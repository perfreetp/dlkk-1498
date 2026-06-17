import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Filter, ChevronRight, Eye, FileText } from 'lucide-react';
import { useCaseStore } from '@/store/useCaseStore';
import { StatusBadge } from '@/components/business/StatusBadge';
import type { CaseStatus } from '@/types';

const statusConfig: Record<string, { label: string; status: CaseStatus[] }> = {
  pending: { label: '待办件', status: ['pending', 'verifying', 'arranging'] },
  supplement: { label: '补正处置', status: ['supplement'] },
  exception: { label: '异常退回', status: ['exception'] },
  completed: { label: '办结归档', status: ['completed', 'archived'] },
};

export default function CaseList() {
  const navigate = useNavigate();
  const { type = 'pending' } = useParams();
  const { cases } = useCaseStore();
  const [searchText, setSearchText] = useState('');

  const config = statusConfig[type] || statusConfig.pending;

  const filteredCases = cases.filter(c => {
    const matchStatus = config.status.includes(c.status);
    const matchSearch = !searchText ||
      c.caseNo.includes(searchText) ||
      c.applicant.name.includes(searchText) ||
      c.babyInfo.name.includes(searchText);
    return matchStatus && matchSearch;
  });

  const handleViewDetail = (id: string, status: CaseStatus) => {
    if (status === 'supplement') {
      navigate(`/supplement/${id}`);
    } else if (status === 'exception') {
      navigate(`/exception/${id}`);
    } else if (status === 'completed' || status === 'archived') {
      navigate(`/archive/${id}`);
    } else if (status === 'processing') {
      navigate(`/arrange/${id}`);
    } else if (status === 'arranging') {
      navigate(`/arrange/${id}`);
    } else {
      navigate(`/create/${id}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">{config.label}</h1>
        <p className="text-sm text-gray-500 mt-1">共 {filteredCases.length} 条记录</p>
      </div>

      <div className="bg-white rounded-lg shadow-card flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索联办单号、申请人..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="w-72 h-9 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-300"
              />
            </div>
            <button className="h-9 px-4 flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded hover:border-primary-300 hover:text-primary-600 transition-colors">
              <Filter size={16} />
              筛选
            </button>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="h-9 px-4 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <FileText size={16} />
            新建联办单
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">联办单号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">申请人</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">新生儿姓名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">办理事项</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">状态</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">受理时间</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCases.length > 0 ? (
                filteredCases.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewDetail(item.id, item.status)}>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-primary-600">{item.caseNo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.applicant.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.babyInfo.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.selectedItems.filter(s => s.selected).slice(0, 2).map(s => (
                          <span key={s.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {s.name}
                          </span>
                        ))}
                        {item.selectedItems.filter(s => s.selected).length > 2 && (
                          <span className="text-xs px-2 py-0.5 text-gray-400">
                            +{item.selectedItems.filter(s => s.selected).length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.createdAt}</td>
                    <td className="px-4 py-3">
                      <button className="text-primary-600 text-sm hover:text-primary-700 flex items-center gap-1"
                              onClick={e => { e.stopPropagation(); handleViewDetail(item.id, item.status); }}>
                        <Eye size={14} />
                        详情
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="text-gray-400">
                      <FileText size={40} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">暂无数据</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredCases.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">共 {filteredCases.length} 条</span>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center text-sm border border-gray-200 rounded hover:border-primary-300 text-gray-500">上一页</button>
              <button className="w-8 h-8 flex items-center justify-center text-sm bg-primary-500 text-white rounded">1</button>
              <button className="w-8 h-8 flex items-center justify-center text-sm border border-gray-200 rounded hover:border-primary-300 text-gray-500">2</button>
              <button className="w-8 h-8 flex items-center justify-center text-sm border border-gray-200 rounded hover:border-primary-300 text-gray-500">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
