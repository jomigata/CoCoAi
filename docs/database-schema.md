# WizCoCo - CoCo Ai 데이터베이스 스키마 설계

## 🗄️ Firebase Firestore 컬렉션 구조

### 1. 사용자 관리 (Users Collection)

```typescript
// users/{userId}
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'client' | 'counselor' | 'admin';
  emailVerified: boolean;
  
  // 개인 프로파일링 정보
  personalProfile?: {
    ageGroup: '10s' | '20s' | '30s' | '40s' | '50s' | '60s+';
    completedAt: Date;
    profileData: {
      selfEsteem: number;        // 자아존중감 점수
      stressCoping: string[];    // 스트레스 대처 방식
      relationshipPattern: string; // 대인관계 패턴
      coreValues: string[];      // 핵심 가치관
      strengths: string[];       // 대표 강점 5가지
    };
    mindMap: {
      personality: string;
      emotionalPattern: string;
      communicationStyle: string;
    };
  };
  
  // 설정
  settings: {
    dailyReminderTime?: string; // 데일리 기록 알림 시간
    notificationsEnabled: boolean;
    privacyLevel: 'public' | 'friends' | 'private';
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. 그룹 관리 (Groups Collection)

```typescript
// groups/{groupId}
interface Group {
  id: string;
  name: string;
  description?: string;
  type: 'family' | 'couple' | 'friends' | 'team' | 'custom';
  
  // 그룹 특성 (복수 선택 가능)
  characteristics: string[]; // ['communication', 'conflict-resolution', 'emotional-support', 'goal-setting']
  
  // 멤버 관리
  members: {
    [userId: string]: {
      role: 'owner' | 'admin' | 'member';
      joinedAt: Date;
      status: 'active' | 'inactive' | 'pending';
      nickname?: string; // 그룹 내 별명
    };
  };
  
  // 그룹 설정
  settings: {
    isPrivate: boolean;
    allowInvites: boolean;
    weeklyReportDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  };
  
  // 통계
  stats: {
    totalMembers: number;
    activeMembers: number;
    completedTests: number;
    weeklyReportsGenerated: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // userId
}
```

### 3. 그룹 초대 (Group Invitations Collection)

```typescript
// groupInvitations/{invitationId}
interface GroupInvitation {
  id: string;
  groupId: string;
  invitedBy: string; // userId
  invitedEmail: string;
  invitedUserId?: string; // 가입된 사용자인 경우
  
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string; // 초대 메시지
  
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
}
```

### 4. 데일리 마음 기록 (Daily Mood Records Collection)

```typescript
// dailyMoodRecords/{recordId}
interface DailyMoodRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD 형식
  
  // 감정 기록
  mood: {
    primary: 'happy' | 'sad' | 'angry' | 'anxious' | 'calm' | 'excited' | 'tired' | 'stressed';
    intensity: number; // 1-10 점수
    secondary?: string[]; // 부가 감정들
  };
  
  // 기록 방식별 데이터
  recordType: 'emoji' | 'tags' | 'text' | 'voice';
  content: {
    emoji?: string;
    tags?: string[];
    text?: string;
    voiceUrl?: string; // Firebase Storage URL
    voiceTranscript?: string; // 음성을 텍스트로 변환한 내용
  };
  
  // 추가 정보
  energy: number; // 1-10 에너지 레벨
  stress: number; // 1-10 스트레스 레벨
  sleep?: {
    hours: number;
    quality: number; // 1-10
  };
  
  // 꿈 기록 (선택사항)
  dream?: {
    content: string;
    aiAnalysis?: {
      symbols: string[];
      interpretation: string;
      psychologicalInsight: string;
    };
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. 심리검사 시스템 (Psychological Tests Collection)

```typescript
// psychologicalTests/{testId}
interface PsychologicalTest {
  id: string;
  title: string;
  description: string;
  category: 'personal-profiling' | 'group-analysis' | 'strength-discovery' | 'relationship' | 'communication';
  
  // 검사 대상
  targetType: 'individual' | 'group';
  targetGroups?: string[]; // 특정 그룹 타입에만 추천
  ageGroups: string[]; // 적합한 연령대
  
  // 검사 구조
  questions: {
    id: string;
    text: string;
    type: 'multiple-choice' | 'scale' | 'text' | 'ranking';
    options?: string[];
    scaleRange?: { min: number; max: number; labels: string[] };
    required: boolean;
  }[];
  
  // 채점 및 해석
  scoring: {
    dimensions: string[]; // 측정하는 심리적 차원들
    algorithm: 'simple-sum' | 'weighted' | 'complex'; // 채점 방식
    weights?: { [questionId: string]: number };
  };
  
  // 메타데이터
  estimatedTime: number; // 예상 소요 시간 (분)
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  version: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // 전문가 userId
}
```

### 6. 검사 결과 (Test Results Collection)

```typescript
// testResults/{resultId}
interface TestResult {
  id: string;
  testId: string;
  userId: string;
  groupId?: string; // 그룹 검사인 경우
  
  // 응답 데이터
  responses: {
    [questionId: string]: any; // 질문별 응답
  };
  
  // 채점 결과
  scores: {
    [dimension: string]: {
      rawScore: number;
      percentile: number;
      interpretation: string;
    };
  };
  
  // AI 분석 결과
  aiAnalysis: {
    summary: string;
    strengths: string[];
    growthAreas: string[];
    recommendations: string[];
    personalizedInsights: string;
    
    // AI 경고 메시지
    aiDisclaimer: string; // "이 결과는 AI 분석에 기반하며, 전문가 상담을 대체할 수 없습니다."
  };
  
  // 시각화 데이터
  visualization: {
    chartType: 'radar' | 'bar' | 'pie' | 'line';
    data: any;
    mindMapData?: any; // 마음 지도 데이터
  };
  
  completedAt: Date;
  isShared: boolean; // 그룹과 공유 여부
}
```

### 7. 위클리 리포트 (Weekly Reports Collection)

```typescript
// weeklyReports/{reportId}
interface WeeklyReport {
  id: string;
  groupId: string;
  weekStart: Date; // 주 시작일
  weekEnd: Date;   // 주 종료일
  
  // 그룹 전체 분석
  groupAnalysis: {
    overallMoodTemperature: number; // 1-10 우리의 마음 온도
    moodTrends: {
      [userId: string]: {
        averageMood: number;
        moodVariability: number;
        dominantEmotions: string[];
      };
    };
    
    // AI가 발견한 연결고리
    connections: {
      correlations: Array<{
        users: string[];
        pattern: string;
        strength: number;
        insight: string;
      }>;
      synchronizedMoods: Array<{
        date: string;
        users: string[];
        commonMood: string;
        possibleCause: string;
      }>;
    };
  };
  
  // 개인별 맞춤 분석
  personalAnalysis: {
    [userId: string]: {
      weekSummary: string;
      emotionalPattern: string;
      relationshipTips: string[];
      recommendedActions: Array<{
        action: string;
        priority: 'high' | 'medium' | 'low';
        category: 'self-care' | 'communication' | 'relationship';
      }>;
      
      // 개인 성장 리포트 요소
      monthlyPattern?: string; // 월간 패턴 (월말인 경우)
      strengthsUsed: string[];
      growthOpportunities: string[];
    };
  };
  
  // 그룹 미션 및 챌린지
  weeklyMissions: Array<{
    title: string;
    description: string;
    type: 'individual' | 'group';
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: number; // 분
    category: 'communication' | 'appreciation' | 'fun' | 'growth';
  }>;
  
  // AI 경고 메시지
  aiDisclaimer: string;
  
  generatedAt: Date;
  isRead: { [userId: string]: boolean };
}
```

### 8. AI 챗봇 대화 (Chat Sessions Collection)

```typescript
// chatSessions/{sessionId}
interface ChatSession {
  id: string;
  userId: string;
  title: string; // 대화 제목 (자동 생성)
  
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    
    // 메시지 메타데이터
    metadata?: {
      intent?: string; // 사용자 의도 분류
      emotion?: string; // 감지된 감정
      supportType?: 'emotional' | 'informational' | 'guidance';
    };
  }>;
  
  // 세션 컨텍스트
  context: {
    currentMood?: string;
    recentTestResults?: string[]; // 최근 검사 결과 ID들
    groupContext?: string; // 그룹 관련 대화인 경우
    conversationGoal?: string; // 대화 목적
  };
  
  status: 'active' | 'completed' | 'archived';
  lastMessageAt: Date;
  createdAt: Date;
}
```

### 9. 그룹 미션 및 챌린지 (Group Missions Collection)

```typescript
// groupMissions/{missionId}
interface GroupMission {
  id: string;
  groupId: string;
  weeklyReportId?: string; // 위클리 리포트에서 생성된 경우
  
  title: string;
  description: string;
  instructions: string[];
  
  type: 'individual' | 'group' | 'pair';
  category: 'communication' | 'appreciation' | 'fun' | 'growth' | 'conflict-resolution';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // 분
  
  // 미션 진행
  participants: {
    [userId: string]: {
      status: 'not-started' | 'in-progress' | 'completed';
      startedAt?: Date;
      completedAt?: Date;
      reflection?: string; // 미션 후 소감
      rating?: number; // 1-5 만족도
    };
  };
  
  // 보상 시스템
  rewards: {
    badge?: string; // 획득 가능한 뱃지
    points: number; // 포인트
    unlockContent?: string; // 해금되는 콘텐츠
  };
  
  // 미션 설정
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  
  createdAt: Date;
}
```

### 10. 사용자 뱃지 및 성취 (User Achievements Collection)

```typescript
// userAchievements/{userId}
interface UserAchievements {
  userId: string;
  
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'consistency' | 'growth' | 'social' | 'milestone';
    earnedAt: Date;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
  
  stats: {
    totalPoints: number;
    dailyRecordStreak: number; // 연속 기록 일수
    maxStreak: number;
    completedTests: number;
    completedMissions: number;
    helpedOthers: number; // 다른 사람을 도운 횟수
  };
  
  level: {
    current: number;
    experience: number;
    nextLevelExp: number;
    title: string; // 레벨에 따른 칭호
  };
  
  updatedAt: Date;
}
```

### 11. 콘텐츠 추천 (Content Recommendations Collection)

```typescript
// contentRecommendations/{recommendationId}
interface ContentRecommendation {
  id: string;
  userId: string;
  groupId?: string;
  
  content: {
    type: 'article' | 'video' | 'book' | 'exercise' | 'meditation';
    title: string;
    description: string;
    url?: string;
    thumbnailUrl?: string;
    duration?: number; // 분
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  
  // 추천 근거
  recommendationReason: {
    basedOn: 'test-result' | 'mood-pattern' | 'group-analysis' | 'personal-goal';
    sourceId: string; // 근거가 된 데이터의 ID
    relevanceScore: number; // 0-1 관련성 점수
    explanation: string;
  };
  
  // 사용자 반응
  userFeedback?: {
    rating: number; // 1-5
    isHelpful: boolean;
    comment?: string;
    completedAt?: Date;
  };
  
  status: 'pending' | 'viewed' | 'completed' | 'dismissed';
  createdAt: Date;
  expiresAt?: Date;
}
```

## 🔐 Firebase Security Rules 확장

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서 - 기존 규칙 유지
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        (resource.data.role == 'counselor' || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'counselor');
    }

    // 그룹 관리
    match /groups/{groupId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members.keys();
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.createdBy;
    }

    // 그룹 초대
    match /groupInvitations/{invitationId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.invitedBy || 
         request.auth.email == resource.data.invitedEmail);
    }

    // 데일리 마음 기록
    match /dailyMoodRecords/{recordId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      // 그룹 멤버들이 위클리 리포트 생성을 위해 읽기 가능
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/groups/$(groupId)) &&
        request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members.keys();
    }

    // 심리검사 결과
    match /testResults/{resultId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      // 그룹 검사 결과는 그룹 멤버들이 읽기 가능
      allow read: if request.auth != null && 
        resource.data.groupId != null &&
        request.auth.uid in get(/databases/$(database)/documents/groups/$(resource.data.groupId)).data.members.keys();
    }

    // 위클리 리포트
    match /weeklyReports/{reportId} {
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/groups/$(resource.data.groupId)).data.members.keys();
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // AI 챗봇 세션
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }

    // 그룹 미션
    match /groupMissions/{missionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/groups/$(resource.data.groupId)).data.members.keys();
    }

    // 사용자 성취
    match /userAchievements/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }

    // 콘텐츠 추천
    match /contentRecommendations/{recommendationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }

    // 심리검사 템플릿 (읽기 전용)
    match /psychologicalTests/{testId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['counselor', 'admin'];
    }
  }
}
```

## 📊 인덱스 최적화

```json
{
  "indexes": [
    {
      "collectionGroup": "dailyMoodRecords",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "testResults",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "completedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "weeklyReports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "groupId", "order": "ASCENDING" },
        { "fieldPath": "weekStart", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "chatSessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "lastMessageAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

이 스키마는 WizCoCo - CoCo Ai 플랫폼의 모든 핵심 기능을 지원하며, 확장성과 보안을 고려하여 설계되었습니다.
