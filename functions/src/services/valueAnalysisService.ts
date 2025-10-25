/**
 * 🎯 공동 가치관 분석 도구
 * 심리상담가 1,2가 설계한 소통 개선 도구
 * 그룹 멤버들의 가치관을 분석하고 공통점과 차이점을 시각화
 */

import { db, serverTimestamp } from '../config/firebaseAdmin';
import { openai, AI_MODELS } from '../config/ai';

// 가치관 인터페이스
interface ValueSystem {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'social' | 'professional' | 'spiritual' | 'material';
  importance: number; // 1-10
  examples: string[];
}

// 가치관 평가 인터페이스
interface ValueAssessment {
  id: string;
  userId: string;
  groupId: string;
  values: {
    valueId: string;
    importance: number; // 1-10
    currentAlignment: number; // 1-10 (현재 삶에서 얼마나 실현되고 있는지)
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  }[];
  completedAt: Date;
  version: string;
}

// 가치관 분석 결과 인터페이스
interface ValueAnalysisResult {
  groupId: string;
  analysisDate: Date;
  individualProfiles: {
    userId: string;
    userName: string;
    topValues: ValueSystem[];
    valuePattern: {
      dominantCategory: string;
      diversity: number; // 0-1
      consistency: number; // 0-1
    };
  }[];
  groupDynamics: {
    sharedValues: ValueSystem[];
    conflictingValues: {
      value: ValueSystem;
      conflictingMembers: string[];
      conflictLevel: 'low' | 'medium' | 'high';
    }[];
    complementaryValues: {
      value: ValueSystem;
      complementaryMembers: string[];
      synergyLevel: number; // 0-1
    }[];
  };
  recommendations: {
    category: 'communication' | 'decision_making' | 'conflict_resolution' | 'goal_setting';
    title: string;
    description: string;
    actionItems: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
  insights: {
    groupCohesion: number; // 0-1
    potentialConflicts: string[];
    growthOpportunities: string[];
    strengths: string[];
  };
}

export class ValueAnalysisService {
  private database = db;

  /**
   * 가치관 평가 시작
   */
  async startValueAssessment(
    groupId: string,
    userId: string,
    assessmentVersion: string = '2.0'
  ): Promise<ValueAssessment> {
    try {
      const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 기본 가치관 목록 조회
      const valueSystems = await this.getValueSystems();
      
      const assessment: ValueAssessment = {
        id: assessmentId,
        userId,
        groupId,
        values: valueSystems.map(value => ({
          valueId: value.id,
          importance: 0, // 사용자가 평가할 값
          currentAlignment: 0, // 사용자가 평가할 값
          priority: 'medium',
          reasoning: ''
        })),
        completedAt: new Date(),
        version: assessmentVersion
      };

      // 평가 저장
      await this.database.collection('value_assessments').doc(assessmentId).set({
        ...assessment,
        createdAt: serverTimestamp()
      });

      return assessment;
      
    } catch (error) {
      console.error('가치관 평가 시작 오류:', error);
      throw error;
    }
  }

  /**
   * 가치관 평가 제출
   */
  async submitValueAssessment(
    assessmentId: string,
    values: ValueAssessment['values']
  ): Promise<void> {
    try {
      await this.database.collection('value_assessments').doc(assessmentId).update({
        values,
        completedAt: serverTimestamp(),
        status: 'completed'
      });
      
    } catch (error) {
      console.error('가치관 평가 제출 오류:', error);
      throw error;
    }
  }

  /**
   * 그룹 가치관 분석 실행
   */
  async analyzeGroupValues(groupId: string): Promise<ValueAnalysisResult> {
    try {
      // 그룹의 모든 가치관 평가 조회
      const assessments = await this.getGroupAssessments(groupId);
      
      if (assessments.length < 2) {
        throw new Error('분석을 위한 충분한 평가 데이터가 없습니다. (최소 2명 필요)');
      }

      // AI 기반 가치관 분석
      const analysisResult = await this.generateValueAnalysis(assessments, groupId);
      
      // 분석 결과 저장
      await this.database.collection('value_analyses').doc(`${groupId}_${Date.now()}`).set({
        ...analysisResult,
        createdAt: serverTimestamp()
      });

      return analysisResult;
      
    } catch (error) {
      console.error('그룹 가치관 분석 오류:', error);
      throw error;
    }
  }

  /**
   * AI 기반 가치관 분석 생성
   */
  private async generateValueAnalysis(
    assessments: ValueAssessment[],
    groupId: string
  ): Promise<ValueAnalysisResult> {
    const prompt = `
심리상담가가 설계한 그룹 가치관 분석을 수행해주세요.

그룹 ID: ${groupId}
평가 참여자 수: ${assessments.length}명

평가 데이터:
${assessments.map(assessment => `
사용자 ID: ${assessment.userId}
가치관 평가:
${assessment.values.map(v => `
- 가치관 ID: ${v.valueId}
- 중요도: ${v.importance}/10
- 현재 실현도: ${v.currentAlignment}/10
- 우선순위: ${v.priority}
- 이유: ${v.reasoning}
`).join('\n')}
`).join('\n')}

다음 형식으로 분석 결과를 제공해주세요:
{
  "individualProfiles": [
    {
      "userId": "사용자ID",
      "userName": "사용자명",
      "topValues": [
        {
          "id": "가치관ID",
          "name": "가치관명",
          "description": "설명",
          "category": "카테고리",
          "importance": 9,
          "examples": ["예시1", "예시2"]
        }
      ],
      "valuePattern": {
        "dominantCategory": "주요 카테고리",
        "diversity": 0.8,
        "consistency": 0.9
      }
    }
  ],
  "groupDynamics": {
    "sharedValues": [
      {
        "id": "공통가치관ID",
        "name": "공통가치관명",
        "description": "설명",
        "category": "카테고리",
        "importance": 8.5,
        "examples": ["예시1", "예시2"]
      }
    ],
    "conflictingValues": [
      {
        "value": {
          "id": "충돌가치관ID",
          "name": "충돌가치관명",
          "description": "설명",
          "category": "카테고리",
          "importance": 7,
          "examples": ["예시1", "예시2"]
        },
        "conflictingMembers": ["멤버1", "멤버2"],
        "conflictLevel": "medium"
      }
    ],
    "complementaryValues": [
      {
        "value": {
          "id": "보완가치관ID",
          "name": "보완가치관명",
          "description": "설명",
          "category": "카테고리",
          "importance": 8,
          "examples": ["예시1", "예시2"]
        },
        "complementaryMembers": ["멤버1", "멤버2"],
        "synergyLevel": 0.9
      }
    ]
  },
  "recommendations": [
    {
      "category": "communication",
      "title": "소통 개선 방안",
      "description": "설명",
      "actionItems": ["실행항목1", "실행항목2"],
      "priority": "high"
    }
  ],
  "insights": {
    "groupCohesion": 0.8,
    "potentialConflicts": ["잠재적 갈등1", "잠재적 갈등2"],
    "growthOpportunities": ["성장 기회1", "성장 기회2"],
    "strengths": ["강점1", "강점2"]
  }
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [
          {
            role: 'system',
            content: '당신은 전문 심리상담가입니다. 그룹의 가치관을 분석하여 깊이 있는 인사이트와 실용적인 추천사항을 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        groupId,
        analysisDate: new Date(),
        individualProfiles: result.individualProfiles || [],
        groupDynamics: result.groupDynamics || {
          sharedValues: [],
          conflictingValues: [],
          complementaryValues: []
        },
        recommendations: result.recommendations || [],
        insights: result.insights || {
          groupCohesion: 0.5,
          potentialConflicts: [],
          growthOpportunities: [],
          strengths: []
        }
      };
      
    } catch (error) {
      console.error('AI 가치관 분석 생성 오류:', error);
      return this.getFallbackAnalysis(assessments, groupId);
    }
  }

  /**
   * 기본 가치관 시스템 조회
   */
  private async getValueSystems(): Promise<ValueSystem[]> {
    return [
      {
        id: 'honesty',
        name: '정직성',
        description: '진실하고 솔직한 소통과 행동',
        category: 'personal',
        importance: 8,
        examples: ['거짓말하지 않기', '솔직한 피드백', '투명한 소통']
      },
      {
        id: 'family',
        name: '가족',
        description: '가족의 안녕과 행복을 최우선으로 생각',
        category: 'personal',
        importance: 9,
        examples: ['가족 시간 우선', '가족 안전 보장', '가족 관계 유지']
      },
      {
        id: 'achievement',
        name: '성취',
        description: '목표 달성과 개인적 성장',
        category: 'professional',
        importance: 7,
        examples: ['목표 설정', '지속적 학습', '성과 창출']
      },
      {
        id: 'creativity',
        name: '창의성',
        description: '새로운 아이디어와 혁신적 사고',
        category: 'personal',
        importance: 6,
        examples: ['창의적 문제해결', '예술적 표현', '혁신적 접근']
      },
      {
        id: 'security',
        name: '안정성',
        description: '안전하고 예측 가능한 환경',
        category: 'material',
        importance: 8,
        examples: ['재정적 안정', '직업 안정성', '물리적 안전']
      },
      {
        id: 'adventure',
        name: '모험',
        description: '새로운 경험과 도전',
        category: 'personal',
        importance: 5,
        examples: ['여행', '새로운 취미', '도전적 목표']
      },
      {
        id: 'helping_others',
        name: '타인 돕기',
        description: '다른 사람들을 돕고 지원하는 것',
        category: 'social',
        importance: 7,
        examples: ['자원봉사', '멘토링', '지원 제공']
      },
      {
        id: 'spirituality',
        name: '영성',
        description: '영적 성장과 의미 추구',
        category: 'spiritual',
        importance: 6,
        examples: ['명상', '기도', '의미 있는 삶']
      }
    ];
  }

  /**
   * 그룹 평가 조회
   */
  private async getGroupAssessments(groupId: string): Promise<ValueAssessment[]> {
    try {
      const snapshot = await this.database
        .collection('value_assessments')
        .where('groupId', '==', groupId)
        .where('status', '==', 'completed')
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate() || new Date()
      })) as ValueAssessment[];
      
    } catch (error) {
      console.error('그룹 평가 조회 오류:', error);
      return [];
    }
  }

  /**
   * 폴백 분석 결과
   */
  private getFallbackAnalysis(assessments: ValueAssessment[], groupId: string): ValueAnalysisResult {
    return {
      groupId,
      analysisDate: new Date(),
      individualProfiles: assessments.map(assessment => ({
        userId: assessment.userId,
        userName: '사용자',
        topValues: [],
        valuePattern: {
          dominantCategory: 'personal',
          diversity: 0.7,
          consistency: 0.8
        }
      })),
      groupDynamics: {
        sharedValues: [],
        conflictingValues: [],
        complementaryValues: []
      },
      recommendations: [
        {
          category: 'communication',
          title: '기본 소통 가이드라인',
          description: '서로의 가치관을 존중하며 소통하세요.',
          actionItems: ['정기적인 대화 시간 갖기', '서로의 관점 이해하기'],
          priority: 'medium'
        }
      ],
      insights: {
        groupCohesion: 0.6,
        potentialConflicts: ['가치관 차이로 인한 갈등 가능성'],
        growthOpportunities: ['가치관 공유를 통한 이해 증진'],
        strengths: ['다양한 관점의 존재']
      }
    };
  }
}
