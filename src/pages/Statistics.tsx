import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar,
  Building2,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatCard } from '@/components/business/StatCard';
import { useCaseStore } from '@/store/useCaseStore';
import type { CaseStatus } from '@/types';

type TimeRange = 'today' | 'week' | 'month' | 'custom';

const COLORS = ['#165DFF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1', '#86909C'];

const statusLabels: Record<CaseStatus, string> = {
  pending: '待叫号',
  verifying: '核验中',
  arranging: '编排中',
  supplement: '待补正',
  exception: '异常待复核',
  processing: '办理中',
  completed: '已办结',
  archived: '已归档',
};

export default function Statistics() {
  const { cases, dailyStats, exceptionReasons, departmentStats } = useCaseStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [trendDays, setTrendDays] = useState<'7' | '30'>('7');

  const totalCases = cases.length;
  const completedCases = cases.filter(
    (c) => c.status === 'completed' || c.status === 'archived'
  ).length;
  const completionRate = totalCases > 0 ? ((completedCases / totalCases) * 100).toFixed(1) : '0';
  const exceptionCases = cases.filter((c) => c.status === 'exception').length;
  const exceptionRate = totalCases > 0 ? ((exceptionCases / totalCases) * 100).toFixed(2) : '0';
  const avgTime = '3.2';

  const departments = ['all', ...departmentStats.map((d) => d.department)];

  const getStatusCounts = () => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      const label = statusLabels[c.status];
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const statusCounts = getStatusCounts();

  const flowData = [
    { from: '收件', to: '核验中', value: totalCases },
    { from: '核验中', to: '编排中', value: Math.floor(totalCases * 0.9) },
    { from: '编排中', to: '办理中', value: Math.floor(totalCases * 0.85) },
    { from: '办理中', to: '已办结', value: completedCases },
    { from: '核验中', to: '待补正', value: cases.filter((c) => c.status === 'supplement').length },
    { from: '办理中', to: '异常待复核', value: exceptionCases },
  ];

  const tableData = departmentStats.map((dept) => ({
    department: dept.department,
    total: dept.total,
    completed: dept.completed,
    completionRate: ((dept.completed / dept.total) * 100).toFixed(1),
    avgTime: dept.avgTime,
    exceptionRate: ((dept.total - dept.completed) / dept.total * 100).toFixed(2),
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">统计分析</h1>
        <p className="text-sm text-gray-500 mt-1">办件数据综合统计与分析</p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-4 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">筛选条件</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">时间范围：</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {[
                { key: 'today', label: '今日' },
                { key: 'week', label: '本周' },
                { key: 'month', label: '本月' },
                { key: 'custom', label: '自定义' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTimeRange(item.key as TimeRange)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeRange === item.key
                      ? 'bg-white text-primary-600 shadow-sm font-medium'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">部门：</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="all">全部部门</option>
              {departmentStats.map((dept) => (
                <option key={dept.department} value={dept.department}>
                  {dept.department}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="总办件量"
          value={totalCases}
          icon={FileText}
          color="primary"
          trend={{ value: 12.5, label: '较上周' }}
        />
        <StatCard
          title="办结率"
          value={`${completionRate}%`}
          icon={CheckCircle}
          color="success"
          trend={{ value: 3.2, label: '较上周' }}
        />
        <StatCard
          title="平均办理时长"
          value={`${avgTime} 天`}
          icon={Clock}
          color="info"
          trend={{ value: -8.5, label: '较上周' }}
        />
        <StatCard
          title="异常率"
          value={`${exceptionRate}%`}
          icon={AlertTriangle}
          color="danger"
          trend={{ value: -2.1, label: '较上周' }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-600" />
              <h3 className="text-base font-semibold text-gray-800">办件趋势</h3>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {[
                { key: '7', label: '近7天' },
                { key: '30', label: '近30天' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTrendDays(item.key as '7' | '30')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    trendDays === item.key
                      ? 'bg-white text-primary-600 shadow-sm font-medium'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
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
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-primary-600" />
            <h3 className="text-base font-semibold text-gray-800">部门办理情况</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
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
                <Bar
                  dataKey="total"
                  name="收件数"
                  fill="#165DFF"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="completed"
                  name="办结数"
                  fill="#00B42A"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-primary-600" />
            <h3 className="text-base font-semibold text-gray-800">高频退件原因</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={exceptionReasons}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="reason"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  labelLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                >
                  {exceptionReasons.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [`${value}件`, name]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight size={18} className="text-primary-600" />
            <h3 className="text-base font-semibold text-gray-800">办件流向统计</h3>
          </div>
          <div className="h-72 flex items-center justify-center">
            <div className="flex items-center justify-between w-full px-4">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center border-2 border-primary-200">
                  <span className="text-lg font-bold text-primary-600">{totalCases}</span>
                </div>
                <span className="text-sm text-gray-700 font-medium">收件</span>
              </div>

              <div className="flex flex-col gap-2 flex-1 mx-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-primary-100 rounded-full">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: '90%' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">核验</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-100 rounded-full">
                    <div
                      className="h-full bg-success rounded-full"
                      style={{ width: '85%' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">编排</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-orange-100 rounded-full">
                    <div
                      className="h-full bg-warning rounded-full"
                      style={{ width: '80%' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">办理</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center border-2 border-green-200">
                  <span className="text-lg font-bold text-success">{completedCases}</span>
                </div>
                <span className="text-sm text-gray-700 font-medium">办结</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            {statusCounts.slice(0, 3).map((item, index) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-gray-500">{item.name}</span>
                </div>
                <span className="text-base font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">详细统计数据</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 rounded-l-lg">
                  部门
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">
                  收件数
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">
                  办结数
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">
                  办结率
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">
                  平均办理时长（天）
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 rounded-r-lg">
                  异常率
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, index) => (
                <tr
                  key={item.department}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-800 font-medium">{item.department}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">{item.total}</td>
                  <td className="py-3 px-4 text-center text-gray-700">{item.completed}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-success font-medium">{item.completionRate}%</span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">{item.avgTime}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-danger font-medium">{item.exceptionRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            共 {tableData.length} 个部门
          </span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
              上一页
            </button>
            <button className="px-3 py-1 text-xs text-white bg-primary-500 rounded">
              1
            </button>
            <button className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
