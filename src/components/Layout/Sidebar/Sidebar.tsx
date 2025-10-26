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
  Users,
  Brain,
  Heart,
  Bot,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Gift,
  Video,
  UserCheck
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { name: '홈', href: '/', icon: Home },
    { name: '대시보드', href: '/dashboard', icon: BarChart3 },
    { name: '마음 기록', href: '/mood', icon: Heart },
    { name: '개인 성장', href: '/growth', icon: TrendingUp },
    { name: '그룹', href: '/groups', icon: Users },
    { name: '코코 챗봇', href: '/chat', icon: Bot },
    { name: '프로파일링', href: '/profiling', icon: Brain },
    { name: '마음 지도', href: '/mind-map', icon: Brain },
    { name: '상담사 매칭', href: '/counselor-matching', icon: UserCheck },
    { name: '화상 상담', href: '/counseling', icon: Video },
    { name: '프로필', href: '/profile', icon: User },
  ];

  // Phase 2: 소통 개선 도구 메뉴
  const communicationItems = [
    { name: '소통 도구', href: '/communication', icon: MessageSquare },
    { name: '대화 스타터', href: '/communication/starters', icon: MessageSquare },
    { name: '감정 교환 일기', href: '/communication/diary', icon: BookOpen },
    { name: '메시지 템플릿', href: '/communication/messages', icon: Gift },
    { name: '가치관 분석', href: '/communication/values', icon: BarChart3 },
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

          {/* Phase 2: 소통 개선 도구 메뉴 */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              소통 도구
            </h3>
            <ul className="space-y-1">
              {communicationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
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
