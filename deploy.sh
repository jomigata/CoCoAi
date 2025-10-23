#!/bin/bash

# CoCoAi 수동 배포 스크립트
# 사용법: ./deploy.sh

echo "🚀 CoCoAi 수동 배포 시작..."

# 프로젝트 디렉토리로 이동
cd "$(dirname "$0")"

# 빌드 실행
echo "📦 애플리케이션 빌드 중..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패"
    exit 1
fi

echo "✅ 빌드 완료"

# Firebase CLI 설치 확인
if ! command -v firebase &> /dev/null; then
    echo "📥 Firebase CLI 설치 중..."
    npm install -g firebase-tools
fi

# Firebase 프로젝트 설정 확인
echo "🔧 Firebase 프로젝트 설정 확인 중..."
firebase use cocoai-60a2d

if [ $? -ne 0 ]; then
    echo "❌ Firebase 프로젝트 설정 실패"
    echo "💡 해결 방법:"
    echo "   1. firebase login 실행"
    echo "   2. firebase use cocoai-60a2d 실행"
    exit 1
fi

# Firebase 배포 실행
echo "🚀 Firebase Hosting 배포 중..."
firebase deploy --only hosting --project cocoai-60a2d

if [ $? -eq 0 ]; then
    echo "✅ 배포 성공!"
    echo "🌐 웹사이트: https://cocoai-60a2d.web.app"
else
    echo "❌ 배포 실패"
    exit 1
fi
