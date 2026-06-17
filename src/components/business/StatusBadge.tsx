import type { CaseStatus } from '@/types';

const statusConfig: Record<CaseStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待受理', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  verifying: { label: '核验中', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  arranging: { label: '编排中', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  supplement: { label: '补正中', color: 'text-warning', bgColor: 'bg-orange-50' },
  exception: { label: '异常待复核', color: 'text-danger', bgColor: 'bg-red-50' },
  processing: { label: '办理中', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  completed: { label: '已办结', color: 'text-success', bgColor: 'bg-green-50' },
  archived: { label: '已归档', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

interface StatusBadgeProps {
  status: CaseStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  );
}
