# 🔐 GitHub Secrets 설정 체크리스트

## ✅ 설정 완료 확인

### 필수 시크릿 (8개)

- [ ] `FIREBASE_TOKEN` - Firebase CI 토큰
- [ ] `FIREBASE_PROJECT_ID` - cocoai-60a2d
- [ ] `VITE_FIREBASE_API_KEY` - AIzaSyAIq3ePshbPFsUDwEEmtWrM14icGOmrmQQ
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` - cocoai-60a2d.firebaseapp.com
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` - cocoai-60a2d.firebasestorage.app
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` - 589508812163
- [ ] `VITE_FIREBASE_APP_ID` - 1:589508812163:web:36a28d29be8c3777fa6ab6
- [ ] `VITE_FIREBASE_MEASUREMENT_ID` - G-DDNRP7SK9S

## 🔗 빠른 링크

- **GitHub Secrets 설정**: https://github.com/wizcoco-ai/CoCoAi/settings/secrets/actions
- **Firebase Console**: https://console.firebase.google.com/project/cocoai-60a2d
- **GitHub Actions**: https://github.com/wizcoco-ai/CoCoAi/actions

## 🚀 설정 후 테스트

1. 모든 시크릿 설정 완료
2. GitHub에 더미 커밋 푸시
3. Actions 탭에서 배포 상태 확인
4. 성공 시 웹사이트 접속 확인

## ❗ 주의사항

- FIREBASE_TOKEN은 반드시 로컬에서 `firebase login:ci` 명령어로 생성
- 모든 값은 정확히 복사하여 입력 (공백 주의)
- 설정 후 즉시 테스트 배포 실행 권장

## 🆘 문제 해결

### Firebase 토큰 생성 실패 시
```bash
# 1. Firebase 재로그인
firebase logout
firebase login

# 2. CI 토큰 생성
firebase login:ci
```

### 배포 실패 시 확인사항
1. 모든 시크릿이 정확히 설정되었는지 확인
2. Firebase 프로젝트 권한 확인
3. GitHub Actions 로그 확인

---

**📞 지원**: CoCoAi 개발팀
**문서 버전**: v1.0
**최종 업데이트**: 2024년 10월 24일
