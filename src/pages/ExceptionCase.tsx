import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCaseStore } from '@/store/useCaseStore';
import { StatusBadge } from '@/components/business/StatusBadge';
import { Timeline } from '@/components/business/Timeline';
import {
  AlertTriangle,
  Clock,
  User,
  FileText,
  Send,
  X,
  Check,
  ChevronRight,
  Search,
  Filter,
  Save,
  FileQuestion,
  Info,
} from 'lucide-react';
import type { CaseInfo, ExceptionStatus, ExceptionItem, FlowRecord, CaseStatus } from '@/types';

type TabType = 'pending' | 'approved' | 'rejected';

const exceptionTypes = [
  { value: '身份证件异常', label: '身份证件异常', color: 'text-red-600', bgColor: 'bg-red-50' },
  { value: '信息不一致', label: '信息不一致', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { value: '特殊情形', label: '特殊情形', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { value: '政策不明确', label: '政策不明确', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { value: '其他', label: '其他', color: 'text-gray-600', bgColor: 'bg-gray-50' },
];

const tabConfig: Record<TabType, { label: string; status: ExceptionStatus }> = {
  pending: { label: '待复核', status: 'pending' },
  approved: { label: '已复核', status: 'approved' },
  rejected: { label: '已退回', status: 'rejected' },
};

export default function ExceptionCase() {
  const { id } = useParams<{ id: string }>();
  const { cases, updateCase, currentUser, addFlowRecord } = useCaseStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedExceptionType, setSelectedExceptionType] = useState<string>('');
  const [exceptionReason, setExceptionReason] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [caseNotFound, setCaseNotFound] = useState<string | null>(null);

  const exceptionCases = useMemo(() => {
    const filtered = cases.filter((c) => c.status === 'exception' && c.exceptions.length > 0);

    const tabFiltered = filtered.filter((c) => {
      const latestException = c.exceptions[c.exceptions.length - 1];
      return latestException.status === tabConfig[activeTab].status;
    });

    if (searchText) {
      return tabFiltered.filter(
        (c) =>
          c.caseNo.toLowerCase().includes(searchText.toLowerCase()) ||
          c.applicant.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return tabFiltered;
  }, [cases, activeTab, searchText]);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null;
    return cases.find((c) => c.id === selectedCaseId) || null;
  }, [selectedCaseId, cases]);

  const latestException = useMemo(() => {
    if (!selectedCase || selectedCase.exceptions.length === 0) return null;
    return selectedCase.exceptions[selectedCase.exceptions.length - 1];
  }, [selectedCase]);

  useEffect(() => {
    if (!id) {
      setCaseNotFound(null);
      return;
    }

    const targetCase = cases.find((c) => c.id === id);
    if (!targetCase) {
      setCaseNotFound(id);
      setSelectedCaseId(null);
      return;
    }

    if (targetCase.status !== 'exception' || targetCase.exceptions.length === 0) {
      setCaseNotFound(id);
      setSelectedCaseId(null);
      return;
    }

    setCaseNotFound(null);
    const latest = targetCase.exceptions[targetCase.exceptions.length - 1];
    const statusToTab: Record<ExceptionStatus, TabType> = {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
    };
    setActiveTab(statusToTab[latest.status] || 'pending');
    setSelectedCaseId(targetCase.id);
    setSelectedExceptionType(latest.type);
    setExceptionReason(latest.reason);
  }, [id, cases]);

  const handleCaseSelect = (caseItem: CaseInfo) => {
    setSelectedCaseId(caseItem.id);
    const latest = caseItem.exceptions[caseItem.exceptions.length - 1];
    if (latest) {
      setSelectedExceptionType(latest.type);
      setExceptionReason(latest.reason);
    }
  };

  const handleSubmitReview = () => {
    if (!selectedCase || !selectedExceptionType || !exceptionReason.trim()) return;

    const newException: ExceptionItem = {
      id: `ex-${Date.now()}`,
      type: selectedExceptionType,
      reason: exceptionReason,
      submitter: currentUser.name,
      reviewer: currentUser.name,
      status: 'approved',
      createdAt: latestException?.createdAt || new Date().toISOString(),
      reviewAt: new Date().toLocaleString('zh-CN'),
      reviewRemark: '复核通过',
    };

    const hasProgressItems = selectedCase.selectedItems.some(
      (item) => item.progressStatus === 'completed' || item.progressStatus === 'processing'
    );
    const nextStatus: CaseStatus = hasProgressItems ? 'processing' : 'arranging';

    const completedItems = selectedCase.selectedItems.filter(
      (item) => item.progressStatus === 'completed'
    );
    const processingItems = selectedCase.selectedItems.filter(
      (item) => item.progressStatus === 'processing'
    );

    const statusLabel = nextStatus === 'processing' ? '办理中' : '编排中';
    let remark = `异常类型：${selectedExceptionType}，复核意见：${exceptionReason}，恢复至【${statusLabel}】环节`;
    if (completedItems.length > 0) {
      const completedNames = completedItems.map((i) => i.name).join('、');
      remark += `，保留${completedNames}已完成状态`;
    }
    if (processingItems.length > 0) {
      const processingNames = processingItems.map((i) => i.name).join('、');
      remark += `，${processingNames}继续办理`;
    }

    addFlowRecord(selectedCase.id, {
      status: nextStatus,
      operator: currentUser.name,
      department: currentUser.department,
      action: '异常复核通过',
      remark,
    });

    updateCase(selectedCase.id, {
      exceptions: [...selectedCase.exceptions.slice(0, -1), newException],
      status: nextStatus,
    });

    setSelectedCaseId(null);
  };

  const handleReject = () => {
    if (!selectedCase || !exceptionReason.trim()) return;

    const newException: ExceptionItem = {
      id: `ex-${Date.now()}`,
      type: selectedExceptionType || latestException?.type || '其他',
      reason: exceptionReason,
      submitter: latestException?.submitter || currentUser.name,
      reviewer: currentUser.name,
      status: 'rejected',
      createdAt: latestException?.createdAt || new Date().toISOString(),
      reviewAt: new Date().toLocaleString('zh-CN'),
      reviewRemark: '退回处理',
    };

    const newFlowRecord: FlowRecord = {
      id: `f-${Date.now()}`,
      status: 'exception',
      operator: currentUser.name,
      department: currentUser.department,
      action: '异常退回',
      remark: `退回原因：${exceptionReason}`,
      timestamp: new Date().toLocaleString('zh-CN'),
    };

    updateCase(selectedCase.id, {
      exceptions: [...selectedCase.exceptions.slice(0, -1), newException],
      flowRecords: [...selectedCase.flowRecords, newFlowRecord],
    });

    setSelectedCaseId(null);
  };

  const handleSaveDraft = () => {
    console.log('保存草稿');
  };

  const getExceptionTypeStyle = (type: string) => {
    const found = exceptionTypes.find((e) => e.value === type);
    return found || { color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  const reviewRecords = useMemo(() => {
    if (!selectedCase) return [];
    return selectedCase.flowRecords.filter(
      (r) => r.status === 'exception' || r.action.includes('复核') || r.action.includes('异常')
    );
  }, [selectedCase]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="text-primary-500" size={24} />
              异常退回
            </h1>
            <p className="text-sm text-gray-500 mt-1">对异常办件进行复核和退回处理</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">当前用户：</span>
            <span className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded">
              {currentUser.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-gray-200">
          {(Object.keys(tabConfig) as TabType[]).map((tab) => {
            const count = cases.filter((c) => {
              if (c.status !== 'exception' || c.exceptions.length === 0) return false;
              const latest = c.exceptions[c.exceptions.length - 1];
              return latest.status === tabConfig[tab].status;
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tabConfig[tab].label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {caseNotFound && (
          <div className="px-8 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2">
            <AlertTriangle className="text-yellow-600" size={18} />
            <span className="text-sm text-yellow-700">
              未找到 ID 为「{caseNotFound}」的异常办件，或该办件当前不处于异常状态。请从左侧列表中选择办件。
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-6 p-6 pb-24" style={{ height: caseNotFound ? 'calc(100vh - 228px)' : 'calc(100vh - 180px)' }}>
        <div className="w-[480px] flex-shrink-0 flex flex-col">
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="搜索联办单号或申请人..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button className="btn-secondary flex items-center gap-1.5 px-3 py-2">
                <Filter size={16} />
                筛选
              </button>
            </div>
          </div>

          <div className="card flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">异常办件列表</h2>
              <span className="text-xs text-gray-500">共 {exceptionCases.length} 条</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {exceptionCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                  <FileQuestion size={48} className="mb-3 opacity-50" />
                  <p className="text-sm">暂无异常办件</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">联办单号</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">申请人</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">异常类型</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">提交时间</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">状态</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {exceptionCases.map((caseItem) => {
                      const latest = caseItem.exceptions[caseItem.exceptions.length - 1];
                      const typeStyle = getExceptionTypeStyle(latest?.type || '其他');
                      const isSelected = selectedCaseId === caseItem.id;

                      return (
                        <tr
                          key={caseItem.id}
                          onClick={() => handleCaseSelect(caseItem)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-800">{caseItem.caseNo}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                                <User size={12} />
                              </div>
                              <span className="text-sm text-gray-700">{caseItem.applicant.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeStyle.bgColor} ${typeStyle.color}`}
                            >
                              {latest?.type || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock size={12} />
                              {latest?.createdAt
                                ? new Date(latest.createdAt).toLocaleString('zh-CN', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={caseItem.status} />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCaseSelect(caseItem);
                              }}
                              className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-0.5"
                            >
                              查看详情
                              <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedCase ? (
            <div className="card flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <FileText size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">请选择一条异常办件</p>
                <p className="text-sm mt-2">点击左侧列表中的办件查看详情并进行复核</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden gap-4">
              <div className="card p-5 flex-shrink-0">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="text-primary-500" size={20} />
                  <h2 className="text-base font-semibold text-gray-800">办件基本信息</h2>
                </div>

                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">联办单号：</span>
                    <span className="text-gray-800 font-medium">{selectedCase.caseNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">申请人：</span>
                    <span className="text-gray-800">{selectedCase.applicant.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">与新生儿关系：</span>
                    <span className="text-gray-800">{selectedCase.applicant.relation}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">联系电话：</span>
                    <span className="text-gray-800">{selectedCase.applicant.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">新生儿姓名：</span>
                    <span className="text-gray-800">{selectedCase.babyInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">当前状态：</span>
                    <StatusBadge status={selectedCase.status} />
                  </div>
                  <div>
                    <span className="text-gray-500">受理窗口：</span>
                    <span className="text-gray-800">{selectedCase.windowNo}号窗口</span>
                  </div>
                  <div>
                    <span className="text-gray-500">经办人：</span>
                    <span className="text-gray-800">{selectedCase.handler || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">申请时间：</span>
                    <span className="text-gray-800">{selectedCase.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex gap-4 overflow-hidden">
                <div className="flex-1 card p-5 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-primary-500" size={20} />
                    <h2 className="text-base font-semibold text-gray-800">异常详情</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">异常类型</label>
                      <div className="grid grid-cols-2 gap-2">
                        {exceptionTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setSelectedExceptionType(type.value)}
                            className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                              selectedExceptionType === type.value
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                selectedExceptionType === type.value ? 'bg-primary-500' : 'bg-gray-300'
                              }`}
                            />
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        异常原因描述
                      </label>
                      <textarea
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                        placeholder="请详细描述异常原因..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        已输入 {exceptionReason.length} 字
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">提交人</label>
                      <div className="text-sm text-gray-800">
                        {latestException?.submitter || '-'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">提交时间</label>
                      <div className="text-sm text-gray-800">
                        {latestException?.createdAt || '-'}
                      </div>
                    </div>
                  </div>

                  {activeTab === 'pending' && (
                    <div className="pt-4 mt-4 border-t border-gray-100">
                      <button
                        onClick={handleSubmitReview}
                        disabled={!selectedExceptionType || !exceptionReason.trim()}
                        className={`btn-primary w-full flex items-center justify-center gap-2 ${
                          !selectedExceptionType || !exceptionReason.trim()
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <Send size={16} />
                        提交复核
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-[380px] card p-5 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="text-primary-500" size={20} />
                    <h2 className="text-base font-semibold text-gray-800">复核记录</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {selectedCase.flowRecords.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <FileText size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">暂无复核记录</p>
                      </div>
                    ) : (
                      <Timeline records={reviewRecords.length > 0 ? reviewRecords : selectedCase.flowRecords} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCase && activeTab === 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between z-10">
          <div className="text-sm text-gray-500">
            当前选中：<span className="text-primary-600 font-medium">{selectedCase.caseNo}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveDraft} className="btn-secondary flex items-center gap-1.5">
              <Save size={16} />
              保存草稿
            </button>
            <button
              onClick={handleReject}
              disabled={!exceptionReason.trim()}
              className={`btn-secondary text-danger border-danger bg-danger/5 hover:bg-danger/10 flex items-center gap-1.5 ${
                !exceptionReason.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <X size={16} />
              退回
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={!selectedExceptionType || !exceptionReason.trim()}
              className={`btn-primary flex items-center gap-1.5 ${
                !selectedExceptionType || !exceptionReason.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              <Check size={16} />
              提交复核
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
