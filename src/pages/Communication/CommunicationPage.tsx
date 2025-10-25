import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  BookOpen, 
  Target,
  Users,
  Heart,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Compass,
  Brain,
  Zap,
  Star
} from 'lucide-react';

/**
 * 💬 소통 도구 메인 페이지
 * 감정 교환 일기, 메시지 템플릿, 가치관 분석으로의 네비게이션 허브
 * 
 * 웹 디자이너 1,2가 설계한 사용자 친화적 인터페이스
 * 직관적인 카드 기반 네비게이션으로 각 도구에 쉽게 접근
 */
const CommunicationPage: React.FC = () => {
  const communicationTools = [
    {
      id: 'emotion-diary',
      title: '감정 교환 일기',
      description: '그룹 멤버들과 마음을 나누고 서로를 이해하는 공간입니다.',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'pink',
      gradient: 'from-pink-100 to-rose-100',
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
      path: '/communication/diary',
      features: ['감정 공유', '댓글 소통', '감정별 필터', '태그 시스템'],
      benefits: '서로의 마음을 이해하고 공감대를 형성할 수 있습니다.'
    },
    {
      id: 'message-template',
      title: '메시지 템플릿',
      description: '상황에 맞는 진심 어린 메시지를 생성하고 공유해보세요.',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'blue',
      gradient: 'from-blue-100 to-indigo-100',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/communication/messages',
      features: ['상황별 템플릿', '개인화 메시지', '톤 조절', '복사/공유'],
      benefits: '어떤 상황에서도 진심이 전달되는 메시지를 작성할 수 있습니다.'
    },
    {
      id: 'value-analysis',
      title: '가치관 분석',
      description: '개인과 그룹의 가치관을 분석하여 더 나은 관계를 만들어보세요.',
      icon: <Target className="w-8 h-8" />,
      color: 'purple',
      gradient: 'from-purple-100 to-indigo-100',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      path: '/communication/values',
      features: ['가치관 시각화', '호환성 분석', 'AI 인사이트', '맞춤 추천'],
      benefits: '서로의 가치관을 이해하고 갈등을 예방할 수 있습니다.'
    }
  ];

  const getCardStyles = (color: string) => {
    const styles = {
      pink: {
        gradient: 'from-pink-50 to-rose-50',
        border: 'border-pink-200',
        hover: 'hover:border-pink-300 hover:shadow-pink-100',
        button: 'bg-pink-500 hover:bg-pink-600'
      },
      blue: {
        gradient: 'from-blue-50 to-indigo-50',
        border: 'border-blue-200',
        hover: 'hover:border-blue-300 hover:shadow-blue-100',
        button: 'bg-blue-500 hover:bg-blue-600'
      },
      purple: {
        gradient: 'from-purple-50 to-indigo-50',
        border: 'border-purple-200',
        hover: 'hover:border-purple-300 hover:shadow-purple-100',
        button: 'bg-purple-500 hover:bg-purple-600'
      }
    };
    return styles[color as keyof typeof styles] || styles.pink;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container-responsive py-12">
        {/* 헤더 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-8">
            <Users className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-display-large text-gray-900 mb-6">
            소통 도구
          </h1>
          <p className="text-body-large text-gray-600 max-w-3xl mx-auto mb-8">
            더 나은 관계를 위한 다양한 소통 도구들을 활용해보세요.
            <br />
            감정을 공유하고, 진심을 전달하며, 서로를 이해하는 방법을 찾아보세요.
          </p>
          
          {/* 통계 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-soft p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <span className="text-sm font-medium text-gray-700">감정 공유</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">1,234</div>
              <div className="text-xs text-gray-500">이번 달</div>
            </div>
            <div className="bg-white rounded-xl shadow-soft p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">메시지 생성</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">567</div>
              <div className="text-xs text-gray-500">이번 주</div>
            </div>
            <div className="bg-white rounded-xl shadow-soft p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">가치관 분석</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">89</div>
              <div className="text-xs text-gray-500">총 분석</div>
            </div>
          </div>
        </div>

        {/* 도구 카드들 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {communicationTools.map((tool) => {
            const styles = getCardStyles(tool.color);
            
            return (
              <Link
                key={tool.id}
                to={tool.path}
                className={`group block bg-white rounded-2xl shadow-soft border-2 ${styles.border} ${styles.hover} transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className={`p-8 bg-gradient-to-br ${styles.gradient} rounded-t-2xl`}>
                  {/* 아이콘과 제목 */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className={`p-3 bg-white rounded-xl shadow-sm ${styles.hover}`}>
                      <div className={tool.iconColor}>
                        {tool.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                        {tool.title}
                      </h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Sparkles className="w-4 h-4" />
                        <span>AI 기반</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 설명 */}
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {tool.description}
                  </p>
                  
                  {/* 주요 기능 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      주요 기능
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tool.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white bg-opacity-60 text-gray-700 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* 혜택 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      기대 효과
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {tool.benefits}
                    </p>
                  </div>
                  
                  {/* 액션 버튼 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Compass className="w-4 h-4" />
                      <span>시작하기</span>
                    </div>
                    <div className={`p-2 rounded-lg ${styles.button} text-white transition-colors`}>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 추가 정보 섹션 */}
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-display-small text-gray-900 mb-4">
              AI 기반 소통 도구의 장점
            </h2>
            <p className="text-body-medium text-gray-600 max-w-2xl mx-auto">
              심리학 전문가와 AI가 함께 설계한 도구들로 더 효과적인 소통을 경험해보세요.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">감정 이해</h3>
              <p className="text-sm text-gray-600">
                서로의 감정을 깊이 이해하고 공감할 수 있습니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">진심 전달</h3>
              <p className="text-sm text-gray-600">
                상황에 맞는 진심 어린 메시지를 쉽게 작성할 수 있습니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">갈등 예방</h3>
              <p className="text-sm text-gray-600">
                가치관 차이를 미리 파악하여 갈등을 예방할 수 있습니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lightbulb className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">관계 개선</h3>
              <p className="text-sm text-gray-600">
                AI 인사이트로 관계 개선 방향을 제시받을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationPage;
