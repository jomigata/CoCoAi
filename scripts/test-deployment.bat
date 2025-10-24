@echo off
chcp 65001 > nul
echo.
echo ========================================
echo 🧪 CoCoAi 자동 배포 테스트 스크립트
echo ========================================
echo.

:: 색상 설정
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "RESET=[0m"

:: 현재 시간 가져오기
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%"

echo %BLUE%테스트 시작 시간: %timestamp%%RESET%
echo.

:: 프로젝트 디렉토리로 이동
cd /d "%~dp0\.."

echo %YELLOW%📋 1단계: GitHub Secrets 설정 확인%RESET%
echo.
echo 다음 링크에서 모든 시크릿이 설정되었는지 확인하세요:
echo %BLUE%🔗 https://github.com/wizcoco-ai/CoCoAi/settings/secrets/actions%RESET%
echo.
echo 필수 시크릿 목록:
echo   ✓ FIREBASE_TOKEN
echo   ✓ FIREBASE_PROJECT_ID
echo   ✓ VITE_FIREBASE_API_KEY
echo   ✓ VITE_FIREBASE_AUTH_DOMAIN
echo   ✓ VITE_FIREBASE_STORAGE_BUCKET
echo   ✓ VITE_FIREBASE_MESSAGING_SENDER_ID
echo   ✓ VITE_FIREBASE_APP_ID
echo   ✓ VITE_FIREBASE_MEASUREMENT_ID
echo.
pause

echo %YELLOW%📋 2단계: 로컬 빌드 테스트%RESET%
echo.
echo 프론트엔드 빌드 테스트 중...
call npm run build
if %errorlevel% neq 0 (
    echo %RED%❌ 프론트엔드 빌드 실패%RESET%
    pause
    exit /b 1
)
echo %GREEN%✅ 프론트엔드 빌드 성공%RESET%
echo.

echo Functions 빌드 테스트 중...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo %RED%❌ Functions 빌드 실패%RESET%
    pause
    exit /b 1
)
echo %GREEN%✅ Functions 빌드 성공%RESET%
cd ..
echo.

echo %YELLOW%📋 3단계: 테스트 커밋 생성%RESET%
echo.
echo 테스트용 더미 파일 생성 중...
echo # 자동 배포 테스트 - %timestamp% > test-deployment.md
git add test-deployment.md

echo 테스트 커밋 생성 중...
git commit -m "test: GitHub Actions 자동 배포 테스트 - %timestamp%

🧪 테스트 목적:
- GitHub Secrets 설정 검증
- Firebase 자동 배포 확인
- 워크플로우 정상 작동 테스트

📋 설정된 시크릿:
- FIREBASE_TOKEN: ✓
- FIREBASE_PROJECT_ID: ✓
- VITE_FIREBASE_* 환경변수: ✓

🔗 배포 상태 확인: https://github.com/wizcoco-ai/CoCoAi/actions"

if %errorlevel% neq 0 (
    echo %RED%❌ 커밋 생성 실패 (변경사항이 없을 수 있습니다)%RESET%
) else (
    echo %GREEN%✅ 테스트 커밋 생성 완료%RESET%
)
echo.

echo %YELLOW%📋 4단계: GitHub로 푸시%RESET%
echo.
git push origin main
if %errorlevel% neq 0 (
    echo %RED%❌ 푸시 실패%RESET%
    pause
    exit /b 1
)
echo %GREEN%✅ GitHub 푸시 완료!%RESET%
echo.

echo %YELLOW%📋 5단계: 배포 상태 모니터링%RESET%
echo.
echo %BLUE%🔄 GitHub Actions 워크플로우가 시작되었습니다!%RESET%
echo.
echo %YELLOW%📊 실시간 배포 상태 확인:%RESET%
echo %BLUE%   🔗 GitHub Actions: https://github.com/wizcoco-ai/CoCoAi/actions%RESET%
echo %BLUE%   🔗 Firebase Console: https://console.firebase.google.com/project/cocoai-60a2d%RESET%
echo.
echo %YELLOW%⏱️ 예상 배포 시간: 3-5분%RESET%
echo.
echo %GREEN%배포 완료 후 다음 링크에서 확인하세요:%RESET%
echo %BLUE%   🌐 웹사이트: https://cocoai-60a2d.web.app%RESET%
echo %BLUE%   🌐 대체 URL: https://cocoai-60a2d.firebaseapp.com%RESET%
echo.

:: 테스트 파일 정리
echo %YELLOW%📋 6단계: 테스트 파일 정리%RESET%
timeout /t 5 /nobreak > nul
if exist test-deployment.md (
    del test-deployment.md
    git add test-deployment.md
    git commit -m "cleanup: Remove test deployment file"
    git push origin main
    echo %GREEN%✅ 테스트 파일 정리 완료%RESET%
)

echo.
echo %GREEN%🎉 자동 배포 테스트 완료!%RESET%
echo.
echo %YELLOW%📋 다음 단계:%RESET%
echo   1. GitHub Actions에서 배포 상태 확인
echo   2. 배포 완료 후 웹사이트 접속 테스트
echo   3. Firebase Console에서 서비스 상태 확인
echo.
pause
