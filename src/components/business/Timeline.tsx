import { Check, Clock, AlertCircle, FileText } from 'lucide-react';
import type { FlowRecord } from '@/types';

const iconMap: Record<string, any> = {
  pending: Clock,
  verifying: FileText,
  arranging: FileText,
  supplement: AlertCircle,
  exception: AlertCircle,
  processing: Clock,
  completed: Check,
  archived: Check,
};

interface TimelineProps {
  records: FlowRecord[];
}

export function Timeline({ records }: TimelineProps) {
  return (
    <div className="relative">
      {records.map((record, index) => {
        const Icon = iconMap[record.status] || FileText;
        const isLast = index === records.length - 1;
        return (
          <div key={record.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isLast ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Icon size={14} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-gray-800">{record.action}</div>
                <div className="text-xs text-gray-400">{record.timestamp}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {record.department} · {record.operator}
              </div>
              {record.remark && (
                <div className="text-xs text-gray-400 mt-1 bg-gray-50 rounded px-2 py-1">
                  {record.remark}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
