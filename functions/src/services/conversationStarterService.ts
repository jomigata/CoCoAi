/**
 * 💬 대화 스타터 카드 시스템
 * 심리상담가 1,2가 설계한 소통 개선 도구
 * 어색한 상황에서 자연스러운 대화를 시작할 수 있도록 도움
 */

import { db, serverTimestamp } from '../config/firebaseAdmin';
import { openai, AI_MODELS } from '../config/ai';
import * as admin from 'firebase-admin';

// 대화 스타터 카드 인터페이스
interface ConversationStarter {
  id: string;
  category: 'icebreaker' | 'deep' | 'fun' | 'reflective' | 'relationship';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  followUpQuestions: string[];
  context: {
    groupType: 'family' | 'couple' | 'friends' | 'team';
    mood: 'light' | 'serious' | 'playful' | 'intimate';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  };
  tags: string[];
  usageCount: number;
  successRate: number;
}

// 대화 세션 인터페이스
interface ConversationSession {
  id: string;
  groupId: string;
  starterCardId: string;
  participants: string[];
  responses: {
    participantId: string;
    response: string;
    timestamp: Date;
    emotionalTone: 'positive' | 'neutral' | 'negative';
  }[];
  duration: number; // 분 단위
  satisfaction: number; // 1-5
  createdAt: Date;
}

export class ConversationStarterService {
  private database = db;

  /**
   * 그룹 상황에 맞는 대화 스타터 카드 추천
   */
  async getRecommendedStarters(
    groupId: string,
    context: {
      groupType: string;
      currentMood: string;
      timeOfDay: string;
      participants: string[];
    }
  ): Promise<ConversationStarter[]> {
    try {
      // 1. 그룹 히스토리 분석
      const groupHistory = await this.analyzeGroupConversationHistory(groupId);
      
      // 2. 참여자 프로필 분석
      const participantProfiles = await this.getParticipantProfiles(context.participants);
      
      // 3. AI 기반 맞춤형 카드 추천
      const recommendedCards = await this.generatePersonalizedStarters(
        context,
        groupHistory,
        participantProfiles
      );

      return recommendedCards;
      
    } catch (error) {
      console.error('대화 스타터 추천 오류:', error);
      return this.getFallbackStarters(context.groupType);
    }
  }

  /**
   * 대화 세션 시작
   */
  async startConversationSession(
    groupId: string,
    starterCardId: string,
    participants: string[]
  ): Promise<ConversationSession> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: ConversationSession = {
        id: sessionId,
        groupId,
        starterCardId,
        participants,
        responses: [],
        duration: 0,
        satisfaction: 0,
        createdAt: new Date()
      };

      // 세션 저장
      await this.database.collection('conversation_sessions').doc(sessionId).set({
        ...session,
        createdAt: serverTimestamp()
      });

      return session;
      
    } catch (error) {
      console.error('대화 세션 시작 오류:', error);
      throw error;
    }
  }

  /**
   * 대화 응답 기록
   */
  async recordResponse(
    sessionId: string,
    participantId: string,
    response: string
  ): Promise<void> {
    try {
      // 감정 톤 분석
      const emotionalTone = await this.analyzeEmotionalTone(response);
      
      const responseData = {
        participantId,
        response,
        timestamp: serverTimestamp(),
        emotionalTone
      };

      // 응답 추가
      await this.database.collection('conversation_sessions').doc(sessionId).update({
        responses: admin.firestore.FieldValue.arrayUnion(responseData)
      });
      
    } catch (error) {
      console.error('대화 응답 기록 오류:', error);
      throw error;
    }
  }

  /**
   * 대화 세션 완료 및 피드백 수집
   */
  async completeConversationSession(
    sessionId: string,
    duration: number,
    satisfaction: number,
    feedback?: string
  ): Promise<void> {
    try {
      await this.database.collection('conversation_sessions').doc(sessionId).update({
        duration,
        satisfaction,
        feedback,
        completedAt: serverTimestamp()
      });

      // 카드 성공률 업데이트
      await this.updateCardSuccessRate(sessionId, satisfaction);
      
    } catch (error) {
      console.error('대화 세션 완료 오류:', error);
      throw error;
    }
  }

  /**
   * AI 기반 맞춤형 대화 스타터 생성
   */
  private async generatePersonalizedStarters(
    context: any,
    groupHistory: any,
    participantProfiles: any[]
  ): Promise<ConversationStarter[]> {
    const prompt = `
심리상담가가 설계한 대화 스타터 카드를 생성해주세요.

그룹 상황:
- 그룹 유형: ${context.groupType}
- 현재 분위기: ${context.currentMood}
- 시간대: ${context.timeOfDay}
- 참여자 수: ${context.participants.length}명

그룹 히스토리:
${JSON.stringify(groupHistory, null, 2)}

참여자 프로필:
${JSON.stringify(participantProfiles, null, 2)}

다음 형식으로 5개의 대화 스타터 카드를 생성해주세요:
{
  "cards": [
    {
      "category": "icebreaker|deep|fun|reflective|relationship",
      "difficulty": "easy|medium|hard",
      "question": "자연스럽고 흥미로운 질문",
      "followUpQuestions": ["후속 질문 1", "후속 질문 2"],
      "context": {
        "groupType": "${context.groupType}",
        "mood": "light|serious|playful|intimate",
        "timeOfDay": "${context.timeOfDay}"
      },
      "tags": ["태그1", "태그2"]
    }
  ]
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [
          {
            role: 'system',
            content: '당신은 전문 심리상담가입니다. 그룹의 상황과 참여자 특성을 고려하여 효과적인 대화 스타터 카드를 생성합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.formatStarterCards(result.cards || []);
      
    } catch (error) {
      console.error('AI 대화 스타터 생성 오류:', error);
      return this.getFallbackStarters(context.groupType);
    }
  }

  /**
   * 감정 톤 분석
   */
  private async analyzeEmotionalTone(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    const prompt = `
다음 텍스트의 감정 톤을 분석해주세요: "${text}"

positive, neutral, negative 중 하나로 응답해주세요.
`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      const tone = response.choices[0].message.content?.toLowerCase().trim();
      return (tone === 'positive' || tone === 'negative') ? tone : 'neutral';
      
    } catch (error) {
      console.error('감정 톤 분석 오류:', error);
      return 'neutral';
    }
  }

  /**
   * 폴백 대화 스타터 카드
   */
  private getFallbackStarters(groupType: string): ConversationStarter[] {
    const baseStarters = {
      family: [
        {
          id: 'family_1',
          category: 'icebreaker' as const,
          difficulty: 'easy' as const,
          question: '오늘 하루 중 가장 기억에 남는 순간은 무엇인가요?',
          followUpQuestions: ['왜 그 순간이 특별했나요?', '그때 어떤 기분이었나요?'],
          context: {
            groupType: 'family' as const,
            mood: 'light' as const,
            timeOfDay: 'any' as const
          },
          tags: ['일상', '감정', '추억'],
          usageCount: 0,
          successRate: 0
        }
      ],
      couple: [
        {
          id: 'couple_1',
          category: 'relationship' as const,
          difficulty: 'medium' as const,
          question: '서로에게 가장 고마웠던 순간은 언제인가요?',
          followUpQuestions: ['그때 어떤 마음이었나요?', '지금도 그런 마음이 있나요?'],
          context: {
            groupType: 'couple' as const,
            mood: 'intimate' as const,
            timeOfDay: 'evening' as const
          },
          tags: ['감사', '관계', '감정'],
          usageCount: 0,
          successRate: 0
        }
      ],
      friends: [
        {
          id: 'friends_1',
          category: 'fun' as const,
          difficulty: 'easy' as const,
          question: '만약 내일부터 일주일 동안 휴가를 낸다면 어디로 가고 싶나요?',
          followUpQuestions: ['왜 그곳을 선택했나요?', '함께 가고 싶은 사람은?'],
          context: {
            groupType: 'friends' as const,
            mood: 'playful' as const,
            timeOfDay: 'any' as const
          },
          tags: ['여행', '꿈', '재미'],
          usageCount: 0,
          successRate: 0
        }
      ],
      team: [
        {
          id: 'team_1',
          category: 'reflective' as const,
          difficulty: 'medium' as const,
          question: '팀에서 가장 잘하고 있다고 생각하는 부분은 무엇인가요?',
          followUpQuestions: ['어떻게 그런 성과를 낼 수 있었나요?', '다른 팀원들에게 도움이 되는 방법은?'],
          context: {
            groupType: 'team' as const,
            mood: 'serious' as const,
            timeOfDay: 'afternoon' as const
          },
          tags: ['성과', '역량', '협업'],
          usageCount: 0,
          successRate: 0
        }
      ]
    };

    return baseStarters[groupType as keyof typeof baseStarters] || baseStarters.friends;
  }

  /**
   * 스타터 카드 포맷팅
   */
  private formatStarterCards(cards: any[]): ConversationStarter[] {
    return cards.map((card, index) => ({
      id: `ai_generated_${Date.now()}_${index}`,
      category: card.category || 'icebreaker',
      difficulty: card.difficulty || 'medium',
      question: card.question || '',
      followUpQuestions: card.followUpQuestions || [],
      context: card.context || {
        groupType: 'friends',
        mood: 'light',
        timeOfDay: 'any'
      },
      tags: card.tags || [],
      usageCount: 0,
      successRate: 0
    }));
  }

  /**
   * 그룹 대화 히스토리 분석
   */
  private async analyzeGroupConversationHistory(groupId: string): Promise<any> {
    // 실제 구현에서는 그룹의 이전 대화 세션들을 분석
    return {
      totalSessions: 0,
      averageDuration: 0,
      commonTopics: [],
      successfulPatterns: []
    };
  }

  /**
   * 참여자 프로필 조회
   */
  private async getParticipantProfiles(participantIds: string[]): Promise<any[]> {
    // 실제 구현에서는 사용자 프로필 데이터를 조회
    return participantIds.map(id => ({
      id,
      personality: 'unknown',
      interests: [],
      communicationStyle: 'unknown'
    }));
  }

  /**
   * 카드 성공률 업데이트
   */
  private async updateCardSuccessRate(sessionId: string, satisfaction: number): Promise<void> {
    // 실제 구현에서는 카드의 성공률을 업데이트
    console.log(`Session ${sessionId} satisfaction: ${satisfaction}`);
  }
}
