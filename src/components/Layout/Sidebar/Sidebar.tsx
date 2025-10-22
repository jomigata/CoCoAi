import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { 
  Home, 
  MessageCircle, 
  BarChart3, 
  User, 
  Settings,
  Calendar,
  FileText,
  Users
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { name: '홈', href: '/', icon: Home },
    { name: '상담', href: '/counseling', icon: MessageCircle },
    { name: '대시보드', href: '/dashboard', icon: BarChart3 },
    { name: '프로필', href: '/profile', icon: User },
  ];

  const adminItems = [
    { name: '일정 관리', href: '/admin/schedule', icon: Calendar },
    { name: '상담 기록', href: '/admin/records', icon: FileText },
    { name: '사용자 관리', href: '/admin/users', icon: Users },
    { name: '설정', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  if (!user) {
    return null; // 로그인하지 않은 사용자에게는 사이드바를 보여주지 않음
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        {/* 사용자 정보 */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {user.displayName || '사용자'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="space-y-2">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              메인 메뉴
            </h3>
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 관리자 메뉴 (상담사용) */}
          {user.role === 'counselor' && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                관리자 메뉴
              </h3>
              <ul className="space-y-1">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive(item.href)
                            ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
