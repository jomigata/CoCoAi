@echo off
chcp 65001 > nul
echo.
echo ========================================
echo 🚀 CoCoAi GitHub 자동 배포 스크립트
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

echo %BLUE%시작 시간: %timestamp%%RESET%
echo.

:: 프로젝트 디렉토리로 이동
cd /d "%~dp0\.."

:: Git 상태 확인
echo %YELLOW%📋 Git 상태 확인 중...%RESET%
git status --porcelain > nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Git 저장소가 아닙니다.%RESET%
    pause
    exit /b 1
)

:: 변경사항 확인
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set changes=%%i
if %changes% equ 0 (
    echo %YELLOW%ℹ️ 커밋할 변경사항이 없습니다.%RESET%
    echo %BLUE%현재 브랜치를 푸시합니다...%RESET%
    git push origin main
    if %errorlevel% equ 0 (
        echo %GREEN%✅ 푸시 완료! GitHub Actions가 자동 배포를 시작합니다.%RESET%
    ) else (
        echo %RED%❌ 푸시 실패%RESET%
    )
    goto :end
)

echo %YELLOW%📝 변경된 파일 목록:%RESET%
git status --short

:: 커밋 메시지 입력
echo.
set /p commit_msg="💬 커밋 메시지를 입력하세요 (기본: Auto-deploy %timestamp%): "
if "%commit_msg%"=="" set commit_msg=Auto-deploy %timestamp%

:: 모든 변경사항 스테이징
echo %YELLOW%📦 변경사항 스테이징 중...%RESET%
git add .
if %errorlevel% neq 0 (
    echo %RED%❌ 스테이징 실패%RESET%
    pause
    exit /b 1
)

:: 커밋 실행
echo %YELLOW%💾 커밋 생성 중...%RESET%
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo %RED%❌ 커밋 실패%RESET%
    pause
    exit /b 1
)

:: 원격 저장소로 푸시
echo %YELLOW%🚀 GitHub로 푸시 중...%RESET%
git push origin main
if %errorlevel% neq 0 (
    echo %RED%❌ 푸시 실패%RESET%
    pause
    exit /b 1
)

echo.
echo %GREEN%✅ GitHub 푸시 완료!%RESET%
echo %BLUE%🔄 GitHub Actions가 자동 배포를 시작합니다...%RESET%
echo.
echo %YELLOW%📊 배포 상태 확인:%RESET%
echo %BLUE%   - GitHub Actions: https://github.com/jomigata/CoCoAi/actions%RESET%
echo %BLUE%   - Firebase Console: https://console.firebase.google.com%RESET%
echo.

:end
echo %GREEN%🎉 작업 완료!%RESET%
echo.
pause
