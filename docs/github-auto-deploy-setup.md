# 🚀 GitHub 자동 배포 설정 가이드

## 📋 개요

이 가이드는 CoCoAi 프로젝트의 GitHub Actions를 통한 자동 배포 시스템 설정 방법을 안내합니다.

## 🔧 1단계: Firebase 토큰 생성

### 1.1 Firebase CLI 로그인
```bash
# 터미널에서 실행
firebase login
```

### 1.2 CI 토큰 생성
```bash
# CI 토큰 생성 (대화형 모드)
firebase login:ci
```

**중요**: 생성된 토큰을 안전한 곳에 복사해 두세요. 이 토큰은 GitHub Secrets에 저장됩니다.

## 🔐 2단계: GitHub Secrets 설정

GitHub 저장소 > Settings > Secrets and variables > Actions에서 다음 시크릿을 추가하세요:

### 2.1 Firebase 관련 시크릿
```
FIREBASE_TOKEN=<1단계에서 생성한 CI 토큰>
FIREBASE_PROJECT_ID=<Firebase 프로젝트 ID>
```

### 2.2 Firebase 환경 변수 시크릿
```
VITE_FIREBASE_API_KEY=<Firebase API 키>
VITE_FIREBASE_AUTH_DOMAIN=<프로젝트ID>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<Firebase 프로젝트 ID>
VITE_FIREBASE_STORAGE_BUCKET=<프로젝트ID>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<메시징 센더 ID>
VITE_FIREBASE_APP_ID=<Firebase 앱 ID>
VITE_FIREBASE_MEASUREMENT_ID=<Google Analytics 측정 ID>
```

### 2.3 Firebase 설정 값 확인 방법
1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. 프로젝트 설정 > 일반 탭
4. "내 앱" 섹션에서 웹 앱 선택
5. "Firebase SDK 스니펫" > "구성" 선택
6. 표시된 값들을 GitHub Secrets에 입력

## 🔄 3단계: 자동 배포 워크플로우

### 3.1 배포 트리거
- **자동 배포**: `main` 브랜치에 푸시할 때
- **PR 미리보기**: Pull Request 생성 시

### 3.2 배포 단계
1. **코드 품질 검사**: TypeScript 타입 체크, ESLint
2. **빌드 및 테스트**: 프로젝트 빌드
3. **Firebase Functions 배포**: 백엔드 로직 배포
4. **Firebase Hosting 배포**: 프론트엔드 배포
5. **Firestore Rules 배포**: 데이터베이스 보안 규칙 배포

## 🚀 4단계: 배포 실행

### 4.1 자동 배포 스크립트 사용
```bash
# Windows
scripts/auto-deploy.bat

# Linux/macOS
./scripts/auto-deploy.sh
```

### 4.2 수동 Git 푸시
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
```

## 📊 5단계: 배포 상태 확인

### 5.1 GitHub Actions 확인
- URL: https://github.com/wizcoco-ai/CoCoAi/actions
- 각 워크플로우의 실행 상태와 로그 확인 가능

### 5.2 Firebase Console 확인
- URL: https://console.firebase.google.com
- Hosting, Functions, Firestore 배포 상태 확인

### 5.3 배포된 웹사이트 확인
- 프로덕션: https://[프로젝트ID].web.app
- PR 미리보기: https://[프로젝트ID]--pr-[PR번호]-[해시].web.app

## 🛠️ 트러블슈팅

### 빌드 실패 시
1. 로컬에서 `npm run build` 실행하여 오류 확인
2. TypeScript 오류: `npm run type-check`
3. 린트 오류: `npm run lint:fix`

### 배포 실패 시
1. Firebase 토큰 만료 확인
2. GitHub Secrets 값 확인
3. Firebase 프로젝트 권한 확인

### 환경 변수 오류 시
1. GitHub Secrets의 환경 변수 값 확인
2. Firebase Console에서 정확한 값 재확인
3. 대소문자 및 특수문자 정확성 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. GitHub Actions 로그
2. Firebase Console 로그
3. 브라우저 개발자 도구 콘솔

---

**팀 연락처**: CoCoAi 개발팀
**문서 버전**: v1.0
**최종 업데이트**: 2024년 10월 24일
