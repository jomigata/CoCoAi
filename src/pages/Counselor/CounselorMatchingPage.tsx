import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { collection, query, where, getDocs, doc, addDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  UserCheck, 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  Video, 
  MessageCircle,
  Heart,
  Brain,
  Users,
  Award,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// AI 경고 시스템
import AIWarning from '@components/Common/AIWarning';
import { useAIWarning } from '@hooks/useAIWarning';

interface Counselor {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  location: string;
  languages: string[];
  availableMethods: ('video' | 'phone' | 'chat' | 'in_person')[];
  priceRange: {
    min: number;
    max: number;
  };
  bio: string;
  education: string[];
  certifications: string[];
  profileImage?: string;
  availability: {
    [key: string]: string[]; // 요일별 시간대
  };
  matchScore?: number;
}

interface MatchingCriteria {
  preferredMethod: 'video' | 'phone' | 'chat' | 'in_person' | 'any';
  specialtyNeeds: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  languagePreference: string;
  urgency: 'immediate' | 'within_week' | 'flexible';
  previousExperience: boolean;
}

/**
 * 👨‍⚕️ 전문가 매칭 및 상담 예약 페이지
 * AI 기반 상담사 매칭 시스템
 * 
 * 심리상담가 1,2가 설계한 전문가 연계 프로세스
 * 사용자의 프로필과 요구사항에 맞는 최적의 상담사 추천
 */
const CounselorMatchingPage: React.FC = () => {
  const { user } = useAuth();
  
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [filteredCounselors, setFilteredCounselors] = useState<Counselor[]>([]);
  const [matchingCriteria, setMatchingCriteria] = useState<MatchingCriteria>({
    preferredMethod: 'any',
    specialtyNeeds: [],
    budgetRange: { min: 50000, max: 200000 },
    languagePreference: '한국어',
    urgency: 'flexible',
    previousExperience: false
  });
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI 경고 시스템
  const aiWarning = useAIWarning({ 
    analysisType: 'general', 
    severity: 'medium' 
  });

  useEffect(() => {
    loadCounselors();
  }, []);

  useEffect(() => {
    filterCounselors();
  }, [counselors, matchingCriteria, searchQuery]);

  const loadCounselors = async () => {
    setIsLoading(true);
    try {
      // 실제 구현에서는 Firestore에서 상담사 목록 로드
      // 임시로 목업 데이터 사용
      const mockCounselors = getMockCounselors();
      setCounselors(mockCounselors);
    } catch (error) {
      console.error('상담사 목록 로드 오류:', error);
      toast.error('상담사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMockCounselors = (): Counselor[] => [
    {
      id: 'counselor_1',
      name: '김상담',
      title: '임상심리전문가',
      specialties: ['우울증', '불안장애', '트라우마', '관계상담'],
      experience: 15,
      rating: 4.8,
      reviewCount: 127,
      location: '서울 강남구',
      languages: ['한국어', '영어'],
      availableMethods: ['video', 'phone', 'in_person'],
      priceRange: { min: 80000, max: 120000 },
      bio: '15년간 다양한 심리적 어려움을 겪는 내담자들과 함께해왔습니다. 특히 우울증과 불안장애 치료에 전문성을 가지고 있으며, 인지행동치료와 마음챙김 기반 치료를 주로 사용합니다.',
      education: ['서울대학교 심리학과 박사', '연세대학교 심리학과 석사'],
      certifications: ['임상심리전문가', '인지행동치료 전문가', 'EMDR 치료사'],
      availability: {
        '월': ['09:00', '10:00', '14:00', '15:00'],
        '화': ['09:00', '10:00', '11:00', '16:00'],
        '수': ['14:00', '15:00', '16:00', '17:00'],
        '목': ['09:00', '10:00', '14:00', '15:00'],
        '금': ['09:00', '11:00', '14:00', '16:00']
      },
      matchScore: 95
    },
    {
      id: 'counselor_2',
      name: '이치료',
      title: '상담심리사',
      specialties: ['가족상담', '부부상담', '청소년상담', '진로상담'],
      experience: 8,
      rating: 4.6,
      reviewCount: 89,
      location: '서울 서초구',
      languages: ['한국어'],
      availableMethods: ['video', 'phone', 'chat'],
      priceRange: { min: 60000, max: 100000 },
      bio: '가족과 관계의 문제를 전문으로 하는 상담심리사입니다. 따뜻하고 공감적인 접근으로 내담자와 함께 해결책을 찾아갑니다.',
      education: ['고려대학교 상담심리학과 석사', '이화여대 심리학과 학사'],
      certifications: ['상담심리사 1급', '가족상담전문가', '청소년상담사'],
      availability: {
        '월': ['10:00', '11:00', '15:00', '16:00'],
        '화': ['09:00', '14:00', '15:00', '17:00'],
        '수': ['10:00', '11:00', '16:00', '17:00'],
        '목': ['09:00', '10:00', '15:00', '16:00'],
        '금': ['14:00', '15:00', '16:00', '17:00']
      },
      matchScore: 87
    },
    {
      id: 'counselor_3',
      name: '박전문',
      title: '정신건강의학과 전문의',
      specialties: ['조현병', '양극성장애', '강박장애', '공황장애'],
      experience: 20,
      rating: 4.9,
      reviewCount: 203,
      location: '서울 종로구',
      languages: ['한국어', '영어', '일본어'],
      availableMethods: ['video', 'in_person'],
      priceRange: { min: 120000, max: 180000 },
      bio: '20년간 정신건강의학과에서 다양한 정신질환을 치료해온 전문의입니다. 약물치료와 심리치료를 병행하여 최적의 치료 결과를 제공합니다.',
      education: ['서울대학교 의과대학 정신건강의학과', '서울대학교 의학박사'],
      certifications: ['정신건강의학과 전문의', '정신분석 전문가'],
      availability: {
        '월': ['14:00', '15:00', '16:00'],
        '화': ['14:00', '15:00', '16:00'],
        '수': ['09:00', '10:00', '14:00'],
        '목': ['14:00', '15:00', '16:00'],
        '금': ['09:00', '10:00', '11:00']
      },
      matchScore: 78
    }
  ];

  const filterCounselors = () => {
    let filtered = [...counselors];

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(counselor =>
        counselor.name.includes(searchQuery) ||
        counselor.specialties.some(specialty => specialty.includes(searchQuery)) ||
        counselor.bio.includes(searchQuery)
      );
    }

    // 상담 방식 필터
    if (matchingCriteria.preferredMethod !== 'any') {
      filtered = filtered.filter(counselor =>
        counselor.availableMethods.includes(matchingCriteria.preferredMethod)
      );
    }

    // 예산 필터
    filtered = filtered.filter(counselor =>
      counselor.priceRange.min <= matchingCriteria.budgetRange.max &&
      counselor.priceRange.max >= matchingCriteria.budgetRange.min
    );

    // 전문 분야 필터
    if (matchingCriteria.specialtyNeeds.length > 0) {
      filtered = filtered.filter(counselor =>
        matchingCriteria.specialtyNeeds.some(need =>
          counselor.specialties.includes(need)
        )
      );
    }

    // 매칭 점수로 정렬
    filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    setFilteredCounselors(filtered);
  };

  const handleBookingRequest = async (counselor: Counselor) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      // 상담 예약 요청 생성
      const bookingRequest = {
        userId: user.uid,
        counselorId: counselor.id,
        requestedAt: new Date(),
        status: 'pending',
        preferredMethod: matchingCriteria.preferredMethod,
        urgency: matchingCriteria.urgency,
        message: `${counselor.name} 상담사님께 상담을 요청합니다.`
      };

      await addDoc(collection(db, 'booking_requests'), bookingRequest);
      
      toast.success('상담 요청이 전송되었습니다! 상담사가 확인 후 연락드릴 예정입니다.');
      setShowBookingModal(false);
      
    } catch (error) {
      console.error('예약 요청 오류:', error);
      toast.error('예약 요청 중 오류가 발생했습니다.');
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      case 'in_person': return <Users className="w-4 h-4" />;
      default: return <UserCheck className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'video': return '화상상담';
      case 'phone': return '전화상담';
      case 'chat': return '채팅상담';
      case 'in_person': return '대면상담';
      default: return '상담';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'within_week': return 'bg-yellow-100 text-yellow-800';
      case 'flexible': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-soft p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">전문가를 찾고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
            <UserCheck className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            전문가 매칭
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            AI가 당신에게 가장 적합한 전문 상담사를 추천해드립니다.
          </p>
        </div>

        {/* AI 경고 시스템 */}
        <div className="mb-8">
          <AIWarning
            message="⚠️ 전문가 매칭 안내"
            details={[
              "이 매칭은 AI 기반 추천으로 참고용입니다.",
              "실제 상담사 선택은 개인의 판단에 따라 결정하세요.",
              "위기 상황 시 즉시 전문 기관에 연락하시기 바랍니다.",
              "상담사와의 첫 만남에서 편안함을 느끼는지 확인하세요."
            ]}
            timestamp={aiWarning.timestamp}
            type="warning"
            showDetails={false}
            className="max-w-4xl mx-auto"
          />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* 매칭 기준 설정 */}
          <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
            <h3 className="text-headline-medium text-gray-900 mb-6 flex items-center">
              <Filter className="w-6 h-6 mr-2 text-pink-500" />
              매칭 기준 설정
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 상담 방식 */}
              <div>
                <label className="block text-body-medium font-medium text-gray-700 mb-2">
                  선호하는 상담 방식
                </label>
                <select
                  value={matchingCriteria.preferredMethod}
                  onChange={(e) => setMatchingCriteria(prev => ({
                    ...prev,
                    preferredMethod: e.target.value as any
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="any">상관없음</option>
                  <option value="video">화상상담</option>
                  <option value="phone">전화상담</option>
                  <option value="chat">채팅상담</option>
                  <option value="in_person">대면상담</option>
                </select>
              </div>

              {/* 예산 범위 */}
              <div>
                <label className="block text-body-medium font-medium text-gray-700 mb-2">
                  예산 범위 (회당)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={matchingCriteria.budgetRange.min}
                    onChange={(e) => setMatchingCriteria(prev => ({
                      ...prev,
                      budgetRange: { ...prev.budgetRange, min: parseInt(e.target.value) }
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="최소"
                  />
                  <span className="text-gray-500">~</span>
                  <input
                    type="number"
                    value={matchingCriteria.budgetRange.max}
                    onChange={(e) => setMatchingCriteria(prev => ({
                      ...prev,
                      budgetRange: { ...prev.budgetRange, max: parseInt(e.target.value) }
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="최대"
                  />
                </div>
              </div>

              {/* 긴급도 */}
              <div>
                <label className="block text-body-medium font-medium text-gray-700 mb-2">
                  상담 긴급도
                </label>
                <select
                  value={matchingCriteria.urgency}
                  onChange={(e) => setMatchingCriteria(prev => ({
                    ...prev,
                    urgency: e.target.value as any
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="flexible">여유있게</option>
                  <option value="within_week">일주일 내</option>
                  <option value="immediate">즉시 필요</option>
                </select>
              </div>
            </div>

            {/* 검색 */}
            <div className="mt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="상담사 이름이나 전문 분야로 검색..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 추천 상담사 목록 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-headline-medium text-gray-900">
                추천 전문가 ({filteredCounselors.length}명)
              </h3>
              
              {matchingCriteria.urgency === 'immediate' && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(matchingCriteria.urgency)}`}>
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  긴급 상담 필요
                </div>
              )}
            </div>

            {filteredCounselors.map((counselor) => (
              <div key={counselor.id} className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* 상담사 기본 정보 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-headline-large text-gray-900">
                            {counselor.name}
                          </h4>
                          {counselor.matchScore && counselor.matchScore > 90 && (
                            <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded-full">
                              최고 매칭
                            </span>
                          )}
                        </div>
                        <p className="text-body-medium text-gray-600 mb-1">
                          {counselor.title}
                        </p>
                        <div className="flex items-center space-x-4 text-body-small text-gray-500">
                          <span className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            {counselor.experience}년 경력
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {counselor.location}
                          </span>
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            {counselor.rating} ({counselor.reviewCount}개 리뷰)
                          </span>
                        </div>
                      </div>
                      
                      {counselor.matchScore && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-pink-600">
                            {counselor.matchScore}%
                          </div>
                          <div className="text-xs text-gray-500">매칭도</div>
                        </div>
                      )}
                    </div>

                    {/* 전문 분야 */}
                    <div className="mb-4">
                      <h5 className="text-body-medium font-medium text-gray-700 mb-2">
                        전문 분야
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {counselor.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 상담 방식 */}
                    <div className="mb-4">
                      <h5 className="text-body-medium font-medium text-gray-700 mb-2">
                        상담 방식
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {counselor.availableMethods.map((method, index) => (
                          <span
                            key={index}
                            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {getMethodIcon(method)}
                            <span className="ml-1">{getMethodLabel(method)}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 소개 */}
                    <p className="text-body-medium text-gray-700 mb-4">
                      {counselor.bio}
                    </p>

                    {/* 가격 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-body-small text-gray-500">상담료 (회당)</span>
                        <div className="text-title-medium font-semibold text-gray-900">
                          {counselor.priceRange.min.toLocaleString()}원 ~ {counselor.priceRange.max.toLocaleString()}원
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setSelectedCounselor(counselor)}
                          className="btn-outline"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCounselor(counselor);
                            setShowBookingModal(true);
                          }}
                          className="btn-primary flex items-center"
                        >
                          상담 요청
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredCounselors.length === 0 && (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-headline-medium text-gray-900 mb-2">
                  조건에 맞는 전문가가 없습니다
                </h3>
                <p className="text-body-medium text-gray-600 mb-6">
                  검색 조건을 조정하거나 다른 키워드로 검색해보세요.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setMatchingCriteria({
                      preferredMethod: 'any',
                      specialtyNeeds: [],
                      budgetRange: { min: 50000, max: 200000 },
                      languagePreference: '한국어',
                      urgency: 'flexible',
                      previousExperience: false
                    });
                  }}
                  className="btn-primary"
                >
                  조건 초기화
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 예약 요청 모달 */}
        {showBookingModal && selectedCounselor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-headline-medium text-gray-900 mb-4">
                상담 요청
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {selectedCounselor.name} 상담사
                  </h4>
                  <p className="text-body-small text-gray-600">
                    {selectedCounselor.title}
                  </p>
                  <p className="text-body-small text-gray-600">
                    {selectedCounselor.priceRange.min.toLocaleString()}원 ~ {selectedCounselor.priceRange.max.toLocaleString()}원
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">상담 요청 안내</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 상담사가 요청을 확인 후 24시간 내 연락드립니다</li>
                        <li>• 첫 상담은 30분 무료 상담으로 진행됩니다</li>
                        <li>• 상담 일정은 상담사와 협의하여 결정합니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={() => handleBookingRequest(selectedCounselor)}
                  className="flex-1 btn-primary"
                >
                  요청하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상담사 상세 모달 */}
        {selectedCounselor && !showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-headline-large text-gray-900">
                  {selectedCounselor.name} 상담사
                </h3>
                <button
                  onClick={() => setSelectedCounselor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 기본 정보 */}
                <div>
                  <h4 className="text-title-medium text-gray-900 mb-3">기본 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-body-medium">
                    <div>
                      <span className="text-gray-600">직책:</span>
                      <span className="ml-2 text-gray-900">{selectedCounselor.title}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">경력:</span>
                      <span className="ml-2 text-gray-900">{selectedCounselor.experience}년</span>
                    </div>
                    <div>
                      <span className="text-gray-600">평점:</span>
                      <span className="ml-2 text-gray-900">{selectedCounselor.rating}/5.0</span>
                    </div>
                    <div>
                      <span className="text-gray-600">리뷰:</span>
                      <span className="ml-2 text-gray-900">{selectedCounselor.reviewCount}개</span>
                    </div>
                  </div>
                </div>

                {/* 학력 */}
                <div>
                  <h4 className="text-title-medium text-gray-900 mb-3">학력</h4>
                  <ul className="space-y-2">
                    {selectedCounselor.education.map((edu, index) => (
                      <li key={index} className="text-body-medium text-gray-700">
                        • {edu}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 자격증 */}
                <div>
                  <h4 className="text-title-medium text-gray-900 mb-3">자격증</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCounselor.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 소개 */}
                <div>
                  <h4 className="text-title-medium text-gray-900 mb-3">소개</h4>
                  <p className="text-body-medium text-gray-700 leading-relaxed">
                    {selectedCounselor.bio}
                  </p>
                </div>

                {/* 예약 가능 시간 */}
                <div>
                  <h4 className="text-title-medium text-gray-900 mb-3">예약 가능 시간</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(selectedCounselor.availability).map(([day, times]) => (
                      <div key={day} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-900 mb-2">{day}요일</div>
                        <div className="flex flex-wrap gap-1">
                          {times.map((time, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white text-gray-700 text-xs rounded border"
                            >
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setSelectedCounselor(null)}
                  className="flex-1 btn-outline"
                >
                  닫기
                </button>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="flex-1 btn-primary"
                >
                  상담 요청하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselorMatchingPage;
