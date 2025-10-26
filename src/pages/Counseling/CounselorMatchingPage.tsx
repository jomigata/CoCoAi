import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Star, Clock, Filter, Search, Users, Award } from 'lucide-react';
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
  reviewCount: number;
  profileImage: string;
  bio: string;
  languages: string[];
  pricePerHour: number;
  availability: {
    timezone: string;
    schedule: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
  };
  aiMatchScore?: number;
  isOnline: boolean;
  responseTime: string;
}

interface MatchingCriteria {
  specialization: string[];
  maxPrice: number;
  experience: number;
  rating: number;
  language: string;
  availability: string[];
}

const CounselorMatchingPage: React.FC = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'experience' | 'match'>('match');
  const [showFilters, setShowFilters] = useState(false);
  const [matchingCriteria, setMatchingCriteria] = useState<MatchingCriteria>({
    specialization: [],
    maxPrice: 100000,
    experience: 0,
    rating: 4.0,
    language: '한국어',
    availability: []
  });

  const aiWarning = useAIWarning({
    analysisType: 'general',
    severity: 'medium'
  });

  // 전문 분야 옵션
  const specializationOptions = [
    '우울증', '불안장애', '대인관계', '가족상담', '트라우마', '성격장애',
    '중독', '식이장애', '수면장애', '스트레스', '직장상담', '청소년상담'
  ];

  // AI 매칭 점수 계산
  const calculateMatchScore = useCallback((counselor: Counselor, criteria: MatchingCriteria): number => {
    let score = 0;
    let totalWeight = 0;

    // 전문 분야 매칭 (40% 가중치)
    const specializationWeight = 0.4;
    const specializationMatch = counselor.specialization.filter(spec => 
      criteria.specialization.includes(spec)
    ).length / Math.max(criteria.specialization.length, 1);
    score += specializationMatch * specializationWeight;
    totalWeight += specializationWeight;

    // 가격 매칭 (20% 가중치)
    const priceWeight = 0.2;
    const priceMatch = criteria.maxPrice >= counselor.pricePerHour ? 
      (criteria.maxPrice - counselor.pricePerHour) / criteria.maxPrice : 0;
    score += priceMatch * priceWeight;
    totalWeight += priceWeight;

    // 경력 매칭 (20% 가중치)
    const experienceWeight = 0.2;
    const experienceMatch = Math.min(counselor.experience / criteria.experience, 1);
    score += experienceMatch * experienceWeight;
    totalWeight += experienceWeight;

    // 평점 매칭 (20% 가중치)
    const ratingWeight = 0.2;
    const ratingMatch = counselor.rating >= criteria.rating ? 
      (counselor.rating - criteria.rating) / (5 - criteria.rating) : 0;
    score += ratingMatch * ratingWeight;
    totalWeight += ratingWeight;

    return Math.round((score / totalWeight) * 100);
  }, []);

  // 상담사 데이터 로드
  useEffect(() => {
    loadCounselors();
  }, []);

  const loadCounselors = async () => {
    try {
      setIsLoading(true);
      
      // 실제 구현에서는 Firebase에서 상담사 데이터를 가져옴
      // 임시 데이터로 대체
      const mockCounselors: Counselor[] = [
        {
          id: 'counselor-1',
          name: '김상담',
          specialization: ['우울증', '불안장애', '대인관계'],
          experience: 8,
          rating: 4.8,
          reviewCount: 156,
          profileImage: '/images/counselor-1.jpg',
          bio: '8년 경력의 전문 심리상담사입니다. CBT와 인지행동치료를 전문으로 합니다.',
          languages: ['한국어', '영어'],
          pricePerHour: 80000,
          availability: {
            timezone: 'Asia/Seoul',
            schedule: [
              { day: '월', startTime: '09:00', endTime: '18:00' },
              { day: '화', startTime: '09:00', endTime: '18:00' }
            ]
          },
          isOnline: true,
          responseTime: '1시간 이내'
        },
        {
          id: 'counselor-2',
          name: '이치료',
          specialization: ['트라우마', '성격장애', '가족상담'],
          experience: 12,
          rating: 4.9,
          reviewCount: 203,
          profileImage: '/images/counselor-2.jpg',
          bio: '12년 경력의 트라우마 전문 상담사입니다. EMDR과 정신분석을 전문으로 합니다.',
          languages: ['한국어'],
          pricePerHour: 100000,
          availability: {
            timezone: 'Asia/Seoul',
            schedule: [
              { day: '월', startTime: '10:00', endTime: '19:00' },
              { day: '수', startTime: '10:00', endTime: '19:00' }
            ]
          },
          isOnline: false,
          responseTime: '2시간 이내'
        },
        {
          id: 'counselor-3',
          name: '박심리',
          specialization: ['청소년상담', '직장상담', '스트레스'],
          experience: 6,
          rating: 4.7,
          reviewCount: 89,
          profileImage: '/images/counselor-3.jpg',
          bio: '청소년과 직장인 상담을 전문으로 하는 상담사입니다. 해결중심치료를 활용합니다.',
          languages: ['한국어', '일본어'],
          pricePerHour: 70000,
          availability: {
            timezone: 'Asia/Seoul',
            schedule: [
              { day: '화', startTime: '14:00', endTime: '22:00' },
              { day: '목', startTime: '14:00', endTime: '22:00' }
            ]
          },
          isOnline: true,
          responseTime: '30분 이내'
        }
      ];

      // AI 매칭 점수 계산
      const counselorsWithScore = mockCounselors.map(counselor => ({
        ...counselor,
        aiMatchScore: calculateMatchScore(counselor, matchingCriteria)
      }));

      setCounselors(counselorsWithScore);
      
    } catch (error) {
      console.error('상담사 데이터 로드 오류:', error);
      toast.error('상담사 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링 및 정렬
  const filteredAndSortedCounselors = useMemo(() => {
    let filtered = counselors.filter(counselor => {
      // 검색어 필터
      if (searchTerm && !counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !counselor.specialization.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }

      // 전문 분야 필터
      if (selectedSpecialization.length > 0 && 
          !selectedSpecialization.some(spec => counselor.specialization.includes(spec))) {
        return false;
      }

      // 가격 필터
      if (counselor.pricePerHour > matchingCriteria.maxPrice) {
        return false;
      }

      // 경력 필터
      if (counselor.experience < matchingCriteria.experience) {
        return false;
      }

      // 평점 필터
      if (counselor.rating < matchingCriteria.rating) {
        return false;
      }

      return true;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.pricePerHour - b.pricePerHour;
        case 'experience':
          return b.experience - a.experience;
        case 'match':
          return (b.aiMatchScore || 0) - (a.aiMatchScore || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [counselors, searchTerm, selectedSpecialization, matchingCriteria, sortBy]);

  const handleSpecializationToggle = (specialization: string) => {
    setSelectedSpecialization(prev => 
      prev.includes(specialization)
        ? prev.filter(s => s !== specialization)
        : [...prev, specialization]
    );
  };

  const handleCounselorSelect = (counselorId: string) => {
    // 상담사 선택 시 상담 예약 페이지로 이동
    window.location.href = `/counseling/book/${counselorId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI 상담사 매칭
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            AI가 분석한 당신의 프로파일을 바탕으로 최적의 상담사를 추천해드립니다.
          </p>
        </div>

        {/* AI 경고 */}
        <div className="mb-6">
          <AIWarning {...aiWarning} />
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="상담사 이름이나 전문 분야로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* 필터 토글 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>필터</span>
            </button>

            {/* 정렬 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="match">AI 매칭순</option>
              <option value="rating">평점순</option>
              <option value="price">가격순</option>
              <option value="experience">경력순</option>
            </select>
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 전문 분야 */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">전문 분야</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {specializationOptions.map((spec) => (
                      <label key={spec} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedSpecialization.includes(spec)}
                          onChange={() => handleSpecializationToggle(spec)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 가격 범위 */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">시간당 가격</h3>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="50000"
                      max="150000"
                      step="10000"
                      value={matchingCriteria.maxPrice}
                      onChange={(e) => setMatchingCriteria(prev => ({
                        ...prev,
                        maxPrice: parseInt(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>5만원</span>
                      <span className="font-medium">{matchingCriteria.maxPrice.toLocaleString()}원</span>
                      <span>15만원</span>
                    </div>
                  </div>
                </div>

                {/* 경력 */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">최소 경력</h3>
                  <select
                    value={matchingCriteria.experience}
                    onChange={(e) => setMatchingCriteria(prev => ({
                      ...prev,
                      experience: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value={0}>경력 무관</option>
                    <option value={1}>1년 이상</option>
                    <option value={3}>3년 이상</option>
                    <option value={5}>5년 이상</option>
                    <option value={10}>10년 이상</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 상담사 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCounselors.map((counselor) => (
            <div
              key={counselor.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleCounselorSelect(counselor.id)}
            >
              {/* 상담사 이미지 및 상태 */}
              <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="h-16 w-16 text-gray-400" />
                </div>
                
                {/* AI 매칭 점수 */}
                {counselor.aiMatchScore && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    AI 매칭 {counselor.aiMatchScore}%
                  </div>
                )}
                
                {/* 온라인 상태 */}
                <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${counselor.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-white text-sm font-medium">
                    {counselor.isOnline ? '온라인' : '오프라인'}
                  </span>
                </div>
              </div>

              {/* 상담사 정보 */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {counselor.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {counselor.rating}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({counselor.reviewCount}개 리뷰)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 전문 분야 */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {counselor.specialization.slice(0, 3).map((spec, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                      >
                        {spec}
                      </span>
                    ))}
                    {counselor.specialization.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                        +{counselor.specialization.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* 경력 및 가격 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                    <Award className="h-4 w-4" />
                    <span>{counselor.experience}년 경력</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {counselor.pricePerHour.toLocaleString()}원/시간
                  </div>
                </div>

                {/* 응답 시간 */}
                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>응답 시간: {counselor.responseTime}</span>
                </div>

                {/* 선택 버튼 */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                  상담 예약하기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 결과 없음 */}
        {filteredAndSortedCounselors.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              조건에 맞는 상담사를 찾을 수 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              필터 조건을 조정하거나 검색어를 변경해보세요.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialization([]);
                setMatchingCriteria({
                  specialization: [],
                  maxPrice: 100000,
                  experience: 0,
                  rating: 4.0,
                  language: '한국어',
                  availability: []
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselorMatchingPage;
