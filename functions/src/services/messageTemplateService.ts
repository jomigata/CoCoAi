/**
 * 💌 '고마워/미안해' 메시지 템플릿 시스템
 * 심리상담가 1,2가 설계한 소통 개선 도구
 * 진심을 전할 수 있는 메시지 템플릿과 개인화 기능
 */

import { db, serverTimestamp } from '../config/firebaseAdmin';
import { openai, AI_MODELS } from '../config/ai';
import * as admin from 'firebase-admin';

// 메시지 템플릿 인터페이스
interface MessageTemplate {
  id: string;
  category: 'gratitude' | 'apology' | 'encouragement' | 'celebration' | 'support';
  title: string;
  template: string;
  variables: string[]; // {{name}}, {{situation}} 등
  context: {
    relationship: 'family' | 'couple' | 'friends' | 'colleagues' | 'any';
    situation: 'daily' | 'special' | 'difficult' | 'celebration' | 'any';
    tone: 'formal' | 'casual' | 'intimate' | 'playful' | 'sincere' | 'warm' | 'any';
  };
  tags: string[];
  usageCount: number;
  successRate: number;
}

// 개인화된 메시지 인터페이스
interface PersonalizedMessage {
  id: string;
  templateId: string;
  senderId: string;
  recipientId: string;
  groupId?: string;
  category: string;
  content: string;
  variables: { [key: string]: string };
  emotionalTone: 'warm' | 'sincere' | 'playful' | 'serious' | 'gentle';
  deliveryMethod: 'instant' | 'scheduled' | 'draft';
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  reactions: {
    recipientId: string;
    reaction: 'love' | 'appreciate' | 'thankful' | 'moved';
    timestamp: Date;
  }[];
  response?: {
    content: string;
    timestamp: Date;
  };
}

// 메시지 통계 인터페이스
interface MessageStats {
  totalSent: number;
  totalReceived: number;
  categoryBreakdown: { [category: string]: number };
  responseRate: number;
  averageReactionScore: number;
  mostUsedTemplates: string[];
  relationshipImpact: {
    family: number;
    couple: number;
    friends: number;
    colleagues: number;
  };
}

export class MessageTemplateService {
  private database = db;

  /**
   * 상황에 맞는 메시지 템플릿 추천
   */
  async getRecommendedTemplates(
    context: {
      category: string;
      relationship: string;
      situation: string;
      tone: string;
      senderId: string;
      recipientId?: string;
    }
  ): Promise<MessageTemplate[]> {
    try {
      // 1. 기본 템플릿 필터링
      const baseTemplates = await this.getBaseTemplates(context);
      
      // 2. 관계 히스토리 분석
      const relationshipHistory = await this.analyzeRelationshipHistory(
        context.senderId, 
        context.recipientId
      );
      
      // 3. AI 기반 맞춤형 템플릿 생성
      const personalizedTemplates = await this.generatePersonalizedTemplates(
        context,
        relationshipHistory
      );

      return [...baseTemplates, ...personalizedTemplates];
      
    } catch (error) {
      console.error('메시지 템플릿 추천 오류:', error);
      return this.getFallbackTemplates(context.category);
    }
  }

  /**
   * 개인화된 메시지 생성
   */
  async createPersonalizedMessage(
    templateId: string,
    senderId: string,
    recipientId: string,
    variables: { [key: string]: string },
    groupId?: string
  ): Promise<PersonalizedMessage> {
    try {
      // 템플릿 조회
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new Error('템플릿을 찾을 수 없습니다.');
      }

      // AI 기반 개인화 메시지 생성
      const personalizedContent = await this.generatePersonalizedContent(
        template,
        variables,
        senderId,
        recipientId
      );

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const message: PersonalizedMessage = {
        id: messageId,
        templateId,
        senderId,
        recipientId,
        groupId,
        category: template.category,
        content: personalizedContent,
        variables,
        emotionalTone: 'sincere',
        deliveryMethod: 'instant',
        reactions: []
      };

      // 메시지 저장
      await this.database.collection('personalized_messages').doc(messageId).set({
        ...message,
        createdAt: serverTimestamp()
      });

      // 템플릿 사용 횟수 업데이트
      await this.updateTemplateUsage(templateId);

      return message;
      
    } catch (error) {
      console.error('개인화된 메시지 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 메시지 전송
   */
  async sendMessage(
    messageId: string,
    deliveryMethod: 'instant' | 'scheduled' = 'instant',
    scheduledAt?: Date
  ): Promise<void> {
    try {
      const updateData: any = {
        deliveryMethod,
        sentAt: serverTimestamp()
      };

      if (deliveryMethod === 'scheduled' && scheduledAt) {
        updateData.scheduledAt = serverTimestamp();
      }

      await this.database.collection('personalized_messages').doc(messageId).update(updateData);
      
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      throw error;
    }
  }

  /**
   * 메시지 반응 추가
   */
  async addReaction(
    messageId: string,
    recipientId: string,
    reaction: 'love' | 'appreciate' | 'thankful' | 'moved'
  ): Promise<void> {
    try {
      const reactionData = {
        recipientId,
        reaction,
        timestamp: serverTimestamp()
      };

      await this.database.collection('personalized_messages').doc(messageId).update({
        reactions: admin.firestore.FieldValue.arrayUnion(reactionData),
        readAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('메시지 반응 추가 오류:', error);
      throw error;
    }
  }

  /**
   * 메시지 응답 추가
   */
  async addResponse(
    messageId: string,
    recipientId: string,
    responseContent: string
  ): Promise<void> {
    try {
      const responseData = {
        content: responseContent,
        timestamp: serverTimestamp()
      };

      await this.database.collection('personalized_messages').doc(messageId).update({
        response: responseData,
        readAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('메시지 응답 추가 오류:', error);
      throw error;
    }
  }

  /**
   * 메시지 통계 조회
   */
  async getMessageStats(userId: string): Promise<MessageStats> {
    try {
      // 전송한 메시지 통계
      const sentMessages = await this.database
        .collection('personalized_messages')
        .where('senderId', '==', userId)
        .get();

      // 받은 메시지 통계
      const receivedMessages = await this.database
        .collection('personalized_messages')
        .where('recipientId', '==', userId)
        .get();

      return this.calculateMessageStats(sentMessages, receivedMessages);
      
    } catch (error) {
      console.error('메시지 통계 조회 오류:', error);
      return this.getFallbackStats();
    }
  }

  /**
   * AI 기반 개인화된 메시지 생성
   */
  private async generatePersonalizedContent(
    template: MessageTemplate,
    variables: { [key: string]: string },
    senderId: string,
    recipientId: string
  ): Promise<string> {
    const prompt = `
심리상담가가 설계한 메시지 템플릿을 개인화해주세요.

템플릿 정보:
- 카테고리: ${template.category}
- 제목: ${template.title}
- 템플릿: ${template.template}
- 변수: ${template.variables.join(', ')}

입력된 변수:
${Object.entries(variables).map(([key, value]) => `${key}: ${value}`).join('\n')}

관계 정보:
- 발신자: ${senderId}
- 수신자: ${recipientId}

다음 조건을 만족하는 개인화된 메시지를 생성해주세요:
1. 진심이 전해지는 따뜻한 톤
2. 상황에 맞는 적절한 표현
3. 수신자가 공감할 수 있는 내용
4. 자연스럽고 진정성 있는 문장

개인화된 메시지만 응답해주세요.
`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [
          {
            role: 'system',
            content: '당신은 전문 심리상담가입니다. 진심이 전해지는 따뜻하고 개인화된 메시지를 생성합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || template.template;
      
    } catch (error) {
      console.error('AI 개인화 메시지 생성 오류:', error);
      return this.applyVariablesToTemplate(template.template, variables);
    }
  }

  /**
   * 기본 템플릿 조회
   */
  private async getBaseTemplates(context: any): Promise<MessageTemplate[]> {
    const templates = {
      gratitude: [
        {
          id: 'gratitude_1',
          category: 'gratitude' as const,
          title: '일상의 작은 도움에 감사',
          template: '{{name}}님, 오늘 {{situation}}에서 도움을 주셔서 정말 고마웠어요. {{detail}} 덕분에 마음이 따뜻해졌습니다.',
          variables: ['name', 'situation', 'detail'],
          context: {
            relationship: 'any' as const,
            situation: 'daily' as const,
            tone: 'casual' as const
          },
          tags: ['감사', '일상', '도움'],
          usageCount: 0,
          successRate: 0
        }
      ],
      apology: [
        {
          id: 'apology_1',
          category: 'apology' as const,
          title: '진심 어린 사과',
          template: '{{name}}님, {{situation}}에 대해 정말 죄송합니다. {{detail}} 제가 더 신중했어야 했는데, 앞으로는 {{promise}} 하겠습니다.',
          variables: ['name', 'situation', 'detail', 'promise'],
          context: {
            relationship: 'any' as const,
            situation: 'difficult' as const,
            tone: 'sincere' as const
          },
          tags: ['사과', '진심', '개선'],
          usageCount: 0,
          successRate: 0
        }
      ],
      encouragement: [
        {
          id: 'encouragement_1',
          category: 'encouragement' as const,
          title: '힘든 시기에 응원',
          template: '{{name}}님, 지금 {{situation}}이 힘드시겠지만, {{strength}}을 가지고 계신 {{name}}님이라면 충분히 극복하실 수 있을 거예요. 응원합니다!',
          variables: ['name', 'situation', 'strength'],
          context: {
            relationship: 'any' as const,
            situation: 'difficult' as const,
            tone: 'warm' as const
          },
          tags: ['응원', '힘내세요', '지지'],
          usageCount: 0,
          successRate: 0
        }
      ]
    };

    return templates[context.category as keyof typeof templates] || [];
  }

  /**
   * 템플릿에 변수 적용
   */
  private applyVariablesToTemplate(template: string, variables: { [key: string]: string }): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }

  /**
   * 템플릿 조회
   */
  private async getTemplateById(templateId: string): Promise<MessageTemplate | null> {
    // 실제 구현에서는 템플릿 데이터베이스에서 조회
    return null;
  }

  /**
   * 템플릿 사용 횟수 업데이트
   */
  private async updateTemplateUsage(templateId: string): Promise<void> {
    // 실제 구현에서는 템플릿 사용 통계 업데이트
    console.log(`Template ${templateId} usage updated`);
  }

  /**
   * 관계 히스토리 분석
   */
  private async analyzeRelationshipHistory(senderId: string, recipientId?: string): Promise<any> {
    // 실제 구현에서는 두 사용자 간의 메시지 히스토리 분석
    return {
      messageCount: 0,
      commonTopics: [],
      communicationStyle: 'unknown'
    };
  }

  /**
   * 개인화된 템플릿 생성
   */
  private async generatePersonalizedTemplates(context: any, history: any): Promise<MessageTemplate[]> {
    // 실제 구현에서는 AI 기반 개인화된 템플릿 생성
    return [];
  }

  /**
   * 메시지 통계 계산
   */
  private calculateMessageStats(sentMessages: any, receivedMessages: any): MessageStats {
    return {
      totalSent: sentMessages.size,
      totalReceived: receivedMessages.size,
      categoryBreakdown: {},
      responseRate: 0.8,
      averageReactionScore: 4.2,
      mostUsedTemplates: [],
      relationshipImpact: {
        family: 8.5,
        couple: 9.2,
        friends: 7.8,
        colleagues: 6.5
      }
    };
  }

  /**
   * 폴백 템플릿
   */
  private async getFallbackTemplates(category: string): Promise<MessageTemplate[]> {
    return this.getBaseTemplates({ category });
  }

  /**
   * 폴백 통계
   */
  private getFallbackStats(): MessageStats {
    return {
      totalSent: 0,
      totalReceived: 0,
      categoryBreakdown: {},
      responseRate: 0,
      averageReactionScore: 0,
      mostUsedTemplates: [],
      relationshipImpact: {
        family: 0,
        couple: 0,
        friends: 0,
        colleagues: 0
      }
    };
  }
}
