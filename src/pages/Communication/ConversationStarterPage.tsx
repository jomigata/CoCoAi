/**
 * 💬 대화 스타터 카드 페이지
 * Phase 2: 소통 개선 도구
 * 그룹 상황에 맞는 대화 시작 도구 제공
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-hot-toast';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  Star, 
  Heart, 
  Lightbulb,
  RefreshCw,
  Filter,
  Search,
  Play
} from 'lucide-react';
import { AIWarning } from '../../components/Common/AIWarning';
import { useAIWarning } from '../../hooks/useAIWarning';

interface ConversationStarter {
  id: string;
  category: 'icebreaker' | 'deep' | 'fun' | 'reflective' | 'relationship';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  followUpQuestions: string[];
  context: {
    groupType: 'family' | 'couple' | 'friends' | 'team';
    mood: 'light' | 'serious' | 'playful' | 'intimate';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  };
  tags: string[];
  usageCount: number;
  successRate: number;
}

interface ConversationSession {
  id: string;
  groupId: string;
  starterCardId: string;
  participants: string[];
  responses: any[];
  duration: number;
  satisfaction: number;
  createdAt: Date;
}

const ConversationStarterPage: React.FC = () => {
  const { user } = useAuth();
  const functions = getFunctions();
  
  const [starters, setStarters] = useState<ConversationStarter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<ConversationSession | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);
  
  // AI 경고 시스템
  const aiWarning = useAIWarning({ 
    analysisType: 'communication', 
    severity: 'low' 
  });

  useEffect(() => {
    if (user) {
      loadConversationStarters();
    }
  }, [user]);

  const loadConversationStarters = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const getStarters = httpsCallable(functions, 'getConversationStarters');
      const result = await getStarters({
        groupId: 'default_group', // 실제로는 현재 그룹 ID 사용
        context: {
          groupType: 'friends',
          currentMood: 'light',
          timeOfDay: 'any',
          participants: [user.uid]
        }
      });
      
      const data = result.data as { success: boolean; starters: ConversationStarter[]; version: string };
      if (data.success) {
        setStarters(data.starters);
        toast.success('대화 스타터 카드를 불러왔습니다.');
      }
    } catch (error) {
      console.error('대화 스타터 로드 오류:', error);
      toast.error('대화 스타터를 불러오는 중 오류가 발생했습니다.');
      
      // 폴백 데이터
      setStarters(getFallbackStarters());
    } finally {
      setIsLoading(false);
    }
  };

  const startConversationSession = async (starter: ConversationStarter) => {
    if (!user) return;
    
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: ConversationSession = {
        id: sessionId,
        groupId: 'default_group',
        starterCardId: starter.id,
        participants: [user.uid],
        responses: [],
        duration: 0,
        satisfaction: 0,
        createdAt: new Date()
      };

      setActiveSession(session);
      startSessionTimer();
      toast.success('대화 세션이 시작되었습니다!');
      
    } catch (error) {
      console.error('대화 세션 시작 오류:', error);
      toast.error('대화 세션 시작 중 오류가 발생했습니다.');
    }
  };

  const startSessionTimer = () => {
    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    setSessionTimer(timer);
  };

  const stopSessionTimer = () => {
    if (sessionTimer) {
      clearInterval(sessionTimer);
      setSessionTimer(null);
    }
  };

  const endConversationSession = async (satisfaction: number) => {
    if (!activeSession) return;
    
    stopSessionTimer();
    
    try {
      // 실제로는 Firebase에 세션 완료 데이터 저장
      console.log('Session ended:', {
        sessionId: activeSession.id,
        duration: sessionDuration,
        satisfaction
      });
      
      setActiveSession(null);
      setSessionDuration(0);
      toast.success('대화 세션이 완료되었습니다!');
      
    } catch (error) {
      console.error('대화 세션 완료 오류:', error);
      toast.error('대화 세션 완료 중 오류가 발생했습니다.');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'icebreaker': return <MessageCircle className="w-5 h-5" />;
      case 'deep': return <Heart className="w-5 h-5" />;
      case 'fun': return <Star className="w-5 h-5" />;
      case 'reflective': return <Lightbulb className="w-5 h-5" />;
      case 'relationship': return <Users className="w-5 h-5" />;
      default: return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStarters = starters.filter(starter => {
    const matchesCategory = selectedCategory === 'all' || starter.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || starter.difficulty === selectedDifficulty;
    const matchesSearch = searchQuery === '' || 
      starter.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      starter.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💬 대화 스타터 카드
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            어색한 순간에 자연스러운 대화를 시작할 수 있도록 도와드립니다.
            그룹 상황에 맞는 맞춤형 질문을 제공합니다.
          </p>
        </div>

        {/* AI 경고 */}
        <AIWarning
          message={aiWarning.message}
          details={aiWarning.details}
          timestamp={aiWarning.timestamp}
          type="info"
          showDetails={true}
          className="max-w-4xl mx-auto mb-8"
        />

        {/* 활성 세션 */}
        {activeSession && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">진행 중인 대화 세션</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-mono">{formatDuration(sessionDuration)}</span>
                </div>
                <button
                  onClick={() => endConversationSession(4)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  세션 종료
                </button>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-800 font-medium">
                {starters.find(s => s.id === activeSession.starterCardId)?.question}
              </p>
            </div>
          </div>
        )}

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">카테고리:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="icebreaker">아이스브레이커</option>
                <option value="deep">깊은 대화</option>
                <option value="fun">재미있는 대화</option>
                <option value="reflective">성찰적 대화</option>
                <option value="relationship">관계 대화</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">난이도:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 flex-1 min-w-64">
              <Search className="w-5 h-5 text-gray-600" />
              <input
                type="text"
                placeholder="질문이나 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            
            <button
              onClick={loadConversationStarters}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 대화 스타터 카드 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))
          ) : (
            filteredStarters.map((starter) => (
              <div key={starter.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(starter.category)}
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {starter.category}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(starter.difficulty)}`}>
                    {starter.difficulty === 'easy' ? '쉬움' : 
                     starter.difficulty === 'medium' ? '보통' : '어려움'}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {starter.question}
                </h3>
                
                {starter.followUpQuestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">후속 질문:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {starter.followUpQuestions.slice(0, 2).map((question, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {starter.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{starter.usageCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>{starter.successRate.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => startConversationSession(starter)}
                    disabled={!!activeSession}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && filteredStarters.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600">다른 필터 조건을 시도해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 폴백 데이터
const getFallbackStarters = (): ConversationStarter[] => [
  {
    id: 'fallback_1',
    category: 'icebreaker',
    difficulty: 'easy',
    question: '오늘 하루 중 가장 기억에 남는 순간은 무엇인가요?',
    followUpQuestions: ['왜 그 순간이 특별했나요?', '그때 어떤 기분이었나요?'],
    context: {
      groupType: 'friends',
      mood: 'light',
      timeOfDay: 'any'
    },
    tags: ['일상', '감정', '추억'],
    usageCount: 0,
    successRate: 0
  },
  {
    id: 'fallback_2',
    category: 'deep',
    difficulty: 'medium',
    question: '지금까지 살아오면서 가장 감사했던 일은 무엇인가요?',
    followUpQuestions: ['그 일이 당신에게 어떤 의미인가요?', '지금도 그런 마음이 있나요?'],
    context: {
      groupType: 'family',
      mood: 'serious',
      timeOfDay: 'evening'
    },
    tags: ['감사', '인생', '의미'],
    usageCount: 0,
    successRate: 0
  }
];

export default ConversationStarterPage;
