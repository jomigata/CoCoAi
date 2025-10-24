#!/bin/bash

# CoCoAi 자동 배포 테스트 스크립트 (Linux/macOS)
# 사용법: ./scripts/test-deployment.sh

# 색상 설정
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 현재 시간
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

echo ""
echo "========================================"
echo "🧪 CoCoAi 자동 배포 테스트 스크립트"
echo "========================================"
echo ""
echo -e "${BLUE}테스트 시작 시간: $timestamp${NC}"
echo ""

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📋 1단계: GitHub Secrets 설정 확인${NC}"
echo ""
echo "다음 링크에서 모든 시크릿이 설정되었는지 확인하세요:"
echo -e "${BLUE}🔗 https://github.com/wizcoco-ai/CoCoAi/settings/secrets/actions${NC}"
echo ""
echo "필수 시크릿 목록:"
echo "  ✓ FIREBASE_TOKEN"
echo "  ✓ FIREBASE_PROJECT_ID"
echo "  ✓ VITE_FIREBASE_API_KEY"
echo "  ✓ VITE_FIREBASE_AUTH_DOMAIN"
echo "  ✓ VITE_FIREBASE_STORAGE_BUCKET"
echo "  ✓ VITE_FIREBASE_MESSAGING_SENDER_ID"
echo "  ✓ VITE_FIREBASE_APP_ID"
echo "  ✓ VITE_FIREBASE_MEASUREMENT_ID"
echo ""
read -p "모든 시크릿이 설정되었으면 Enter를 누르세요..."

echo -e "${YELLOW}📋 2단계: 로컬 빌드 테스트${NC}"
echo ""
echo "프론트엔드 빌드 테스트 중..."
if ! npm run build; then
    echo -e "${RED}❌ 프론트엔드 빌드 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 프론트엔드 빌드 성공${NC}"
echo ""

echo "Functions 빌드 테스트 중..."
cd functions
if ! npm run build; then
    echo -e "${RED}❌ Functions 빌드 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Functions 빌드 성공${NC}"
cd ..
echo ""

echo -e "${YELLOW}📋 3단계: 테스트 커밋 생성${NC}"
echo ""
echo "테스트용 더미 파일 생성 중..."
echo "# 자동 배포 테스트 - $timestamp" > test-deployment.md
git add test-deployment.md

echo "테스트 커밋 생성 중..."
if git commit -m "test: GitHub Actions 자동 배포 테스트 - $timestamp

🧪 테스트 목적:
- GitHub Secrets 설정 검증
- Firebase 자동 배포 확인
- 워크플로우 정상 작동 테스트

📋 설정된 시크릿:
- FIREBASE_TOKEN: ✓
- FIREBASE_PROJECT_ID: ✓
- VITE_FIREBASE_* 환경변수: ✓

🔗 배포 상태 확인: https://github.com/wizcoco-ai/CoCoAi/actions"; then
    echo -e "${GREEN}✅ 테스트 커밋 생성 완료${NC}"
else
    echo -e "${RED}❌ 커밋 생성 실패 (변경사항이 없을 수 있습니다)${NC}"
fi
echo ""

echo -e "${YELLOW}📋 4단계: GitHub로 푸시${NC}"
echo ""
if ! git push origin main; then
    echo -e "${RED}❌ 푸시 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✅ GitHub 푸시 완료!${NC}"
echo ""

echo -e "${YELLOW}📋 5단계: 배포 상태 모니터링${NC}"
echo ""
echo -e "${BLUE}🔄 GitHub Actions 워크플로우가 시작되었습니다!${NC}"
echo ""
echo -e "${YELLOW}📊 실시간 배포 상태 확인:${NC}"
echo -e "${BLUE}   🔗 GitHub Actions: https://github.com/wizcoco-ai/CoCoAi/actions${NC}"
echo -e "${BLUE}   🔗 Firebase Console: https://console.firebase.google.com/project/cocoai-60a2d${NC}"
echo ""
echo -e "${YELLOW}⏱️ 예상 배포 시간: 3-5분${NC}"
echo ""
echo -e "${GREEN}배포 완료 후 다음 링크에서 확인하세요:${NC}"
echo -e "${BLUE}   🌐 웹사이트: https://cocoai-60a2d.web.app${NC}"
echo -e "${BLUE}   🌐 대체 URL: https://cocoai-60a2d.firebaseapp.com${NC}"
echo ""

# 테스트 파일 정리
echo -e "${YELLOW}📋 6단계: 테스트 파일 정리${NC}"
sleep 5
if [ -f test-deployment.md ]; then
    rm test-deployment.md
    git add test-deployment.md
    git commit -m "cleanup: Remove test deployment file"
    git push origin main
    echo -e "${GREEN}✅ 테스트 파일 정리 완료${NC}"
fi

echo ""
echo -e "${GREEN}🎉 자동 배포 테스트 완료!${NC}"
echo ""
echo -e "${YELLOW}📋 다음 단계:${NC}"
echo "  1. GitHub Actions에서 배포 상태 확인"
echo "  2. 배포 완료 후 웹사이트 접속 테스트"
echo "  3. Firebase Console에서 서비스 상태 확인"
echo ""
