import { FileText, Clock, AlertTriangle, XCircle, ChevronRight, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/business/StatCard';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useCaseStore } from '@/store/useCaseStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { queue, cases, dailyStats, exceptionReasons, getTodayStats, callNextNumber } = useCaseStore();

  const todayStats = getTodayStats();

  const todayCases = cases.filter(c => c.createdAt.startsWith(new Date().toISOString().split('T')[0]));

  const waitingQueue = queue.filter(q => q.status === 'waiting');
  const callingQueue = queue.filter(q => q.status === 'calling');

  const handleCallNext = () => {
    callNextNumber();
  };

  const formatTime = (dateStr: string) => {
    return dateStr.split(' ')[1]?.substring(0, 5) || '';
  };

  const getSelectedItemsNames = (items: { name: string }[]) => {
    return items.slice(0, 2).map(i => i.name).join('、') + (items.length > 2 ? '...' : '');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">工作台</h1>
        <p className="text-sm text-gray-500 mt-1">今日概览</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="今日收件"
          value={todayStats.total}
          icon={FileText}
          color="primary"
          trend={{ value: 12, label: '较昨日' }}
        />
        <StatCard
          title="办理中"
          value={todayStats.processing}
          icon={Clock}
          color="info"
        />
        <StatCard
          title="待补正"
          value={todayStats.supplement}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="异常待复核"
          value={todayStats.exception}
          icon={XCircle}
          color="danger"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">叫号队列</h3>
            <span className="text-xs text-gray-500">等待 {waitingQueue.length} 人</span>
          </div>

          {callingQueue.length > 0 && (
            <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary-600 font-medium">正在叫号</span>
                <span className="text-xs text-primary-600">请前往{useCaseStore.getState().currentUser.windowNo}号窗口</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-2xl font-bold text-primary-600">{callingQueue[0].queueNo}</span>
                <span className="text-sm text-gray-700">{callingQueue[0].name}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {waitingQueue.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-12 text-center font-semibold text-primary-600">{item.queueNo}</span>
                  <div>
                    <p className="text-sm text-gray-800 font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">预计等待 {item.estimatedTime} 分钟</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            ))}
            {waitingQueue.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                暂无等待人员
              </div>
            )}
          </div>

          <button
            onClick={handleCallNext}
            className="w-full mt-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <Users size={18} />
            叫下一号
          </button>
        </div>

        <div className="col-span-2 bg-white rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">今日办件列表</h3>
            <span className="text-xs text-gray-500">共 {todayCases.length} 件</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">联办单号</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">申请人</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">新生儿姓名</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">状态</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">办理事项</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">受理时间</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {todayCases.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <span
                        className="text-primary-600 font-medium hover:underline cursor-pointer"
                        onClick={e => { e.stopPropagation(); navigate(`/case/${item.id}`); }}
                      >
                        {item.caseNo}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="text-primary-600 hover:underline cursor-pointer"
                        onClick={e => { e.stopPropagation(); navigate(`/case/${item.id}`); }}
                      >
                        {item.applicant.name}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="text-primary-600 hover:underline cursor-pointer"
                        onClick={e => { e.stopPropagation(); navigate(`/case/${item.id}`); }}
                      >
                        {item.babyInfo.name}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-3 text-gray-600 text-xs">
                      {getSelectedItemsNames(item.selectedItems)}
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs">
                      {formatTime(item.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        className="text-primary-600 text-xs hover:underline cursor-pointer font-medium"
                        onClick={e => { e.stopPropagation(); navigate(`/case/${item.id}`); }}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
                {todayCases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                      暂无今日办件
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-card p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">办件流向趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="收件数"
                  stroke="#165DFF"
                  strokeWidth={2}
                  dot={{ fill: '#165DFF', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="办结数"
                  stroke="#00B42A"
                  strokeWidth={2}
                  dot={{ fill: '#00B42A', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">高频退件原因</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exceptionReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis
                  dataKey="reason"
                  type="category"
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}件`,
                    name === 'count' ? '数量' : name,
                  ]}
                />
                <Bar
                  dataKey="count"
                  name="数量"
                  fill="#165DFF"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
