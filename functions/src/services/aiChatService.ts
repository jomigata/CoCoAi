import { openai, AI_MODELS, AI_PROMPTS, detectCrisis, CRISIS_RESPONSE, postProcessAIResponse } from '../config/ai';
import * as admin from 'firebase/admin';

/**
 * 🤖 고도화된 AI 챗봇 서비스
 * 심리상담가 1,2가 설계한 상담 프로세스 적용
 */

interface ChatContext {
  userId: string;
  sessionId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userProfile?: any;
  emotionalState?: {
    current: string;
    intensity: number;
    triggers?: string[];
  };
}

interface AIResponse {
  content: string;
  emotionalAnalysis: {
    detectedEmotions: string[];
    intensity: number;
    urgency: 'low' | 'medium' | 'high' | 'crisis';
  };
  recommendations: string[];
  followUpQuestions: string[];
  needsProfessionalHelp: boolean;
}

export class AIChatService {
  private db = admin.firestore();

  /**
   * 메인 AI 챗봇 응답 생성
   */
  async generateResponse(
    message: string, 
    context: ChatContext
  ): Promise<AIResponse> {
    try {
      // 1. 위기 상황 감지
      if (detectCrisis(message)) {
        return this.handleCrisisResponse(message, context);
      }

      // 2. 감정 분석
      const emotionalAnalysis = await this.analyzeEmotion(message);

      // 3. 대화 맥락 구성
      const conversationContext = this.buildConversationContext(message, context);

      // 4. AI 응답 생성
      const aiResponse = await this.callOpenAI(conversationContext, context);

      // 5. 응답 후처리 및 검증
      const processedResponse = postProcessAIResponse(aiResponse, 'chat');

      // 6. 추천사항 및 후속 질문 생성
      const recommendations = await this.generateRecommendations(message, emotionalAnalysis);
      const followUpQuestions = this.generateFollowUpQuestions(emotionalAnalysis);

      // 7. 전문가 상담 필요성 판단
      const needsProfessionalHelp = this.assessProfessionalHelpNeed(
        emotionalAnalysis, 
        context.conversationHistory
      );

      return {
        content: processedResponse,
        emotionalAnalysis,
        recommendations,
        followUpQuestions,
        needsProfessionalHelp
      };

    } catch (error) {
      console.error('AI 챗봇 응답 생성 오류:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * 위기 상황 처리
   */
  private async handleCrisisResponse(
    message: string, 
    context: ChatContext
  ): Promise<AIResponse> {
    // 위기 상황 로그 저장
    await this.logCrisisEvent(context.userId, message);

    return {
      content: CRISIS_RESPONSE,
      emotionalAnalysis: {
        detectedEmotions: ['위기', '절망', '고통'],
        intensity: 10,
        urgency: 'crisis'
      },
      recommendations: [
        '즉시 전문가 상담 받기',
        '신뢰할 수 있는 사람과 대화하기',
        '안전한 환경 확보하기'
      ],
      followUpQuestions: [],
      needsProfessionalHelp: true
    };
  }

  /**
   * 감정 분석
   */
  private async analyzeEmotion(message: string): Promise<{
    detectedEmotions: string[];
    intensity: number;
    urgency: 'low' | 'medium' | 'high' | 'crisis';
  }> {
    try {
      const prompt = `
다음 메시지의 감정을 분석해주세요:
"${message}"

분석 결과를 JSON 형태로 제공해주세요:
{
  "detectedEmotions": ["감정1", "감정2", ...],
  "intensity": 1-10 점수,
  "urgency": "low|medium|high|crisis"
}
`;

      const completion = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        detectedEmotions: result.detectedEmotions || ['중성'],
        intensity: result.intensity || 5,
        urgency: result.urgency || 'low'
      };

    } catch (error) {
      console.error('감정 분석 오류:', error);
      return {
        detectedEmotions: ['중성'],
        intensity: 5,
        urgency: 'low'
      };
    }
  }

  /**
   * 대화 맥락 구성
   */
  private buildConversationContext(message: string, context: ChatContext): string {
    let contextPrompt = AI_PROMPTS.COCO_CHATBOT;

    // 사용자 프로필 정보 추가
    if (context.userProfile) {
      contextPrompt += `\n\n사용자 프로필 정보:\n${JSON.stringify(context.userProfile, null, 2)}`;
    }

    // 대화 히스토리 추가 (최근 5개)
    if (context.conversationHistory.length > 0) {
      const recentHistory = context.conversationHistory.slice(-5);
      contextPrompt += '\n\n최근 대화 내용:\n';
      recentHistory.forEach(msg => {
        contextPrompt += `${msg.role}: ${msg.content}\n`;
      });
    }

    // 현재 감정 상태 추가
    if (context.emotionalState) {
      contextPrompt += `\n\n현재 감정 상태: ${context.emotionalState.current} (강도: ${context.emotionalState.intensity}/10)`;
    }

    contextPrompt += `\n\n사용자 메시지: "${message}"\n\n따뜻하고 도움이 되는 응답을 해주세요.`;

    return contextPrompt;
  }

  /**
   * OpenAI API 호출
   */
  private async callOpenAI(prompt: string, context: ChatContext): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.CHAT,
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.8,
      max_tokens: 500,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    return completion.choices[0].message.content || '';
  }

  /**
   * 추천사항 생성
   */
  private async generateRecommendations(
    message: string, 
    emotionalAnalysis: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // 감정 상태에 따른 추천
    if (emotionalAnalysis.intensity > 7) {
      recommendations.push('깊은 호흡이나 명상으로 마음을 진정시켜보세요');
      recommendations.push('신뢰할 수 있는 사람과 이야기해보세요');
    }

    if (emotionalAnalysis.detectedEmotions.includes('스트레스')) {
      recommendations.push('짧은 산책이나 스트레칭을 해보세요');
      recommendations.push('좋아하는 음악을 들어보세요');
    }

    if (emotionalAnalysis.detectedEmotions.includes('외로움')) {
      recommendations.push('가족이나 친구에게 안부 인사를 해보세요');
      recommendations.push('관심 있는 온라인 커뮤니티에 참여해보세요');
    }

    // 기본 추천사항
    if (recommendations.length === 0) {
      recommendations.push('오늘 하루 감사한 일 3가지를 생각해보세요');
      recommendations.push('충분한 수면과 규칙적인 생활을 유지하세요');
    }

    return recommendations.slice(0, 3); // 최대 3개
  }

  /**
   * 후속 질문 생성
   */
  private generateFollowUpQuestions(emotionalAnalysis: any): string[] {
    const questions: string[] = [];

    if (emotionalAnalysis.intensity > 6) {
      questions.push('이런 감정이 언제부터 시작되었나요?');
      questions.push('특별히 힘든 상황이 있으셨나요?');
    } else {
      questions.push('오늘 하루 중 가장 기분 좋았던 순간은 언제였나요?');
      questions.push('요즘 관심 있는 일이나 취미가 있으신가요?');
    }

    return questions.slice(0, 2); // 최대 2개
  }

  /**
   * 전문가 상담 필요성 판단
   */
  private assessProfessionalHelpNeed(
    emotionalAnalysis: any, 
    conversationHistory: any[]
  ): boolean {
    // 위기 상황
    if (emotionalAnalysis.urgency === 'crisis') return true;

    // 지속적인 고강도 부정 감정
    if (emotionalAnalysis.intensity > 8) return true;

    // 반복적인 우울/불안 표현 (최근 5회 대화 중 3회 이상)
    const recentNegativeCount = conversationHistory
      .slice(-5)
      .filter(msg => 
        msg.role === 'user' && 
        (msg.content.includes('우울') || 
         msg.content.includes('불안') || 
         msg.content.includes('힘들'))
      ).length;

    if (recentNegativeCount >= 3) return true;

    return false;
  }

  /**
   * 위기 상황 로그 저장
   */
  private async logCrisisEvent(userId: string, message: string): Promise<void> {
    try {
      await this.db.collection('crisis_logs').add({
        userId,
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        handled: true
      });
    } catch (error) {
      console.error('위기 상황 로그 저장 오류:', error);
    }
  }

  /**
   * 폴백 응답 (오류 시)
   */
  private getFallbackResponse(): AIResponse {
    return {
      content: `죄송합니다. 일시적인 오류가 발생했습니다. 😔

잠시 후 다시 시도해주시거나, 급한 상담이 필요하시면 전문 상담 기관에 연락해주세요.

📞 상담 전화:
• 생명의전화: 1588-9191
• 청소년전화: 1388

💡 이 응답은 AI 기반이며, 전문적인 상담이 필요한 경우 전문가와 상담하시기를 권장합니다.`,
      emotionalAnalysis: {
        detectedEmotions: ['중성'],
        intensity: 5,
        urgency: 'low'
      },
      recommendations: ['잠시 후 다시 시도해보세요'],
      followUpQuestions: [],
      needsProfessionalHelp: false
    };
  }

  /**
   * 대화 세션 저장
   */
  async saveConversation(
    userId: string,
    sessionId: string,
    userMessage: string,
    aiResponse: AIResponse
  ): Promise<void> {
    try {
      const conversationData = {
        userId,
        sessionId,
        userMessage,
        aiResponse: aiResponse.content,
        emotionalAnalysis: aiResponse.emotionalAnalysis,
        recommendations: aiResponse.recommendations,
        needsProfessionalHelp: aiResponse.needsProfessionalHelp,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      await this.db
        .collection('chat_sessions')
        .doc(sessionId)
        .collection('messages')
        .add(conversationData);

      // 세션 메타데이터 업데이트
      await this.db
        .collection('chat_sessions')
        .doc(sessionId)
        .set({
          userId,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          messageCount: admin.firestore.FieldValue.increment(1),
          lastEmotionalState: aiResponse.emotionalAnalysis
        }, { merge: true });

    } catch (error) {
      console.error('대화 저장 오류:', error);
    }
  }
}

export default AIChatService;
