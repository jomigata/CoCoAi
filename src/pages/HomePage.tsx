import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, BarChart3, Users, Shield, Clock } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <Heart className="h-16 w-16 text-pink-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            WizCoCo
            <span className="block text-2xl md:text-4xl text-pink-500 mt-2">
              - CoCo Ai 심리 케어 플랫폼
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            AI 기반 심리 케어 플랫폼으로 마음의 건강을 돌보세요. 
            전문 상담사와 함께하는 따뜻한 상담 서비스를 제공합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              지금 시작하기
            </Link>
            <Link
              to="/counseling"
              className="border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              상담 알아보기
            </Link>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              우리의 서비스
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              전문적이고 안전한 심리 케어 서비스를 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <MessageCircle className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AI 챗봇 상담
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                24시간 언제든지 AI 챗봇과 대화하며 심리 상태를 점검하고 조언을 받을 수 있습니다.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                전문 상담사 상담
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                자격을 갖춘 전문 상담사와 1:1 화상 상담을 통해 깊이 있는 심리 치료를 받을 수 있습니다.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <BarChart3 className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                심리 상태 분석
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI가 대화 내용을 분석하여 심리 상태를 파악하고 개선 방향을 제시합니다.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <Shield className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                완전한 익명성
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                개인정보 보호와 익명성을 보장하여 안전하게 상담을 받을 수 있습니다.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <Clock className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                24시간 서비스
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                언제든지 필요한 순간에 심리 케어 서비스를 이용할 수 있습니다.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                맞춤형 케어
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                개인의 상황과 필요에 맞는 맞춤형 심리 케어 프로그램을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              신뢰받는 서비스
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              많은 사용자들이 선택한 심리 케어 플랫폼
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-pink-500 mb-2">10,000+</div>
              <div className="text-gray-600 dark:text-gray-300">활성 사용자</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-500 mb-2">50,000+</div>
              <div className="text-gray-600 dark:text-gray-300">상담 세션</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-500 mb-2">200+</div>
              <div className="text-gray-600 dark:text-gray-300">전문 상담사</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-500 mb-2">98%</div>
              <div className="text-gray-600 dark:text-gray-300">만족도</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-pink-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            지금 시작해보세요
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            마음의 건강을 위한 첫 걸음을 내딛어보세요
          </p>
          <Link
            to="/register"
            className="bg-white text-pink-500 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
