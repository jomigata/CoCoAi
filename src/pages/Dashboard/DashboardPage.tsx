import React from 'react';
import { useAuth } from '@store/AuthContext';
import { BarChart3, MessageCircle, Calendar, Users, TrendingUp, Activity } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '@components/Common/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();

  // 로딩 중일 때 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const stats = [
    { name: '총 상담 세션', value: '24', icon: MessageCircle, change: '+12%', changeType: 'positive' },
    { name: '이번 달 상담', value: '8', icon: Calendar, change: '+3', changeType: 'positive' },
    { name: '만족도', value: '4.8', icon: TrendingUp, change: '+0.2', changeType: 'positive' },
    { name: '활성 사용자', value: '156', icon: Users, change: '+8%', changeType: 'positive' },
  ];

  const recentActivities = [
    { id: 1, type: '상담', description: '김민수님과의 상담이 완료되었습니다.', time: '2시간 전' },
    { id: 2, type: '메시지', description: '새로운 메시지가 도착했습니다.', time: '4시간 전' },
    { id: 3, type: '예약', description: '내일 오후 2시 상담 예약이 있습니다.', time: '6시간 전' },
    { id: 4, type: '리뷰', description: '새로운 리뷰가 작성되었습니다.', time: '1일 전' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          안녕하세요, {user?.displayName || '사용자'}님! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          오늘도 마음의 건강을 위해 함께해요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-pink-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  지난 달 대비
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            최근 활동
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            빠른 액션
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <MessageCircle className="h-8 w-8 text-pink-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                새 상담 시작
              </p>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Calendar className="h-8 w-8 text-pink-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                일정 관리
              </p>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <BarChart3 className="h-8 w-8 text-pink-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                리포트 보기
              </p>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Activity className="h-8 w-8 text-pink-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                심리 테스트
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;