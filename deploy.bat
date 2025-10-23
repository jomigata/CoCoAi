@echo off
REM CoCoAi 수동 배포 스크립트 (Windows)
REM 사용법: deploy.bat

echo 🚀 CoCoAi 수동 배포 시작...

REM 프로젝트 디렉토리로 이동
cd /d "%~dp0"

REM 빌드 실행
echo 📦 애플리케이션 빌드 중...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ 빌드 실패
    pause
    exit /b 1
)

echo ✅ 빌드 완료

REM Firebase CLI 설치 확인
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 Firebase CLI 설치 중...
    call npm install -g firebase-tools
)

REM Firebase 프로젝트 설정 확인
echo 🔧 Firebase 프로젝트 설정 확인 중...
call firebase use cocoai-60a2d

if %errorlevel% neq 0 (
    echo ❌ Firebase 프로젝트 설정 실패
    echo 💡 해결 방법:
    echo    1. firebase login 실행
    echo    2. firebase use cocoai-60a2d 실행
    pause
    exit /b 1
)

REM Firebase 배포 실행
echo 🚀 Firebase Hosting 배포 중...
call firebase deploy --only hosting --project cocoai-60a2d

if %errorlevel% equ 0 (
    echo ✅ 배포 성공!
    echo 🌐 웹사이트: https://cocoai-60a2d.web.app
) else (
    echo ❌ 배포 실패
    pause
    exit /b 1
)

pause
