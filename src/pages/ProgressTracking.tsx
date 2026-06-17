import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useCaseStore } from '@/store/useCaseStore';
import { StatusBadge } from '@/components/business/StatusBadge';
import type { ItemProgressStatus, SelectedItem } from '@/types';

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

function getItemProgress(item: SelectedItem): number {
  if (item.progressStatus === 'completed') return 100;
  if (item.progressStatus === 'pending') return 0;
  if (item.progressStatus === 'processing') return 50;
  if (item.progressStatus === 'overdue') return 80;
  if (item.progressStatus === 'exception') return 30;
  return 0;
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

function getDepartmentKey(department: string): string | null {
  for (const [key, names] of Object.entries(departmentGroups)) {
    if (names.includes(department)) return key;
  }
  return null;
}

function CircularProgress({ percentage, size = 80, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2563EB"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-primary-600">{percentage}%</span>
      </div>
    </div>
  );
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

export default function ProgressTracking() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { cases, setCurrentCase, currentUser, updateCase, getCaseById, addFlowRecord } = useCaseStore();

  const caseInfo = useMemo(() => {
    if (!id) return undefined;
    return getCaseById(id);
  }, [id, getCaseById, cases]);

  useEffect(() => {
    if (caseInfo) {
      setCurrentCase(caseInfo);
    }
  }, [caseInfo, setCurrentCase]);

  const selectedItems = useMemo(() => {
    return caseInfo?.selectedItems.filter(item => item.selected) || [];
  }, [caseInfo]);

  const isProcessingStage = useMemo(() => {
    if (!caseInfo) return false;
    return caseInfo.status === 'processing' || caseInfo.status === 'completed' || caseInfo.status === 'archived';
  }, [caseInfo]);

  const overallProgress = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    const completedCount = selectedItems.filter(item => resolveItemStatus(item) === 'completed').length;
    return Math.round((completedCount / selectedItems.length) * 100);
  }, [selectedItems]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, SelectedItem[]> = {
      police: [],
      hrss: [],
      medical: [],
      health: [],
    };
    selectedItems.forEach(item => {
      const key = getDepartmentKey(item.department);
      if (key && groups[key]) {
        groups[key].push(item);
      }
    });
    return groups;
  }, [selectedItems]);

  const expectCompleteTime = useMemo(() => {
    if (!caseInfo) return '-';
    const times = selectedItems
      .map(item => item.expectCompleteAt)
      .filter((t): t is string => !!t);
    if (times.length === 0) return caseInfo.deadline;
    const maxTime = times.reduce((a, b) => (a > b ? a : b));
    return maxTime;
  }, [caseInfo, selectedItems]);

  const getDepartmentProgress = (items: SelectedItem[]) => {
    if (items.length === 0) return 0;
    const completed = items.filter(item => resolveItemStatus(item) === 'completed').length;
    return Math.round((completed / items.length) * 100);
  };

  if (!caseInfo) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-700 mb-2">找不到该办件</h2>
          <p className="text-sm text-gray-500 mb-4">该办件可能已被删除或不存在</p>
          <button
            onClick={() => navigate('/cases/pending')}
            className="px-4 py-2 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 transition-colors"
          >
            返回办件列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white rounded-lg shadow-card mb-4">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-primary-300 hover:text-primary-600 text-gray-500 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-800">办件进度跟踪</h1>
                <StatusBadge status={caseInfo.status} />
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText size={14} />
                  办件编号：{caseInfo.caseNo}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  受理时间：{caseInfo.createdAt}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <CircularProgress percentage={overallProgress} />
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">预计完成时间</div>
              <div className={`text-base font-medium flex items-center gap-1 ${isOverdue(expectCompleteTime) && overallProgress < 100 ? 'text-red-600' : 'text-gray-700'}`}>
                <Clock size={16} className={isOverdue(expectCompleteTime) && overallProgress < 100 ? 'text-red-600' : 'text-gray-400'} />
                {expectCompleteTime}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                共 {selectedItems.length} 个事项，已完成 {selectedItems.filter(i => resolveItemStatus(i) === 'completed').length} 个
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isProcessingStage ? (
        <div className="bg-white rounded-lg shadow-card flex-1 flex items-center justify-center">
          <div className="text-center">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-lg font-medium text-gray-600 mb-2">该办件尚未进入办理阶段</h2>
            <p className="text-sm text-gray-400">请等待办件受理完成后查看办理进度</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(groupedItems).map(([deptKey, items]) => {
              if (items.length === 0) return null;
              const deptProgress = getDepartmentProgress(items);
              const completedCount = items.filter(i => resolveItemStatus(i) === 'completed').length;

              return (
                <div key={deptKey} className="bg-white rounded-lg shadow-card">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                          <Building2 size={18} className="text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">
                            {departmentNames[deptKey] || deptKey}
                          </h3>
                          <p className="text-xs text-gray-400">{items[0]?.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">
                          {completedCount}/{items.length} 已完成
                        </div>
                        <div className="w-24 mt-1">
                          <ItemProgressBar progress={deptProgress} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {items.map(item => {
                      const status = resolveItemStatus(item);
                      const progress = getItemProgress(item);
                      const overdue = isOverdue(item.expectCompleteAt) && status !== 'completed';

                      return (
                        <div key={item.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FileText size={14} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                              </div>
                            </div>
                            <ItemStatusBadge status={status} />
                          </div>

                          <div className="ml-6 space-y-2">
                            <div className="flex items-center gap-6 text-xs">
                              <div className="flex items-center gap-1 text-gray-500">
                                <Calendar size={12} />
                                <span>受理：{item.acceptAt || '-'}</span>
                              </div>
                              <div className={`flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                                <Clock size={12} />
                                <span>预计完成：{item.expectCompleteAt || '-'}</span>
                                {overdue && <span className="ml-1 text-red-600 font-medium">（已超期）</span>}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">办理进度</span>
                                <span className="font-medium text-gray-700">{progress}%</span>
                              </div>
                              <ItemProgressBar progress={progress} />
                            </div>

                            <div className="flex items-center gap-6 text-xs">
                              <div className="flex items-center gap-1 text-gray-500">
                                <User size={12} />
                                <span>经办人：{item.handler || '-'}</span>
                              </div>
                              {item.progressRemark && (
                                <div className="flex items-start gap-1 flex-1">
                                  <AlertCircle size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-500 line-clamp-1">{item.progressRemark}</span>
                                </div>
                              )}
                            </div>
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
      )}
    </div>
  );
}
