import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-pink-500">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-4">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            홈으로 돌아가기
          </Link>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              이전 페이지
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Search className="h-4 w-4 mr-2" />
              새로고침
            </button>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>문제가 지속되면 고객지원팀에 문의해 주세요.</p>
          <p className="mt-1">
            이메일: <a href="mailto:support@cocoai.com" className="text-pink-500 hover:text-pink-600">support@cocoai.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
