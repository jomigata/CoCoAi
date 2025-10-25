import React, { useEffect, useState } from 'react';
import { SkipToContent, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

interface AccessibilityState {
  skipToContent: boolean;
  screenReaderMode: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    skipToContent: false,
    screenReaderMode: false,
    highContrast: false,
    fontSize: 'medium',
    reducedMotion: false,
  });

  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);

  useEffect(() => {
    // 접근성 설정을 로컬 스토리지에서 불러오기
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      setAccessibilityState(JSON.parse(savedSettings));
    }

    // 시스템 접근성 설정 감지
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    setAccessibilityState(prev => ({
      ...prev,
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
    }));
  }, []);

  useEffect(() => {
    // 접근성 설정을 로컬 스토리지에 저장
    localStorage.setItem('accessibility-settings', JSON.stringify(accessibilityState));

    // CSS 변수로 접근성 설정 적용
    const root = document.documentElement;
    
    // 폰트 크기 설정
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.setProperty('--accessibility-font-size', fontSizeMap[accessibilityState.fontSize]);

    // 고대비 모드
    if (accessibilityState.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 모션 감소 모드
    if (accessibilityState.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // 스크린 리더 모드
    if (accessibilityState.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }
  }, [accessibilityState]);

  const toggleAccessibilitySetting = (setting: keyof AccessibilityState) => {
    setAccessibilityState(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const updateFontSize = (size: 'small' | 'medium' | 'large') => {
    setAccessibilityState(prev => ({
      ...prev,
      fontSize: size,
    }));
  };

  const skipToMainContent = () => {
    const mainContent = document.querySelector('main') || document.querySelector('#main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* 접근성 패널 토글 버튼 */}
      <button
        className="fixed top-4 right-4 z-50 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        onClick={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
        aria-label="접근성 설정 열기"
        title="접근성 설정"
      >
        <Eye className="h-5 w-5" />
      </button>

      {/* 접근성 패널 */}
      {showAccessibilityPanel && (
        <div className="fixed top-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">접근성 설정</h3>
            <button
              onClick={() => setShowAccessibilityPanel(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="접근성 설정 닫기"
            >
              <EyeOff className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 스킵 투 콘텐츠 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                메인 콘텐츠로 건너뛰기
              </label>
              <button
                onClick={skipToMainContent}
                className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                건너뛰기
              </button>
            </div>

            {/* 스크린 리더 모드 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                스크린 리더 모드
              </label>
              <button
                onClick={() => toggleAccessibilitySetting('screenReaderMode')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  accessibilityState.screenReaderMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-pressed={accessibilityState.screenReaderMode}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    accessibilityState.screenReaderMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 고대비 모드 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                고대비 모드
              </label>
              <button
                onClick={() => toggleAccessibilitySetting('highContrast')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  accessibilityState.highContrast ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-pressed={accessibilityState.highContrast}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    accessibilityState.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 모션 감소 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                모션 감소
              </label>
              <button
                onClick={() => toggleAccessibilitySetting('reducedMotion')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  accessibilityState.reducedMotion ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-pressed={accessibilityState.reducedMotion}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    accessibilityState.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 폰트 크기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                폰트 크기
              </label>
              <div className="flex space-x-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateFontSize(size)}
                    className={`px-3 py-1 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      accessibilityState.fontSize === size
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {size === 'small' ? '작게' : size === 'medium' ? '보통' : '크게'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 접근성 설정 컨텍스트 제공 */}
      <div className="accessibility-context" data-settings={JSON.stringify(accessibilityState)}>
        {children}
      </div>
    </>
  );
};

export default AccessibilityProvider;
