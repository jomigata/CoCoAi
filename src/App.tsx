import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';

// 컴포넌트 임포트
import Layout from '@components/Layout/Layout';
import HomePage from '@pages/HomePage';
import NotFoundPage from '@pages/NotFoundPage';

// 동적 import로 코드 스플리팅 구현
const LoginPage = lazy(() => import('@pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('@pages/Auth/RegisterPage'));
const DashboardPage = lazy(() => import('@pages/Dashboard/DashboardPage'));
const CounselingPage = lazy(() => import('@pages/Counseling/CounselingPage'));
const ProfilePage = lazy(() => import('@pages/Profile/ProfilePage'));

// 새로운 페이지들 - 동적 import
const PersonalProfilingPage = lazy(() => import('@pages/Profiling/PersonalProfilingPage'));
const ProfilingResultsPage = lazy(() => import('@pages/Profiling/ProfilingResultsPage'));
const MindMapPage = lazy(() => import('@pages/MindMap/MindMapPage'));
const GroupsPage = lazy(() => import('@pages/Groups/GroupsPage'));
const CreateGroupPage = lazy(() => import('@pages/Groups/CreateGroupPage'));
const GroupInvitePage = lazy(() => import('@pages/Groups/GroupInvitePage'));
const GroupDiagnosisPage = lazy(() => import('@pages/Groups/GroupDiagnosisPage'));
const GroupReportsPage = lazy(() => import('@pages/Groups/GroupReportsPage'));
const WeeklyReportPage = lazy(() => import('@pages/Groups/WeeklyReportPage'));
const DailyMoodPage = lazy(() => import('@pages/Mood/DailyMoodPage'));
const ChatPage = lazy(() => import('@pages/Chat/ChatPage'));
const RecommendationsPage = lazy(() => import('@pages/Recommendations/RecommendationsPage'));
const AchievementsPage = lazy(() => import('@pages/Achievements/AchievementsPage'));
const RelationshipGardenPage = lazy(() => import('@pages/Garden/RelationshipGardenPage'));
const CounselorMatchingPage = lazy(() => import('@pages/Counselor/CounselorMatchingPage'));
const PersonalGrowthPage = lazy(() => import('@pages/Growth/PersonalGrowthPage'));

// Phase 2: 소통 개선 도구 페이지들 - 동적 import
const ConversationStarterPage = lazy(() => import('@pages/Communication/ConversationStarterPage'));
const CommunicationPage = lazy(() => import('@pages/Communication/CommunicationPage'));
const EmotionDiaryPage = lazy(() => import('@pages/Communication/EmotionDiaryPage'));
const MessageTemplatePage = lazy(() => import('@pages/Communication/MessageTemplatePage'));
const ValueAnalysisPage = lazy(() => import('@pages/Communication/ValueAnalysisPage'));

// 컨텍스트 임포트
import { AuthProvider } from '@store/AuthContext';
import { ThemeProvider } from '@store/ThemeContext';
import AccessibilityProvider from '@components/Accessibility/AccessibilityProvider';
import NotificationProvider from '@store/NotificationContext';

// 스타일 임포트
import './index.css';
import './styles/design-system.css';

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="loading-spinner"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AccessibilityProvider>
            <Router>
              <div className="App">
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* 공개 라우트 */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      
                      {/* 보호된 라우트 */}
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/counseling" element={<CounselingPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      
                  {/* 새로운 기능 라우트 */}
                  <Route path="/profiling" element={<PersonalProfilingPage />} />
                  <Route path="/profile/results" element={<ProfilingResultsPage />} />
                  <Route path="/mind-map" element={<MindMapPage />} />
                  <Route path="/groups" element={<GroupsPage />} />
                      <Route path="/groups/create" element={<CreateGroupPage />} />
                      <Route path="/groups/join" element={<GroupInvitePage />} />
                      <Route path="/groups/:groupId/diagnosis" element={<GroupDiagnosisPage />} />
                      <Route path="/groups/:groupId/reports" element={<GroupReportsPage />} />
                      <Route path="/groups/:groupId/weekly-report" element={<WeeklyReportPage />} />
                      <Route path="/mood" element={<DailyMoodPage />} />
                      <Route path="/chat" element={<ChatPage />} />
                      <Route path="/recommendations" element={<RecommendationsPage />} />
                      <Route path="/achievements" element={<AchievementsPage />} />
                      <Route path="/garden" element={<RelationshipGardenPage />} />
                      <Route path="/counselor-matching" element={<CounselorMatchingPage />} />
                      <Route path="/growth" element={<PersonalGrowthPage />} />
                      
                      {/* Phase 2: 소통 개선 도구 */}
                      <Route path="/communication" element={<CommunicationPage />} />
                      <Route path="/communication/starters" element={<ConversationStarterPage />} />
                      <Route path="/communication/diary" element={<EmotionDiaryPage />} />
                      <Route path="/communication/messages" element={<MessageTemplatePage />} />
                      <Route path="/communication/values" element={<ValueAnalysisPage />} />
                      
                      {/* 404 페이지 */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </Layout>
                
                {/* 토스트 알림 */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#4ade80',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </AccessibilityProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
