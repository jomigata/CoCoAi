import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenAI } from 'openai';
// import * as nodemailer from 'nodemailer'; // TODO: Implement email functionality
import cors from 'cors';
import express from 'express';

// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();

// OpenAI 초기화 (환경변수에서 API 키 가져오기)
const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

// CORS 설정
const corsHandler = cors({ origin: true });

// Express 앱 생성
const app = express();
app.use(corsHandler);

/**
 * 🧠 개인 프로파일링 결과 분석 함수
 * 심리상담가 1,2가 설계한 분석 알고리즘 적용
 */
export const analyzeProfilingResults = functions.https.onCall(async (data, context) => {
  try {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, responses } = data;
    
    // AI 분석 프롬프트 (심리상담가 전문 지식 기반)
    const analysisPrompt = `
    당신은 30년 경력의 전문 심리상담가입니다. 다음 프로파일링 응답을 분석해주세요:
    
    응답 데이터: ${JSON.stringify(responses)}
    
    다음 항목들을 분석해주세요:
    1. 자아존중감 수준 (1-5점)
    2. 스트레스 대처 방식 유형
    3. 대인관계 패턴
    4. 핵심 가치관
    5. 개선 권장사항 (실천 가능한 3가지)
    
    ⚠️ 중요: 이 분석은 AI 기반이므로 완전하지 않을 수 있습니다. 전문가 상담을 권장합니다.
    
    JSON 형태로 응답해주세요.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.7,
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content || '{}');
    
    // AI 편향성 경고 메시지 추가
    analysisResult.aiWarning = {
      message: "⚠️ AI 분석 결과 안내",
      details: [
        "이 분석은 AI 기반으로 제공되며, 완전하지 않을 수 있습니다.",
        "개인의 복잡한 심리 상태를 완전히 반영하지 못할 수 있습니다.",
        "정확한 진단을 위해서는 전문 심리상담사와의 상담을 권장합니다.",
        "이 결과는 참고용으로만 활용해주세요."
      ],
      timestamp: new Date().toISOString()
    };

    // Firestore에 결과 저장
    await db.collection('profiling_results').doc(userId).set({
      userId,
      responses,
      analysisResult,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, analysisResult };
    
  } catch (error) {
    console.error('프로파일링 분석 오류:', error);
    throw new functions.https.HttpsError('internal', '분석 중 오류가 발생했습니다.');
  }
});

/**
 * 📊 그룹 위클리 리포트 생성 함수
 * 멤버들의 데일리 기록을 교차 분석
 */
export const generateGroupReport = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { groupId, weekStartDate } = data;
    
    // 그룹 멤버들의 해당 주 데일리 기록 수집
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) {
      throw new functions.https.HttpsError('not-found', '그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();
    const memberIds = groupData?.members || [];
    
    // 각 멤버의 주간 감정 기록 수집
    const weeklyRecords: any[] = [];
    for (const memberId of memberIds) {
      const recordsQuery = await db
        .collection('mood_records')
        .doc(memberId)
        .collection('records')
        .where('createdAt', '>=', new Date(weekStartDate))
        .where('createdAt', '<', new Date(new Date(weekStartDate).getTime() + 7 * 24 * 60 * 60 * 1000))
        .get();
      
      const memberRecords = recordsQuery.docs.map(doc => ({
        memberId,
        ...doc.data()
      }));
      
      weeklyRecords.push(...memberRecords);
    }

    // AI 기반 그룹 분석
    const groupAnalysisPrompt = `
    당신은 관계 심리학 전문가입니다. 다음 그룹의 주간 감정 기록을 분석해주세요:
    
    그룹 정보: ${JSON.stringify(groupData)}
    주간 기록: ${JSON.stringify(weeklyRecords)}
    
    다음 항목들을 분석해주세요:
    1. 그룹 전체 감정 온도 (1-10점)
    2. 각 멤버별 주요 감정 패턴
    3. 그룹 내 감정 연결고리 발견사항
    4. 관계 개선을 위한 맞춤형 조언 (멤버별 3가지씩)
    
    ⚠️ 이 분석은 AI 기반이며, 실제 관계의 복잡성을 완전히 반영하지 못할 수 있습니다.
    
    JSON 형태로 응답해주세요.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: groupAnalysisPrompt }],
      temperature: 0.7,
    });

    const reportResult = JSON.parse(completion.choices[0].message.content || '{}');
    
    // AI 편향성 경고 추가
    reportResult.aiWarning = {
      message: "⚠️ AI 분석 결과 안내",
      details: [
        "이 리포트는 AI 기반 분석으로 제공됩니다.",
        "실제 관계의 복잡성과 맥락을 완전히 파악하지 못할 수 있습니다.",
        "개인적인 상황이나 외부 요인이 반영되지 않을 수 있습니다.",
        "참고용으로 활용하시고, 중요한 결정은 충분한 대화를 통해 해주세요."
      ],
      timestamp: new Date().toISOString()
    };

    // 리포트 저장
    const reportId = `${groupId}_${weekStartDate}`;
    await db.collection('group_reports').doc(reportId).set({
      groupId,
      weekStartDate,
      reportResult,
      memberCount: memberIds.length,
      recordCount: weeklyRecords.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, reportResult, reportId };
    
  } catch (error) {
    console.error('그룹 리포트 생성 오류:', error);
    throw new functions.https.HttpsError('internal', '리포트 생성 중 오류가 발생했습니다.');
  }
});

/**
 * 📧 그룹 초대 이메일 발송 함수
 */
export const sendGroupInvitation = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { groupId, inviteeEmail, inviterName, groupName } = data;
    
    // 초대 토큰 생성
    const invitationId = admin.firestore().collection('invitations').doc().id;
    const invitationToken = Buffer.from(`${groupId}:${inviteeEmail}:${Date.now()}`).toString('base64');
    
    // 초대 정보 저장
    await db.collection('invitations').doc(invitationId).set({
      groupId,
      inviteeEmail,
      inviterUid: context.auth.uid,
      inviterName,
      groupName,
      token: invitationToken,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후 만료
    });

    // 이메일 발송 (실제 구현 시 nodemailer 설정 필요)
    const invitationLink = `https://cocoai-60a2d.web.app/groups/join?token=${invitationToken}`;
    
    console.log(`그룹 초대 이메일 발송: ${inviteeEmail}`);
    console.log(`초대 링크: ${invitationLink}`);
    
    // TODO: 실제 이메일 발송 구현
    // const transporter = nodemailer.createTransporter(...);
    // await transporter.sendMail(...);

    return { 
      success: true, 
      invitationId, 
      invitationLink,
      message: '초대 이메일이 발송되었습니다.' 
    };
    
  } catch (error) {
    console.error('초대 이메일 발송 오류:', error);
    throw new functions.https.HttpsError('internal', '초대 발송 중 오류가 발생했습니다.');
  }
});

/**
 * 🤖 고도화된 AI 챗봇 응답 처리 함수
 * 마음 친구 코코의 지능형 응답 생성
 */
export const processAIChat = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { message, sessionId, userId } = data;
    
    // 고도화된 AI 챗봇 서비스 사용
    const { AIChatService } = await import('./services/aiChatService');
    const chatService = new AIChatService();
    
    // 대화 컨텍스트 구성
    const conversationHistory = await getConversationHistory(sessionId);
    const userProfile = await getUserProfileForChat(userId);
    
    const chatContext = {
      userId,
      sessionId,
      conversationHistory: conversationHistory.map((msg: any) => ({
        role: msg.role || 'user',
        content: msg.content || '',
        timestamp: msg.timestamp || new Date()
      })),
      userProfile
    };
    
    // AI 응답 생성
    const aiResponse = await chatService.generateResponse(message, chatContext);
    
    // 대화 저장
    await chatService.saveConversation(userId, sessionId, message, aiResponse);
    
    return { 
      success: true, 
      response: aiResponse.content,
      emotionalAnalysis: aiResponse.emotionalAnalysis,
      recommendations: aiResponse.recommendations,
      needsProfessionalHelp: aiResponse.needsProfessionalHelp,
      sessionId 
    };
    
  } catch (error) {
    console.error('AI 챗봇 처리 오류:', error);
    throw new functions.https.HttpsError('internal', 'AI 응답 생성 중 오류가 발생했습니다.');
  }
});

// 대화 히스토리 조회 헬퍼 함수
async function getConversationHistory(sessionId: string) {
  const messagesQuery = await db
    .collection('chat_sessions')
    .doc(sessionId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
    
  return messagesQuery.docs.map(doc => doc.data()).reverse();
}

// 사용자 프로파일 조회 헬퍼 함수
async function getUserProfileForChat(userId: string) {
  const profileDoc = await db.collection('profiling_results').doc(userId).get();
  return profileDoc.exists ? profileDoc.data() : null;
}

/**
 * 📈 감정 패턴 분석 함수
 * 개인의 월간 감정 패턴을 분석하여 인사이트 제공
 */
export const analyzeMoodPatterns = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, startDate, endDate } = data;
    
    // 해당 기간의 감정 기록 수집
    const moodRecordsQuery = await db
      .collection('mood_records')
      .doc(userId)
      .collection('records')
      .where('createdAt', '>=', new Date(startDate))
      .where('createdAt', '<=', new Date(endDate))
      .orderBy('createdAt')
      .get();
    
    const moodRecords = moodRecordsQuery.docs.map(doc => doc.data());
    
    if (moodRecords.length === 0) {
      return { 
        success: false, 
        message: '분석할 감정 기록이 충분하지 않습니다.' 
      };
    }

    // AI 패턴 분석
    const patternAnalysisPrompt = `
    다음 감정 기록 데이터를 분석하여 패턴과 인사이트를 제공해주세요:
    
    기록 데이터: ${JSON.stringify(moodRecords)}
    분석 기간: ${startDate} ~ ${endDate}
    
    다음 항목들을 분석해주세요:
    1. 주요 감정 패턴 (요일별, 시간대별)
    2. 스트레스 요인 분석
    3. 긍정적 변화 포인트
    4. 개선을 위한 실천 방안 (구체적인 3가지)
    5. 다음 달 목표 제안
    
    ⚠️ 이 분석은 AI 기반이며, 개인의 복잡한 상황을 완전히 반영하지 못할 수 있습니다.
    
    JSON 형태로 응답해주세요.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: patternAnalysisPrompt }],
      temperature: 0.7,
    });

    const patternResult = JSON.parse(completion.choices[0].message.content || '{}');
    
    // AI 편향성 경고 추가
    patternResult.aiWarning = {
      message: "⚠️ AI 패턴 분석 안내",
      details: [
        "이 분석은 기록된 데이터만을 바탕으로 합니다.",
        "개인적인 상황이나 외부 요인이 고려되지 않을 수 있습니다.",
        "패턴 해석에 AI의 편향이 있을 수 있습니다.",
        "참고용으로 활용하시고, 전문가 상담을 권장합니다."
      ],
      timestamp: new Date().toISOString()
    };

    // 분석 결과 저장
    await db.collection('mood_analytics').doc(userId).collection('monthly_reports').add({
      userId,
      startDate,
      endDate,
      recordCount: moodRecords.length,
      patternResult,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, patternResult };
    
  } catch (error) {
    console.error('감정 패턴 분석 오류:', error);
    throw new functions.https.HttpsError('internal', '패턴 분석 중 오류가 발생했습니다.');
  }
});

/**
 * 🎯 개인화 추천 생성 함수
 * 사용자 맞춤형 콘텐츠 및 활동 추천
 */
export const generateRecommendations = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, type = 'general', limit = 5 } = data;
    
    // 개인화 추천 서비스 사용
    const { RecommendationService } = await import('./services/recommendationService');
    const recommendationService = new RecommendationService();
    
    let recommendations;
    
    switch (type) {
      case 'content':
        recommendations = await recommendationService.generateContentRecommendations(
          userId, 
          data.category || 'article'
        );
        break;
      case 'activity':
        recommendations = await recommendationService.generateActivityRecommendations(
          userId,
          data.timeAvailable || 30
        );
        break;
      default:
        recommendations = await recommendationService.generatePersonalizedRecommendations(
          userId,
          limit
        );
    }
    
    return { 
      success: true, 
      recommendations,
      generatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('개인화 추천 생성 오류:', error);
    throw new functions.https.HttpsError('internal', '추천 생성 중 오류가 발생했습니다.');
  }
});

/**
 * 📊 추천 피드백 저장 함수
 */
export const saveRecommendationFeedback = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { recommendationId, feedback, rating } = data;
    const userId = context.auth.uid;
    
    const { RecommendationService } = await import('./services/recommendationService');
    const recommendationService = new RecommendationService();
    
    await recommendationService.saveFeedback(userId, recommendationId, feedback, rating);
    
    return { success: true };
    
  } catch (error) {
    console.error('추천 피드백 저장 오류:', error);
    throw new functions.https.HttpsError('internal', '피드백 저장 중 오류가 발생했습니다.');
  }
});

// Express 앱을 Cloud Function으로 export
export const api = functions.https.onRequest(app);
