import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  showRetry = true 
}) => {
  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          오류가 발생했습니다
        </h2>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
