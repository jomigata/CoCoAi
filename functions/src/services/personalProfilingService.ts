/**
 * 🧠 개인 프로파일링 서비스
 * 심리상담가 1,2가 설계한 개인 종합 프로파일링 시스템
 * 연령대별 맞춤형 심리검사 및 마음 지도 생성
 */

import { db, serverTimestamp } from '../config/firebaseAdmin';
import { openai, AI_MODELS } from '../config/ai';
import { AIWarningService } from './aiWarningService';

// 프로파일링 질문 인터페이스
interface ProfilingQuestion {
  id: string;
  category: 'selfEsteem' | 'stressCoping' | 'relationshipPattern' | 'coreValues' | 'strengths';
  question: string;
  type: 'scale' | 'multiple-choice' | 'ranking';
  options?: string[];
  scaleRange?: { min: number; max: number; labels: string[] };
  required: boolean;
  ageGroup?: string[]; // 특정 연령대에만 표시
  weight?: number; // 채점 가중치
}

// 프로파일링 결과 인터페이스
interface ProfilingResult {
  userId: string;
  ageGroup: string;
  completedAt: Date;
  responses: { [questionId: string]: any };
  scores: {
    selfEsteem: number; // 0-100
    stressCoping: {
      active: number;
      passive: number;
      social: number;
      individual: number;
    };
    relationshipPattern: string;
    coreValues: string[];
    strengths: string[];
  };
  mindMap: {
    personality: string;
    emotionalPattern: string;
    communicationStyle: string;
    growthAreas: string[];
    recommendations: string[];
  };
  aiAnalysis: {
    summary: string;
    insights: string[];
    personalizedAdvice: string[];
    monthlyGoals: string[];
  };
  aiWarning: any;
}

// 연령대별 질문 세트
interface AgeGroupQuestions {
  [ageGroup: string]: ProfilingQuestion[];
}

export class PersonalProfilingService {
  private database = db;

  /**
   * 연령대별 맞춤형 질문 세트 생성
   * 심리상담가 1,2가 설계한 연령대별 특화 질문
   */
  private getAgeGroupQuestions(): AgeGroupQuestions {
    return {
      '10s': [
        // 자아존중감 (10대 특화 - 정체성 형성기)
        {
          id: 'teen_self_worth',
          category: 'selfEsteem',
          question: '나는 나 자신을 소중하게 생각한다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['10s'],
          weight: 1.2
        },
        {
          id: 'teen_peer_pressure',
          category: 'selfEsteem',
          question: '친구들의 의견에 쉽게 휩쓸리지 않는다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['10s'],
          weight: 1.0
        },
        {
          id: 'teen_body_image',
          category: 'selfEsteem',
          question: '내 외모에 대해 긍정적으로 생각한다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['10s'],
          weight: 1.1
        },
        {
          id: 'teen_academic_pressure',
          category: 'stressCoping',
          question: '시험 스트레스를 어떻게 해소하나요?',
          type: 'multiple-choice',
          options: [
            '친구들과 대화하기',
            '혼자만의 시간 갖기',
            '운동하기',
            '음악 듣기',
            '게임하기'
          ],
          required: true,
          ageGroup: ['10s'],
          weight: 1.0
        },
        {
          id: 'teen_future_worry',
          category: 'stressCoping',
          question: '미래에 대한 걱정이 많다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['10s'],
          weight: 1.0
        },
        {
          id: 'teen_relationship_style',
          category: 'relationshipPattern',
          question: '친구들과의 관계에서 나는',
          type: 'multiple-choice',
          options: [
            '리더 역할을 자주 맡는다',
            '조용히 따라가는 편이다',
            '중재 역할을 자주 한다',
            '혼자 있는 것을 선호한다'
          ],
          required: true,
          ageGroup: ['10s'],
          weight: 1.0
        },
        {
          id: 'teen_core_values',
          category: 'coreValues',
          question: '나에게 가장 중요한 가치는? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '성공',
            '친구',
            '가족',
            '자유',
            '공정함',
            '창의성',
            '안정성',
            '모험'
          ],
          required: true,
          ageGroup: ['10s'],
          weight: 1.0
        },
        {
          id: 'teen_strengths',
          category: 'strengths',
          question: '내가 잘하는 것은? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '공부',
            '운동',
            '예술',
            '리더십',
            '공감능력',
            '창의성',
            '논리적 사고',
            '협력'
          ],
          required: true,
          ageGroup: ['10s'],
          weight: 1.0
        }
      ],
      '20s': [
        // 자아존중감 (20대 특화 - 성인기 진입)
        {
          id: 'twenties_identity',
          category: 'selfEsteem',
          question: '나는 나만의 정체성을 가지고 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['20s'],
          weight: 1.2
        },
        {
          id: 'twenties_career_confidence',
          category: 'selfEsteem',
          question: '내 직업적 능력에 대해 자신감이 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['20s'],
          weight: 1.1
        },
        {
          id: 'twenties_independence',
          category: 'selfEsteem',
          question: '독립적으로 문제를 해결할 수 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['20s'],
          weight: 1.0
        },
        {
          id: 'twenties_work_stress',
          category: 'stressCoping',
          question: '직장/학교 스트레스를 어떻게 해소하나요?',
          type: 'multiple-choice',
          options: [
            '동료/친구들과 대화하기',
            '혼자만의 시간 갖기',
            '운동이나 취미활동',
            '음주나 쇼핑',
            '여행하기'
          ],
          required: true,
          ageGroup: ['20s'],
          weight: 1.0
        },
        {
          id: 'twenties_future_planning',
          category: 'stressCoping',
          question: '미래 계획에 대한 불안감이 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['20s'],
          weight: 1.0
        },
        {
          id: 'twenties_romantic_relationship',
          category: 'relationshipPattern',
          question: '연인과의 관계에서 나는',
          type: 'multiple-choice',
          options: [
            '적극적으로 표현한다',
            '조용히 관찰한다',
            '균형을 맞추려고 노력한다',
            '독립성을 유지한다'
          ],
          required: true,
          ageGroup: ['20s'],
          weight: 1.0
        },
        {
          id: 'twenties_core_values',
          category: 'coreValues',
          question: '나에게 가장 중요한 가치는? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '성공',
            '사랑',
            '자유',
            '안정성',
            '성장',
            '창의성',
            '공정함',
            '모험'
          ],
          required: true,
          ageGroup: ['20s'],
          weight: 1.0
        },
        {
          id: 'twenties_strengths',
          category: 'strengths',
          question: '내가 잘하는 것은? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '업무능력',
            '소통능력',
            '리더십',
            '창의성',
            '문제해결',
            '협력',
            '적응력',
            '전문성'
          ],
          required: true,
          ageGroup: ['20s'],
          weight: 1.0
        }
      ],
      '30s': [
        // 자아존중감 (30대 특화 - 안정기)
        {
          id: 'thirties_life_satisfaction',
          category: 'selfEsteem',
          question: '현재 내 삶에 만족한다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['30s'],
          weight: 1.2
        },
        {
          id: 'thirties_professional_confidence',
          category: 'selfEsteem',
          question: '내 전문성에 대해 자신감이 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['30s'],
          weight: 1.1
        },
        {
          id: 'thirties_work_life_balance',
          category: 'stressCoping',
          question: '일과 삶의 균형을 잘 맞추고 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['30s'],
          weight: 1.0
        },
        {
          id: 'thirties_family_stress',
          category: 'stressCoping',
          question: '가족 관련 스트레스를 어떻게 해소하나요?',
          type: 'multiple-choice',
          options: [
            '배우자와 대화하기',
            '혼자만의 시간 갖기',
            '운동이나 취미활동',
            '친구들과 만나기',
            '전문가 상담받기'
          ],
          required: true,
          ageGroup: ['30s'],
          weight: 1.0
        },
        {
          id: 'thirties_parenting_concerns',
          category: 'stressCoping',
          question: '육아나 가족 관리에 대한 부담감이 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['30s'],
          weight: 1.0
        },
        {
          id: 'thirties_relationship_maturity',
          category: 'relationshipPattern',
          question: '인간관계에서 나는',
          type: 'multiple-choice',
          options: [
            '성숙하게 소통한다',
            '갈등을 피하려고 한다',
            '솔직하게 표현한다',
            '상대방을 배려한다'
          ],
          required: true,
          ageGroup: ['30s'],
          weight: 1.0
        },
        {
          id: 'thirties_core_values',
          category: 'coreValues',
          question: '나에게 가장 중요한 가치는? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '가족',
            '안정성',
            '성공',
            '건강',
            '성장',
            '평화',
            '공정함',
            '사랑'
          ],
          required: true,
          ageGroup: ['30s'],
          weight: 1.0
        },
        {
          id: 'thirties_strengths',
          category: 'strengths',
          question: '내가 잘하는 것은? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '가족관리',
            '업무능력',
            '소통능력',
            '문제해결',
            '리더십',
            '조직력',
            '인내심',
            '전문성'
          ],
          required: true,
          ageGroup: ['30s'],
          weight: 1.0
        }
      ],
      '40s': [
        // 자아존중감 (40대 특화 - 중년기)
        {
          id: 'forties_midlife_satisfaction',
          category: 'selfEsteem',
          question: '중년의 나이에 만족한다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['40s'],
          weight: 1.2
        },
        {
          id: 'forties_wisdom_confidence',
          category: 'selfEsteem',
          question: '내 인생 경험과 지혜에 대해 자신감이 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['40s'],
          weight: 1.1
        },
        {
          id: 'forties_aging_concerns',
          category: 'stressCoping',
          question: '나이듦에 대한 걱정이 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['40s'],
          weight: 1.0
        },
        {
          id: 'forties_career_stress',
          category: 'stressCoping',
          question: '직장에서의 스트레스를 어떻게 해소하나요?',
          type: 'multiple-choice',
          options: [
            '동료들과 대화하기',
            '가족과 시간 보내기',
            '운동이나 취미활동',
            '독서나 명상',
            '여행하기'
          ],
          required: true,
          ageGroup: ['40s'],
          weight: 1.0
        },
        {
          id: 'forties_teenage_children',
          category: 'stressCoping',
          question: '청소년 자녀와의 관계에서 스트레스를 받는다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['40s'],
          weight: 1.0
        },
        {
          id: 'forties_relationship_depth',
          category: 'relationshipPattern',
          question: '인간관계에서 나는',
          type: 'multiple-choice',
          options: [
            '깊이 있는 관계를 선호한다',
            '표면적 관계를 유지한다',
            '선별적으로 관계를 맺는다',
            '모든 사람과 좋은 관계를 유지한다'
          ],
          required: true,
          ageGroup: ['40s'],
          weight: 1.0
        },
        {
          id: 'forties_core_values',
          category: 'coreValues',
          question: '나에게 가장 중요한 가치는? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '가족',
            '건강',
            '안정성',
            '지혜',
            '평화',
            '성장',
            '공정함',
            '사랑'
          ],
          required: true,
          ageGroup: ['40s'],
          weight: 1.0
        },
        {
          id: 'forties_strengths',
          category: 'strengths',
          question: '내가 잘하는 것은? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '가족관리',
            '업무능력',
            '조언하기',
            '문제해결',
            '리더십',
            '조직력',
            '인내심',
            '지혜'
          ],
          required: true,
          ageGroup: ['40s'],
          weight: 1.0
        }
      ],
      '50s+': [
        // 자아존중감 (50대+ 특화 - 성숙기)
        {
          id: 'fifties_life_acceptance',
          category: 'selfEsteem',
          question: '내 인생을 긍정적으로 받아들인다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['50s+'],
          weight: 1.2
        },
        {
          id: 'fifties_legacy_concern',
          category: 'selfEsteem',
          question: '내가 남긴 것에 대해 만족한다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['50s+'],
          weight: 1.1
        },
        {
          id: 'fifties_health_concerns',
          category: 'stressCoping',
          question: '건강에 대한 걱정이 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['50s+'],
          weight: 1.0
        },
        {
          id: 'fifties_retirement_stress',
          category: 'stressCoping',
          question: '은퇴나 노후에 대한 걱정이 있다',
          type: 'scale',
          scaleRange: { 
            min: 1, 
            max: 5, 
            labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'] 
          },
          required: true,
          ageGroup: ['50s+'],
          weight: 1.0
        },
        {
          id: 'fifties_stress_coping',
          category: 'stressCoping',
          question: '스트레스를 어떻게 해소하나요?',
          type: 'multiple-choice',
          options: [
            '가족과 대화하기',
            '혼자만의 시간 갖기',
            '운동이나 취미활동',
            '독서나 명상',
            '여행하기'
          ],
          required: true,
          ageGroup: ['50s+'],
          weight: 1.0
        },
        {
          id: 'fifties_relationship_wisdom',
          category: 'relationshipPattern',
          question: '인간관계에서 나는',
          type: 'multiple-choice',
          options: [
            '지혜롭게 조언한다',
            '조용히 관찰한다',
            '균형을 맞추려고 노력한다',
            '깊이 있는 관계를 선호한다'
          ],
          required: true,
          ageGroup: ['50s+'],
          weight: 1.0
        },
        {
          id: 'fifties_core_values',
          category: 'coreValues',
          question: '나에게 가장 중요한 가치는? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '가족',
            '건강',
            '평화',
            '지혜',
            '사랑',
            '안정성',
            '공정함',
            '성장'
          ],
          required: true,
          ageGroup: ['50s+'],
          weight: 1.0
        },
        {
          id: 'fifties_strengths',
          category: 'strengths',
          question: '내가 잘하는 것은? (3개까지 선택)',
          type: 'multiple-choice',
          options: [
            '가족관리',
            '조언하기',
            '문제해결',
            '리더십',
            '조직력',
            '인내심',
            '지혜',
            '공감능력'
          ],
          required: true,
          ageGroup: ['50s+'],
          weight: 1.0
        }
      ]
    };
  }

  /**
   * 연령대별 맞춤형 질문 조회
   */
  async getPersonalizedQuestions(ageGroup: string): Promise<ProfilingQuestion[]> {
    try {
      const ageGroupQuestions = this.getAgeGroupQuestions();
      const questions = ageGroupQuestions[ageGroup] || ageGroupQuestions['20s']; // 기본값: 20대
      
      return questions;
    } catch (error) {
      console.error('연령대별 질문 조회 오류:', error);
      throw new Error('질문 조회에 실패했습니다.');
    }
  }

  /**
   * 프로파일링 응답 분석 및 결과 생성
   */
  async analyzeProfilingResponses(
    userId: string, 
    ageGroup: string, 
    responses: { [key: string]: any }
  ): Promise<ProfilingResult> {
    try {
      // 점수 계산
      const scores = this.calculateScores(responses, ageGroup);
      
      // 마음 지도 생성
      const mindMap = this.generateMindMap(scores);
      
      // AI 분석 생성
      const aiAnalysis = await this.generateAIAnalysis(responses, ageGroup);
      
      // 결과 저장
      const result: ProfilingResult = {
        userId,
        ageGroup,
        completedAt: new Date(),
        responses,
        scores,
        mindMap,
        aiAnalysis,
        aiWarning: AIWarningService.generateContextualWarning('personal_profiling', {
          dataPoints: Object.keys(responses).length,
          analysisDepth: 'advanced'
        })
      };
      
      await this.saveProfilingResult(result);
      
      return result;
    } catch (error) {
      console.error('프로파일링 분석 오류:', error);
      throw new Error('프로파일링 분석에 실패했습니다.');
    }
  }

  /**
   * 프로파일링 결과 조회
   */
  async getProfilingResult(userId: string): Promise<ProfilingResult | null> {
    try {
      const doc = await this.database.collection('personal_profiles').doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data();
      return {
        userId: data?.userId || userId,
        ageGroup: data?.ageGroup || '20s',
        completedAt: data?.completedAt?.toDate() || new Date(),
        responses: data?.responses || {},
        scores: data?.scores || {},
        mindMap: data?.mindMap || {},
        aiAnalysis: data?.aiAnalysis || {},
        aiWarning: data?.aiWarning || null
      };
    } catch (error) {
      console.error('프로파일링 결과 조회 오류:', error);
      throw new Error('프로파일링 결과 조회에 실패했습니다.');
    }
  }

  /**
   * 점수 계산
   */
  private calculateScores(responses: { [key: string]: any }, ageGroup: string): any {
    const questions = this.getAgeGroupQuestions()[ageGroup] || [];
    
    let selfEsteemTotal = 0;
    let selfEsteemCount = 0;
    
    const stressCoping = {
      active: 0,
      passive: 0,
      social: 0,
      individual: 0
    };
    
    let relationshipPattern = '';
    const coreValues: string[] = [];
    const strengths: string[] = [];
    
    questions.forEach(question => {
      const response = responses[question.id];
      if (!response) return;
      
      switch (question.category) {
        case 'selfEsteem':
          if (typeof response === 'number') {
            selfEsteemTotal += response * (question.weight || 1);
            selfEsteemCount++;
          }
          break;
          
        case 'stressCoping':
          if (Array.isArray(response)) {
            response.forEach(option => {
              if (option.includes('대화') || option.includes('만나기')) {
                stressCoping.social++;
              } else if (option.includes('운동') || option.includes('활동')) {
                stressCoping.active++;
              } else if (option.includes('혼자') || option.includes('독서')) {
                stressCoping.individual++;
              } else {
                stressCoping.passive++;
              }
            });
          }
          break;
          
        case 'relationshipPattern':
          relationshipPattern = response;
          break;
          
        case 'coreValues':
          if (Array.isArray(response)) {
            coreValues.push(...response);
          }
          break;
          
        case 'strengths':
          if (Array.isArray(response)) {
            strengths.push(...response);
          }
          break;
      }
    });
    
    return {
      selfEsteem: selfEsteemCount > 0 ? Math.round((selfEsteemTotal / selfEsteemCount) * 20) : 50,
      stressCoping,
      relationshipPattern,
      coreValues: [...new Set(coreValues)],
      strengths: [...new Set(strengths)]
    };
  }

  /**
   * 마음 지도 생성
   */
  private generateMindMap(scores: any): any {
    // 성격 유형 결정
    let personality = '';
    if (scores.relationshipPattern.includes('리더')) {
      personality = '외향형 리더';
    } else if (scores.relationshipPattern.includes('조용히')) {
      personality = '내향형 사색가';
    } else if (scores.relationshipPattern.includes('중재')) {
      personality = '적응형 중재자';
    } else {
      personality = '균형형 협력자';
    }
    
    // 감정 패턴 분석
    let emotionalPattern = '';
    if (scores.stressCoping.social > scores.stressCoping.individual) {
      emotionalPattern = '관계 중심형';
    } else if (scores.stressCoping.individual > scores.stressCoping.social) {
      emotionalPattern = '내적 성찰형';
    } else if (scores.stressCoping.active > scores.stressCoping.passive) {
      emotionalPattern = '해결 지향형';
    } else {
      emotionalPattern = '감정 표현형';
    }
    
    // 소통 스타일 결정
    let communicationStyle = '';
    if (scores.strengths.includes('소통능력')) {
      communicationStyle = '적극적 소통형';
    } else if (scores.strengths.includes('공감능력')) {
      communicationStyle = '공감적 경청형';
    } else if (scores.strengths.includes('논리적 사고')) {
      communicationStyle = '논리적 설득형';
    } else {
      communicationStyle = '조화로운 대화형';
    }
    
    return {
      personality,
      emotionalPattern,
      communicationStyle,
      growthAreas: this.getGrowthAreas(scores),
      recommendations: this.getRecommendations(scores)
    };
  }

  /**
   * 성장 영역 식별
   */
  private getGrowthAreas(scores: any): string[] {
    const areas: string[] = [];
    
    if (scores.selfEsteem < 60) {
      areas.push('자아존중감 향상');
    }
    
    if (scores.stressCoping.passive > scores.stressCoping.active) {
      areas.push('적극적 스트레스 관리');
    }
    
    if (scores.coreValues.length < 3) {
      areas.push('가치관 정립');
    }
    
    return areas;
  }

  /**
   * 추천사항 생성
   */
  private getRecommendations(scores: any): string[] {
    const recommendations: string[] = [];
    
    if (scores.selfEsteem < 60) {
      recommendations.push('매일 자신을 칭찬하는 습관을 만들어보세요');
    }
    
    if (scores.stressCoping.social > scores.stressCoping.individual) {
      recommendations.push('혼자만의 시간을 갖는 것도 중요합니다');
    }
    
    if (scores.strengths.length < 3) {
      recommendations.push('새로운 취미나 활동을 시도해보세요');
    }
    
    return recommendations;
  }

  /**
   * AI 분석 생성
   */
  private async generateAIAnalysis(responses: { [key: string]: any }, ageGroup: string): Promise<any> {
    try {
      const prompt = `
        연령대: ${ageGroup}
        응답 데이터: ${JSON.stringify(responses)}
        
        이 데이터를 바탕으로 개인화된 심리 분석을 제공해주세요:
        1. 종합 요약 (2-3문장)
        2. 주요 인사이트 (3-5개)
        3. 개인화된 조언 (3-5개)
        4. 월간 목표 (3-5개)
        
        한국어로 답변해주세요.
      `;
      
      const completion = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [
          {
            role: 'system',
            content: '당신은 전문 심리상담사입니다. 사용자의 응답을 바탕으로 따뜻하고 건설적인 분석을 제공해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });
      
      const analysis = completion.choices[0]?.message?.content || '';
      
      return {
        summary: analysis.split('\n')[0] || '분석 결과를 생성했습니다.',
        insights: analysis.split('\n').slice(1, 6).filter(line => line.trim()),
        personalizedAdvice: analysis.split('\n').slice(6, 11).filter(line => line.trim()),
        monthlyGoals: analysis.split('\n').slice(11, 16).filter(line => line.trim())
      };
    } catch (error) {
      console.error('AI 분석 생성 오류:', error);
      return {
        summary: 'AI 분석을 생성하는 중 오류가 발생했습니다.',
        insights: ['분석 결과를 확인해주세요'],
        personalizedAdvice: ['전문가 상담을 권장합니다'],
        monthlyGoals: ['꾸준한 자기 관리를 권장합니다']
      };
    }
  }

  /**
   * 프로파일링 결과 저장
   */
  private async saveProfilingResult(result: ProfilingResult): Promise<void> {
    try {
      await this.database.collection('personal_profiles').doc(result.userId).set({
        ...result,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('프로파일링 결과 저장 오류:', error);
      throw new Error('프로파일링 결과 저장에 실패했습니다.');
    }
  }
}