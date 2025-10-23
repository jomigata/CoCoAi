import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@store/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  Send,
  Bot,
  User,
  Heart,
  Lightbulb,
  MessageCircle,
  RefreshCw,
  Settings,
  HelpCircle,
  Smile,
  Brain,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    emotion?: string;
    supportType?: 'emotional' | 'informational' | 'guidance';
  };
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  context: {
    currentMood?: string;
    recentTestResults?: string[];
    groupContext?: string;
    conversationGoal?: string;
  };
  status: 'active' | 'completed' | 'archived';
  lastMessageAt: Date;
  createdAt: Date;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 코코 AI의 기본 응답 템플릿
  const cocoResponses = {
    welcome: [
      "안녕하세요! 저는 마음 친구 코코예요 🌸 오늘 하루는 어떠셨나요?",
      "반가워요! 코코가 여러분의 마음을 함께 돌봐드릴게요 💝 무엇을 도와드릴까요?",
      "안녕하세요! 마음이 편안한 하루 보내고 계신가요? 코코와 함께 이야기해요 🤗"
    ],
    emotional: [
      "마음이 힘드시군요. 그런 감정을 느끼는 것은 자연스러운 일이에요. 천천히 이야기해주세요.",
      "지금 느끼시는 감정을 충분히 이해해요. 혼자가 아니라는 것을 기억해주세요.",
      "어려운 시간을 보내고 계시는군요. 코코가 함께 있으니 편안하게 마음을 나눠주세요."
    ],
    informational: [
      "좋은 질문이에요! 제가 알고 있는 정보를 바탕으로 도움을 드릴게요.",
      "그 부분에 대해 설명해드릴게요. 더 궁금한 점이 있으면 언제든 물어보세요.",
      "정확한 정보를 제공해드리고 싶어요. 자세히 알려드릴게요."
    ],
    guidance: [
      "함께 해결 방법을 찾아볼까요? 단계별로 접근해보는 것이 좋을 것 같아요.",
      "좋은 방향으로 나아가고 계시네요! 몇 가지 제안을 드려볼게요.",
      "상황을 개선할 수 있는 방법들이 있어요. 하나씩 시도해보시는 것은 어떨까요?"
    ],
    encouragement: [
      "정말 잘하고 계세요! 작은 변화도 큰 의미가 있어요 ✨",
      "스스로를 자랑스러워하세요. 지금까지 정말 많이 성장하셨어요 🌱",
      "힘든 상황에서도 노력하는 모습이 아름다워요. 응원할게요! 💪"
    ]
  };

  // 빠른 응답 버튼들
  const quickResponses = [
    { text: "오늘 기분이 어때요?", icon: <Smile className="w-4 h-4" /> },
    { text: "스트레스 관리 방법", icon: <Brain className="w-4 h-4" /> },
    { text: "마음 건강 팁", icon: <Heart className="w-4 h-4" /> },
    { text: "앱 사용법 도움", icon: <HelpCircle className="w-4 h-4" /> }
  ];

  useEffect(() => {
    if (user) {
      initializeChat();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    if (!user) return;

    // 환영 메시지 표시
    const welcomeMessage = cocoResponses.welcome[Math.floor(Math.random() * cocoResponses.welcome.length)];
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
      metadata: {
        supportType: 'emotional'
      }
    }]);
  };

  const createNewSession = async () => {
    if (!user) return null;

    try {
      const sessionData = {
        userId: user.uid,
        title: `대화 - ${new Date().toLocaleDateString('ko-KR')}`,
        context: {
          conversationGoal: 'general-support'
        },
        status: 'active',
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'chatSessions'), sessionData);
      return docRef.id;
    } catch (error) {
      console.error('세션 생성 오류:', error);
      return null;
    }
  };

  const analyzeUserMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // 감정 키워드 분석
    const emotionalKeywords = ['슬프', '우울', '힘들', '스트레스', '불안', '걱정', '화나', '짜증'];
    const positiveKeywords = ['행복', '기쁘', '좋아', '감사', '뿌듯', '만족'];
    const questionKeywords = ['어떻게', '방법', '도움', '알려줘', '설명'];

    let intent = 'general';
    let emotion = 'neutral';
    let supportType: 'emotional' | 'informational' | 'guidance' = 'informational';

    if (emotionalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      emotion = 'negative';
      supportType = 'emotional';
      intent = 'emotional-support';
    } else if (positiveKeywords.some(keyword => lowerMessage.includes(keyword))) {
      emotion = 'positive';
      supportType = 'emotional';
      intent = 'celebration';
    } else if (questionKeywords.some(keyword => lowerMessage.includes(keyword))) {
      supportType = 'guidance';
      intent = 'information-seeking';
    }

    return { intent, emotion, supportType };
  };

  const generateCocoResponse = (userMessage: string, analysis: any): string => {
    const { supportType, emotion, intent } = analysis;

    // 특정 키워드에 대한 맞춤 응답
    if (userMessage.includes('프로파일링') || userMessage.includes('검사')) {
      return "개인 프로파일링은 자신을 더 깊이 이해하는 좋은 방법이에요! 프로파일링 페이지에서 시작하실 수 있어요. 결과를 통해 맞춤형 조언도 받으실 수 있답니다 ✨";
    }

    if (userMessage.includes('그룹') || userMessage.includes('가족') || userMessage.includes('친구')) {
      return "그룹 기능을 통해 소중한 사람들과 마음을 나눠보세요! 함께 심리검사를 하고 위클리 리포트를 받아보실 수 있어요. 관계가 더욱 깊어질 거예요 💕";
    }

    if (userMessage.includes('기록') || userMessage.includes('일기')) {
      return "데일리 마음 기록은 자신의 감정 패턴을 발견하는 데 정말 도움이 돼요! 매일 조금씩이라도 기록해보세요. 시간이 지나면 놀라운 변화를 발견하실 수 있을 거예요 📝";
    }

    // 감정 상태에 따른 응답
    if (supportType === 'emotional') {
      if (emotion === 'negative') {
        const responses = cocoResponses.emotional;
        let response = responses[Math.floor(Math.random() * responses.length)];
        
        // 구체적인 조언 추가
        response += "\n\n💡 도움이 될 만한 방법들:\n";
        response += "• 깊게 숨을 들이마시고 천천히 내쉬어보세요\n";
        response += "• 지금 이 순간에 집중해보세요\n";
        response += "• 신뢰할 수 있는 사람과 이야기해보세요\n";
        response += "• 필요하다면 전문가의 도움을 받는 것도 좋아요";
        
        return response;
      } else if (emotion === 'positive') {
        const encouragements = cocoResponses.encouragement;
        return encouragements[Math.floor(Math.random() * encouragements.length)];
      }
    }

    if (supportType === 'guidance') {
      const guidances = cocoResponses.guidance;
      return guidances[Math.floor(Math.random() * guidances.length)];
    }

    // 기본 정보 제공 응답
    const informational = cocoResponses.informational;
    let response = informational[Math.floor(Math.random() * informational.length)];
    
    response += "\n\n🌟 WizCoCo에서 이런 기능들을 사용해보세요:\n";
    response += "• 개인 프로파일링으로 자신을 더 깊이 알아보기\n";
    response += "• 데일리 마음 기록으로 감정 패턴 발견하기\n";
    response += "• 그룹 기능으로 소중한 사람들과 함께 성장하기\n";
    response += "• 심리검사로 새로운 인사이트 얻기";
    
    return response;
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !user) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);
    setShowWelcome(false);

    // 사용자 메시지 추가
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // 세션이 없으면 새로 생성
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await createNewSession();
        setSessionId(currentSessionId);
      }

      // 메시지 분석
      const analysis = analyzeUserMessage(userMessage);
      
      // AI 응답 생성 (실제로는 외부 AI API 호출)
      setTimeout(() => {
        const cocoResponse = generateCocoResponse(userMessage, analysis);
        
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: cocoResponse,
          timestamp: new Date(),
          metadata: analysis
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);

        // Firestore에 메시지 저장 (실제 구현에서는 세션 업데이트)
        if (currentSessionId) {
          // 세션 업데이트 로직
        }
      }, 1000 + Math.random() * 2000); // 1-3초 랜덤 지연으로 자연스러운 응답 시뮬레이션

    } catch (error) {
      console.error('메시지 전송 오류:', error);
      toast.error('메시지 전송 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleQuickResponse = (text: string) => {
    setCurrentMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-screen bg-gradient-primary flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mr-4">
              <Bot className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-title-large text-gray-900">마음 친구 코코</h1>
              <p className="text-body-small text-gray-500">24시간 언제든 함께해요</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setMessages([]);
                setSessionId(null);
                setShowWelcome(true);
                initializeChat();
              }}
              className="btn-ghost p-2"
              title="새 대화 시작"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="btn-ghost p-2" title="설정">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* 환영 메시지 및 빠른 응답 */}
          {showWelcome && messages.length <= 1 && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full mb-4">
                <Heart className="w-10 h-10 text-pink-600" />
              </div>
              <h2 className="text-headline-medium text-gray-900 mb-2">
                마음 친구 코코와 대화해보세요
              </h2>
              <p className="text-body-medium text-gray-600 mb-6">
                고민 상담, 앱 사용법, 심리 건강 정보 등 무엇이든 물어보세요!
              </p>
              
              {/* 빠른 응답 버튼들 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {quickResponses.map((response, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickResponse(response.text)}
                    className="flex items-center justify-center p-3 bg-white rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all duration-200"
                  >
                    <div className="text-pink-600 mr-2">
                      {response.icon}
                    </div>
                    <span className="text-body-small font-medium text-gray-700">
                      {response.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메시지 목록 */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs md:max-w-md lg:max-w-lg ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                {/* 아바타 */}
                <div className={`flex-shrink-0 ${
                  message.role === 'user' ? 'ml-3' : 'mr-3'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-pink-500' 
                      : 'bg-pink-100'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-pink-600" />
                    )}
                  </div>
                </div>

                {/* 메시지 버블 */}
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-pink-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  <div className="whitespace-pre-wrap text-body-medium">
                    {message.content}
                  </div>
                  
                  {/* 메타데이터 표시 (개발 모드에서만) */}
                  {message.metadata && process.env.NODE_ENV === 'development' && (
                    <div className="mt-2 text-xs opacity-70">
                      {message.metadata.supportType} | {message.metadata.emotion}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-pink-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 로딩 인디케이터 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex mr-3">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-pink-600" />
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-1">
                  <div className="loading-dots">
                    <div className="loading-dot"></div>
                    <div className="loading-dot" style={{ animationDelay: '0.1s' }}></div>
                    <div className="loading-dot" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-body-small text-gray-500 ml-2">코코가 생각 중...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="코코에게 메시지를 보내보세요..."
                className="input-field resize-none"
                rows={1}
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading}
              className={`btn-primary p-3 flex-shrink-0 ${
                !currentMessage.trim() || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* 도움말 텍스트 */}
          <div className="flex items-center justify-center mt-3">
            <div className="flex items-center text-body-small text-gray-500">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span>
                코코는 AI 챗봇입니다. 전문적인 상담이 필요한 경우 전문가의 도움을 받으세요.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
