import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { 
  Heart, 
  Smile,
  Frown,
  Meh,
  Star,
  Clock,
  User,
  Reply,
  ThumbsUp,
  Share2,
  BookOpen
} from 'lucide-react';
import { AIWarning } from '../../components/Common/AIWarning';
import { useAIWarning } from '../../hooks/useAIWarning';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface EmotionDiary {
  id: string;
  title: string;
  content: string;
  emotion: 'happy' | 'sad' | 'angry' | 'anxious' | 'excited' | 'calm' | 'confused' | 'grateful';
  authorId: string;
  authorName: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
  likes: string[];
  isPublic: boolean;
  tags: string[];
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  likes: string[];
}

interface NewDiaryEntry {
  title: string;
  content: string;
  emotion: string;
  groupId: string;
  isPublic: boolean;
  tags: string[];
}

/**
 * 💝 감정 교환 일기 페이지
 * 그룹 멤버들과 감정을 공유하고 소통하는 공간
 * 
 * 심리상담가 1,2가 설계한 감정 공유 시스템
 * 안전한 공간에서 감정을 표현하고 서로 공감하는 환경 제공
 */
const EmotionDiaryPage: React.FC = () => {
  const { user } = useAuth();
  const functions = getFunctions();
  
  const [diaries, setDiaries] = useState<EmotionDiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [filterEmotion, setFilterEmotion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // AI 경고 시스템
  const aiWarning = useAIWarning({
    analysisType: 'communication',
    severity: 'low'
  });

  useEffect(() => {
    if (user) {
      loadEmotionDiaries();
    }
  }, [user]);

  const loadEmotionDiaries = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Firebase Functions를 통한 실제 감정 일기 데이터 로드
      const getEmotionDiaries = httpsCallable(functions, 'getEmotionDiaries');
      const result = await getEmotionDiaries({ userId: user.uid });
      const data = result.data as { success: boolean; diaries: EmotionDiary[] };
      
      if (data.success && data.diaries) {
        setDiaries(data.diaries.map(diary => ({
          ...diary,
          createdAt: new Date(diary.createdAt),
          updatedAt: new Date(diary.updatedAt),
          comments: diary.comments.map(comment => ({
            ...comment,
            createdAt: new Date(comment.createdAt)
          }))
        })));
        toast.success('감정 일기를 불러왔습니다!');
      } else {
        // 폴백으로 목업 데이터 사용
        setDiaries(getMockDiaries());
      }
    } catch (error) {
      console.error('감정 일기 로드 오류:', error);
      toast.error('감정 일기를 불러오는 중 오류가 발생했습니다.');
      
      // 폴백 데이터
      setDiaries(getMockDiaries());
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async (diaryId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const addCommentToDiary = httpsCallable(functions, 'addCommentToDiary');
      const result = await addCommentToDiary({
        diaryId,
        content,
        authorId: user.uid,
        authorName: user.displayName || '익명'
      });
      
      const data = result.data as { success: boolean; comment: Comment };
      
      if (data.success) {
        setDiaries(prev => prev.map(diary => 
          diary.id === diaryId 
            ? { ...diary, comments: [...diary.comments, data.comment] }
            : diary
        ));
        setNewComment('');
        toast.success('댓글이 추가되었습니다!');
      }
    } catch (error) {
      console.error('댓글 추가 오류:', error);
      toast.error('댓글 추가 중 오류가 발생했습니다.');
    }
  };

  const toggleLike = async (diaryId: string) => {
    if (!user) return;

    try {
      const toggleDiaryLike = httpsCallable(functions, 'toggleDiaryLike');
      const result = await toggleDiaryLike({
        diaryId,
        userId: user.uid
      });
      
      const data = result.data as { success: boolean; likes: string[] };
      
      if (data.success) {
        setDiaries(prev => prev.map(diary => 
          diary.id === diaryId 
            ? { ...diary, likes: data.likes }
            : diary
        ));
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'happy': return <Smile className="w-5 h-5 text-yellow-500" />;
      case 'sad': return <Frown className="w-5 h-5 text-blue-500" />;
      case 'angry': return <Frown className="w-5 h-5 text-red-500" />;
      case 'anxious': return <Meh className="w-5 h-5 text-orange-500" />;
      case 'excited': return <Star className="w-5 h-5 text-pink-500" />;
      case 'calm': return <Heart className="w-5 h-5 text-green-500" />;
      case 'confused': return <Meh className="w-5 h-5 text-gray-500" />;
      case 'grateful': return <Heart className="w-5 h-5 text-purple-500" />;
      default: return <Heart className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'happy': return 'bg-yellow-100 text-yellow-800';
      case 'sad': return 'bg-blue-100 text-blue-800';
      case 'angry': return 'bg-red-100 text-red-800';
      case 'anxious': return 'bg-orange-100 text-orange-800';
      case 'excited': return 'bg-pink-100 text-pink-800';
      case 'calm': return 'bg-green-100 text-green-800';
      case 'confused': return 'bg-gray-100 text-gray-800';
      case 'grateful': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmotionName = (emotion: string) => {
    switch (emotion) {
      case 'happy': return '기쁨';
      case 'sad': return '슬픔';
      case 'angry': return '화남';
      case 'anxious': return '불안';
      case 'excited': return '흥분';
      case 'calm': return '평온';
      case 'confused': return '혼란';
      case 'grateful': return '감사';
      default: return '기타';
    }
  };

  const getMockDiaries = (): EmotionDiary[] => {
    return [
      {
        id: 'diary_1',
        title: '오늘의 기쁜 순간',
        content: '친구와 함께한 시간이 정말 즐거웠어요. 오랫만에 마음껏 웃을 수 있어서 행복했습니다.',
        emotion: 'happy',
        authorId: 'user_1',
        authorName: '김친구',
        groupId: 'group_1',
        createdAt: new Date('2024-10-21'),
        updatedAt: new Date('2024-10-21'),
        comments: [
          {
            id: 'comment_1',
            content: '정말 기쁜 일이네요! 저도 함께 기뻐해요 😊',
            authorId: 'user_2',
            authorName: '이친구',
            createdAt: new Date('2024-10-21'),
            likes: ['user_1']
          }
        ],
        likes: ['user_2', 'user_3'],
        isPublic: true,
        tags: ['친구', '즐거움', '웃음']
      },
      {
        id: 'diary_2',
        title: '조금 힘든 하루',
        content: '오늘은 조금 피곤하고 힘든 하루였어요. 하지만 내일은 더 좋은 하루가 될 것 같아요.',
        emotion: 'sad',
        authorId: 'user_2',
        authorName: '이친구',
        groupId: 'group_1',
        createdAt: new Date('2024-10-20'),
        updatedAt: new Date('2024-10-20'),
        comments: [
          {
            id: 'comment_2',
            content: '힘든 하루였지만 잘 견뎌내셨네요. 내일은 더 좋은 하루가 될 거예요!',
            authorId: 'user_1',
            authorName: '김친구',
            createdAt: new Date('2024-10-20'),
            likes: ['user_2']
          }
        ],
        likes: ['user_1'],
        isPublic: true,
        tags: ['힘듦', '위로', '희망']
      }
    ];
  };

  const filteredDiaries = diaries.filter(diary => {
    const emotionMatch = filterEmotion === 'all' || diary.emotion === filterEmotion;
    const searchMatch = diary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       diary.content.toLowerCase().includes(searchTerm.toLowerCase());
    return emotionMatch && searchMatch;
  });

  if (isLoading) {
    return <LoadingSpinner message="감정 일기를 불러오고 있습니다..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mb-6">
            <BookOpen className="w-10 h-10 text-pink-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            감정 교환 일기
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-6">
            그룹 멤버들과 마음을 나누고 서로를 이해하는 공간입니다.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* 필터 및 검색 */}
          <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 감정 필터 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  감정별 보기
                </label>
                <select
                  value={filterEmotion}
                  onChange={(e) => setFilterEmotion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">모든 감정</option>
                  <option value="happy">기쁨</option>
                  <option value="sad">슬픔</option>
                  <option value="angry">화남</option>
                  <option value="anxious">불안</option>
                  <option value="excited">흥분</option>
                  <option value="calm">평온</option>
                  <option value="confused">혼란</option>
                  <option value="grateful">감사</option>
                </select>
              </div>
              
              {/* 검색 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  검색
                </label>
                <input
                  type="text"
                  placeholder="제목이나 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 일기 목록 */}
          <div className="space-y-6">
            {filteredDiaries.map(diary => (
              <div key={diary.id} className="bg-white rounded-xl shadow-soft p-6">
                {/* 일기 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getEmotionColor(diary.emotion)}`}>
                      {getEmotionIcon(diary.emotion)}
                      <span>{getEmotionName(diary.emotion)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <User className="w-4 h-4 inline mr-1" />
                      {diary.authorName}
                    </div>
                    <div className="text-sm text-gray-500">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {diary.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleLike(diary.id)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                        diary.likes.includes(user?.uid || '')
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{diary.likes.length}</span>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 일기 내용 */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {diary.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {diary.content}
                  </p>
                </div>

                {/* 태그 */}
                {diary.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {diary.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 댓글 섹션 */}
                <div className="border-t pt-4">
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">
                      댓글 ({diary.comments.length})
                    </h4>
                    
                    {/* 댓글 목록 */}
                    <div className="space-y-3 mb-4">
                      {diary.comments.map(comment => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {comment.authorName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {comment.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-gray-700 text-sm">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {/* 새 댓글 작성 */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="댓글을 작성해주세요..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addComment(diary.id, newComment);
                          }
                        }}
                      />
                      <button
                        onClick={() => addComment(diary.id, newComment)}
                        className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDiaries.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                아직 작성된 일기가 없습니다
              </h3>
              <p className="text-gray-600">
                첫 번째 감정 일기를 작성해보세요!
              </p>
            </div>
          )}
        </div>

        {/* AI 경고 */}
        <div className="mt-8">
          <AIWarning {...aiWarning} />
        </div>
      </div>
    </div>
  );
};

export default EmotionDiaryPage;
