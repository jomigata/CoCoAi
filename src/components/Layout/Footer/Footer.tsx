import React from 'react';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 로고 및 설명 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="h-8 w-8 text-pink-500" />
              <span className="text-2xl font-bold">WizCoCo</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              AI 기반 심리 케어 플랫폼으로 마음의 건강을 돌보세요. 
              전문 상담사와 함께하는 따뜻한 상담 서비스를 제공합니다.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-pink-400 transition-colors"
              >
                개인정보처리방침
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-pink-400 transition-colors"
              >
                이용약관
              </a>
            </div>
          </div>

          {/* 서비스 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  심리 상담
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  AI 챗봇
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  심리 테스트
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-pink-400 transition-colors"
                >
                  커뮤니티
                </a>
              </li>
            </ul>
          </div>

          {/* 연락처 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">연락처</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-pink-400" />
                <span className="text-gray-400">support@cocoai.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-pink-400" />
                <span className="text-gray-400">02-1234-5678</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-pink-400" />
                <span className="text-gray-400">서울특별시 강남구</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 WizCoCo - CoCo Ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
