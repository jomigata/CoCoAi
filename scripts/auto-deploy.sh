#!/bin/bash

# CoCoAi GitHub 자동 배포 스크립트 (Linux/macOS)
# 사용법: ./scripts/auto-deploy.sh

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
echo "🚀 CoCoAi GitHub 자동 배포 스크립트"
echo "========================================"
echo ""
echo -e "${BLUE}시작 시간: $timestamp${NC}"
echo ""

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."

# Git 상태 확인
echo -e "${YELLOW}📋 Git 상태 확인 중...${NC}"
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Git 저장소가 아닙니다.${NC}"
    exit 1
fi

# 변경사항 확인
changes=$(git status --porcelain | wc -l)
if [ $changes -eq 0 ]; then
    echo -e "${YELLOW}ℹ️ 커밋할 변경사항이 없습니다.${NC}"
    echo -e "${BLUE}현재 브랜치를 푸시합니다...${NC}"
    if git push origin main; then
        echo -e "${GREEN}✅ 푸시 완료! GitHub Actions가 자동 배포를 시작합니다.${NC}"
    else
        echo -e "${RED}❌ 푸시 실패${NC}"
        exit 1
    fi
    exit 0
fi

echo -e "${YELLOW}📝 변경된 파일 목록:${NC}"
git status --short

# 커밋 메시지 입력
echo ""
read -p "💬 커밋 메시지를 입력하세요 (기본: Auto-deploy $timestamp): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Auto-deploy $timestamp"
fi

# 모든 변경사항 스테이징
echo -e "${YELLOW}📦 변경사항 스테이징 중...${NC}"
if ! git add .; then
    echo -e "${RED}❌ 스테이징 실패${NC}"
    exit 1
fi

# 커밋 실행
echo -e "${YELLOW}💾 커밋 생성 중...${NC}"
if ! git commit -m "$commit_msg"; then
    echo -e "${RED}❌ 커밋 실패${NC}"
    exit 1
fi

# 원격 저장소로 푸시
echo -e "${YELLOW}🚀 GitHub로 푸시 중...${NC}"
if ! git push origin main; then
    echo -e "${RED}❌ 푸시 실패${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ GitHub 푸시 완료!${NC}"
echo -e "${BLUE}🔄 GitHub Actions가 자동 배포를 시작합니다...${NC}"
echo ""
echo -e "${YELLOW}📊 배포 상태 확인:${NC}"
echo -e "${BLUE}   - GitHub Actions: https://github.com/jomigata/CoCoAi/actions${NC}"
echo -e "${BLUE}   - Firebase Console: https://console.firebase.google.com${NC}"
echo ""
echo -e "${GREEN}🎉 작업 완료!${NC}"
echo ""
