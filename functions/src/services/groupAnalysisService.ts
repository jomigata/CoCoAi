/**
 * 🧠 그룹 분석 서비스
 * 심리상담가 1,2가 설계한 관계 분석 프레임워크
 * 멤버 간 감정 데이터 교차 분석 및 관계 패턴 인식
 */

import { db, serverTimestamp } from '../config/firebaseAdmin';
import { openai, AI_MODELS } from '../config/ai';

// 감정 데이터 인터페이스
interface MoodRecord {
  memberId: string;
  memberName: string;
  date: string;
  mood: {
    primary: string;
    intensity: number;
    secondary: string[];
  };
  energy: number;
  stress: number;
  content?: {
    diary?: string;
    tags?: string[];
    activities?: string[];
  };
  createdAt: Date;
}

// 교차 분석 결과 인터페이스
interface CrossAnalysisResult {
  correlations: {
    memberId1: string;
    memberId2: string;
    emotionalSync: number; // 감정 동조도 (0-1)
    stressCorrelation: number; // 스트레스 상관관계 (-1 to 1)
    energyAlignment: number; // 에너지 일치도 (0-1)
    interactionPattern: 'supportive' | 'conflicting' | 'independent' | 'mirroring';
  }[];
  groupDynamics: {
    overallHarmony: number; // 전체 조화도 (0-1)
    emotionalStability: number; // 감정 안정성 (0-1)
    supportNetwork: string[]; // 지지 네트워크 멤버 ID들
    stressPoints: string[]; // 스트레스 포인트 멤버 ID들
  };
  temporalPatterns: {
    peakEmotionTimes: string[]; // 감정 피크 시간대
    lowEnergyPeriods: string[]; // 저에너지 시기
    groupSyncMoments: string[]; // 그룹 동조 순간들
  };
}

// 관계 패턴 인터페이스
interface RelationshipPattern {
  patternType: 'caregiver-receiver' | 'mutual-support' | 'leader-follower' | 'independent-parallel' | 'conflict-prone';
  strength: number; // 패턴 강도 (0-1)
  stability: number; // 패턴 안정성 (0-1)
  members: string[]; // 관련 멤버들
  description: string;
  recommendations: string[];
}

export class GroupAnalysisService {
  private database = db;

  /**
   * 멤버 간 감정 데이터 교차 분석
   */
  async performCrossAnalysis(
    groupId: string, 
    weeklyRecords: MoodRecord[]
  ): Promise<CrossAnalysisResult> {
    try {
      // 1. 멤버별 데이터 그룹화
      const memberData = this.groupRecordsByMember(weeklyRecords);
      
      // 2. 쌍별 상관관계 분석
      const correlations = await this.calculateMemberCorrelations(memberData);
      
      // 3. 그룹 다이나믹스 분석
      const groupDynamics = this.analyzeGroupDynamics(memberData, correlations);
      
      // 4. 시간적 패턴 분석
      const temporalPatterns = this.analyzeTemporalPatterns(weeklyRecords);
      
      return {
        correlations,
        groupDynamics,
        temporalPatterns
      };
      
    } catch (error) {
      console.error('교차 분석 오류:', error);
      throw error;
    }
  }

  /**
   * 관계 패턴 인식 AI 모델
   */
  async recognizeRelationshipPatterns(
    crossAnalysis: CrossAnalysisResult,
    groupType: string,
    memberProfiles: any[]
  ): Promise<RelationshipPattern[]> {
    try {
      const analysisPrompt = `
당신은 관계 심리학 전문가입니다. 다음 그룹의 교차 분석 데이터를 바탕으로 관계 패턴을 인식해주세요.

그룹 유형: ${groupType}
교차 분석 결과: ${JSON.stringify(crossAnalysis)}
멤버 프로필: ${JSON.stringify(memberProfiles)}

다음 관계 패턴들을 분석하고 식별해주세요:
1. caregiver-receiver: 돌봄 제공자와 수혜자 관계
2. mutual-support: 상호 지지 관계
3. leader-follower: 리더와 팔로워 관계
4. independent-parallel: 독립적 병행 관계
5. conflict-prone: 갈등 발생 가능성이 높은 관계

각 패턴에 대해 다음을 제공해주세요:
- 패턴 강도 (0-1)
- 패턴 안정성 (0-1)
- 관련 멤버들
- 패턴 설명
- 관계 개선 권장사항 (3가지)

⚠️ 이 분석은 AI 기반이며, 실제 관계의 복잡성을 완전히 반영하지 못할 수 있습니다.

JSON 배열 형태로 응답해주세요.
`;

      const completion = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.3, // 일관성을 위해 낮은 온도
      });

      const patterns = JSON.parse(completion.choices[0].message.content || '[]');
      
      // AI 편향성 경고 추가
      patterns.forEach((pattern: any) => {
        pattern.aiWarning = {
          message: "⚠️ AI 분석 기반 관계 패턴",
          caution: "실제 관계는 이보다 복잡하고 다면적일 수 있습니다."
        };
      });

      return patterns;
      
    } catch (error) {
      console.error('관계 패턴 인식 오류:', error);
      throw error;
    }
  }

  /**
   * 개인화된 관계 조언 생성
   */
  async generatePersonalizedAdvice(
    memberId: string,
    memberName: string,
    crossAnalysis: CrossAnalysisResult,
    relationshipPatterns: RelationshipPattern[],
    groupContext: any
  ): Promise<{
    emotionalInsights: string[];
    relationshipTips: string[];
    actionItems: string[];
    weeklyGoals: string[];
  }> {
    try {
      const advicePrompt = `
당신은 관계 심리학 전문가입니다. ${memberName}님을 위한 개인화된 관계 조언을 생성해주세요.

멤버 정보:
- 이름: ${memberName}
- ID: ${memberId}

그룹 분석 결과:
- 교차 분석: ${JSON.stringify(crossAnalysis)}
- 관계 패턴: ${JSON.stringify(relationshipPatterns)}
- 그룹 맥락: ${JSON.stringify(groupContext)}

다음 4가지 영역에서 조언을 제공해주세요:

1. emotionalInsights: 감정적 인사이트 (3가지)
   - 이번 주 감정 패턴에 대한 객관적 관찰
   - 다른 멤버들과의 감정적 연결점
   - 감정 조절을 위한 인사이트

2. relationshipTips: 관계 개선 팁 (3가지)
   - 구체적이고 실천 가능한 관계 개선 방법
   - 그룹 내 역할에 맞는 소통 전략
   - 갈등 예방 및 해결 방법

3. actionItems: 실천 과제 (3가지)
   - 이번 주에 실천할 수 있는 구체적 행동
   - 측정 가능하고 달성 가능한 목표
   - 관계 개선에 직접적 도움이 되는 활동

4. weeklyGoals: 주간 목표 (2가지)
   - 다음 주까지 달성할 관계 목표
   - 개인 성장과 그룹 조화를 동시에 고려
   - 구체적이고 측정 가능한 목표

⚠️ 모든 조언은 따뜻하고 격려적인 톤으로 작성하고, AI 분석의 한계를 인정하는 내용을 포함해주세요.

JSON 형태로 응답해주세요.
`;

      const completion = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [{ role: "user", content: advicePrompt }],
        temperature: 0.7, // 창의적 조언을 위해 적당한 온도
      });

      const advice = JSON.parse(completion.choices[0].message.content || '{}');
      
      // AI 편향성 경고 추가
      advice.aiDisclaimer = {
        message: "⚠️ 개인화된 AI 조언 안내",
        details: [
          "이 조언은 AI 분석을 바탕으로 생성되었습니다.",
          "개인의 고유한 상황과 감정을 완전히 반영하지 못할 수 있습니다.",
          "참고용으로 활용하시고, 본인의 판단과 상황에 맞게 적용해주세요.",
          "필요시 전문 상담사와의 상담을 권장합니다."
        ]
      };

      return advice;
      
    } catch (error) {
      console.error('개인화된 조언 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 멤버별 데이터 그룹화
   */
  private groupRecordsByMember(records: MoodRecord[]): { [memberId: string]: MoodRecord[] } {
    return records.reduce((acc, record) => {
      if (!acc[record.memberId]) {
        acc[record.memberId] = [];
      }
      acc[record.memberId].push(record);
      return acc;
    }, {} as { [memberId: string]: MoodRecord[] });
  }

  /**
   * 멤버 간 상관관계 계산
   */
  private async calculateMemberCorrelations(
    memberData: { [memberId: string]: MoodRecord[] }
  ): Promise<CrossAnalysisResult['correlations']> {
    const correlations: CrossAnalysisResult['correlations'] = [];
    const memberIds = Object.keys(memberData);

    // 모든 멤버 쌍에 대해 상관관계 계산
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const member1Id = memberIds[i];
        const member2Id = memberIds[j];
        const member1Records = memberData[member1Id];
        const member2Records = memberData[member2Id];

        // 감정 동조도 계산
        const emotionalSync = this.calculateEmotionalSync(member1Records, member2Records);
        
        // 스트레스 상관관계 계산
        const stressCorrelation = this.calculateStressCorrelation(member1Records, member2Records);
        
        // 에너지 일치도 계산
        const energyAlignment = this.calculateEnergyAlignment(member1Records, member2Records);
        
        // 상호작용 패턴 결정
        const interactionPattern = this.determineInteractionPattern(
          emotionalSync, 
          stressCorrelation, 
          energyAlignment
        );

        correlations.push({
          memberId1: member1Id,
          memberId2: member2Id,
          emotionalSync,
          stressCorrelation,
          energyAlignment,
          interactionPattern
        });
      }
    }

    return correlations;
  }

  /**
   * 감정 동조도 계산
   */
  private calculateEmotionalSync(records1: MoodRecord[], records2: MoodRecord[]): number {
    if (records1.length === 0 || records2.length === 0) return 0;

    // 같은 날짜의 기록들을 매칭
    const matchedRecords = this.matchRecordsByDate(records1, records2);
    if (matchedRecords.length === 0) return 0;

    let syncScore = 0;
    matchedRecords.forEach(([record1, record2]) => {
      // 주요 감정 일치도
      const primaryMoodSync = record1.mood.primary === record2.mood.primary ? 1 : 0;
      
      // 감정 강도 유사도
      const intensityDiff = Math.abs(record1.mood.intensity - record2.mood.intensity);
      const intensitySync = 1 - (intensityDiff / 10); // 0-1 스케일
      
      // 부가 감정 겹침도
      const secondaryOverlap = this.calculateArrayOverlap(
        record1.mood.secondary, 
        record2.mood.secondary
      );
      
      syncScore += (primaryMoodSync * 0.5 + intensitySync * 0.3 + secondaryOverlap * 0.2);
    });

    return syncScore / matchedRecords.length;
  }

  /**
   * 스트레스 상관관계 계산
   */
  private calculateStressCorrelation(records1: MoodRecord[], records2: MoodRecord[]): number {
    const matchedRecords = this.matchRecordsByDate(records1, records2);
    if (matchedRecords.length < 2) return 0;

    const stressValues1 = matchedRecords.map(([r1]) => r1.stress);
    const stressValues2 = matchedRecords.map(([, r2]) => r2.stress);

    return this.calculatePearsonCorrelation(stressValues1, stressValues2);
  }

  /**
   * 에너지 일치도 계산
   */
  private calculateEnergyAlignment(records1: MoodRecord[], records2: MoodRecord[]): number {
    const matchedRecords = this.matchRecordsByDate(records1, records2);
    if (matchedRecords.length === 0) return 0;

    let alignmentScore = 0;
    matchedRecords.forEach(([record1, record2]) => {
      const energyDiff = Math.abs(record1.energy - record2.energy);
      alignmentScore += 1 - (energyDiff / 10); // 0-1 스케일
    });

    return Math.max(0, alignmentScore / matchedRecords.length);
  }

  /**
   * 상호작용 패턴 결정
   */
  private determineInteractionPattern(
    emotionalSync: number,
    stressCorrelation: number,
    energyAlignment: number
  ): 'supportive' | 'conflicting' | 'independent' | 'mirroring' {
    if (emotionalSync > 0.7 && energyAlignment > 0.7) {
      return 'mirroring'; // 감정과 에너지가 높게 일치
    } else if (stressCorrelation < -0.3 && emotionalSync > 0.4) {
      return 'supportive'; // 한 명의 스트레스가 높을 때 다른 명이 지지
    } else if (stressCorrelation > 0.5 && emotionalSync < 0.3) {
      return 'conflicting'; // 스트레스는 함께 높아지지만 감정은 불일치
    } else {
      return 'independent'; // 독립적인 패턴
    }
  }

  /**
   * 그룹 다이나믹스 분석
   */
  private analyzeGroupDynamics(
    memberData: { [memberId: string]: MoodRecord[] },
    correlations: CrossAnalysisResult['correlations']
  ): CrossAnalysisResult['groupDynamics'] {
    const memberIds = Object.keys(memberData);
    
    // 전체 조화도 계산
    const avgEmotionalSync = correlations.reduce((sum, corr) => sum + corr.emotionalSync, 0) / correlations.length;
    const avgEnergyAlignment = correlations.reduce((sum, corr) => sum + corr.energyAlignment, 0) / correlations.length;
    const overallHarmony = (avgEmotionalSync + avgEnergyAlignment) / 2;

    // 감정 안정성 계산 (변동성의 역수)
    let totalVariance = 0;
    let recordCount = 0;
    
    memberIds.forEach(memberId => {
      const records = memberData[memberId];
      if (records.length > 1) {
        const moodIntensities = records.map(r => r.mood.intensity);
        const variance = this.calculateVariance(moodIntensities);
        totalVariance += variance;
        recordCount++;
      }
    });
    
    const avgVariance = recordCount > 0 ? totalVariance / recordCount : 0;
    const emotionalStability = Math.max(0, 1 - (avgVariance / 25)); // 정규화

    // 지지 네트워크 식별
    const supportNetwork = correlations
      .filter(corr => corr.interactionPattern === 'supportive')
      .flatMap(corr => [corr.memberId1, corr.memberId2])
      .filter((id, index, arr) => arr.indexOf(id) === index);

    // 스트레스 포인트 식별
    const stressPoints = memberIds.filter(memberId => {
      const records = memberData[memberId];
      const avgStress = records.reduce((sum, r) => sum + r.stress, 0) / records.length;
      return avgStress > 7; // 높은 스트레스 임계값
    });

    return {
      overallHarmony,
      emotionalStability,
      supportNetwork,
      stressPoints
    };
  }

  /**
   * 시간적 패턴 분석
   */
  private analyzeTemporalPatterns(records: MoodRecord[]): CrossAnalysisResult['temporalPatterns'] {
    // 시간대별 감정 강도 분석
    const hourlyIntensity: { [hour: string]: number[] } = {};
    const hourlyEnergy: { [hour: string]: number[] } = {};
    
    records.forEach(record => {
      const hour = new Date(record.createdAt).getHours().toString();
      
      if (!hourlyIntensity[hour]) {
        hourlyIntensity[hour] = [];
        hourlyEnergy[hour] = [];
      }
      
      hourlyIntensity[hour].push(record.mood.intensity);
      hourlyEnergy[hour].push(record.energy);
    });

    // 피크 시간대 식별
    const peakEmotionTimes = Object.keys(hourlyIntensity)
      .filter(hour => {
        const avgIntensity = hourlyIntensity[hour].reduce((a, b) => a + b, 0) / hourlyIntensity[hour].length;
        return avgIntensity > 7;
      })
      .map(hour => `${hour}:00`);

    // 저에너지 시간대 식별
    const lowEnergyPeriods = Object.keys(hourlyEnergy)
      .filter(hour => {
        const avgEnergy = hourlyEnergy[hour].reduce((a, b) => a + b, 0) / hourlyEnergy[hour].length;
        return avgEnergy < 4;
      })
      .map(hour => `${hour}:00`);

    // 그룹 동조 순간 식별 (같은 시간대에 여러 멤버가 기록한 경우)
    const timeSlots: { [timeSlot: string]: string[] } = {};
    records.forEach(record => {
      const timeSlot = new Date(record.createdAt).toISOString().slice(0, 13); // 시간 단위
      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = [];
      }
      timeSlots[timeSlot].push(record.memberId);
    });

    const groupSyncMoments = Object.keys(timeSlots)
      .filter(timeSlot => timeSlots[timeSlot].length > 1)
      .map(timeSlot => new Date(timeSlot).toLocaleString('ko-KR'));

    return {
      peakEmotionTimes,
      lowEnergyPeriods,
      groupSyncMoments
    };
  }

  // 유틸리티 메서드들
  private matchRecordsByDate(records1: MoodRecord[], records2: MoodRecord[]): [MoodRecord, MoodRecord][] {
    const matched: [MoodRecord, MoodRecord][] = [];
    
    records1.forEach(r1 => {
      const matchingRecord = records2.find(r2 => 
        new Date(r1.createdAt).toDateString() === new Date(r2.createdAt).toDateString()
      );
      if (matchingRecord) {
        matched.push([r1, matchingRecord]);
      }
    });
    
    return matched;
  }

  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 && arr2.length === 0) return 1;
    if (arr1.length === 0 || arr2.length === 0) return 0;
    
    const intersection = arr1.filter(item => arr2.includes(item));
    const union = [...new Set([...arr1, ...arr2])];
    
    return intersection.length / union.length;
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 분석 결과 저장
   */
  async saveAnalysisResult(
    groupId: string,
    weekStartDate: string,
    analysisResult: any
  ): Promise<void> {
    try {
      const analysisId = `${groupId}_${weekStartDate}_analysis`;
      
      await this.database.collection('group_analysis').doc(analysisId).set({
        groupId,
        weekStartDate,
        analysisResult,
        createdAt: serverTimestamp(),
        version: '2.0' // 고도화된 버전
      });
      
    } catch (error) {
      console.error('분석 결과 저장 오류:', error);
      throw error;
    }
  }
}
