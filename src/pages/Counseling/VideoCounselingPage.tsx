import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Phone, Users, Clock, Star, MessageCircle } from 'lucide-react';
import VideoCall from '@components/VideoCall/VideoCall';
import LoadingSpinner from '@components/Common/LoadingSpinner';
import AIWarning from '@components/Common/AIWarning';
import { useAIWarning } from '@hooks/useAIWarning';
import toast from 'react-hot-toast';

interface Counselor {
  id: string;
  name: string;
  specialization: string[];
  experience: number;
  rating: number;
  profileImage: string;
  bio: string;
  languages: string[];
  availability: {
    timezone: string;
    schedule: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
  };
}

interface Session {
  id: string;
  counselorId: string;
  clientId: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  rating?: number;
}

const VideoCounselingPage: React.FC = () => {
  const { user } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [isInCall, setIsInCall] = useState(false);
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState<string>('');

  const aiWarning = useAIWarning({
    analysisType: 'counseling',
    severity: 'high'
  });

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    } else {
      setIsLoading(false);
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    if (!user || !sessionId) return;

    try {
      setIsLoading(true);
      
      // 실제 구현에서는 Firebase에서 세션 데이터를 가져옴
      // 임시 데이터로 대체
      const mockSession: Session = {
        id: sessionId,
        counselorId: 'counselor-1',
        clientId: user.uid,
        scheduledAt: new Date(),
        duration: 60,
        status: 'scheduled'
      };

      const mockCounselor: Counselor = {
        id: 'counselor-1',
        name: '김상담',
        specialization: ['우울증', '불안장애', '대인관계'],
        experience: 8,
        rating: 4.8,
        profileImage: '/images/counselor-placeholder.jpg',
        bio: '8년 경력의 전문 심리상담사입니다. CBT와 인지행동치료를 전문으로 하며, 따뜻하고 공감적인 상담을 제공합니다.',
        languages: ['한국어', '영어'],
        availability: {
          timezone: 'Asia/Seoul',
          schedule: [
            { day: '월', startTime: '09:00', endTime: '18:00' },
            { day: '화', startTime: '09:00', endTime: '18:00' },
            { day: '수', startTime: '09:00', endTime: '18:00' },
            { day: '목', startTime: '09:00', endTime: '18:00' },
            { day: '금', startTime: '09:00', endTime: '18:00' }
          ]
        }
      };

      setSession(mockSession);
      setCounselor(mockCounselor);
      setRoomId(`room-${sessionId}`);
      
    } catch (error) {
      console.error('세션 데이터 로드 오류:', error);
      toast.error('상담 세션 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const startVideoCall = () => {
    if (!user || !counselor) {
      toast.error('상담사 정보가 없습니다.');
      return;
    }

    setIsInCall(true);
    toast.success('화상 상담이 시작됩니다');
  };

  const endVideoCall = () => {
    setIsInCall(false);
    toast.success('화상 상담이 종료되었습니다');
    
    // 상담 완료 후 피드백 페이지로 이동
    navigate(`/counseling/feedback/${sessionId}`);
  };

  const cancelSession = () => {
    if (window.confirm('상담을 취소하시겠습니까?')) {
      toast.success('상담이 취소되었습니다');
      navigate('/counseling');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">로그인이 필요합니다.</p>
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  if (!session || !counselor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">상담 세션을 찾을 수 없습니다.</p>
          <button 
            onClick={() => navigate('/counseling')}
            className="btn btn-primary"
          >
            상담 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (isInCall) {
    return (
      <VideoCall
        roomId={roomId}
        userId={user.uid}
        userName={user.displayName || '사용자'}
        onCallEnd={endVideoCall}
        isCounselor={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            화상 상담
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            전문 상담사와의 1:1 화상 상담 세션입니다.
          </p>
        </div>

        {/* AI 경고 */}
        <div className="mb-6">
          <AIWarning {...aiWarning} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 상담사 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {counselor.name}
                </h3>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {counselor.rating}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    ({counselor.experience}년 경력)
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">전문 분야</h4>
                  <div className="flex flex-wrap gap-2">
                    {counselor.specialization.map((spec, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">소개</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {counselor.bio}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">사용 언어</h4>
                  <div className="flex flex-wrap gap-2">
                    {counselor.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 상담 세션 정보 및 컨트롤 */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                상담 세션 정보
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">예정 시간</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {session.scheduledAt.toLocaleDateString('ko-KR')} {session.scheduledAt.toLocaleTimeString('ko-KR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">상담 시간</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {session.duration}분
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">상담 방식</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      화상 상담
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">참여자</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      나, {counselor.name} 상담사
                    </p>
                  </div>
                </div>
              </div>

              {/* 상담 시작 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={startVideoCall}
                  className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Video className="h-6 w-6" />
                  <span>화상 상담 시작</span>
                </button>

                <button
                  onClick={cancelSession}
                  className="px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  상담 취소
                </button>
              </div>
            </div>

            {/* 상담 전 준비사항 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                상담 전 준비사항
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>조용하고 프라이버시가 보장되는 공간에서 상담을 받으세요.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>카메라와 마이크가 정상 작동하는지 확인해주세요.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>안정적인 인터넷 연결을 확인해주세요.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>상담 중에는 다른 활동을 하지 말고 집중해주세요.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCounselingPage;
