// 환경 변수 타입 정의
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
  VITE_FIREBASE_MEASUREMENT_ID: string;
  VITE_API_BASE_URL: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
}

// 환경 변수 가져오기
export const getEnvConfig = (): Partial<EnvironmentConfig> => {
  return {
    NODE_ENV: import.meta.env.MODE as EnvironmentConfig['NODE_ENV'],
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  };
};

// 환경 변수 검증
export const validateEnvConfig = (config: Partial<EnvironmentConfig>): boolean => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  return requiredVars.every(varName => {
    const value = config[varName as keyof EnvironmentConfig];
    return value && value.trim() !== '';
  });
};

// 현재 환경 설정
export const envConfig = getEnvConfig();
export const isDevelopment = envConfig.NODE_ENV === 'development';
export const isProduction = envConfig.NODE_ENV === 'production';
export const isTest = envConfig.NODE_ENV === 'test';
