import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { doc, getDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Target, 
  CheckCircle,
  Clock,
  ArrowRight,
  Brain,
  Lightbulb,
  Star,
  AlertTriangle
} from 'lucide-react';

// AI 경고 시스템
import AIWarning from '@components/Common/AIWarning';
import { useGroupWarning } from '@hooks/useAIWarning';

interface Group {
  id: string;
  name: string;
  type: string;
  characteristics: string[];
  memberCount: number;
}

interface GroupMember {
  userId: string;
  displayName: string;
  role: string;
  status: string;
}

interface DiagnosisQuestion {
  id: string;
  category: 'communication' | 'trust' | 'conflict' | 'support' | 'goals';
  question: string;
  type: 'scale' | 'choice' | 'ranking';
  options?: string[];
  scaleRange?: { min: number; max: number; labels: string[] };
  required: boolean;
}

interface DiagnosisResponse {
  questionId: string;
  response: any;
  memberId: string;
}

/**
 * 🧠 그룹 심층 진단 페이지
 * 그룹 유형에 맞춘 맞춤형 심리 검사 제공
 * 
 * 심리상담가 1,2가 설계한 그룹 진단 도구
 * AI 기반 다각도 분석 결과 제공
 */
const GroupDiagnosisPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [questions, setQuestions] = useState<DiagnosisQuestion[]>([]);
  const [responses, setResponses] = useState<{ [questionId: string]: any }>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedMembers, setCompletedMembers] = useState<string[]>([]);
  
  // AI 경고 시스템
  const aiWarning = useGroupWarning();

  useEffect(() => {
    if (groupId) {
      loadGroupData();
      loadDiagnosisQuestions();
      checkCompletionStatus();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    if (!groupId) return;

    try {
      // 그룹 정보 로드
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        setGroup({ id: groupDoc.id, ...groupDoc.data() } as Group);
      }

      // 그룹 멤버 로드
      const membersSnapshot = await getDocs(collection(db, `groups/${groupId}/members`));
      const membersList: GroupMember[] = [];
      
      membersSnapshot.forEach((doc) => {
        membersList.push({ ...doc.data() } as GroupMember);
      });
      
      setMembers(membersList);
    } catch (error) {
      console.error('그룹 데이터 로드 오류:', error);
      toast.error('그룹 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadDiagnosisQuestions = async () => {
    // 실제 구현에서는 그룹 유형에 따라 다른 질문 세트 로드
    // 임시로 하드코딩된 질문들 사용
    const mockQuestions: DiagnosisQuestion[] = [
      // 소통 관련 질문
      {
        id: 'comm_1',
        category: 'communication',
        question: '우리 그룹에서 서로의 의견을 자유롭게 표현할 수 있다',
        type: 'scale',
        scaleRange: { 
          min: 1, 
          max: 5, 
          labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
        },
        required: true
      },
      {
        id: 'comm_2',
        category: 'communication',
        question: '그룹 내에서 가장 중요한 소통 방식은 무엇인가요?',
        type: 'choice',
        options: ['직접적인 대화', '경청과 공감', '비언어적 표현', '서면 소통', '행동으로 보여주기'],
        required: true
      },
      
      // 신뢰 관련 질문
      {
        id: 'trust_1',
        category: 'trust',
        question: '그룹 멤버들을 완전히 신뢰한다',
        type: 'scale',
        scaleRange: { 
          min: 1, 
          max: 5, 
          labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
        },
        required: true
      },
      {
        id: 'trust_2',
        category: 'trust',
        question: '신뢰 구축에 가장 중요한 요소를 순서대로 나열해주세요',
        type: 'ranking',
        options: ['약속 지키기', '솔직한 소통', '상호 존중', '시간 투자', '공통 목표'],
        required: true
      },
      
      // 갈등 해결 관련 질문
      {
        id: 'conflict_1',
        category: 'conflict',
        question: '그룹 내 갈등이 발생했을 때 주로 어떻게 해결하나요?',
        type: 'choice',
        options: ['직접 대화로 해결', '시간을 두고 자연스럽게', '제3자 중재', '각자 양보', '리더가 결정'],
        required: true
      },
      
      // 지지 관련 질문
      {
        id: 'support_1',
        category: 'support',
        question: '어려운 일이 있을 때 그룹 멤버들에게 도움을 요청할 수 있다',
        type: 'scale',
        scaleRange: { 
          min: 1, 
          max: 5, 
          labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
        },
        required: true
      },
      
      // 목표 관련 질문
      {
        id: 'goals_1',
        category: 'goals',
        question: '우리 그룹의 공통 목표가 명확하다',
        type: 'scale',
        scaleRange: { 
          min: 1, 
          max: 5, 
          labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
        },
        required: true
      }
    ];

    setQuestions(mockQuestions);
    setIsLoading(false);
  };

  const checkCompletionStatus = async () => {
    // 실제 구현에서는 Firestore에서 완료 상태 확인
    // 임시로 빈 배열 설정
    setCompletedMembers([]);
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    if (currentQuestion.required && !responses[currentQuestion.id]) {
      toast.error('필수 질문에 답변해주세요.');
      return;
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !groupId) return;

    // 모든 필수 질문 답변 확인
    const unansweredRequired = questions.filter(q => 
      q.required && !responses[q.id]
    );

    if (unansweredRequired.length > 0) {
      toast.error('모든 필수 질문에 답변해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 응답 저장
      const diagnosisData = {
        groupId,
        userId: user.uid,
        responses,
        completedAt: new Date(),
        version: '1.0'
      };

      await addDoc(collection(db, 'group_diagnosis_responses'), diagnosisData);
      
      toast.success('진단을 완료했습니다! 🎉');
      
      // 모든 멤버가 완료했는지 확인 후 결과 페이지로 이동
      navigate(`/groups/${groupId}/diagnosis/results`);
      
    } catch (error) {
      console.error('진단 제출 오류:', error);
      toast.error('진단 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return <MessageCircle className="w-5 h-5" />;
      case 'trust': return <Heart className="w-5 h-5" />;
      case 'conflict': return <AlertTriangle className="w-5 h-5" />;
      case 'support': return <Users className="w-5 h-5" />;
      case 'goals': return <Target className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'communication': return '소통';
      case 'trust': return '신뢰';
      case 'conflict': return '갈등 해결';
      case 'support': return '상호 지지';
      case 'goals': return '목표 공유';
      default: return '기타';
    }
  };

  const renderQuestion = (question: DiagnosisQuestion) => {
    switch (question.type) {
      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              {question.scaleRange?.labels.map((label, index) => (
                <span key={index} className="text-body-small text-gray-600 text-center flex-1">
                  {label}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center">
              {Array.from({ length: question.scaleRange?.max || 5 }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handleResponseChange(question.id, index + 1)}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-medium transition-colors ${
                    responses[question.id] === index + 1
                      ? 'border-pink-500 bg-pink-500 text-white'
                      : 'border-gray-300 text-gray-600 hover:border-pink-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleResponseChange(question.id, option)}
                className={`w-full p-4 text-left border rounded-lg transition-colors ${
                  responses[question.id] === option
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-300 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    responses[question.id] === option
                      ? 'border-pink-500 bg-pink-500'
                      : 'border-gray-300'
                  }`}>
                    {responses[question.id] === option && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  {option}
                </div>
              </button>
            ))}
          </div>
        );
        
      case 'ranking':
        // 간단한 순위 선택 (실제로는 드래그 앤 드롭 구현)
        return (
          <div className="space-y-3">
            <p className="text-body-medium text-gray-600 mb-4">
              가장 중요한 순서대로 선택해주세요 (1순위부터)
            </p>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <select
                  onChange={(e) => {
                    const currentRanking = responses[question.id] || {};
                    currentRanking[option] = parseInt(e.target.value);
                    handleResponseChange(question.id, currentRanking);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">순위</option>
                  {Array.from({ length: question.options?.length || 0 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}순위</option>
                  ))}
                </select>
                <span className="flex-1">{option}</span>
              </div>
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">진단 도구를 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            그룹을 찾을 수 없습니다
          </h2>
          <button
            onClick={() => navigate('/groups')}
            className="btn-primary w-full"
          >
            그룹 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
            <Brain className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            {group.name} 그룹 진단
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-6">
            그룹의 소통 패턴과 관계 역학을 분석하여 더 나은 관계를 만들어가세요.
          </p>
        </div>

        {/* AI 경고 시스템 */}
        <div className="mb-8">
          <AIWarning
            message={aiWarning.message}
            details={aiWarning.details}
            timestamp={aiWarning.timestamp}
            type={aiWarning.type}
            showDetails={false}
            className="max-w-4xl mx-auto"
          />
        </div>

        {/* 진행률 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-body-medium font-medium text-gray-700">
                진행률: {currentStep + 1}/{questions.length}
              </span>
              <span className="text-body-medium text-gray-600">
                {Math.round(progress)}% 완료
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 질문 카드 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-soft p-8">
            {/* 카테고리 표시 */}
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-3">
                {getCategoryIcon(currentQuestion.category)}
              </div>
              <div>
                <span className="text-body-small font-medium text-purple-600 uppercase tracking-wide">
                  {getCategoryName(currentQuestion.category)}
                </span>
                <div className="text-body-small text-gray-500">
                  질문 {currentStep + 1} / {questions.length}
                </div>
              </div>
            </div>

            {/* 질문 */}
            <h2 className="text-headline-large text-gray-900 mb-8">
              {currentQuestion.question}
            </h2>

            {/* 답변 영역 */}
            <div className="mb-8">
              {renderQuestion(currentQuestion)}
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>

              <div className="flex items-center space-x-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep
                        ? 'bg-pink-500'
                        : index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {currentStep === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '제출 중...' : '진단 완료'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-primary flex items-center"
                >
                  다음
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>

          {/* 완료 현황 */}
          <div className="mt-8 bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-title-medium text-gray-900 mb-4">
              멤버 완료 현황
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    completedMembers.includes(member.userId)
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {completedMembers.includes(member.userId) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-body-medium font-medium text-gray-900">
                      {member.displayName}
                    </p>
                    <p className="text-body-small text-gray-500">
                      {completedMembers.includes(member.userId) ? '완료' : '대기 중'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDiagnosisPage;
