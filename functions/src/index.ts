import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenAI } from 'openai';
// import * as nodemailer from 'nodemailer'; // TODO: Implement email functionality
import cors from 'cors';
import express from 'express';

// Firebase Admin 초기화 (중복 방지)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

// Phase 2: 소통 개선 도구 서비스들
import { ConversationStarterService } from './services/conversationStarterService';
import { EmotionExchangeService } from './services/emotionExchangeService';
import { MessageTemplateService } from './services/messageTemplateService';
import { ValueAnalysisService } from './services/valueAnalysisService';

// Phase 2 Week 9-10: 게이미피케이션 서비스들
import { GardenService } from './services/gardenService';
import { BadgeService } from './services/badgeService';

// 개인 프로파일링 서비스
import { PersonalProfilingService } from './services/personalProfilingService';

// OpenAI 초기화 (환경변수에서 API 키 가져오기)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// CORS 설정
const corsHandler = cors({ origin: true });

// Express 앱 생성
const app = express();
app.use(corsHandler);

/**
 * 🧠 개인 프로파일링 질문 세트 조회 함수
 * 연령대별 맞춤형 질문 제공
 */
export const getProfilingQuestions = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { ageGroup } = data;
    
    const profilingService = new PersonalProfilingService();
    const questions = await profilingService.getPersonalizedQuestions(ageGroup);
    
    return { 
      success: true, 
      questions,
      totalQuestions: questions.length,
      estimatedTime: Math.ceil(questions.length * 0.5) // 질문당 30초 추정
    };
    
  } catch (error) {
    console.error('프로파일링 질문 조회 오류:', error);
    throw new functions.https.HttpsError('internal', '질문 조회 중 오류가 발생했습니다.');
  }
});

/**
 * 🧠 개인 프로파일링 결과 분석 함수
 * 심리상담가 1,2가 설계한 분석 알고리즘 적용
 */
export const analyzeProfilingResults = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, ageGroup, responses } = data;
    
    const profilingService = new PersonalProfilingService();
    const result = await profilingService.analyzeProfilingResponses(userId, ageGroup, responses);
    
    return { 
      success: true, 
      result,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('프로파일링 분석 오류:', error);
    throw new functions.https.HttpsError('internal', '분석 중 오류가 발생했습니다.');
  }
});

/**
 * 🧠 개인 프로파일링 결과 조회 함수
 */
export const getProfilingResult = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId } = data;
    
    const profilingService = new PersonalProfilingService();
    const result = await profilingService.getProfilingResult(userId);
    
    return { 
      success: true, 
      result,
      hasResult: result !== null
    };
    
  } catch (error) {
    console.error('프로파일링 결과 조회 오류:', error);
    throw new functions.https.HttpsError('internal', '결과 조회 중 오류가 발생했습니다.');
  }
});

/**
 * 📊 고도화된 그룹 위클리 리포트 생성 함수 (v2.0)
 * 멤버들의 데일리 기록을 교차 분석하여 관계 패턴 인식
 */
export const generateGroupReport = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { groupId, weekStartDate } = data;
    
    // 그룹 정보 및 멤버 데이터 수집
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) {
      throw new functions.https.HttpsError('not-found', '그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();
    const memberIds = groupData?.members || [];
    
    // 멤버 프로필 정보 수집
    const memberProfiles = [];
    for (const memberId of memberIds) {
      const userDoc = await db.collection('users').doc(memberId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        memberProfiles.push({
          id: memberId,
          name: userData?.displayName || '익명',
          personalProfile: userData?.personalProfile || null
        });
      }
    }
    
    // 각 멤버의 주간 감정 기록 수집
    const weeklyRecords: any[] = [];
    for (const memberId of memberIds) {
      const memberProfile = memberProfiles.find(p => p.id === memberId);
      const recordsQuery = await db
        .collection('mood_records')
        .doc(memberId)
        .collection('records')
        .where('createdAt', '>=', new Date(weekStartDate))
        .where('createdAt', '<', new Date(new Date(weekStartDate).getTime() + 7 * 24 * 60 * 60 * 1000))
        .get();
      
      const memberRecords = recordsQuery.docs.map(doc => ({
        memberId,
        memberName: memberProfile?.name || '익명',
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      weeklyRecords.push(...memberRecords);
    }

    // 고도화된 그룹 분석 서비스 사용
    const { GroupAnalysisService } = await import('./services/groupAnalysisService');
    const analysisService = new GroupAnalysisService();
    
    // 1. 멤버 간 감정 데이터 교차 분석
    const crossAnalysis = await analysisService.performCrossAnalysis(groupId, weeklyRecords);
    
    // 2. 관계 패턴 인식
    const relationshipPatterns = await analysisService.recognizeRelationshipPatterns(
      crossAnalysis, 
      groupData?.type || 'general',
      memberProfiles
    );
    
    // 3. 멤버별 개인화된 조언 생성
    const personalizedAdvice: any = {};
    for (const memberProfile of memberProfiles) {
      const advice = await analysisService.generatePersonalizedAdvice(
        memberProfile.id,
        memberProfile.name,
        crossAnalysis,
        relationshipPatterns,
        {
          groupType: groupData?.type,
          groupName: groupData?.name,
          memberCount: memberIds.length
        }
      );
      personalizedAdvice[memberProfile.id] = advice;
    }
    
    // 4. 종합 리포트 구성
    const reportResult = {
      // 기본 정보
      groupInfo: {
        id: groupId,
        name: groupData?.name,
        type: groupData?.type,
        memberCount: memberIds.length,
        weekStartDate,
        generatedAt: new Date().toISOString()
      },
      
      // 교차 분석 결과
      crossAnalysis,
      
      // 관계 패턴
      relationshipPatterns,
      
      // 개인화된 조언
      personalizedAdvice,
      
      // 그룹 요약
      groupSummary: {
        overallHarmony: crossAnalysis.groupDynamics.overallHarmony,
        emotionalStability: crossAnalysis.groupDynamics.emotionalStability,
        keyInsights: [
          `그룹 조화도: ${(crossAnalysis.groupDynamics.overallHarmony * 100).toFixed(1)}%`,
          `감정 안정성: ${(crossAnalysis.groupDynamics.emotionalStability * 100).toFixed(1)}%`,
          `지지 네트워크: ${crossAnalysis.groupDynamics.supportNetwork.length}명`,
          `관계 패턴: ${relationshipPatterns.length}개 식별`
        ]
      },
      
      // AI 편향성 경고 (강화된 버전)
      aiWarning: {
        message: "⚠️ 고도화된 AI 분석 결과 안내",
        details: [
          "이 리포트는 최신 AI 기술을 활용한 고도화된 분석입니다.",
          "실제 관계의 복잡성과 개인의 고유한 맥락을 완전히 반영하지 못할 수 있습니다.",
          "문화적, 개인적 배경에 따른 차이가 충분히 고려되지 않을 수 있습니다.",
          "AI 분석의 한계를 인정하며, 참고용으로만 활용해주세요.",
          "중요한 관계 결정은 충분한 대화와 전문가 상담을 통해 해주세요."
        ],
        timestamp: new Date().toISOString(),
        version: "2.0"
      }
    };

    // 분석 결과 저장
    await analysisService.saveAnalysisResult(groupId, weekStartDate, reportResult);

    // 리포트 저장
    const reportId = `${groupId}_${weekStartDate}`;
    await db.collection('group_reports').doc(reportId).set({
      groupId,
      weekStartDate,
      reportResult,
      memberCount: memberIds.length,
      recordCount: weeklyRecords.length,
      analysisVersion: '2.0',
      createdAt: serverTimestamp()
    });

    return { 
      success: true, 
      reportResult, 
      reportId,
      analysisVersion: '2.0'
    };
    
  } catch (error) {
    console.error('고도화된 그룹 리포트 생성 오류:', error);
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

/**
 * 🌱 개인 성장 리포트 생성 함수 (v2.0)
 * 월간 감정 패턴 분석 및 실천 가능한 대안 추천
 */
export const generatePersonalGrowthReport = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, month } = data; // month: YYYY-MM 형식
    
    // 개인 성장 서비스 사용
    const { PersonalGrowthService } = await import('./services/personalGrowthService');
    const growthService = new PersonalGrowthService();
    
    // 월간 성장 리포트 생성
    const growthReport = await growthService.generateMonthlyGrowthReport(userId, month);
    
    return { 
      success: true, 
      report: growthReport,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('개인 성장 리포트 생성 오류:', error);
    throw new functions.https.HttpsError('internal', '리포트 생성 중 오류가 발생했습니다.');
  }
});

/**
 * 🔮 꿈 기록 AI 해몽 함수
 * 심리학적 관점에서 꿈 내용 분석
 */
export const analyzeDream = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, dreamContent, dreamDate, emotionalState } = data;
    
    // 최근 감정 패턴 조회
    const recentRecordsQuery = await db
      .collection('mood_records')
      .doc(userId)
      .collection('records')
      .orderBy('createdAt', 'desc')
      .limit(7)
      .get();
    
    const recentMoodPatterns = recentRecordsQuery.docs.map(doc => doc.data());
    
    // 개인 성장 서비스 사용
    const { PersonalGrowthService } = await import('./services/personalGrowthService');
    const growthService = new PersonalGrowthService();
    
    // 꿈 분석
    const dreamAnalysis = await growthService.analyzeDreamRecord(
      userId,
      dreamContent,
      new Date(dreamDate),
      emotionalState,
      recentMoodPatterns
    );
    
    return { 
      success: true, 
      analysis: dreamAnalysis,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('꿈 해석 분석 오류:', error);
    throw new functions.https.HttpsError('internal', '꿈 분석 중 오류가 발생했습니다.');
  }
});

/**
 * 📋 실천 체크 프로그램 생성 함수
 * 개인화된 성장 활동 스케줄 생성
 */
export const createGrowthProgram = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, selectedAlternatives } = data;
    
    // 개인 성장 서비스 사용
    const { PersonalGrowthService } = await import('./services/personalGrowthService');
    const growthService = new PersonalGrowthService();
    
    // 실천 체크 프로그램 생성
    const program = await growthService.createPeriodicCheckProgram(userId, selectedAlternatives);
    
    return { 
      success: true, 
      program,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('성장 프로그램 생성 오류:', error);
    throw new functions.https.HttpsError('internal', '프로그램 생성 중 오류가 발생했습니다.');
  }
});

/**
 * 💬 대화 스타터 카드 추천 함수
 * Phase 2: 소통 개선 도구
 */
export const getConversationStarters = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { groupId, context: conversationContext } = data;
    
    const conversationService = new ConversationStarterService();
    const starters = await conversationService.getRecommendedStarters(groupId, conversationContext);
    
    return { 
      success: true, 
      starters,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('대화 스타터 추천 오류:', error);
    throw new functions.https.HttpsError('internal', '대화 스타터 추천 중 오류가 발생했습니다.');
  }
});

/**
 * 📝 감정 교환 일기 생성 함수
 * Phase 2: 소통 개선 도구
 */
export const createEmotionDiary = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { groupId, creatorId, diaryData } = data;
    
    const emotionService = new EmotionExchangeService();
    const diary = await emotionService.createEmotionDiary(groupId, creatorId, diaryData);
    
    return { 
      success: true, 
      diary,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('감정 교환 일기 생성 오류:', error);
    throw new functions.https.HttpsError('internal', '감정 교환 일기 생성 중 오류가 발생했습니다.');
  }
});

/**
 * 💌 개인화된 메시지 생성 함수
 * Phase 2: 소통 개선 도구
 */
export const createPersonalizedMessage = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { templateId, senderId, recipientId, variables, groupId } = data;
    
    const messageService = new MessageTemplateService();
    const message = await messageService.createPersonalizedMessage(
      templateId, 
      senderId, 
      recipientId, 
      variables, 
      groupId
    );
    
    return { 
      success: true, 
      message,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('개인화된 메시지 생성 오류:', error);
    throw new functions.https.HttpsError('internal', '개인화된 메시지 생성 중 오류가 발생했습니다.');
  }
});

/**
 * 🎯 가치관 분석 함수
 * Phase 2: 소통 개선 도구
 */
export const analyzeGroupValues = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { groupId } = data;
    
    const valueService = new ValueAnalysisService();
    const analysis = await valueService.analyzeGroupValues(groupId);
    
    return { 
      success: true, 
      analysis,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('가치관 분석 오류:', error);
    throw new functions.https.HttpsError('internal', '가치관 분석 중 오류가 발생했습니다.');
  }
});

/**
 * 🌱 정원 정보 조회 함수
 * 사용자의 관계의 정원 상태를 조회합니다.
 */
export const getUserGarden = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId } = data;
    
    const gardenService = new GardenService();
    const garden = await gardenService.getUserGarden(userId);
    
    return { 
      success: true, 
      garden,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('정원 정보 조회 오류:', error);
    throw new functions.https.HttpsError('internal', '정원 정보 조회 중 오류가 발생했습니다.');
  }
});

/**
 * 🌱 정원 액션 수행 함수
 * 물주기, 심기, 수확 등의 정원 액션을 수행합니다.
 */
export const performGardenAction = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, action } = data;
    
    const gardenService = new GardenService();
    const result = await gardenService.performGardenAction(userId, action);
    
    return { 
      success: true, 
      garden: result.garden,
      events: result.events,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('정원 액션 수행 오류:', error);
    throw new functions.https.HttpsError('internal', '정원 액션 수행 중 오류가 발생했습니다.');
  }
});

/**
 * 🌱 그룹 활동 정원 업데이트 함수
 * 그룹 활동과 연동하여 정원을 업데이트합니다.
 */
export const updateGardenFromGroupActivity = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, groupId, activityType } = data;
    
    const gardenService = new GardenService();
    const result = await gardenService.updateGardenFromGroupActivity(userId, groupId, activityType);
    
    return { 
      success: true, 
      garden: result.garden,
      events: result.events,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('그룹 활동 정원 업데이트 오류:', error);
    throw new functions.https.HttpsError('internal', '그룹 활동 정원 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * 🌱 식물 성장 시뮬레이션 함수
 * AI 기반 식물 성장을 시뮬레이션합니다.
 */
export const simulatePlantGrowth = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId } = data;
    
    const gardenService = new GardenService();
    const result = await gardenService.simulatePlantGrowth(userId);
    
    return { 
      success: true, 
      events: result.events,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('식물 성장 시뮬레이션 오류:', error);
    throw new functions.https.HttpsError('internal', '식물 성장 시뮬레이션 중 오류가 발생했습니다.');
  }
});

/**
 * 🏆 사용자 통계 및 뱃지 정보 조회 함수
 */
export const getUserStats = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId } = data;
    
    const badgeService = new BadgeService();
    const userStats = await badgeService.getUserStats(userId);
    
    return { 
      success: true, 
      userStats,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    throw new functions.https.HttpsError('internal', '사용자 통계 조회 중 오류가 발생했습니다.');
  }
});

/**
 * 🏆 뱃지 진행 상황 조회 함수
 */
export const getUserBadgeProgress = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId } = data;
    
    const badgeService = new BadgeService();
    const badgeProgress = await badgeService.getUserBadgeProgress(userId);
    
    return { 
      success: true, 
      badgeProgress,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('뱃지 진행 상황 조회 오류:', error);
    throw new functions.https.HttpsError('internal', '뱃지 진행 상황 조회 중 오류가 발생했습니다.');
  }
});

/**
 * 🏆 뱃지 획득 체크 및 업데이트 함수
 */
export const checkAndUpdateBadges = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, activityType, activityData } = data;
    
    const badgeService = new BadgeService();
    const result = await badgeService.checkAndUpdateBadges(userId, activityType, activityData);
    
    return { 
      success: true, 
      unlockedBadges: result.unlockedBadges,
      updatedStats: result.updatedStats,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('뱃지 체크 및 업데이트 오류:', error);
    throw new functions.https.HttpsError('internal', '뱃지 체크 및 업데이트 중 오류가 발생했습니다.');
  }
});

/**
 * 🏆 칭찬 릴레이 전송 함수
 */
export const sendPraise = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId, targetUserId, praiseMessage } = data;
    
    const badgeService = new BadgeService();
    const result = await badgeService.sendPraise(userId, targetUserId, praiseMessage);
    
    return { 
      success: true, 
      points: result.points,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('칭찬 전송 오류:', error);
    throw new functions.https.HttpsError('internal', '칭찬 전송 중 오류가 발생했습니다.');
  }
});

/**
 * 🏆 칭찬 받은 목록 조회 함수
 */
export const getReceivedPraises = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { userId } = data;
    
    const badgeService = new BadgeService();
    const praises = await badgeService.getReceivedPraises(userId);
    
    return { 
      success: true, 
      praises,
      version: '2.0'
    };
    
  } catch (error) {
    console.error('칭찬 목록 조회 오류:', error);
    throw new functions.https.HttpsError('internal', '칭찬 목록 조회 중 오류가 발생했습니다.');
  }
});

// Express 앱을 Cloud Function으로 export
export const api = functions.https.onRequest(app);
