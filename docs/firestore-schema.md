# 🗄️ WizCoCo - CoCo Ai Firestore 데이터베이스 스키마

## 📋 컬렉션 구조 개요

```
/users/{userId}
/groups/{groupId}
  /members/{memberId}
/profiling_results/{userId}
/mood_records/{userId}
  /records/{recordId}
/group_reports/{groupId}
  /reports/{reportId}
/chat_sessions/{sessionId}
  /messages/{messageId}
/invitations/{invitationId}
/mood_analytics/{userId}
  /monthly_reports/{reportId}
```

## 📊 상세 스키마 정의

### 1. users 컬렉션
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'client' | 'counselor';
  emailVerified: boolean;
  
  // 프로파일 정보
  profile?: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    occupation?: string;
    interests?: string[];
  };
  
  // 설정
  settings?: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: 'ko' | 'en';
    privacy: {
      shareDataWithGroup: boolean;
      allowAnalytics: boolean;
    };
  };
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

### 2. groups 컬렉션
```typescript
interface Group {
  id: string;
  name: string;
  description?: string;
  type: 'family' | 'couple' | 'friends' | 'team' | 'therapy' | 'other';
  
  // 그룹 특성 (복수 선택 가능)
  characteristics: Array<
    'communication_improvement' | 'conflict_resolution' | 
    'emotional_support' | 'goal_sharing' | 'trust_building' |
    'stress_management' | 'relationship_growth' | 'family_harmony'
  >;
  
  // 멤버 관리
  createdBy: string; // 그룹장 UID
  memberCount: number;
  maxMembers: number;
  
  // 설정
  settings: {
    isPrivate: boolean;
    allowInvitations: boolean;
    weeklyReportDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    autoGenerateReports: boolean;
  };
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivityAt?: Timestamp;
}
```

### 3. groups/{groupId}/members 서브컬렉션
```typescript
interface GroupMember {
  userId: string;
  displayName: string;
  role: 'admin' | 'member';
  joinedAt: Timestamp;
  
  // 권한
  permissions: {
    canInvite: boolean;
    canViewReports: boolean;
    canEditGroup: boolean;
  };
  
  // 참여 상태
  status: 'active' | 'inactive' | 'left';
  lastSeenAt?: Timestamp;
}
```

### 4. profiling_results 컬렉션
```typescript
interface ProfilingResult {
  userId: string;
  
  // 원본 응답 데이터
  responses: {
    [questionId: string]: any;
  };
  
  // AI 분석 결과
  analysisResult: {
    selfEsteem: {
      score: number; // 1-5
      level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
      insights: string[];
    };
    
    stressCoping: {
      primaryStyle: 'problem_focused' | 'emotion_focused' | 'avoidance' | 'social_support';
      strengths: string[];
      improvementAreas: string[];
    };
    
    relationshipPattern: {
      attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
      communicationStyle: string;
      conflictResolution: string;
    };
    
    coreValues: string[];
    
    recommendations: Array<{
      category: string;
      action: string;
      priority: 'high' | 'medium' | 'low';
      timeframe: string;
    }>;
    
    // AI 편향성 경고
    aiWarning: {
      message: string;
      details: string[];
      timestamp: string;
    };
  };
  
  // 메타데이터
  version: string; // 프로파일링 버전
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5. mood_records/{userId}/records 서브컬렉션
```typescript
interface MoodRecord {
  id: string;
  userId: string;
  
  // 기본 감정 정보
  mood: {
    primary: 'happy' | 'calm' | 'excited' | 'sad' | 'angry' | 'anxious' | 'tired' | 'stressed';
    intensity: number; // 1-10
    secondary: string[]; // 부가 감정 태그들
  };
  
  // 기록 방식
  recordType: 'emoji' | 'text' | 'voice' | 'tags';
  
  // 내용
  content: {
    text?: string;
    voiceUrl?: string;
    tags?: string[];
    gratitude?: string[]; // 감사한 일들
  };
  
  // 추가 지표
  energy: number; // 1-10
  stress: number; // 1-10
  sleep?: {
    duration: number; // 시간
    quality: number; // 1-5
  };
  
  // 꿈 기록
  dream?: {
    content: string;
    emotions: string[];
    symbols: string[];
    aiInterpretation?: string;
  };
  
  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
  timezone: string;
}
```

### 6. group_reports/{groupId}/reports 서브컬렉션
```typescript
interface GroupReport {
  id: string;
  groupId: string;
  weekStartDate: string; // YYYY-MM-DD
  
  // 분석 결과
  reportResult: {
    // 그룹 전체 감정 온도
    groupMoodTemperature: {
      score: number; // 1-10
      trend: 'improving' | 'stable' | 'declining';
      description: string;
    };
    
    // 멤버별 패턴
    memberPatterns: Array<{
      userId: string;
      displayName: string;
      weeklyMood: {
        average: number;
        dominant: string;
        changes: string[];
      };
      insights: string[];
    }>;
    
    // 그룹 연결고리
    connectionInsights: {
      sharedMoods: string[];
      complementaryPatterns: string[];
      concernAreas: string[];
    };
    
    // 맞춤형 조언
    recommendations: Array<{
      targetMember: string;
      category: 'communication' | 'support' | 'activity' | 'mindfulness';
      advice: string;
      actionItems: string[];
    }>;
    
    // AI 편향성 경고
    aiWarning: {
      message: string;
      details: string[];
      timestamp: string;
    };
  };
  
  // 메타데이터
  memberCount: number;
  recordCount: number;
  generatedBy: 'auto' | 'manual';
  createdAt: Timestamp;
}
```

### 7. chat_sessions 컬렉션
```typescript
interface ChatSession {
  id: string;
  userId: string;
  
  // 세션 정보
  title?: string;
  type: 'general' | 'crisis' | 'guidance' | 'emotional_support';
  
  // 상태
  status: 'active' | 'ended' | 'paused';
  messageCount: number;
  
  // 메타데이터
  startedAt: Timestamp;
  lastMessageAt?: Timestamp;
  endedAt?: Timestamp;
}
```

### 8. chat_sessions/{sessionId}/messages 서브컬렉션
```typescript
interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  
  // 메시지 내용
  message: string;
  aiResponse?: string;
  
  // 메시지 타입
  type: 'user_message' | 'ai_response' | 'system_message';
  
  // 감정 분석 (선택적)
  sentiment?: {
    score: number; // -1 to 1
    emotions: string[];
    urgency: 'low' | 'medium' | 'high' | 'crisis';
  };
  
  // 메타데이터
  timestamp: Timestamp;
  edited?: boolean;
  editedAt?: Timestamp;
}
```

### 9. invitations 컬렉션
```typescript
interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  
  // 초대자 정보
  inviterUid: string;
  inviterName: string;
  
  // 피초대자 정보
  inviteeEmail: string;
  inviteeUid?: string; // 수락 후 설정
  
  // 초대 상태
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string; // 초대 토큰
  
  // 메타데이터
  createdAt: Timestamp;
  expiresAt: Timestamp;
  respondedAt?: Timestamp;
}
```

### 10. mood_analytics/{userId}/monthly_reports 서브컬렉션
```typescript
interface MoodAnalytics {
  id: string;
  userId: string;
  
  // 분석 기간
  startDate: string;
  endDate: string;
  recordCount: number;
  
  // 패턴 분석 결과
  patternResult: {
    // 시간별 패턴
    timePatterns: {
      weekdayVsWeekend: any;
      hourlyDistribution: any;
      monthlyTrends: any;
    };
    
    // 감정 패턴
    emotionPatterns: {
      dominantMoods: string[];
      moodStability: number;
      positiveRatio: number;
    };
    
    // 스트레스 분석
    stressAnalysis: {
      averageLevel: number;
      peakDays: string[];
      triggers: string[];
    };
    
    // 개선 제안
    improvements: Array<{
      area: string;
      suggestion: string;
      expectedImpact: 'high' | 'medium' | 'low';
    }>;
    
    // 다음 달 목표
    nextMonthGoals: string[];
    
    // AI 편향성 경고
    aiWarning: {
      message: string;
      details: string[];
      timestamp: string;
    };
  };
  
  createdAt: Timestamp;
}
```

## 🔐 보안 규칙 고려사항

### 주요 보안 원칙
1. **개인 데이터 보호**: 사용자는 자신의 데이터만 접근 가능
2. **그룹 데이터 제한**: 그룹 멤버만 해당 그룹 데이터 접근 가능
3. **민감 정보 암호화**: 프로파일링 결과, 감정 기록 등 암호화 저장
4. **AI 결과 경고**: 모든 AI 분석 결과에 편향성 경고 포함

### 접근 권한 매트릭스
- **users**: 본인만 읽기/쓰기
- **groups**: 멤버만 읽기, 관리자만 쓰기
- **profiling_results**: 본인만 읽기/쓰기
- **mood_records**: 본인만 읽기/쓰기, 그룹 멤버는 요약만 읽기
- **group_reports**: 그룹 멤버만 읽기
- **chat_sessions**: 본인만 읽기/쓰기
- **invitations**: 관련자만 읽기/쓰기

## 📈 성능 최적화

### 인덱스 설정
- `users`: `email`, `role`, `createdAt`
- `groups`: `type`, `createdBy`, `createdAt`
- `mood_records`: `userId`, `createdAt`, `mood.primary`
- `group_reports`: `groupId`, `weekStartDate`
- `chat_sessions`: `userId`, `startedAt`
- `invitations`: `inviteeEmail`, `status`, `expiresAt`

### 데이터 집계
- 실시간 집계를 위한 카운터 필드 활용
- 주간/월간 리포트는 배치 작업으로 생성
- 자주 조회되는 데이터는 캐싱 적용
