import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { 
  MessageSquare, 
  Heart, 
  Users, 
  Calendar,
  Plus,
  Edit3,
  Copy,
  Send,
  Star,
  Clock,
  User,
  Filter,
  Search,
  BookOpen,
  Gift,
  Smile,
  ThumbsUp,
  Share2,
  Download
} from 'lucide-react';
import { AIWarning } from '../../components/Common/AIWarning';
import { useAIWarning } from '../../hooks/useAIWarning';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

interface MessageTemplate {
  id: string;
  title: string;
  template: string;
  category: 'gratitude' | 'apology' | 'encouragement' | 'celebration' | 'support' | 'love' | 'general';
  tone: 'formal' | 'casual' | 'warm' | 'sincere' | 'playful';
  variables: string[];
  context: {
    relationship: 'family' | 'friends' | 'partner' | 'colleagues' | 'general';
    situation: 'happy' | 'difficult' | 'neutral' | 'special';
  };
  tags: string[];
  usageCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PersonalizedMessage {
  templateId: string;
  personalizedText: string;
  variables: { [key: string]: string };
  recipientName: string;
  relationship: string;
  situation: string;
}

/**
 * 💌 메시지 템플릿 페이지
 * 상황에 맞는 진심 어린 메시지를 생성하고 공유하는 공간
 * 
 * 심리상담가 1,2가 설계한 소통 도구
 * AI 기반 개인화된 메시지 생성으로 진심이 전달되는 소통 지원
 */
const MessageTemplatePage: React.FC = () => {
  const { user } = useAuth();
  const functions = getFunctions();
  
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [personalizedMessage, setPersonalizedMessage] = useState<PersonalizedMessage | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTone, setFilterTone] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customVariables, setCustomVariables] = useState<{ [key: string]: string }>({});

  // AI 경고 시스템
  const aiWarning = useAIWarning({
    analysisType: 'communication',
    severity: 'low'
  });

  useEffect(() => {
    if (user) {
      loadMessageTemplates();
    }
  }, [user]);

  const loadMessageTemplates = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Firebase Functions를 통한 실제 메시지 템플릿 데이터 로드
      const getMessageTemplates = httpsCallable(functions, 'getMessageTemplates');
      const result = await getMessageTemplates({ userId: user.uid });
      const data = result.data as { success: boolean; templates: MessageTemplate[] };
      
      if (data.success && data.templates) {
        setTemplates(data.templates.map(template => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt)
        })));
        toast.success('메시지 템플릿을 불러왔습니다!');
      } else {
        // 폴백으로 목업 데이터 사용
        setTemplates(getMockTemplates());
      }
    } catch (error) {
      console.error('메시지 템플릿 로드 오류:', error);
      toast.error('메시지 템플릿을 불러오는 중 오류가 발생했습니다.');
      
      // 폴백 데이터
      setTemplates(getMockTemplates());
    } finally {
      setIsLoading(false);
    }
  };

  const generatePersonalizedMessage = async (templateId: string, variables: { [key: string]: string }) => {
    if (!user) return;

    try {
      const createPersonalizedMessage = httpsCallable(functions, 'createPersonalizedMessage');
      const result = await createPersonalizedMessage({
        templateId,
        variables,
        userId: user.uid
      });
      
      const data = result.data as { success: boolean; message: PersonalizedMessage };
      
      if (data.success) {
        setPersonalizedMessage(data.message);
        toast.success('개인화된 메시지가 생성되었습니다!');
      }
    } catch (error) {
      console.error('개인화 메시지 생성 오류:', error);
      toast.error('개인화 메시지 생성 중 오류가 발생했습니다.');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gratitude': return <Heart className="w-5 h-5 text-pink-500" />;
      case 'apology': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'encouragement': return <ThumbsUp className="w-5 h-5 text-green-500" />;
      case 'celebration': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'support': return <Users className="w-5 h-5 text-purple-500" />;
      case 'love': return <Heart className="w-5 h-5 text-red-500" />;
      case 'general': return <MessageSquare className="w-5 h-5 text-gray-500" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'gratitude': return '감사';
      case 'apology': return '사과';
      case 'encouragement': return '격려';
      case 'celebration': return '축하';
      case 'support': return '지지';
      case 'love': return '사랑';
      case 'general': return '일반';
      default: return '기타';
    }
  };

  const getToneName = (tone: string) => {
    switch (tone) {
      case 'formal': return '정중한';
      case 'casual': return '편안한';
      case 'warm': return '따뜻한';
      case 'sincere': return '진심 어린';
      case 'playful': return '재미있는';
      default: return '일반적인';
    }
  };

  const getMockTemplates = (): MessageTemplate[] => {
    return [
      {
        id: 'template_1',
        title: '진심을 담은 감사 메시지',
        template: '{{name}}님, {{situation}}에 정말 감사드립니다. 덕분에 큰 힘이 되었습니다.',
        category: 'gratitude',
        tone: 'sincere',
        variables: ['name', 'situation'],
        context: {
          relationship: 'general',
          situation: 'difficult'
        },
        tags: ['감사', '진심'],
        usageCount: 15,
        successRate: 95,
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-10-21')
      },
      {
        id: 'template_2',
        title: '따뜻한 격려 메시지',
        template: '{{name}}님, 힘든 시간이지만 함께 이겨내요. 당신은 충분히 잘하고 있습니다.',
        category: 'encouragement',
        tone: 'warm',
        variables: ['name'],
        context: {
          relationship: 'friends',
          situation: 'difficult'
        },
        tags: ['격려', '따뜻함'],
        usageCount: 23,
        successRate: 92,
        createdAt: new Date('2024-10-10'),
        updatedAt: new Date('2024-10-20')
      },
      {
        id: 'template_3',
        title: '축하 메시지',
        template: '{{name}}님, {{achievement}} 정말 축하드려요! 당신의 노력이 빛나는 순간입니다.',
        category: 'celebration',
        tone: 'playful',
        variables: ['name', 'achievement'],
        context: {
          relationship: 'general',
          situation: 'happy'
        },
        tags: ['축하', '성취'],
        usageCount: 8,
        successRate: 98,
        createdAt: new Date('2024-10-05'),
        updatedAt: new Date('2024-10-18')
      }
    ];
  };

  const filteredTemplates = templates.filter(template => {
    const categoryMatch = filterCategory === 'all' || template.category === filterCategory;
    const toneMatch = filterTone === 'all' || template.tone === filterTone;
    const searchMatch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       template.template.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && toneMatch && searchMatch;
  });

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setPersonalizedMessage(null);
    
    // 기본 변수값 설정
    const defaultVariables: { [key: string]: string } = {};
    template.variables.forEach(variable => {
      defaultVariables[variable] = '';
    });
    setCustomVariables(defaultVariables);
  };

  const handlePersonalizeMessage = () => {
    if (!selectedTemplate) return;
    
    // 간단한 개인화 (실제로는 AI 서비스 사용)
    let personalizedText = selectedTemplate.template;
    Object.entries(customVariables).forEach(([key, value]) => {
      personalizedText = personalizedText.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    const message: PersonalizedMessage = {
      templateId: selectedTemplate.id,
      personalizedText,
      variables: customVariables,
      recipientName: customVariables.name || '친구',
      relationship: selectedTemplate.context.relationship,
      situation: selectedTemplate.context.situation
    };
    
    setPersonalizedMessage(message);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('메시지가 클립보드에 복사되었습니다!');
  };

  if (isLoading) {
    return <LoadingSpinner message="메시지 템플릿을 불러오고 있습니다..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
            <MessageSquare className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            메시지 템플릿
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-6">
            상황에 맞는 진심 어린 메시지를 생성하고 공유해보세요.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 템플릿 목록 */}
            <div className="space-y-6">
              {/* 필터 및 검색 */}
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 카테고리 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">모든 카테고리</option>
                      <option value="gratitude">감사</option>
                      <option value="apology">사과</option>
                      <option value="encouragement">격려</option>
                      <option value="celebration">축하</option>
                      <option value="support">지지</option>
                      <option value="love">사랑</option>
                      <option value="general">일반</option>
                    </select>
                  </div>
                  
                  {/* 톤 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      톤
                    </label>
                    <select
                      value={filterTone}
                      onChange={(e) => setFilterTone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">모든 톤</option>
                      <option value="formal">정중한</option>
                      <option value="casual">편안한</option>
                      <option value="warm">따뜻한</option>
                      <option value="sincere">진심 어린</option>
                      <option value="playful">재미있는</option>
                    </select>
                  </div>
                  
                  {/* 검색 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      검색
                    </label>
                    <input
                      type="text"
                      placeholder="템플릿 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 템플릿 목록 */}
              <div className="space-y-4">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`bg-white rounded-xl shadow-soft p-6 cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(template.category)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {template.title}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              template.category === 'gratitude' ? 'bg-pink-100 text-pink-800' :
                              template.category === 'apology' ? 'bg-blue-100 text-blue-800' :
                              template.category === 'encouragement' ? 'bg-green-100 text-green-800' :
                              template.category === 'celebration' ? 'bg-yellow-100 text-yellow-800' :
                              template.category === 'support' ? 'bg-purple-100 text-purple-800' :
                              template.category === 'love' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getCategoryName(template.category)}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {getToneName(template.tone)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span>{template.successRate}%</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{template.usageCount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-3">
                      {template.template}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 개인화 및 미리보기 */}
            <div className="space-y-6">
              {selectedTemplate && (
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    메시지 개인화
                  </h3>
                  
                  {/* 변수 입력 */}
                  <div className="space-y-4 mb-6">
                    {selectedTemplate.variables.map(variable => (
                      <div key={variable}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {variable === 'name' ? '이름' :
                           variable === 'situation' ? '상황' :
                           variable === 'achievement' ? '성취' :
                           variable}
                        </label>
                        <input
                          type="text"
                          placeholder={`${variable}을(를) 입력하세요`}
                          value={customVariables[variable] || ''}
                          onChange={(e) => setCustomVariables(prev => ({
                            ...prev,
                            [variable]: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={handlePersonalizeMessage}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    메시지 생성하기
                  </button>
                </div>
              )}

              {/* 생성된 메시지 미리보기 */}
              {personalizedMessage && (
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      생성된 메시지
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(personalizedMessage.personalizedText)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="복사"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="공유"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-800 leading-relaxed">
                      {personalizedMessage.personalizedText}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>받는 사람: {personalizedMessage.recipientName}</span>
                      <span>관계: {personalizedMessage.relationship}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <Send className="w-4 h-4" />
                        <span>전송</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                해당하는 템플릿이 없습니다
              </h3>
              <p className="text-gray-600">
                다른 필터 조건을 시도해보세요.
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

export default MessageTemplatePage;
