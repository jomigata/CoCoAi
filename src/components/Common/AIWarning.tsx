import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface AIWarningProps {
  message?: string;
  details?: string[];
  timestamp?: string;
  type?: 'warning' | 'info' | 'critical';
  showDetails?: boolean;
  className?: string;
}

/**
 * 🚨 AI 편향성 경고 컴포넌트
 * 모든 AI 분석 결과에 필수로 표시되는 경고 메시지
 * 
 * 심리상담가 1,2의 검토를 거친 표준 경고 문구 사용
 */
const AIWarning: React.FC<AIWarningProps> = ({
  message = "⚠️ AI 분석 결과 안내",
  details = [
    "이 분석은 AI 기반으로 제공되며, 완전하지 않을 수 있습니다.",
    "개인의 복잡한 심리 상태를 완전히 반영하지 못할 수 있습니다.",
    "정확한 진단을 위해서는 전문 심리상담사와의 상담을 권장합니다.",
    "이 결과는 참고용으로만 활용해주세요."
  ],
  timestamp,
  type = 'warning',
  showDetails = false,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const getTypeStyles = () => {
    switch (type) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          text: 'text-red-800 dark:text-red-200',
          button: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          text: 'text-blue-800 dark:text-blue-200',
          button: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
        };
      default:
        return {
          container: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-400',
          text: 'text-amber-800 dark:text-amber-200',
          button: 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`border rounded-lg p-4 ${styles.container} ${className}`}>
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {type === 'critical' ? (
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${styles.icon}`} />
          ) : (
            <Info className={`w-5 h-5 mt-0.5 ${styles.icon}`} />
          )}
          <div className="flex-1">
            <h4 className={`font-medium ${styles.text}`}>
              {message}
            </h4>
            {timestamp && (
              <p className={`text-sm mt-1 opacity-75 ${styles.text}`}>
                생성 시간: {new Date(timestamp).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        </div>
        
        {details.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`ml-2 p-1 rounded-md transition-colors ${styles.button}`}
            aria-label={isExpanded ? "세부사항 숨기기" : "세부사항 보기"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* 세부사항 */}
      {isExpanded && details.length > 0 && (
        <div className="mt-3 pl-8">
          <ul className={`space-y-1 text-sm ${styles.text}`}>
            {details.map((detail, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mt-2 mr-2 flex-shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
          
          {/* 전문가 상담 링크 */}
          <div className="mt-3 pt-3 border-t border-current/20">
            <p className={`text-sm font-medium ${styles.text}`}>
              💡 더 정확한 분석이 필요하시다면:
            </p>
            <div className="mt-2 space-y-1">
              <a
                href="/counseling"
                className={`inline-flex items-center text-sm underline hover:no-underline ${styles.button}`}
              >
                전문 심리상담사와 상담하기 →
              </a>
              <br />
              <a
                href="tel:1588-9191"
                className={`inline-flex items-center text-sm underline hover:no-underline ${styles.button}`}
              >
                위기상황 상담전화: 1588-9191
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWarning;
