# WizCoCo - CoCo Ai 심리 케어 플랫폼

AI 기반 심리 케어 플랫폼으로 마음의 건강을 돌보는 서비스입니다.

## 🚀 프로젝트 개요

WizCoCo는 심리 상담사와 내담자를 위한 최신 기능과 최고의 디자인, 편리함을 추구하는 웹 프로그램입니다. AI 챗봇과 전문 상담사를 통한 종합적인 심리 케어 서비스를 제공합니다.

## ✨ 주요 기능

### 🤖 AI 챗봇 상담
- 24시간 언제든지 AI 챗봇과 대화
- 심리 상태 분석 및 개선 방향 제시
- 자연어 처리 기반 감정 분석

### 👨‍⚕️ 전문 상담사 상담
- 자격을 갖춘 전문 상담사와 1:1 화상 상담
- 실시간 메시징 및 파일 공유
- 상담 기록 관리 및 추적

### 📊 심리 상태 분석
- AI 기반 대화 내용 분석
- 심리 상태 시각화 및 리포트
- 개인 맞춤형 케어 프로그램 제안

### 🔒 완전한 익명성
- 개인정보 보호 및 익명성 보장
- 안전한 데이터 암호화
- GDPR 준수

## 🛠 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스
- **TypeScript** - 타입 안전성
- **Vite** - 빠른 개발 환경
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅
- **Zustand** - 상태 관리
- **React Hook Form** - 폼 관리
- **React Hot Toast** - 알림

### Backend & Database
- **Firebase Authentication** - 사용자 인증
- **Firestore** - NoSQL 데이터베이스
- **Firebase Storage** - 파일 저장
- **Firebase Hosting** - 웹 호스팅
- **Firebase Analytics** - 사용자 분석

### DevOps & CI/CD
- **GitHub Actions** - 자동화 파이프라인
- **Firebase CLI** - 배포 자동화
- **ESLint** - 코드 품질 관리
- **Prettier** - 코드 포맷팅

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Layout/         # 레이아웃 컴포넌트
│   ├── UI/             # UI 컴포넌트
│   └── Forms/          # 폼 컴포넌트
├── pages/              # 페이지 컴포넌트
│   ├── Auth/           # 인증 관련 페이지
│   ├── Dashboard/      # 대시보드 페이지
│   ├── Counseling/     # 상담 관련 페이지
│   └── Profile/        # 프로필 페이지
├── hooks/              # 커스텀 훅
├── services/           # API 서비스
├── store/              # 상태 관리
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
└── config/             # 설정 파일
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 8.0.0 이상
- Firebase 계정

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/jomigata/CoCoAi.git
   cd CoCoAi
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   # .env.local 파일 생성
   cp .env.example .env.local
   
   # Firebase 설정 정보 입력
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

5. **브라우저에서 확인**
   ```
   http://localhost:3000
   ```

### 빌드 및 배포

1. **프로덕션 빌드**
   ```bash
   npm run build
   ```

2. **Firebase 배포**
   ```bash
   npm run deploy
   ```

## 🔧 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 코드 린팅
npm run lint

# 코드 린팅 자동 수정
npm run lint:fix

# 타입 체크
npm run type-check

# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage
```

## 🔐 Firebase 설정

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 새 프로젝트 생성
3. 웹 앱 추가

### 2. Authentication 설정
- 이메일/비밀번호 인증 활성화
- Google 로그인 활성화
- Facebook 로그인 활성화

### 3. Firestore Database 설정
- 데이터베이스 생성
- 보안 규칙 설정
- 인덱스 생성

### 4. Storage 설정
- Cloud Storage 활성화
- 보안 규칙 설정

### 5. Hosting 설정
- Firebase Hosting 활성화
- 도메인 설정

## 📊 CI/CD 파이프라인

GitHub Actions를 통한 자동화된 CI/CD 파이프라인이 구축되어 있습니다:

- **코드 품질 검사**: ESLint, TypeScript 타입 체크
- **테스트 실행**: 단위 테스트 및 커버리지 리포트
- **빌드 테스트**: 프로덕션 빌드 검증
- **보안 스캔**: Snyk를 통한 취약점 검사
- **성능 테스트**: Lighthouse CI를 통한 성능 측정
- **자동 배포**: Firebase Hosting 자동 배포

## 🔒 보안

- Firebase 보안 규칙을 통한 데이터 접근 제어
- 사용자 인증 및 권한 관리
- 개인정보 보호 및 암호화
- HTTPS 강제 적용
- XSS 및 CSRF 보호

## 📈 성능 최적화

- 코드 스플리팅 및 지연 로딩
- 이미지 최적화 및 압축
- CDN을 통한 정적 자원 배포
- 캐싱 전략 적용
- 번들 크기 최적화

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

- **프로젝트 링크**: [https://github.com/jomigata/CoCoAi](https://github.com/jomigata/CoCoAi)
- **웹사이트**: [https://cocoai-60a2d.web.app](https://cocoai-60a2d.web.app)
- **이메일**: support@cocoai.com

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받았습니다:
- React
- Firebase
- Tailwind CSS
- Vite
- TypeScript

---

**WizCoCo - CoCo Ai**와 함께 마음의 건강을 돌보세요! 💖
