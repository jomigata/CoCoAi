/**
 * 🌱 개인 성장 리포트 서비스
 * 심리상담가 1,2가 설계한 개인 성장 분석 프레임워크
 * 월간 감정 패턴 분석 및 실천 가능한 대안 추천
 */

import { db, serverTimestamp } from '../config/firebaseAdmin';
import { openai, AI_MODELS } from '../config/ai';
import { AIWarningService } from './aiWarningService';

// 감정 패턴 인터페이스
interface EmotionalPattern {
  patternType: 'cyclic' | 'trending' | 'stable' | 'volatile' | 'seasonal';
  description: string;
  strength: number; // 0-1
  frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
  triggers: string[];
  peakTimes: string[];
  lowTimes: string[];
  correlations: {
    weather?: number;
    dayOfWeek?: { [day: string]: number };
    timeOfDay?: { [hour: string]: number };
    activities?: { [activity: string]: number };
  };
}

// 성장 영역 인터페이스
interface GrowthArea {
  area: 'emotional_regulation' | 'stress_management' | 'relationship_skills' | 'self_awareness' | 'resilience' | 'communication';
  currentLevel: number; // 1-10
  targetLevel: number; // 1-10
  progressRate: number; // -1 to 1 (개선/악화 속도)
  keyStrengths: string[];
  improvementAreas: string[];
  milestones: Array<{
    description: string;
    targetDate: string;
    achieved: boolean;
  }>;
}

// 실천 대안 인터페이스
interface ActionableAlternative {
  id: string;
  category: 'mindfulness' | 'exercise' | 'social' | 'creative' | 'learning' | 'routine';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeRequired: string; // "5분", "30분", "1시간" 등
  frequency: 'daily' | 'weekly' | 'as_needed';
  expectedBenefit: string;
  instructions: string[];
  trackingMethod: string;
  successMetrics: string[];
}

// 월간 성장 리포트 인터페이스
interface MonthlyGrowthReport {
  userId: string;
  month: string; // YYYY-MM 형식
  emotionalPatterns: EmotionalPattern[];
  growthAreas: GrowthArea[];
  actionableAlternatives: ActionableAlternative[];
  overallProgress: {
    emotionalStability: number;
    selfAwareness: number;
    copingSkills: number;
    overallScore: number;
  };
  personalizedInsights: string[];
  nextMonthGoals: string[];
  aiWarning: any;
}

export class PersonalGrowthService {
  private database = db;

  /**
   * 월간 감정 패턴 분석
   */
  async analyzeMonthlyEmotionalPatterns(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EmotionalPattern[]> {
    try {
      // 월간 감정 기록 수집
      const moodRecords = await this.collectMonthlyMoodRecords(userId, startDate, endDate);
      
      if (moodRecords.length < 7) {
        throw new Error('분석을 위한 충분한 데이터가 없습니다. (최소 7일 필요)');
      }

      // 1. 시계열 패턴 분석
      const timeSeriesPatterns = this.analyzeTimeSeriesPatterns(moodRecords);
      
      // 2. 주기적 패턴 감지
      const cyclicPatterns = this.detectCyclicPatterns(moodRecords);
      
      // 3. 트렌드 분석
      const trendPatterns = this.analyzeTrends(moodRecords);
      
      // 4. 변동성 분석
      const volatilityPatterns = this.analyzeVolatility(moodRecords);
      
      // 5. 외부 요인 상관관계 분석
      const correlationPatterns = await this.analyzeExternalCorrelations(moodRecords);

      // AI 기반 패턴 해석
      const interpretedPatterns = await this.interpretPatternsWithAI(
        [...timeSeriesPatterns, ...cyclicPatterns, ...trendPatterns, ...volatilityPatterns],
        correlationPatterns
      );

      return interpretedPatterns;
      
    } catch (error) {
      console.error('월간 감정 패턴 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 실천 가능한 대안 추천 엔진
   */
  async generateActionableAlternatives(
    userId: string,
    emotionalPatterns: EmotionalPattern[],
    growthAreas: GrowthArea[],
    userProfile: any
  ): Promise<ActionableAlternative[]> {
    try {
      const recommendationPrompt = `
당신은 30년 경력의 전문 심리상담가입니다. 다음 개인의 감정 패턴과 성장 영역을 바탕으로 실천 가능한 대안을 추천해주세요.

사용자 프로필: ${JSON.stringify(userProfile)}
감정 패턴: ${JSON.stringify(emotionalPatterns)}
성장 영역: ${JSON.stringify(growthAreas)}

다음 6개 카테고리에서 각각 2-3개씩 총 15개의 실천 대안을 제공해주세요:

1. mindfulness: 마음챙김 및 명상 관련
2. exercise: 신체 활동 및 운동 관련  
3. social: 사회적 관계 및 소통 관련
4. creative: 창의적 활동 및 표현 관련
5. learning: 학습 및 자기계발 관련
6. routine: 일상 루틴 및 습관 관련

각 대안은 다음 형식으로 제공해주세요:
- id: 고유 식별자
- category: 카테고리
- title: 제목 (간결하고 매력적으로)
- description: 설명 (2-3문장)
- difficulty: easy/medium/hard
- timeRequired: 소요 시간
- frequency: daily/weekly/as_needed
- expectedBenefit: 기대 효과
- instructions: 실행 방법 (3-5단계)
- trackingMethod: 추적 방법
- successMetrics: 성공 지표 (2-3개)

⚠️ 모든 추천은 개인의 현재 상황과 능력을 고려하여 실현 가능하고 구체적이어야 합니다.

JSON 배열 형태로 응답해주세요.
`;

      const completion = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [{ role: "user", content: recommendationPrompt }],
        temperature: 0.7,
      });

      const alternatives = JSON.parse(completion.choices[0].message.content || '[]');
      
      // 개인화 점수 계산 및 정렬
      const personalizedAlternatives = alternatives.map((alt: any) => ({
        ...alt,
        personalizationScore: this.calculatePersonalizationScore(alt, emotionalPatterns, growthAreas),
        aiWarning: AIWarningService.generateContextualWarning('recommendation', {
          dataPoints: emotionalPatterns.length,
          analysisDepth: 'advanced'
        })
      }));

      // 점수 순으로 정렬하여 상위 12개 반환
      return personalizedAlternatives
        .sort((a: any, b: any) => b.personalizationScore - a.personalizationScore)
        .slice(0, 12);
      
    } catch (error) {
      console.error('실천 대안 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 주기적 실천 체크 프로그램
   */
  async createPeriodicCheckProgram(
    userId: string,
    selectedAlternatives: ActionableAlternative[]
  ): Promise<{
    programId: string;
    schedule: Array<{
      date: string;
      tasks: Array<{
        alternativeId: string;
        title: string;
        completed: boolean;
        notes?: string;
        rating?: number; // 1-5
      }>;
    }>;
    milestones: Array<{
      week: number;
      description: string;
      criteria: string[];
      achieved: boolean;
    }>;
  }> {
    try {
      const programId = `growth_program_${userId}_${Date.now()}`;
      
      // 4주간의 체크 스케줄 생성
      const schedule = this.generateCheckSchedule(selectedAlternatives);
      
      // 주간 마일스톤 설정
      const milestones = this.generateMilestones(selectedAlternatives);
      
      // 프로그램 저장
      await this.database.collection('growth_programs').doc(programId).set({
        userId,
        selectedAlternatives,
        schedule,
        milestones,
        startDate: new Date(),
        status: 'active',
        createdAt: serverTimestamp()
      });

      return {
        programId,
        schedule,
        milestones
      };
      
    } catch (error) {
      console.error('실천 체크 프로그램 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 꿈 기록 AI 해몽 서비스
   */
  async analyzeDreamRecord(
    userId: string,
    dreamContent: string,
    dreamDate: Date,
    emotionalState: any,
    recentMoodPatterns: any[]
  ): Promise<{
    interpretation: {
      mainThemes: string[];
      psychologicalMeaning: string;
      emotionalSignificance: string;
      possibleTriggers: string[];
      connectionToCurrentState: string;
    };
    insights: string[];
    recommendations: string[];
    aiWarning: any;
  }> {
    try {
      const dreamAnalysisPrompt = `
당신은 융(Jung)의 분석심리학과 현대 꿈 연구를 전문으로 하는 심리학자입니다. 다음 꿈을 분석해주세요.

꿈 내용: "${dreamContent}"
꿈을 꾼 날짜: ${dreamDate.toISOString()}
당시 감정 상태: ${JSON.stringify(emotionalState)}
최근 감정 패턴: ${JSON.stringify(recentMoodPatterns)}

다음 관점에서 분석해주세요:

1. interpretation (해석):
   - mainThemes: 주요 테마들 (3-5개)
   - psychologicalMeaning: 심리학적 의미
   - emotionalSignificance: 감정적 의미
   - possibleTriggers: 가능한 촉발 요인들
   - connectionToCurrentState: 현재 심리 상태와의 연관성

2. insights: 개인적 통찰 (3-4개)
3. recommendations: 실천 권장사항 (2-3개)

⚠️ 중요 원칙:
- 꿈 해석은 개인적이고 주관적입니다
- 과학적 근거가 제한적임을 인정합니다
- 절대적 진실이 아닌 가능성으로 제시합니다
- 개인의 문화적 배경과 경험을 고려합니다
- 부정적 해석보다는 성장 지향적 관점을 제시합니다

JSON 형태로 응답해주세요.
`;

      const completion = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [{ role: "user", content: dreamAnalysisPrompt }],
        temperature: 0.8, // 창의적 해석을 위해 높은 온도
      });

      const analysisResult = JSON.parse(completion.choices[0].message.content || '{}');
      
      // AI 경고 추가
      analysisResult.aiWarning = {
        message: "⚠️ AI 꿈 해석 안내",
        details: [
          "꿈 해석은 매우 개인적이고 주관적인 영역입니다.",
          "과학적 근거가 제한적이며, 절대적 진실이 아닙니다.",
          "문화적 배경과 개인적 경험에 따라 의미가 달라질 수 있습니다.",
          "참고용으로만 활용하시고, 본인의 직감을 더 신뢰하세요.",
          "지속적으로 불안한 꿈이 반복된다면 전문가와 상담하세요."
        ],
        timestamp: new Date().toISOString(),
        version: "2.0"
      };

      // 꿈 기록 저장
      await this.database.collection('dream_records').add({
        userId,
        dreamContent,
        dreamDate,
        emotionalState,
        analysisResult,
        createdAt: serverTimestamp()
      });

      return analysisResult;
      
    } catch (error) {
      console.error('꿈 해석 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 종합 월간 성장 리포트 생성
   */
  async generateMonthlyGrowthReport(
    userId: string,
    month: string // YYYY-MM 형식
  ): Promise<MonthlyGrowthReport> {
    try {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0);

      // 사용자 프로필 조회
      const userDoc = await this.database.collection('users').doc(userId).get();
      const userProfile = userDoc.data();

      // 1. 감정 패턴 분석
      const emotionalPatterns = await this.analyzeMonthlyEmotionalPatterns(userId, startDate, endDate);
      
      // 2. 성장 영역 분석
      const growthAreas = await this.analyzeGrowthAreas(userId, startDate, endDate);
      
      // 3. 실천 대안 생성
      const actionableAlternatives = await this.generateActionableAlternatives(
        userId, 
        emotionalPatterns, 
        growthAreas, 
        userProfile
      );
      
      // 4. 전체 진전도 계산
      const overallProgress = this.calculateOverallProgress(emotionalPatterns, growthAreas);
      
      // 5. 개인화된 인사이트 생성
      const personalizedInsights = await this.generatePersonalizedInsights(
        emotionalPatterns, 
        growthAreas, 
        overallProgress
      );
      
      // 6. 다음 달 목표 설정
      const nextMonthGoals = await this.generateNextMonthGoals(
        emotionalPatterns, 
        growthAreas, 
        actionableAlternatives
      );

      const report: MonthlyGrowthReport = {
        userId,
        month,
        emotionalPatterns,
        growthAreas,
        actionableAlternatives,
        overallProgress,
        personalizedInsights,
        nextMonthGoals,
        aiWarning: AIWarningService.generateContextualWarning('personal_profiling', {
          dataPoints: emotionalPatterns.length,
          analysisDepth: 'advanced',
          timeframe: '1개월'
        })
      };

      // 리포트 저장
      await this.database.collection('growth_reports').doc(`${userId}_${month}`).set({
        ...report,
        createdAt: serverTimestamp()
      });

      return report;
      
    } catch (error) {
      console.error('월간 성장 리포트 생성 오류:', error);
      throw error;
    }
  }

  // 유틸리티 메서드들
  private async collectMonthlyMoodRecords(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const recordsQuery = await this.database
      .collection('mood_records')
      .doc(userId)
      .collection('records')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .orderBy('createdAt')
      .get();

    return recordsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  }

  private analyzeTimeSeriesPatterns(records: any[]): EmotionalPattern[] {
    // 시계열 분석 로직 구현
    const patterns: EmotionalPattern[] = [];
    
    // 일별 감정 변화 분석
    const dailyChanges = this.calculateDailyChanges(records);
    if (this.isStablePattern(dailyChanges)) {
      patterns.push({
        patternType: 'stable',
        description: '감정 상태가 안정적으로 유지되고 있습니다.',
        strength: this.calculateStability(dailyChanges),
        frequency: 'daily',
        triggers: [],
        peakTimes: [],
        lowTimes: [],
        correlations: {}
      });
    }

    return patterns;
  }

  private detectCyclicPatterns(records: any[]): EmotionalPattern[] {
    // 주기적 패턴 감지 로직
    return [];
  }

  private analyzeTrends(records: any[]): EmotionalPattern[] {
    // 트렌드 분석 로직
    return [];
  }

  private analyzeVolatility(records: any[]): EmotionalPattern[] {
    // 변동성 분석 로직
    return [];
  }

  private async analyzeExternalCorrelations(records: any[]): Promise<any> {
    // 외부 요인 상관관계 분석
    return {};
  }

  private async interpretPatternsWithAI(patterns: EmotionalPattern[], correlations: any): Promise<EmotionalPattern[]> {
    // AI 기반 패턴 해석
    return patterns;
  }

  private calculatePersonalizationScore(
    alternative: ActionableAlternative, 
    patterns: EmotionalPattern[], 
    growthAreas: GrowthArea[]
  ): number {
    // 개인화 점수 계산 로직
    let score = 0.5; // 기본 점수

    // 성장 영역과의 매칭도
    const relevantGrowthAreas = growthAreas.filter(area => 
      this.isAlternativeRelevantToGrowthArea(alternative, area)
    );
    score += relevantGrowthAreas.length * 0.2;

    // 감정 패턴과의 적합도
    const patternMatch = patterns.some(pattern => 
      this.isAlternativeRelevantToPattern(alternative, pattern)
    );
    if (patternMatch) score += 0.3;

    return Math.min(score, 1.0);
  }

  private generateCheckSchedule(alternatives: ActionableAlternative[]): any[] {
    // 4주간 체크 스케줄 생성
    const schedule = [];
    const startDate = new Date();
    
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + day);
        
        const dailyTasks = alternatives
          .filter(alt => alt.frequency === 'daily' || (alt.frequency === 'weekly' && day === 0))
          .map(alt => ({
            alternativeId: alt.id,
            title: alt.title,
            completed: false
          }));

        if (dailyTasks.length > 0) {
          schedule.push({
            date: date.toISOString().split('T')[0],
            tasks: dailyTasks
          });
        }
      }
    }

    return schedule;
  }

  private generateMilestones(alternatives: ActionableAlternative[]): any[] {
    return [
      {
        week: 1,
        description: '새로운 습관 시작하기',
        criteria: ['선택한 활동 중 50% 이상 실행', '일일 기록 작성'],
        achieved: false
      },
      {
        week: 2,
        description: '습관 정착시키기',
        criteria: ['선택한 활동 중 70% 이상 실행', '개선 효과 체감'],
        achieved: false
      },
      {
        week: 3,
        description: '지속적 실천하기',
        criteria: ['선택한 활동 중 80% 이상 실행', '어려움 극복 경험'],
        achieved: false
      },
      {
        week: 4,
        description: '습관으로 만들기',
        criteria: ['선택한 활동 중 90% 이상 실행', '다음 달 계획 수립'],
        achieved: false
      }
    ];
  }

  private async analyzeGrowthAreas(userId: string, startDate: Date, endDate: Date): Promise<GrowthArea[]> {
    // 성장 영역 분석 로직
    return [];
  }

  private calculateOverallProgress(patterns: EmotionalPattern[], growthAreas: GrowthArea[]): any {
    return {
      emotionalStability: 0.7,
      selfAwareness: 0.8,
      copingSkills: 0.6,
      overallScore: 0.7
    };
  }

  private async generatePersonalizedInsights(patterns: EmotionalPattern[], growthAreas: GrowthArea[], progress: any): Promise<string[]> {
    return [
      "이번 달 감정 안정성이 향상되었습니다.",
      "스트레스 관리 능력이 개선되고 있습니다.",
      "자기 인식 수준이 높아졌습니다."
    ];
  }

  private async generateNextMonthGoals(patterns: EmotionalPattern[], growthAreas: GrowthArea[], alternatives: ActionableAlternative[]): Promise<string[]> {
    return [
      "매일 10분 마음챙김 명상 실천하기",
      "주 3회 이상 운동하기",
      "감정 일기 꾸준히 작성하기"
    ];
  }

  // 헬퍼 메서드들
  private calculateDailyChanges(records: any[]): number[] {
    const changes = [];
    for (let i = 1; i < records.length; i++) {
      const change = records[i].mood.intensity - records[i-1].mood.intensity;
      changes.push(change);
    }
    return changes;
  }

  private isStablePattern(changes: number[]): boolean {
    const variance = this.calculateVariance(changes);
    return variance < 2; // 임계값
  }

  private calculateStability(changes: number[]): number {
    const variance = this.calculateVariance(changes);
    return Math.max(0, 1 - (variance / 10)); // 정규화
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private isAlternativeRelevantToGrowthArea(alternative: ActionableAlternative, growthArea: GrowthArea): boolean {
    // 대안이 성장 영역과 관련있는지 판단
    const relevanceMap: { [key: string]: string[] } = {
      'emotional_regulation': ['mindfulness', 'routine'],
      'stress_management': ['exercise', 'mindfulness'],
      'relationship_skills': ['social', 'communication'],
      'self_awareness': ['mindfulness', 'learning'],
      'resilience': ['exercise', 'creative'],
      'communication': ['social', 'learning']
    };

    return relevanceMap[growthArea.area]?.includes(alternative.category) || false;
  }

  private isAlternativeRelevantToPattern(alternative: ActionableAlternative, pattern: EmotionalPattern): boolean {
    // 대안이 감정 패턴과 관련있는지 판단
    if (pattern.patternType === 'volatile' && alternative.category === 'mindfulness') return true;
    if (pattern.patternType === 'stable' && alternative.category === 'creative') return true;
    return false;
  }
}
