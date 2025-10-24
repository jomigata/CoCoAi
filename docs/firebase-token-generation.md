# 🔥 Firebase CI 토큰 생성 가이드

## 📋 개요

GitHub Actions에서 Firebase 배포를 위해서는 CI 토큰이 필요합니다. 이 가이드는 토큰 생성 방법을 단계별로 안내합니다.

## 🚀 방법 1: Firebase CLI 사용 (권장)

### 1단계: Firebase CLI 설치 확인
```bash
firebase --version
```

### 2단계: Firebase 로그인
```bash
firebase login
```

### 3단계: CI 토큰 생성
```bash
firebase login:ci
```

**⚠️ 중요**: 이 명령어는 대화형 모드에서만 작동합니다. 터미널에서 직접 실행해야 합니다.

### 4단계: 토큰 복사
생성된 토큰을 안전한 곳에 복사해 두세요.

## 🔐 방법 2: 서비스 계정 키 사용

### 1단계: Firebase Console 접속
**🔗 [Firebase Console - 서비스 계정](https://console.firebase.google.com/project/cocoai-60a2d/settings/serviceaccounts/adminsdk)**

### 2단계: 새 비공개 키 생성
1. "새 비공개 키 생성" 클릭
2. JSON 파일 다운로드
3. 파일을 안전한 곳에 저장

### 3단계: JSON을 Base64로 인코딩
```bash
# Linux/macOS
base64 -i path/to/service-account-key.json

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\service-account-key.json"))
```

### 4단계: GitHub Secrets에 추가
- Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Secret: Base64로 인코딩된 JSON 내용

## 🔧 방법 3: GitHub Actions에서 직접 인증

### workflow 파일에 추가:
```yaml
- name: Authenticate to Firebase
  uses: google-github-actions/auth@v1
  with:
    credentials_json: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}

- name: Set up Cloud SDK
  uses: google-github-actions/setup-gcloud@v1

- name: Deploy to Firebase
  run: firebase deploy --token "$(gcloud auth print-access-token)"
```

## ✅ 토큰 검증

### 로컬에서 테스트
```bash
firebase deploy --token YOUR_TOKEN_HERE --only hosting
```

### 성공 시 출력 예시
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/cocoai-60a2d/overview
Hosting URL: https://cocoai-60a2d.web.app
```

## 🛡️ 보안 주의사항

1. **토큰 노출 금지**: 토큰을 코드나 로그에 노출하지 마세요
2. **정기적 갱신**: 보안을 위해 주기적으로 토큰을 갱신하세요
3. **최소 권한**: 필요한 최소 권한만 부여하세요
4. **안전한 저장**: 토큰을 안전한 곳에 저장하세요

## 🆘 문제 해결

### "Authentication Error" 발생 시
```bash
# 1. 로그아웃 후 재로그인
firebase logout
firebase login

# 2. 프로젝트 재설정
firebase use cocoai-60a2d

# 3. 토큰 재생성
firebase login:ci
```

### "Permission Denied" 발생 시
1. Firebase Console에서 IAM 권한 확인
2. 계정에 "Firebase Admin" 역할 부여
3. 프로젝트 소유자 권한 확인

### 토큰이 작동하지 않을 때
1. 토큰 만료 여부 확인
2. 프로젝트 ID 정확성 확인
3. Firebase CLI 버전 업데이트

---

**📞 지원**: CoCoAi 개발팀
**문서 버전**: v1.0
**최종 업데이트**: 2024년 10월 24일
