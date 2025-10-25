import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { 
  Brain, 
  Heart, 
  Users, 
  Target, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ProfilingQuestion {
  id: string;
  category: 'selfEsteem' | 'stressCoping' | 'relationshipPattern' | 'coreValues' | 'strengths';
  question: string;
  type: 'scale' | 'multiple-choice' | 'ranking';
  options?: string[];
  scaleRange?: { min: number; max: number; labels: string[] };
  required: boolean;
}

const PersonalProfilingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [questions, setQuestions] = useState<ProfilingQuestion[]>([]);
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [showAgeSelection, setShowAgeSelection] = useState(true);

  // 개인 종합 프로파일링 질문들
  const profilingQuestions: ProfilingQuestion[] = [
    // 자아존중감 측정 (1-5단계)
    {
      id: 'self_worth',
      category: 'selfEsteem',
      question: '나는 나 자신을 가치 있는 사람이라고 생각한다',
      type: 'scale',
      scaleRange: { 
        min: 1, 
        max: 5, 
        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
      },
      required: true
    },
    {
      id: 'self_confidence',
      category: 'selfEsteem',
      question: '나는 내 능력에 대해 자신감을 가지고 있다',
      type: 'scale',
      scaleRange: { 
        min: 1, 
        max: 5, 
        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
      },
      required: true
    },
    {
      id: 'self_acceptance',
      category: 'selfEsteem',
      question: '나는 내 모습을 있는 그대로 받아들인다',
      type: 'scale',
      scaleRange: { 
        min: 1, 
        max: 5, 
        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
      },
      required: true
    },

    // 스트레스 대처 방식 (복수 선택)
    {
      id: 'stress_coping',
      category: 'stressCoping',
      question: '스트레스를 받을 때 주로 어떤 방식으로 대처하시나요? (복수 선택 가능)',
      type: 'multiple-choice',
      options: [
        '운동이나 신체 활동',
        '친구나 가족과 대화',
        '혼자만의 시간 갖기',
        '취미 활동하기',
        '음악 듣기나 영화 보기',
        '명상이나 요가',
        '문제 해결에 집중하기',
        '전문가 도움 받기',
        '일시적으로 피하기',
        '감정 표출하기'
      ],
      required: true
    },

    // 대인관계 패턴
    {
      id: 'relationship_style',
      category: 'relationshipPattern',
      question: '당신의 대인관계 스타일은 어떤 편인가요?',
      type: 'multiple-choice',
      options: [
        '외향적이고 사교적인 편',
        '내향적이고 신중한 편',
        '상황에 따라 유연하게 적응',
        '깊고 의미 있는 관계를 선호',
        '넓고 다양한 관계를 선호',
        '리더십을 발휘하는 편',
        '협력하고 지원하는 편',
        '독립적이고 자율적인 편'
      ],
      required: true
    },

    // 핵심 가치관 (복수 선택)
    {
      id: 'core_values',
      category: 'coreValues',
      question: '당신에게 가장 중요한 가치관은 무엇인가요? (최대 5개 선택)',
      type: 'multiple-choice',
      options: [
        '가족과의 유대',
        '개인의 성장',
        '사회적 기여',
        '경제적 안정',
        '창의성과 혁신',
        '정직과 진실',
        '자유와 독립',
        '안정과 보안',
        '모험과 도전',
        '조화와 평화',
        '성취와 성공',
        '사랑과 관계',
        '지식과 학습',
        '건강과 웰빙',
        '영성과 의미'
      ],
      required: true
    },

    // 강점 발견 (복수 선택)
    {
      id: 'personal_strengths',
      category: 'strengths',
      question: '다음 중 당신의 강점이라고 생각하는 것들을 선택해주세요 (최대 7개)',
      type: 'multiple-choice',
      options: [
        '공감 능력',
        '논리적 사고',
        '창의적 아이디어',
        '리더십',
        '협력과 팀워크',
        '끈기와 인내',
        '유연성과 적응력',
        '의사소통 능력',
        '문제 해결 능력',
        '계획과 조직력',
        '호기심과 학습욕',
        '긍정적 사고',
        '책임감',
        '도전 정신',
        '배려와 친절',
        '집중력',
        '직관력',
        '분석 능력',
        '예술적 감각',
        '유머 감각'
      ],
      required: true
    }
  ];


  useEffect(() => {
    checkExistingProfile();
    if (ageGroup) {
      loadQuestions();
    }
  }, [user, ageGroup]);

  const checkExistingProfile = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().personalProfile) {
        setHasExistingProfile(true);
      }
    } catch (error) {
      console.error('기존 프로필 확인 오류:', error);
    }
  };

  const loadQuestions = async () => {
    if (!user) return;

    try {
      const functions = getFunctions();
      const getProfilingQuestions = httpsCallable(functions, 'getProfilingQuestions');
      
      const result = await getProfilingQuestions({ ageGroup });
      if ((result.data as any).success) {
        setQuestions((result.data as any).questions);
        setShowAgeSelection(false);
      }
    } catch (error) {
      console.error('질문 로드 오류:', error);
      // 기본 질문 사용
      setQuestions(profilingQuestions);
    }
  };

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    if (currentQuestion?.required && !responses[currentQuestion.id]) {
      toast.error('필수 질문에 답변해주세요.');
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };


  const handleSubmit = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const functions = getFunctions();
      const analyzeProfilingResults = httpsCallable(functions, 'analyzeProfilingResults');
      
      const result = await analyzeProfilingResults({
        userId: user.uid,
        ageGroup,
        responses
      });

      if ((result.data as any).success) {
        // 사용자 문서 업데이트
        await setDoc(doc(db, 'users', user.uid), {
          personalProfile: {
            ageGroup,
            completedAt: new Date(),
            profileData: (result.data as any).result.scores,
            mindMap: (result.data as any).result.mindMap,
            aiAnalysis: (result.data as any).result.aiAnalysis
          }
        }, { merge: true });

        toast.success('개인 프로파일링이 완료되었습니다!');
        navigate('/profile/results');
      } else {
        throw new Error('분석 실패');
      }
    } catch (error) {
      console.error('프로파일링 저장 오류:', error);
      toast.error('프로파일링 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeGroupSelect = (selectedAgeGroup: string) => {
    setAgeGroup(selectedAgeGroup);
  };

  const renderAgeSelection = () => {
    const ageGroups = [
      { id: '10s', label: '10대', description: '정체성 형성기' },
      { id: '20s', label: '20대', description: '성인기 진입' },
      { id: '30s', label: '30대', description: '안정기' },
      { id: '40s', label: '40대', description: '중년기' },
      { id: '50s+', label: '50대+', description: '성숙기' }
    ];

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🧠 개인 종합 프로파일링
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            연령대를 선택해주세요. 각 연령대별로 맞춤형 질문을 제공합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ageGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => handleAgeGroupSelect(group.id)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-pink-300"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500 mb-2">
                  {group.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {group.description}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  연령대별 특화 질문 제공
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            선택한 연령대에 따라 개인화된 심리 분석을 제공합니다
          </p>
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    const question = questions[currentStep];
    
    switch (question.type) {
      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              {question.scaleRange?.labels.map((label, index) => (
                <button
                  key={index}
                  onClick={() => handleResponse(question.id, index + 1)}
                  className={`flex-1 mx-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                    responses[question.id] === index + 1
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{index + 1}</div>
                    <div className="text-sm">{label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'multiple-choice': {
        const isMultiSelect = question.question.includes('복수 선택') || question.question.includes('최대');
        const maxSelections = question.question.includes('최대 5개') ? 5 : 
                             question.question.includes('최대 7개') ? 7 : 
                             isMultiSelect ? 10 : 1;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options?.map((option, index) => {
              const isSelected = isMultiSelect 
                ? (responses[question.id] || []).includes(option)
                : responses[question.id] === option;
              
              const canSelect = isMultiSelect 
                ? !isSelected || (responses[question.id] || []).length < maxSelections
                : true;

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isMultiSelect) {
                      const currentSelections = responses[question.id] || [];
                      if (isSelected) {
                        // 선택 해제
                        handleResponse(
                          question.id, 
                          currentSelections.filter((item: string) => item !== option)
                        );
                      } else if (currentSelections.length < maxSelections) {
                        // 선택 추가
                        handleResponse(question.id, [...currentSelections, option]);
                      }
                    } else {
                      handleResponse(question.id, option);
                    }
                  }}
                  disabled={isMultiSelect && !canSelect && !isSelected}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : canSelect
                      ? 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      isSelected ? 'border-pink-500 bg-pink-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'selfEsteem': return <Heart className="w-6 h-6" />;
      case 'stressCoping': return <Brain className="w-6 h-6" />;
      case 'relationshipPattern': return <Users className="w-6 h-6" />;
      case 'coreValues': return <Target className="w-6 h-6" />;
      case 'strengths': return <Star className="w-6 h-6" />;
      default: return <Brain className="w-6 h-6" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'selfEsteem': return '자아존중감';
      case 'stressCoping': return '스트레스 대처';
      case 'relationshipPattern': return '대인관계 패턴';
      case 'coreValues': return '핵심 가치관';
      case 'strengths': return '개인 강점';
      default: return '프로파일링';
    }
  };

  if (hasExistingProfile) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            이미 프로파일링을 완료하셨습니다
          </h2>
          <p className="text-gray-600 mb-6">
            기존 프로파일 결과를 확인하거나 새로운 검사를 진행해보세요.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/profile/results')}
              className="btn-primary w-full"
            >
              프로파일 결과 보기
            </button>
            <button
              onClick={() => setHasExistingProfile(false)}
              className="btn-outline w-full"
            >
              새로 검사하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showAgeSelection) {
    return renderAgeSelection();
  }

  const currentQuestion = questions[currentStep];
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">프로파일링 질문을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-display-medium text-gray-900 mb-4">
            개인 종합 프로파일링
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            당신의 고유한 심리적 특성을 파악하여 개인 맞춤형 마음 지도를 만들어드립니다.
          </p>
        </div>

        {/* 진행률 표시 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              {currentStep + 1} / {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}% 완료
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 질문 카드 */}
        <div className="max-w-4xl mx-auto">
          <div className="card-elevated fade-in">
            {/* 카테고리 헤더 */}
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center text-pink-600 mr-4">
                {getCategoryIcon(currentQuestion.category)}
              </div>
              <div>
                <h3 className="text-title-large text-gray-900">
                  {getCategoryTitle(currentQuestion.category)}
                </h3>
                <p className="text-body-small text-gray-500">
                  {currentStep + 1}단계
                </p>
              </div>
            </div>

            {/* 질문 */}
            <div className="mb-8">
              <h2 className="text-headline-small text-gray-900 mb-6">
                {currentQuestion.question}
              </h2>
              
              {currentQuestion.required && (
                <div className="flex items-center text-orange-600 mb-4">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="text-sm">필수 응답 항목입니다</span>
                </div>
              )}

              {renderQuestion()}
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                이전
              </button>

              <button
                onClick={handleNext}
                disabled={isLoading}
                className="btn-primary flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2" />
                    처리 중...
                  </>
                ) : currentStep === questions.length - 1 ? (
                  <>
                    완료하기
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    다음
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AI 경고 메시지 */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="alert-info">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">AI 분석 결과에 대한 안내</p>
                <p>
                  이 프로파일링 결과는 AI 분석에 기반하며, 개인의 복잡한 심리를 완전히 반영하지 못할 수 있습니다. 
                  전문적인 심리 상담이 필요한 경우 전문가의 도움을 받으시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalProfilingPage;
