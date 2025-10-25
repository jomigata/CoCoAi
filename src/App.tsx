import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// 컴포넌트 임포트
import Layout from '@components/Layout/Layout';
import HomePage from '@pages/HomePage';
import LoginPage from '@pages/Auth/LoginPage';
import RegisterPage from '@pages/Auth/RegisterPage';
import DashboardPage from '@pages/Dashboard/DashboardPage';
import CounselingPage from '@pages/Counseling/CounselingPage';
import ProfilePage from '@pages/Profile/ProfilePage';
import NotFoundPage from '@pages/NotFoundPage';

// 새로운 페이지들
import PersonalProfilingPage from '@pages/Profiling/PersonalProfilingPage';
import ProfilingResultsPage from '@pages/Profiling/ProfilingResultsPage';
import GroupsPage from '@pages/Groups/GroupsPage';
import CreateGroupPage from '@pages/Groups/CreateGroupPage';
import GroupInvitePage from '@pages/Groups/GroupInvitePage';
import GroupDiagnosisPage from '@pages/Groups/GroupDiagnosisPage';
import GroupReportsPage from '@pages/Groups/GroupReportsPage';
import DailyMoodPage from '@pages/Mood/DailyMoodPage';
import ChatPage from '@pages/Chat/ChatPage';
import RecommendationsPage from '@pages/Recommendations/RecommendationsPage';
import AchievementsPage from '@pages/Achievements/AchievementsPage';
import RelationshipGardenPage from '@pages/Garden/RelationshipGardenPage';
import CounselorMatchingPage from '@pages/Counselor/CounselorMatchingPage';
import PersonalGrowthPage from '@pages/Growth/PersonalGrowthPage';

// Phase 2: 소통 개선 도구 페이지들
import ConversationStarterPage from '@pages/Communication/ConversationStarterPage';

// 컨텍스트 임포트
import { AuthProvider } from '@store/AuthContext';
import { ThemeProvider } from '@store/ThemeContext';

// 스타일 임포트
import './index.css';
import './styles/design-system.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Layout>
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
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/create" element={<CreateGroupPage />} />
                <Route path="/groups/join" element={<GroupInvitePage />} />
                <Route path="/groups/:groupId/diagnosis" element={<GroupDiagnosisPage />} />
                <Route path="/groups/:groupId/reports" element={<GroupReportsPage />} />
                <Route path="/mood" element={<DailyMoodPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/garden" element={<RelationshipGardenPage />} />
                <Route path="/counselor-matching" element={<CounselorMatchingPage />} />
                <Route path="/growth" element={<PersonalGrowthPage />} />
                
                {/* Phase 2: 소통 개선 도구 라우트 */}
                <Route path="/communication/starters" element={<ConversationStarterPage />} />
                
                {/* 404 페이지 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
