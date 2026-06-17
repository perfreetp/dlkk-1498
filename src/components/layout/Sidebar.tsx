import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileText, AlertCircle, Archive, BarChart3, Settings } from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: '工作台首页', icon: LayoutDashboard },
  { path: '/create', label: '新建联办单', icon: PlusCircle },
  { path: '/cases/pending', label: '待办件', icon: FileText },
  { path: '/cases/supplement', label: '补正处置', icon: AlertCircle },
  { path: '/cases/exception', label: '异常退回', icon: AlertCircle },
  { path: '/cases/completed', label: '办结归档', icon: Archive },
  { path: '/statistics', label: '统计分析', icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-white shadow-card flex flex-col h-full">
      <div className="h-14 flex items-center justify-center border-b border-gray-100">
        <h1 className="text-lg font-bold text-primary-600">出生一件事联办</h1>
      </div>
      <nav className="flex-1 py-4">
        <div className="px-3 mb-2">
          <span className="text-xs text-gray-400 px-2">业务办理</span>
        </div>
        {menuItems.slice(0, 6).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div className="px-3 mt-6 mb-2">
          <span className="text-xs text-gray-400 px-2">数据分析</span>
        </div>
        {menuItems.slice(6).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-100 p-3">
        <button className="flex items-center gap-3 w-full px-2 py-2 rounded text-sm text-gray-600 hover:bg-gray-50">
          <Settings size={18} />
          <span>系统设置</span>
        </button>
      </div>
    </aside>
  );
}
