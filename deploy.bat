@echo off
REM CoCoAi 수동 배포 스크립트 (Windows) - 개선된 버전
REM 사용법: deploy.bat

echo.
echo ========================================
echo 🚀 CoCoAi 수동 배포 시작...
echo ========================================
echo.

REM 프로젝트 디렉토리로 이동
cd /d "%~dp0"

REM Node.js 및 npm 버전 확인
echo 📋 환경 정보 확인 중...
node --version
npm --version
echo.

REM 의존성 설치
echo 📦 의존성 설치 중...
call npm ci

if %errorlevel% neq 0 (
    echo ❌ 의존성 설치 실패
    pause
    exit /b 1
)

REM 빌드 실행
echo 📦 애플리케이션 빌드 중...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ 빌드 실패
    pause
    exit /b 1
)

echo ✅ 빌드 완료
echo.

REM Firebase CLI 설치 확인
echo 🔧 Firebase CLI 확인 중...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 Firebase CLI 설치 중...
    call npm install -g firebase-tools@latest
    if %errorlevel% neq 0 (
        echo ❌ Firebase CLI 설치 실패
        pause
        exit /b 1
    )
)

firebase --version
echo.

REM Firebase 로그인 상태 확인
echo 🔐 Firebase 로그인 상태 확인 중...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase 로그인이 필요합니다.
    echo 💡 다음 명령어를 실행해주세요:
    echo    firebase login
    echo.
    pause
    exit /b 1
)

REM Firebase 프로젝트 설정
echo 🔧 Firebase 프로젝트 설정 중...
call firebase use cocoai-60a2d

if %errorlevel% neq 0 (
    echo ❌ Firebase 프로젝트 설정 실패
    echo 💡 해결 방법:
    echo    1. firebase login 실행
    echo    2. firebase use cocoai-60a2d 실행
    echo.
    pause
    exit /b 1
)

echo ✅ Firebase 프로젝트 설정 완료
echo.

REM Firebase 배포 실행
echo 🚀 Firebase Hosting 배포 중...
call firebase deploy --only hosting --project cocoai-60a2d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ 배포 성공!
    echo 🌐 웹사이트: https://cocoai-60a2d.web.app
    echo 🔗 Firebase Console: https://console.firebase.google.com/project/cocoai-60a2d/hosting
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ❌ 배포 실패
    echo 💡 문제 해결 방법:
    echo    1. Firebase 로그인 상태 확인: firebase login
    echo    2. 프로젝트 권한 확인: firebase projects:list
    echo    3. 프로젝트 설정 확인: firebase use cocoai-60a2d
    echo ========================================
    pause
    exit /b 1
)

echo.
pause
