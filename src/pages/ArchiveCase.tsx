import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCaseStore } from '@/store/useCaseStore';
import { StatusBadge } from '@/components/business/StatusBadge';
import { Timeline } from '@/components/business/Timeline';
import {
  Archive,
  FileText,
  CheckCircle,
  Clock,
  User,
  Download,
  FileCheck,
  FileDigit,
  Calendar,
  Building,
  ChevronRight,
  XCircle,
  AlertTriangle,
  Building2,
  AlertCircle,
} from 'lucide-react';
import type { CaseInfo, ResultRecord, ResultType, ItemProgressStatus, SelectedItem } from '@/types';

type TabType = 'pending' | 'archived';

const departmentGroups: Record<string, string[]> = {
  police: ['公安局'],
  hrss: ['人社局'],
  medical: ['医保局'],
  health: ['卫健委'],
};

const departmentNames: Record<string, string> = {
  police: '公安',
  hrss: '人社',
  medical: '医保',
  health: '卫健',
};

const itemStatusConfig: Record<ItemProgressStatus, { label: string; color: string; bgColor: string; icon?: typeof CheckCircle }> = {
  pending: { label: '待受理', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  processing: { label: '办理中', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  overdue: { label: '超期', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
  exception: { label: '异常', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle },
};

function isOverdue(expectCompleteAt?: string): boolean {
  if (!expectCompleteAt) return false;
  const now = new Date();
  const expectDate = new Date(expectCompleteAt);
  return now > expectDate;
}

function resolveItemStatus(item: SelectedItem): ItemProgressStatus {
  if (item.progressStatus === 'completed') return 'completed';
  if (item.progressStatus === 'exception') return 'exception';
  if (item.progressStatus === 'processing') return 'processing';
  if (item.progressStatus === 'pending') {
    if (isOverdue(item.expectCompleteAt)) return 'overdue';
    return 'pending';
  }
  if (isOverdue(item.expectCompleteAt)) return 'overdue';
  return item.progressStatus || 'pending';
}

function resolveItemProgressStatus(item: SelectedItem, caseStatus?: string): ItemProgressStatus {
  if (item.progressStatus) {
    return resolveItemStatus(item);
  }
  if (caseStatus === 'completed' || caseStatus === 'archived') {
    return 'completed';
  }
  return 'pending';
}

function getItemProgress(item: SelectedItem, caseStatus?: string): number {
  const status = resolveItemProgressStatus(item, caseStatus);
  if (status === 'completed') return 100;
  if (status === 'pending') return 0;
  if (status === 'processing') return 50;
  if (status === 'overdue') return 80;
  if (status === 'exception') return 30;
  return 0;
}

function getDepartmentKey(department: string): string | null {
  for (const [key, names] of Object.entries(departmentGroups)) {
    if (names.includes(department)) return key;
  }
  return null;
}

function ItemStatusBadge({ status }: { status: ItemProgressStatus }) {
  const config = itemStatusConfig[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
      {Icon && <Icon size={12} />}
      {config.label}
    </span>
  );
}

function ItemProgressBar({ progress }: { progress: number }) {
  let barColor = 'bg-gray-300';
  if (progress >= 100) barColor = 'bg-green-500';
  else if (progress >= 50) barColor = 'bg-primary-500';
  else if (progress > 0) barColor = 'bg-yellow-500';

  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function ArchiveCase() {
  const { id } = useParams<{ id?: string }>();
  const { cases, currentUser, setCurrentCase, updateCase, getCaseById, addFlowRecord } = useCaseStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedCase, setSelectedCase] = useState<CaseInfo | null>(null);
  const [notFoundWarning, setNotFoundWarning] = useState<string | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiveCheckResult, setArchiveCheckResult] = useState<{ incompleteCount: number; exceptionCount: number } | null>(null);

  const pendingCases = useMemo(() => {
    return cases.filter((c) => c.status === 'completed');
  }, [cases]);

  const archivedCases = useMemo(() => {
    return cases.filter((c) => c.status === 'archived');
  }, [cases]);

  const displayCases = useMemo(() => {
    return activeTab === 'pending' ? pendingCases : archivedCases;
  }, [activeTab, pendingCases, archivedCases]);

  const groupedItems = useMemo(() => {
    if (!selectedCase) return {};
    const groups: Record<string, SelectedItem[]> = {
      police: [],
      hrss: [],
      medical: [],
      health: [],
    };
    selectedCase.selectedItems.forEach(item => {
      if (!item.selected) return;
      const key = getDepartmentKey(item.department);
      if (key && groups[key]) {
        groups[key].push(item);
      }
    });
    return groups;
  }, [selectedCase]);

  const getDepartmentProgress = (items: SelectedItem[]) => {
    if (items.length === 0) return 0;
    const completed = items.filter(item => resolveItemProgressStatus(item, selectedCase?.status) === 'completed').length;
    return Math.round((completed / items.length) * 100);
  };

  const checkArchiveConditions = () => {
    if (!selectedCase) return { incompleteCount: 0, exceptionCount: 0, canArchive: true };
    
    let incompleteCount = 0;
    let exceptionCount = 0;
    
    selectedCase.selectedItems.forEach(item => {
      if (!item.selected) return;
      const status = resolveItemProgressStatus(item, selectedCase.status);
      if (status !== 'completed') {
        incompleteCount++;
      }
      if (status === 'exception') {
        exceptionCount++;
      }
    });
    
    return {
      incompleteCount,
      exceptionCount,
      canArchive: incompleteCount === 0 && exceptionCount === 0,
    };
  };

  const processCaseWithProgressStatus = (caseItem: CaseInfo): CaseInfo => {
    if (caseItem.status !== 'completed' && caseItem.status !== 'archived') {
      return caseItem;
    }
    const updatedItems = caseItem.selectedItems.map(item => {
      if (!item.progressStatus) {
        return { ...item, progressStatus: 'completed' as ItemProgressStatus };
      }
      return item;
    });
    return { ...caseItem, selectedItems: updatedItems };
  };

  useEffect(() => {
    if (!id) return;

    const targetCase = getCaseById(id);
    if (targetCase) {
      if (targetCase.status === 'completed') {
        setActiveTab('pending');
      } else if (targetCase.status === 'archived') {
        setActiveTab('archived');
      }
      const processedCase = processCaseWithProgressStatus(targetCase);
      setSelectedCase(processedCase);
      setCurrentCase(processedCase);
      setNotFoundWarning(null);
    } else {
      setNotFoundWarning(`未找到 ID 为 ${id} 的办件`);
      setSelectedCase(null);
      setCurrentCase(null);
    }
  }, [id, cases, getCaseById, setCurrentCase]);

  const handleCaseClick = (caseItem: CaseInfo) => {
    const processedCase = processCaseWithProgressStatus(caseItem);
    setSelectedCase(processedCase);
    setCurrentCase(processedCase);
  };

  const handleArchive = () => {
    if (!selectedCase) return;

    const checkResult = checkArchiveConditions();
    if (!checkResult.canArchive) {
      setArchiveCheckResult({
        incompleteCount: checkResult.incompleteCount,
        exceptionCount: checkResult.exceptionCount,
      });
      setShowArchiveDialog(true);
      return;
    }

    executeArchive();
  };

  const executeArchive = () => {
    if (!selectedCase) return;

    addFlowRecord(selectedCase.id, {
      status: 'archived',
      operator: currentUser.name,
      department: currentUser.department,
      action: '归档完成',
    });

    updateCase(selectedCase.id, {
      status: 'archived',
    });

    const latestCase = getCaseById(selectedCase.id);
    if (latestCase) {
      const processedCase = processCaseWithProgressStatus(latestCase);
      setSelectedCase(processedCase);
      setCurrentCase(processedCase);
    }

    setActiveTab('archived');
    setShowArchiveDialog(false);
    setArchiveCheckResult(null);
  };

  const cancelArchive = () => {
    setShowArchiveDialog(false);
    setArchiveCheckResult(null);
  };

  const handleResultRegister = (type: ResultType) => {
    if (!selectedCase) return;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const resultKey = type;

    const updatedResult: ResultRecord = {
      type,
      registered: true,
      registeredBy: currentUser.name,
      registeredAt: now,
      documentNo: type === 'paper' ? `HZ${Date.now()}` : `DZ${Date.now()}`,
    };

    updateCase(selectedCase.id, {
      results: {
        ...selectedCase.results,
        [resultKey]: updatedResult,
      },
    });

    const latestCase = getCaseById(selectedCase.id);
    if (latestCase) {
      setSelectedCase(latestCase);
      setCurrentCase(latestCase);
    }
  };

  const formatDate = (dateStr: string) => {
    return dateStr;
  };

  const getCompletedTime = (caseItem: CaseInfo) => {
    const completedRecord = caseItem.flowRecords.find((r) => r.status === 'completed');
    return completedRecord?.timestamp || caseItem.updatedAt;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {notFoundWarning && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-8 py-3">
          <div className="flex items-center gap-2 text-yellow-700 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {notFoundWarning}
          </div>
        </div>
      )}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">办结归档</h1>
            <p className="text-sm text-gray-500 mt-1">对已办结的办件进行结果登记和归档管理</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">当前用户：</span>
            <span className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded">
              {currentUser.name}
            </span>
          </div>
        </div>

        <div className="flex gap-8 mt-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            待归档
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'pending' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {pendingCases.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'archived'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            已归档
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'archived' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {archivedCases.length}
            </span>
          </button>
        </div>
      </div>

      <div className="flex gap-6 p-6">
        <div className="flex-1 min-w-0">
          <div className="card">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-primary-500" size={18} />
                <h2 className="text-base font-semibold text-gray-800">
                  {activeTab === 'pending' ? '待归档办件列表' : '已归档办件列表'}
                </h2>
              </div>
              <span className="text-xs text-gray-500">共 {displayCases.length} 条</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">联办单号</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">申请人</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">新生儿姓名</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">办结时间</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">状态</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {displayCases.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleCaseClick(item)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${
                        selectedCase?.id === item.id
                          ? 'bg-primary-50/50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-4 text-primary-600 font-medium">{item.caseNo}</td>
                      <td className="py-3 px-4 text-gray-700">{item.applicant.name}</td>
                      <td className="py-3 px-4 text-gray-700">{item.babyInfo.name}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(getCompletedTime(item))}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-primary-600 text-xs hover:text-primary-700 font-medium flex items-center gap-1">
                          查看详情
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {displayCases.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                        <Archive size={48} className="mx-auto mb-3 opacity-30" />
                        <p>暂无{activeTab === 'pending' ? '待归档' : '已归档'}办件</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-[520px] flex-shrink-0">
          {selectedCase ? (
            <div className="space-y-6">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="text-primary-500" size={18} />
                    <h2 className="text-base font-semibold text-gray-800">办件基本信息</h2>
                  </div>
                  <StatusBadge status={selectedCase.status} />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">联办单号</div>
                      <div className="text-sm text-gray-800 font-medium">{selectedCase.caseNo}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">办件类型</div>
                      <div className="text-sm text-gray-800">
                        {selectedCase.type === 'newborn'
                          ? '新生儿'
                          : selectedCase.type === 'parents'
                          ? '父母'
                          : '其他'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">申请人</div>
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <User size={14} className="text-gray-400" />
                        {selectedCase.applicant.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">与新生儿关系</div>
                      <div className="text-sm text-gray-800">{selectedCase.applicant.relation}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">新生儿姓名</div>
                      <div className="text-sm text-gray-800">{selectedCase.babyInfo.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">性 别</div>
                      <div className="text-sm text-gray-800">
                        {selectedCase.babyInfo.gender === 'male' ? '男' : '女'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">出生日期</div>
                      <div className="text-sm text-gray-800">{selectedCase.babyInfo.birthDate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">办理窗口</div>
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <Building size={14} className="text-gray-400" />
                        {selectedCase.windowNo}号窗口
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">办理事项</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCase.selectedItems.map((item) => (
                        <span
                          key={item.id}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="text-primary-500" size={18} />
                  <h2 className="text-base font-semibold text-gray-800">部门事项办理情况</h2>
                </div>

                <div className="space-y-4">
                  {Object.entries(groupedItems).map(([deptKey, items]) => {
                    if (items.length === 0) return null;
                    const deptProgress = getDepartmentProgress(items);
                    const completedCount = items.filter(i => resolveItemProgressStatus(i, selectedCase.status) === 'completed').length;

                    return (
                      <div key={deptKey} className="border border-gray-100 rounded-lg overflow-hidden">
                        <div className="p-3 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded bg-primary-50 flex items-center justify-center">
                                <Building2 size={16} className="text-primary-600" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-800">
                                  {departmentNames[deptKey] || deptKey}
                                </h3>
                                <p className="text-xs text-gray-400">{items[0]?.department}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium text-gray-700">
                                {completedCount}/{items.length} 已完成
                              </div>
                              <div className="w-20 mt-1">
                                <ItemProgressBar progress={deptProgress} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                          {items.map(item => {
                            const status = resolveItemProgressStatus(item, selectedCase.status);
                            const overdue = isOverdue(item.expectCompleteAt) && status !== 'completed';

                            return (
                              <div key={item.id} className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <FileText size={13} className="text-gray-400" />
                                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                    </div>
                                  </div>
                                  <ItemStatusBadge status={status} />
                                </div>

                                <div className="ml-5 space-y-1.5">
                                  <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1 text-gray-500">
                                      <Calendar size={11} />
                                      <span>受理：{item.acceptAt || '-'}</span>
                                    </div>
                                    <div className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                      <Clock size={11} />
                                      <span>预计：{item.expectCompleteAt || '-'}</span>
                                      {overdue && <span>（超期）</span>}
                                    </div>
                                  </div>

                                  {item.progressRemark && (
                                    <div className="flex items-start gap-1 text-xs">
                                      <AlertCircle size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-500">{item.progressRemark}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck className="text-primary-500" size={18} />
                  <h2 className="text-base font-semibold text-gray-800">办理结果登记</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 border rounded-lg transition-colors ${
                      selectedCase.results.paper.registered
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded ${
                            selectedCase.results.paper.registered
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <FileText size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-800">纸质结果</span>
                      </div>
                      {selectedCase.results.paper.registered && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                    </div>

                    {selectedCase.results.paper.registered ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">证件编号</span>
                          <span className="text-gray-800 font-medium">
                            {selectedCase.results.paper.documentNo}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">登记人</span>
                          <span className="text-gray-800">{selectedCase.results.paper.registeredBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">登记时间</span>
                          <span className="text-gray-800">{selectedCase.results.paper.registeredAt}</span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <CheckCircle size={12} className="text-green-500" />
                          <span className="text-green-600">已登记</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleResultRegister('paper')}
                          disabled={selectedCase.status === 'archived'}
                          className={`w-full py-2 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                            selectedCase.status === 'archived'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                          }`}
                        >
                          <CheckCircle size={14} />
                          登记纸质结果
                        </button>
                        <p className="text-xs text-gray-400 text-center">未登记</p>
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-4 border rounded-lg transition-colors ${
                      selectedCase.results.electronic.registered
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded ${
                            selectedCase.results.electronic.registered
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <FileDigit size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-800">电子结果</span>
                      </div>
                      {selectedCase.results.electronic.registered && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                    </div>

                    {selectedCase.results.electronic.registered ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">证件编号</span>
                          <span className="text-gray-800 font-medium">
                            {selectedCase.results.electronic.documentNo}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">登记人</span>
                          <span className="text-gray-800">{selectedCase.results.electronic.registeredBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">登记时间</span>
                          <span className="text-gray-800">{selectedCase.results.electronic.registeredAt}</span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <CheckCircle size={12} className="text-green-500" />
                          <span className="text-green-600">已登记</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleResultRegister('electronic')}
                          disabled={selectedCase.status === 'archived'}
                          className={`w-full py-2 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                            selectedCase.status === 'archived'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                          }`}
                        >
                          <CheckCircle size={14} />
                          登记电子结果
                        </button>
                        <p className="text-xs text-gray-400 text-center">未登记</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="text-primary-500" size={18} />
                  <h2 className="text-base font-semibold text-gray-800">办件流向</h2>
                </div>
                <div className="max-h-64 overflow-y-auto pr-2">
                  <Timeline records={selectedCase.flowRecords} />
                </div>
              </div>

              {selectedCase.status === 'completed' && (
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Archive className="text-primary-500" size={18} />
                    <h2 className="text-base font-semibold text-gray-800">归档操作</h2>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    确认纸质结果和电子结果均已登记后，可将该办件归档。归档后办件状态将变为"已归档"。
                  </p>
                  <button
                    onClick={handleArchive}
                    disabled={
                      !selectedCase.results.paper.registered ||
                      !selectedCase.results.electronic.registered
                    }
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                      !selectedCase.results.paper.registered ||
                      !selectedCase.results.electronic.registered
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    <Archive size={18} />
                    确认归档
                  </button>
                  {(!selectedCase.results.paper.registered ||
                    !selectedCase.results.electronic.registered) && (
                    <p className="text-xs text-orange-500 mt-2 text-center">
                      请先完成纸质结果和电子结果的登记
                    </p>
                  )}
                </div>
              )}

              {selectedCase.status === 'archived' && (
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Download className="text-primary-500" size={18} />
                    <h2 className="text-base font-semibold text-gray-800">归档信息</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-500" size={18} />
                        <span className="text-green-700 font-medium">已归档</span>
                      </div>
                      <button className="text-primary-600 text-xs hover:text-primary-700 flex items-center gap-1">
                        <Download size={14} />
                        下载档案
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      归档时间：
                      {selectedCase.flowRecords.find((r) => r.status === 'archived')?.timestamp ||
                        selectedCase.updatedAt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center">
              <FileText size={64} className="text-gray-200 mb-4" />
              <p className="text-gray-400 text-sm">请从左侧列表选择办件查看详情</p>
            </div>
          )}
        </div>
      </div>

      {showArchiveDialog && archiveCheckResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[420px] max-w-[90vw]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-orange-500" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">确认归档</h3>
                <p className="text-sm text-gray-600">
                  您确认要归档该办件吗？当前还有 <span className="font-semibold text-orange-600">{archiveCheckResult.incompleteCount}</span> 个事项未完成、
                  <span className="font-semibold text-orange-600">{archiveCheckResult.exceptionCount}</span> 个事项异常。归档后数据将无法修改。
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={cancelArchive}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={executeArchive}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
              >
                确认归档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
