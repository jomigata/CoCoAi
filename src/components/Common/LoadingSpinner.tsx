import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = '로딩 중...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft p-8 text-center">
        <div className={`animate-spin rounded-full border-b-2 border-pink-500 mx-auto mb-4 ${sizeClasses[size]}`}>
          <Loader2 className={`${sizeClasses[size]} text-pink-500`} />
        </div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
