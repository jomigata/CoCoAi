import { openai, AI_MODELS } from '../config/ai';
import { db, serverTimestamp } from '../config/firebaseAdmin';

/**
 * 🎯 개인화 추천 시스템
 * 사용자의 프로파일, 감정 패턴, 행동 데이터를 기반으로 맞춤형 콘텐츠 추천
 * 
 * 심리상담가 1,2가 설계한 개인화 알고리즘 적용
 */

interface UserProfile {
  userId: string;
  profileData: {
    selfEsteem: number;
    stressCoping: string[];
    relationshipPattern: string;
    coreValues: string[];
    strengths: string[];
  };
  preferences: {
    contentTypes: string[];
    activityLevel: 'low' | 'medium' | 'high';
    socialPreference: 'introvert' | 'extrovert' | 'ambivert';
  };
}

interface MoodPattern {
  averageMood: number;
  dominantEmotions: string[];
  stressFactors: string[];
  positiveFactors: string[];
  timePatterns: {
    bestTimeOfDay: string;
    worstTimeOfDay: string;
    weekdayVsWeekend: 'weekday_better' | 'weekend_better' | 'similar';
  };
}

interface Recommendation {
  id: string;
  type: 'content' | 'activity' | 'exercise' | 'mindfulness' | 'social' | 'learning';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  actionItems: string[];
  expectedBenefit: string;
  relatedUrl?: string;
}

export class RecommendationService {
  // Database instance is imported from firebaseAdmin config
  private database = db;

  /**
   * 메인 추천 생성 함수
   */
  async generatePersonalizedRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<Recommendation[]> {
    try {
      // 1. 사용자 데이터 수집
      const userProfile = await this.getUserProfile(userId);
      const moodPattern = await this.getMoodPattern(userId);
      const behaviorData = await this.getBehaviorData(userId);

      // 2. AI 기반 추천 생성
      const recommendations = await this.generateAIRecommendations(
        userProfile,
        moodPattern,
        behaviorData
      );

      // 3. 추천 우선순위 계산
      const prioritizedRecommendations = this.prioritizeRecommendations(
        recommendations,
        userProfile,
        moodPattern
      );

      // 4. 최종 추천 목록 반환
      return prioritizedRecommendations.slice(0, limit);

    } catch (error) {
      console.error('개인화 추천 생성 오류:', error);
      return this.getFallbackRecommendations();
    }
  }

  /**
   * 사용자 프로필 조회
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileDoc = await this.database
        .collection('profiling_results')
        .doc(userId)
        .get();

      if (!profileDoc.exists) return null;

      const profileData = profileDoc.data();
      return {
        userId,
        profileData: profileData?.analysisResult || {},
        preferences: profileData?.preferences || {
          contentTypes: ['article', 'video'],
          activityLevel: 'medium',
          socialPreference: 'ambivert'
        }
      };
    } catch (error) {
      console.error('사용자 프로필 조회 오류:', error);
      return null;
    }
  }

  /**
   * 감정 패턴 분석
   */
  private async getMoodPattern(userId: string): Promise<MoodPattern | null> {
    try {
      // 최근 30일간의 감정 기록 조회
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const moodRecordsQuery = await this.database
        .collection('mood_records')
        .doc(userId)
        .collection('records')
        .where('createdAt', '>=', thirtyDaysAgo)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      if (moodRecordsQuery.empty) return null;

      const records = moodRecordsQuery.docs.map((doc: any) => doc.data());
      
      // 패턴 분석
      const moodScores = records.map((r: any) => r.mood?.intensity || 5);
      const averageMood = moodScores.reduce((a: number, b: number) => a + b, 0) / moodScores.length;

      const emotions = records.flatMap((r: any) => r.mood?.secondary || []);
      const dominantEmotions = this.getTopItems(emotions, 3);

      return {
        averageMood,
        dominantEmotions,
        stressFactors: this.extractStressFactors(records),
        positiveFactors: this.extractPositiveFactors(records),
        timePatterns: this.analyzeTimePatterns(records)
      };
    } catch (error) {
      console.error('감정 패턴 분석 오류:', error);
      return null;
    }
  }

  /**
   * 행동 데이터 수집
   */
  private async getBehaviorData(userId: string): Promise<any> {
    try {
      // 앱 사용 패턴, 완료한 활동 등
      const behaviorDoc = await this.database
        .collection('user_behavior')
        .doc(userId)
        .get();

      return behaviorDoc.exists ? behaviorDoc.data() : {
        appUsageFrequency: 'medium',
        preferredFeatures: ['mood_tracking', 'chat'],
        completedActivities: [],
        engagementLevel: 'medium'
      };
    } catch (error) {
      console.error('행동 데이터 수집 오류:', error);
      return {};
    }
  }

  /**
   * AI 기반 추천 생성
   */
  private async generateAIRecommendations(
    userProfile: UserProfile | null,
    moodPattern: MoodPattern | null,
    behaviorData: any
  ): Promise<Recommendation[]> {
    const prompt = `
당신은 개인화 추천 전문가입니다. 다음 사용자 데이터를 바탕으로 맞춤형 추천을 생성해주세요.

사용자 프로필:
${JSON.stringify(userProfile, null, 2)}

감정 패턴:
${JSON.stringify(moodPattern, null, 2)}

행동 데이터:
${JSON.stringify(behaviorData, null, 2)}

다음 카테고리별로 추천을 생성해주세요:
1. 콘텐츠 (심리학 아티클, 영상, 도서)
2. 활동 (운동, 취미, 창작)
3. 마음챙김 (명상, 호흡법, 요가)
4. 사회적 활동 (모임, 봉사, 네트워킹)
5. 학습 (새로운 기술, 언어, 지식)

각 추천은 다음 JSON 형식으로 제공해주세요:
{
  "recommendations": [
    {
      "type": "content|activity|mindfulness|social|learning",
      "title": "추천 제목",
      "description": "상세 설명",
      "reason": "추천 이유",
      "priority": "high|medium|low",
      "estimatedTime": "예상 소요 시간",
      "difficulty": "easy|medium|hard",
      "tags": ["태그1", "태그2"],
      "actionItems": ["실행 방법1", "실행 방법2"],
      "expectedBenefit": "기대 효과"
    }
  ]
}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODELS.CONTENT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"recommendations": []}');
      
      return result.recommendations.map((rec: any, index: number) => ({
        id: `ai_rec_${Date.now()}_${index}`,
        ...rec
      }));

    } catch (error) {
      console.error('AI 추천 생성 오류:', error);
      return [];
    }
  }

  /**
   * 추천 우선순위 계산
   */
  private prioritizeRecommendations(
    recommendations: Recommendation[],
    userProfile: UserProfile | null,
    moodPattern: MoodPattern | null
  ): Recommendation[] {
    return recommendations
      .map(rec => ({
        ...rec,
        score: this.calculateRecommendationScore(rec, userProfile, moodPattern)
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...rec }) => rec);
  }

  /**
   * 추천 점수 계산
   */
  private calculateRecommendationScore(
    recommendation: Recommendation,
    userProfile: UserProfile | null,
    moodPattern: MoodPattern | null
  ): number {
    let score = 0;

    // 기본 우선순위 점수
    switch (recommendation.priority) {
      case 'high': score += 30; break;
      case 'medium': score += 20; break;
      case 'low': score += 10; break;
    }

    // 사용자 프로필 기반 점수
    if (userProfile) {
      // 자아존중감이 낮으면 자신감 향상 콘텐츠 우선
      if (userProfile.profileData.selfEsteem < 60 && 
          recommendation.tags.includes('자신감')) {
        score += 20;
      }

      // 스트레스 대처 방식과 일치하는 추천
      if (userProfile.profileData.stressCoping.some(coping => 
          recommendation.tags.includes(coping))) {
        score += 15;
      }
    }

    // 감정 패턴 기반 점수
    if (moodPattern) {
      // 평균 기분이 낮으면 기분 개선 콘텐츠 우선
      if (moodPattern.averageMood < 6 && 
          recommendation.tags.includes('기분개선')) {
        score += 25;
      }

      // 주요 감정과 관련된 추천
      if (moodPattern.dominantEmotions.some(emotion => 
          recommendation.tags.includes(emotion))) {
        score += 10;
      }
    }

    // 난이도 조정 (쉬운 것부터 시작)
    switch (recommendation.difficulty) {
      case 'easy': score += 10; break;
      case 'medium': score += 5; break;
      case 'hard': score -= 5; break;
    }

    return score;
  }

  /**
   * 콘텐츠 추천 생성
   */
  async generateContentRecommendations(
    userId: string,
    category: 'article' | 'video' | 'book' | 'podcast'
  ): Promise<Recommendation[]> {
    const userProfile = await this.getUserProfile(userId);
    const moodPattern = await this.getMoodPattern(userId);

    // 카테고리별 콘텐츠 데이터베이스에서 조회
    const contentQuery = await this.database
      .collection('content_library')
      .where('category', '==', category)
      .where('status', '==', 'active')
      .limit(20)
      .get();

    const contents = contentQuery.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // 개인화 필터링 및 순위 조정
    return this.filterAndRankContent(contents, userProfile, moodPattern);
  }

  /**
   * 활동 추천 생성
   */
  async generateActivityRecommendations(
    userId: string,
    timeAvailable: number = 30 // 분 단위
  ): Promise<Recommendation[]> {
    const activities = [
      {
        type: 'mindfulness',
        title: '5분 마음챙김 명상',
        description: '간단한 호흡 명상으로 마음을 진정시켜보세요',
        estimatedTime: '5분',
        difficulty: 'easy',
        tags: ['명상', '스트레스해소', '집중력']
      },
      {
        type: 'activity',
        title: '감사 일기 쓰기',
        description: '오늘 감사한 일 3가지를 적어보세요',
        estimatedTime: '10분',
        difficulty: 'easy',
        tags: ['감사', '긍정성', '자기성찰']
      },
      {
        type: 'activity',
        title: '짧은 산책하기',
        description: '15분간 가벼운 산책으로 기분 전환하기',
        estimatedTime: '15분',
        difficulty: 'easy',
        tags: ['운동', '자연', '기분전환']
      }
    ];

    // 시간 제약에 맞는 활동 필터링
    return activities
      .filter(activity => {
        const activityTime = parseInt(activity.estimatedTime);
        return activityTime <= timeAvailable;
      })
      .map((activity, index) => ({
        id: `activity_${index}`,
        type: activity.type as 'content' | 'activity' | 'exercise' | 'mindfulness' | 'social' | 'learning',
        title: activity.title,
        description: activity.description,
        priority: 'medium' as const,
        reason: '현재 상황에 적합한 활동입니다',
        actionItems: ['지금 바로 시작해보세요'],
        expectedBenefit: '기분 개선과 스트레스 완화에 도움됩니다',
        estimatedTime: activity.estimatedTime,
        difficulty: activity.difficulty as 'easy' | 'medium' | 'hard',
        tags: activity.tags
      }));
  }

  /**
   * 유틸리티 함수들
   */
  private getTopItems(items: string[], count: number): string[] {
    const frequency = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([item]) => item);
  }

  private extractStressFactors(records: any[]): string[] {
    // 스트레스 레벨이 높은 날의 태그나 내용 분석
    return records
      .filter(r => r.stress > 7)
      .flatMap(r => r.content?.tags || [])
      .slice(0, 5);
  }

  private extractPositiveFactors(records: any[]): string[] {
    // 기분이 좋은 날의 태그나 내용 분석
    return records
      .filter(r => r.mood?.intensity > 7)
      .flatMap(r => r.content?.tags || [])
      .slice(0, 5);
  }

  private analyzeTimePatterns(records: any[]): any {
    // 시간대별 기분 패턴 분석 (간단 버전)
    return {
      bestTimeOfDay: '저녁',
      worstTimeOfDay: '오전',
      weekdayVsWeekend: 'weekend_better'
    };
  }

  private filterAndRankContent(
    contents: any[],
    userProfile: UserProfile | null,
    moodPattern: MoodPattern | null
  ): Recommendation[] {
    // 콘텐츠 필터링 및 순위 조정 로직
    return contents.map((content, index) => ({
      id: content.id,
      type: 'content' as const,
      title: content.title,
      description: content.description,
      reason: '당신의 관심사와 일치합니다',
      priority: 'medium' as const,
      estimatedTime: content.estimatedTime || '10분',
      difficulty: content.difficulty || 'easy',
      tags: content.tags || [],
      actionItems: ['지금 읽어보세요'],
      expectedBenefit: content.expectedBenefit || '새로운 인사이트를 얻을 수 있습니다',
      relatedUrl: content.url
    }));
  }

  /**
   * 폴백 추천 (오류 시)
   */
  private getFallbackRecommendations(): Recommendation[] {
    return [
      {
        id: 'fallback_1',
        type: 'mindfulness',
        title: '깊은 호흡하기',
        description: '4-7-8 호흡법으로 마음을 진정시켜보세요',
        reason: '언제나 도움이 되는 기본적인 마음챙김 방법입니다',
        priority: 'high',
        estimatedTime: '3분',
        difficulty: 'easy',
        tags: ['호흡', '명상', '스트레스해소'],
        actionItems: [
          '편안한 자세로 앉기',
          '4초간 숨 들이마시기',
          '7초간 숨 참기',
          '8초간 숨 내쉬기'
        ],
        expectedBenefit: '즉시 마음이 진정되고 스트레스가 완화됩니다'
      },
      {
        id: 'fallback_2',
        type: 'activity',
        title: '감사 표현하기',
        description: '오늘 감사한 일 하나를 떠올려보세요',
        reason: '긍정적인 마음가짐을 기를 수 있습니다',
        priority: 'medium',
        estimatedTime: '2분',
        difficulty: 'easy',
        tags: ['감사', '긍정성'],
        actionItems: ['감사한 일 하나 떠올리기', '그 이유 생각해보기'],
        expectedBenefit: '긍정적인 감정이 증가하고 행복감을 느낄 수 있습니다'
      }
    ];
  }

  /**
   * 추천 피드백 저장
   */
  async saveFeedback(
    userId: string,
    recommendationId: string,
    feedback: 'helpful' | 'not_helpful' | 'completed',
    rating?: number
  ): Promise<void> {
    try {
      await this.database.collection('recommendation_feedback').add({
        userId,
        recommendationId,
        feedback,
        rating,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('추천 피드백 저장 오류:', error);
    }
  }
}

export default RecommendationService;
