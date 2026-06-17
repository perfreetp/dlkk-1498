import { Bell, Search, User } from 'lucide-react';
import { useCaseStore } from '@/store/useCaseStore';

export function Header() {
  const { currentUser } = useCaseStore();

  return (
    <header className="h-14 bg-white shadow-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索办件号、姓名、身份证号..."
            className="w-80 h-8 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-100"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500">
          <span className="text-primary-600 font-medium">{currentUser.department}</span>
          <span className="mx-2">·</span>
          <span>窗口 {currentUser.windowNo}</span>
        </div>
        <button className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={16} className="text-primary-600" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-800">{currentUser.name}</div>
            <div className="text-xs text-gray-400">窗口受理人员</div>
          </div>
        </div>
      </div>
    </header>
  );
}
