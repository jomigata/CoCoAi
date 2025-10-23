import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  Calendar,
  Heart,
  Smile,
  Zap,
  Coffee,
  CloudRain,
  Sun,
  Moon,
  Mic,
  Type,
  Hash,
  Save,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface MoodRecord {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD 형식
  mood: {
    primary: 'happy' | 'sad' | 'angry' | 'anxious' | 'calm' | 'excited' | 'tired' | 'stressed';
    intensity: number; // 1-10 점수
    secondary?: string[]; // 부가 감정들
  };
  recordType: 'emoji' | 'tags' | 'text' | 'voice';
  content: {
    emoji?: string;
    tags?: string[];
    text?: string;
    voiceUrl?: string;
    voiceTranscript?: string;
  };
  energy: number; // 1-10 에너지 레벨
  stress: number; // 1-10 스트레스 레벨
  sleep?: {
    hours: number;
    quality: number; // 1-10
  };
  dream?: {
    content: string;
    aiAnalysis?: {
      symbols: string[];
      interpretation: string;
      psychologicalInsight: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const DailyMoodPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentRecord, setCurrentRecord] = useState<Partial<MoodRecord>>({
    mood: {
      primary: 'happy',
      intensity: 5,
      secondary: []
    },
    recordType: 'emoji',
    content: {},
    energy: 5,
    stress: 5
  });
  
  const [todayRecord, setTodayRecord] = useState<MoodRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<MoodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');
  const [showDreamSection, setShowDreamSection] = useState(false);
  const [showSleepSection, setShowSleepSection] = useState(false);

  // 감정 옵션들
  const moodOptions = [
    { id: 'happy', name: '행복', emoji: '😊', color: 'text-yellow-600 bg-yellow-100' },
    { id: 'calm', name: '평온', emoji: '😌', color: 'text-green-600 bg-green-100' },
    { id: 'excited', name: '흥분', emoji: '🤩', color: 'text-purple-600 bg-purple-100' },
    { id: 'sad', name: '슬픔', emoji: '😢', color: 'text-blue-600 bg-blue-100' },
    { id: 'angry', name: '화남', emoji: '😠', color: 'text-red-600 bg-red-100' },
    { id: 'anxious', name: '불안', emoji: '😰', color: 'text-orange-600 bg-orange-100' },
    { id: 'tired', name: '피곤', emoji: '😴', color: 'text-gray-600 bg-gray-100' },
    { id: 'stressed', name: '스트레스', emoji: '😫', color: 'text-red-600 bg-red-100' }
  ];

  // 부가 감정 태그들
  const secondaryMoodTags = [
    '감사한', '외로운', '걱정되는', '기대되는', '후회되는', '뿌듯한',
    '답답한', '설레는', '무기력한', '희망적인', '짜증나는', '평화로운',
    '긴장되는', '만족스러운', '우울한', '자신감 있는', '혼란스러운', '편안한'
  ];

  // 기록 방식별 아이콘
  const recordTypeIcons = {
    emoji: <Smile className="w-5 h-5" />,
    tags: <Hash className="w-5 h-5" />,
    text: <Type className="w-5 h-5" />,
    voice: <Mic className="w-5 h-5" />
  };

  useEffect(() => {
    if (user) {
      loadTodayRecord();
      loadRecentRecords();
    }
  }, [user]);

  const loadTodayRecord = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const q = query(
        collection(db, 'dailyMoodRecords'),
        where('userId', '==', user.uid),
        where('date', '==', today),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        setTodayRecord({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as MoodRecord);
        
        // 기존 기록이 있으면 현재 기록으로 설정
        setCurrentRecord({
          ...data,
          id: doc.id
        });
      }
    } catch (error) {
      console.error('오늘 기록 로드 오류:', error);
    }
  };

  const loadRecentRecords = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'dailyMoodRecords'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(7)
      );
      
      const querySnapshot = await getDocs(q);
      const records: MoodRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as MoodRecord);
      });
      
      setRecentRecords(records);
    } catch (error) {
      console.error('최근 기록 로드 오류:', error);
    }
  };

  const handleMoodChange = (moodId: string) => {
    setCurrentRecord(prev => ({
      ...prev,
      mood: {
        ...prev.mood!,
        primary: moodId as any
      }
    }));
  };

  const handleIntensityChange = (intensity: number) => {
    setCurrentRecord(prev => ({
      ...prev,
      mood: {
        ...prev.mood!,
        intensity
      }
    }));
  };

  // handleSecondaryMoodToggle 함수는 향후 부가 감정 선택 기능에서 사용될 예정

  const handleRecordTypeChange = (type: 'emoji' | 'tags' | 'text' | 'voice') => {
    setCurrentRecord(prev => ({
      ...prev,
      recordType: type,
      content: {} // 기록 방식 변경 시 내용 초기화
    }));
  };

  const handleContentChange = (field: string, value: any) => {
    setCurrentRecord(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    // 필수 필드 검증
    if (!currentRecord.mood?.primary) {
      toast.error('감정을 선택해주세요.');
      return;
    }

    if (currentRecord.recordType === 'text' && !currentRecord.content?.text?.trim()) {
      toast.error('텍스트 내용을 입력해주세요.');
      return;
    }

    if (currentRecord.recordType === 'tags' && (!currentRecord.content?.tags || currentRecord.content.tags.length === 0)) {
      toast.error('태그를 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const recordData = {
        userId: user.uid,
        date: today,
        mood: currentRecord.mood,
        recordType: currentRecord.recordType,
        content: currentRecord.content,
        energy: currentRecord.energy || 5,
        stress: currentRecord.stress || 5,
        ...(showSleepSection && currentRecord.sleep && {
          sleep: currentRecord.sleep
        }),
        ...(showDreamSection && currentRecord.dream && {
          dream: currentRecord.dream
        }),
        updatedAt: new Date()
      };

      if (todayRecord?.id) {
        // 기존 기록 업데이트
        await updateDoc(doc(db, 'dailyMoodRecords', todayRecord.id), recordData);
        toast.success('오늘의 마음 기록이 업데이트되었습니다.');
      } else {
        // 새 기록 생성
        await addDoc(collection(db, 'dailyMoodRecords'), {
          ...recordData,
          createdAt: new Date()
        });
        toast.success('오늘의 마음 기록이 저장되었습니다.');
      }

      // 기록 새로고침
      await loadTodayRecord();
      await loadRecentRecords();
    } catch (error) {
      console.error('기록 저장 오류:', error);
      toast.error('기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodInfo = (moodId: string) => {
    return moodOptions.find(mood => mood.id === moodId) || moodOptions[0];
  };

  const renderRecordContent = () => {
    switch (currentRecord.recordType) {
      case 'emoji':
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {getMoodInfo(currentRecord.mood?.primary || 'happy').emoji}
            </div>
            <p className="text-body-medium text-gray-600">
              이모지로 오늘의 기분을 표현했습니다.
            </p>
          </div>
        );

      case 'tags':
        return (
          <div>
            <label className="block text-title-medium text-gray-900 mb-4">
              부가 감정 태그 선택
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {secondaryMoodTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    const currentTags = currentRecord.content?.tags || [];
                    const newTags = currentTags.includes(tag)
                      ? currentTags.filter(t => t !== tag)
                      : [...currentTags, tag];
                    handleContentChange('tags', newTags);
                  }}
                  className={`p-2 rounded-lg border text-sm transition-all duration-200 ${
                    (currentRecord.content?.tags || []).includes(tag)
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="text-body-small text-gray-500 mt-2">
              선택된 태그: {(currentRecord.content?.tags || []).length}개
            </p>
          </div>
        );

      case 'text':
        return (
          <div>
            <label className="block text-title-medium text-gray-900 mb-3">
              오늘의 마음을 글로 표현해보세요
            </label>
            <textarea
              value={currentRecord.content?.text || ''}
              onChange={(e) => handleContentChange('text', e.target.value)}
              placeholder="오늘 하루 어떤 일이 있었나요? 어떤 기분이었나요?"
              className="input-field h-32 resize-none"
              maxLength={500}
            />
            <p className="text-body-small text-gray-500 mt-2">
              {(currentRecord.content?.text || '').length}/500자
            </p>
          </div>
        );

      case 'voice':
        return (
          <div className="text-center py-8">
            <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-body-medium text-gray-600 mb-4">
              음성 기록 기능은 곧 제공될 예정입니다.
            </p>
            <button
              onClick={() => setCurrentRecord(prev => ({ ...prev, recordType: 'text' }))}
              className="btn-outline"
            >
              텍스트로 기록하기
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-display-medium text-gray-900 mb-4">
            데일리 마음 기록
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto">
            매일 자신의 감정과 상태를 기록하여 마음의 패턴을 발견해보세요.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="tab-list max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('record')}
              className={`tab-button ${activeTab === 'record' ? 'active' : 'inactive'}`}
            >
              오늘 기록하기
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`tab-button ${activeTab === 'history' ? 'active' : 'inactive'}`}
            >
              기록 히스토리
            </button>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'record' && (
            <div className="space-y-8 fade-in">
              {/* 오늘 날짜 */}
              <div className="text-center">
                <div className="inline-flex items-center bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-200">
                  <Calendar className="w-5 h-5 text-pink-600 mr-3" />
                  <span className="text-title-medium text-gray-900">
                    {new Date().toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </span>
                </div>
              </div>

              {/* 기본 감정 선택 */}
              <div className="card-elevated">
                <h3 className="text-headline-small text-gray-900 mb-6">
                  오늘의 기본 감정은 어떤가요?
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => handleMoodChange(mood.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        currentRecord.mood?.primary === mood.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">{mood.emoji}</div>
                      <div className="text-body-medium font-medium text-gray-900">
                        {mood.name}
                      </div>
                    </button>
                  ))}
                </div>

                {/* 감정 강도 */}
                <div>
                  <label className="block text-title-medium text-gray-900 mb-4">
                    감정의 강도: {currentRecord.mood?.intensity}/10
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-body-small text-gray-500">약함</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentRecord.mood?.intensity || 5}
                      onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-body-small text-gray-500">강함</span>
                  </div>
                </div>
              </div>

              {/* 기록 방식 선택 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6">
                  어떤 방식으로 기록하시겠어요?
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(recordTypeIcons).map(([type, icon]) => (
                    <button
                      key={type}
                      onClick={() => handleRecordTypeChange(type as any)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        currentRecord.recordType === type
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        {icon}
                        <span className="text-body-small font-medium mt-2">
                          {type === 'emoji' && '이모지'}
                          {type === 'tags' && '태그'}
                          {type === 'text' && '텍스트'}
                          {type === 'voice' && '음성'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {renderRecordContent()}
              </div>

              {/* 에너지 & 스트레스 레벨 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6">
                  오늘의 컨디션은 어떤가요?
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-title-medium text-gray-900 mb-3">
                      에너지 레벨: {currentRecord.energy}/10
                    </label>
                    <div className="flex items-center space-x-2">
                      <Coffee className="w-5 h-5 text-gray-400" />
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={currentRecord.energy || 5}
                        onChange={(e) => setCurrentRecord(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <Zap className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-title-medium text-gray-900 mb-3">
                      스트레스 레벨: {currentRecord.stress}/10
                    </label>
                    <div className="flex items-center space-x-2">
                      <Sun className="w-5 h-5 text-green-500" />
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={currentRecord.stress || 5}
                        onChange={(e) => setCurrentRecord(prev => ({ ...prev, stress: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <CloudRain className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 추가 옵션 */}
              <div className="card">
                <h3 className="text-headline-small text-gray-900 mb-6">
                  추가 정보 (선택사항)
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Moon className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-title-medium text-gray-900">수면 정보 추가</span>
                    </div>
                    <button
                      onClick={() => setShowSleepSection(!showSleepSection)}
                      className={`toggle-switch ${showSleepSection ? 'active' : ''}`}
                    >
                      <span className={`toggle-thumb ${showSleepSection ? 'active' : ''}`} />
                    </button>
                  </div>

                  {showSleepSection && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                      <div>
                        <label className="block text-body-medium text-gray-700 mb-2">
                          수면 시간 (시간)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={currentRecord.sleep?.hours || 8}
                          onChange={(e) => setCurrentRecord(prev => ({
                            ...prev,
                            sleep: {
                              hours: parseFloat(e.target.value),
                              quality: prev.sleep?.quality || 7
                            }
                          }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-body-medium text-gray-700 mb-2">
                          수면 질 (1-10)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={currentRecord.sleep?.quality || 7}
                          onChange={(e) => setCurrentRecord(prev => ({
                            ...prev,
                            sleep: {
                              hours: prev.sleep?.hours || 8,
                              quality: parseInt(e.target.value)
                            }
                          }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-center text-body-small text-gray-600 mt-1">
                          {currentRecord.sleep?.quality || 7}/10
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Moon className="w-5 h-5 text-purple-600 mr-3" />
                      <span className="text-title-medium text-gray-900">꿈 기록 추가</span>
                    </div>
                    <button
                      onClick={() => setShowDreamSection(!showDreamSection)}
                      className={`toggle-switch ${showDreamSection ? 'active' : ''}`}
                    >
                      <span className={`toggle-thumb ${showDreamSection ? 'active' : ''}`} />
                    </button>
                  </div>

                  {showDreamSection && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <label className="block text-body-medium text-gray-700 mb-2">
                        꿈 내용
                      </label>
                      <textarea
                        value={currentRecord.dream?.content || ''}
                        onChange={(e) => setCurrentRecord(prev => ({
                          ...prev,
                          dream: {
                            ...prev.dream,
                            content: e.target.value
                          }
                        }))}
                        placeholder="어떤 꿈을 꾸셨나요? AI가 심리학적 의미를 분석해드립니다."
                        className="input-field h-24 resize-none"
                        maxLength={300}
                      />
                      <p className="text-body-small text-gray-500 mt-1">
                        {(currentRecord.dream?.content || '').length}/300자
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="text-center">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="btn-primary text-lg px-8 py-4 flex items-center mx-auto"
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner mr-3" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-3" />
                      {todayRecord ? '기록 업데이트' : '오늘 기록 저장'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="fade-in">
              {recentRecords.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-headline-small text-gray-900">
                      최근 7일 기록
                    </h3>
                    <button
                      onClick={() => navigate('/mood/analytics')}
                      className="btn-outline flex items-center"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      상세 분석 보기
                    </button>
                  </div>

                  {recentRecords.map((record) => {
                    const moodInfo = getMoodInfo(record.mood.primary);
                    return (
                      <div key={record.id} className="card-hover">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <div className="text-4xl mr-4">
                              {moodInfo.emoji}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <h4 className="text-title-medium text-gray-900 mr-3">
                                  {moodInfo.name}
                                </h4>
                                <div className="badge-primary">
                                  강도 {record.mood.intensity}/10
                                </div>
                              </div>
                              <div className="flex items-center text-body-small text-gray-500 mb-2">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(record.date).toLocaleDateString('ko-KR')}
                                <Clock className="w-4 h-4 ml-4 mr-1" />
                                {record.createdAt.toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              
                              {/* 기록 내용 미리보기 */}
                              {record.content.text && (
                                <p className="text-body-medium text-gray-600 line-clamp-2 mb-2">
                                  {record.content.text}
                                </p>
                              )}
                              
                              {record.content.tags && record.content.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {record.content.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="badge-secondary text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                  {record.content.tags.length > 3 && (
                                    <span className="badge-secondary text-xs">
                                      +{record.content.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-body-small text-gray-500 mb-1">
                              에너지 {record.energy}/10
                            </div>
                            <div className="text-body-small text-gray-500">
                              스트레스 {record.stress}/10
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <Heart className="empty-state-icon" />
                  <h3 className="empty-state-title">아직 기록이 없습니다</h3>
                  <p className="empty-state-description">
                    첫 번째 마음 기록을 남겨보세요.
                  </p>
                  <button
                    onClick={() => setActiveTab('record')}
                    className="btn-primary"
                  >
                    기록 시작하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI 경고 메시지 */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="alert-info">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">마음 기록 안내</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>매일 꾸준한 기록을 통해 감정 패턴을 발견할 수 있습니다.</li>
                  <li>기록된 데이터는 위클리 리포트 생성에 활용됩니다.</li>
                  <li>모든 개인 데이터는 암호화되어 안전하게 보호됩니다.</li>
                  <li>꿈 분석 등 AI 기능은 참고용이며, 전문가 상담을 대체하지 않습니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyMoodPage;
