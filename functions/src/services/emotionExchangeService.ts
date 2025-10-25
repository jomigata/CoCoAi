/**
 * 📝 실시간 감정 교환 일기 시스템
 * 심리상담가 1,2가 설계한 소통 개선 도구
 * 그룹 멤버들이 실시간으로 감정과 생각을 공유하는 공간
 */

import { db, serverTimestamp } from '../config/firebaseAdmin';
import { openai, AI_MODELS } from '../config/ai';
import * as admin from 'firebase-admin';

// 감정 교환 일기 인터페이스
interface EmotionExchangeDiary {
  id: string;
  groupId: string;
  title: string;
  description: string;
  prompt: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  participants: string[];
  entries: EmotionEntry[];
  status: 'active' | 'completed' | 'expired';
  insights?: DiaryInsights;
}

// 감정 일기 항목 인터페이스
interface EmotionEntry {
  id: string;
  participantId: string;
  participantName: string;
  content: string;
  emotionalState: {
    primary: string;
    intensity: number; // 1-10
    secondary: string[];
  };
  mood: {
    happiness: number; // 1-10
    sadness: number; // 1-10
    anger: number; // 1-10
    fear: number; // 1-10
    surprise: number; // 1-10
  };
  tags: string[];
  isAnonymous: boolean;
  createdAt: Date;
  reactions: {
    participantId: string;
    reaction: 'like' | 'love' | 'support' | 'empathy';
    timestamp: Date;
  }[];
  comments: {
    participantId: string;
    content: string;
    timestamp: Date;
  }[];
}

// 일기 인사이트 인터페이스
interface DiaryInsights {
  commonThemes: string[];
  emotionalPatterns: {
    dominantEmotion: string;
    averageIntensity: number;
    emotionalDiversity: number;
  };
  groupCohesion: {
    empathyLevel: number;
    supportLevel: number;
    communicationQuality: number;
  };
  individualInsights: {
    participantId: string;
    emotionalProfile: string;
    growthAreas: string[];
    strengths: string[];
  }[];
  recommendations: string[];
}

export class EmotionExchangeService {
  private database = db;

  /**
   * 감정 교환 일기 생성
   */
  async createEmotionDiary(
    groupId: string,
    creatorId: string,
    diaryData: {
      title: string;
      description: string;
      prompt: string;
      duration: number; // 시간 단위
    }
  ): Promise<EmotionExchangeDiary> {
    try {
      const diaryId = `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + diaryData.duration * 60 * 60 * 1000);

      const diary: EmotionExchangeDiary = {
        id: diaryId,
        groupId,
        title: diaryData.title,
        description: diaryData.description,
        prompt: diaryData.prompt,
        createdBy: creatorId,
        createdAt: now,
        expiresAt,
        participants: [],
        entries: [],
        status: 'active'
      };

      // 일기 저장
      await this.database.collection('emotion_diaries').doc(diaryId).set({
        ...diary,
        createdAt: serverTimestamp(),
        expiresAt: serverTimestamp()
      });

      return diary;
      
    } catch (error) {
      console.error('감정 교환 일기 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 감정 일기 항목 추가
   */
  async addEmotionEntry(
    diaryId: string,
    participantId: string,
    entryData: {
      content: string;
      emotionalState: EmotionEntry['emotionalState'];
      mood: EmotionEntry['mood'];
      tags: string[];
      isAnonymous: boolean;
    }
  ): Promise<EmotionEntry> {
    try {
      const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 참여자 이름 조회
      const participantName = await this.getParticipantName(participantId);
      
      const entry: EmotionEntry = {
        id: entryId,
        participantId,
        participantName,
        content: entryData.content,
        emotionalState: entryData.emotionalState,
        mood: entryData.mood,
        tags: entryData.tags,
        isAnonymous: entryData.isAnonymous,
        createdAt: new Date(),
        reactions: [],
        comments: []
      };

      // 일기에 항목 추가
      await this.database.collection('emotion_diaries').doc(diaryId).update({
        entries: admin.firestore.FieldValue.arrayUnion(entry),
        participants: admin.firestore.FieldValue.arrayUnion(participantId)
      });

      return entry;
      
    } catch (error) {
      console.error('감정 일기 항목 추가 오류:', error);
      throw error;
    }
  }

  /**
   * 감정 일기 반응 추가
   */
  async addReaction(
    diaryId: string,
    entryId: string,
    participantId: string,
    reaction: 'like' | 'love' | 'support' | 'empathy'
  ): Promise<void> {
    try {
      const reactionData = {
        participantId,
        reaction,
        timestamp: serverTimestamp()
      };

      // 해당 항목에 반응 추가 (실제 구현에서는 중첩된 배열 업데이트 필요)
      await this.database.collection('emotion_diaries').doc(diaryId).update({
        [`entries.${entryId}.reactions`]: admin.firestore.FieldValue.arrayUnion(reactionData)
      });
      
    } catch (error) {
      console.error('감정 일기 반응 추가 오류:', error);
      throw error;
    }
  }

  /**
   * 감정 일기 댓글 추가
   */
  async addComment(
    diaryId: string,
    entryId: string,
    participantId: string,
    content: string
  ): Promise<void> {
    try {
      const commentData = {
        participantId,
        content,
        timestamp: serverTimestamp()
      };

      // 해당 항목에 댓글 추가
      await this.database.collection('emotion_diaries').doc(diaryId).update({
        [`entries.${entryId}.comments`]: admin.firestore.FieldValue.arrayUnion(commentData)
      });
      
    } catch (error) {
      console.error('감정 일기 댓글 추가 오류:', error);
      throw error;
    }
  }

  /**
   * 감정 일기 인사이트 생성
   */
  async generateDiaryInsights(diaryId: string): Promise<DiaryInsights> {
    try {
      const diary = await this.getDiaryById(diaryId);
      if (!diary || diary.entries.length === 0) {
        throw new Error('분석할 일기 항목이 없습니다.');
      }

      // AI 기반 인사이트 생성
      const insights = await this.generateAIInsights(diary);
      
      // 인사이트 저장
      await this.database.collection('emotion_diaries').doc(diaryId).update({
        insights,
        status: 'completed'
      });

      return insights;
      
    } catch (error) {
      console.error('감정 일기 인사이트 생성 오류:', error);
      throw error;
    }
  }

  /**
   * AI 기반 인사이트 생성
   */
  private async generateAIInsights(diary: EmotionExchangeDiary): Promise<DiaryInsights> {
    const prompt = `
심리상담가가 설계한 감정 교환 일기 분석을 수행해주세요.

일기 정보:
- 제목: ${diary.title}
- 설명: ${diary.description}
- 프롬프트: ${diary.prompt}
- 참여자 수: ${diary.participants.length}명
- 항목 수: ${diary.entries.length}개

항목 내용:
${diary.entries.map(entry => `
참여자: ${entry.isAnonymous ? '익명' : entry.participantName}
내용: ${entry.content}
감정 상태: ${entry.emotionalState.primary} (강도: ${entry.emotionalState.intensity}/10)
기분: 행복(${entry.mood.happiness}) 슬픔(${entry.mood.sadness}) 분노(${entry.mood.anger}) 두려움(${entry.mood.fear}) 놀람(${entry.mood.surprise})
태그: ${entry.tags.join(', ')}
`).join('\n')}

다음 형식으로 분석 결과를 제공해주세요:
{
  "commonThemes": ["공통 주제 1", "공통 주제 2"],
  "emotionalPatterns": {
    "dominantEmotion": "주요 감정",
    "averageIntensity": 7.5,
    "emotionalDiversity": 0.8
  },
  "groupCohesion": {
    "empathyLevel": 8.2,
    "supportLevel": 7.8,
    "communicationQuality": 8.5
  },
  "individualInsights": [
    {
      "participantId": "참여자ID",
      "emotionalProfile": "감정 프로필 설명",
      "growthAreas": ["성장 영역 1", "성장 영역 2"],
      "strengths": ["강점 1", "강점 2"]
    }
  ],
  "recommendations": ["추천사항 1", "추천사항 2"]
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODELS.ANALYSIS,
        messages: [
          {
            role: 'system',
            content: '당신은 전문 심리상담가입니다. 그룹의 감정 교환 일기를 분석하여 깊이 있는 인사이트를 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as DiaryInsights;
      
    } catch (error) {
      console.error('AI 인사이트 생성 오류:', error);
      return this.getFallbackInsights(diary);
    }
  }

  /**
   * 일기 조회
   */
  private async getDiaryById(diaryId: string): Promise<EmotionExchangeDiary | null> {
    try {
      const doc = await this.database.collection('emotion_diaries').doc(diaryId).get();
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data();
      return {
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        expiresAt: data?.expiresAt?.toDate() || new Date(),
        entries: data?.entries || []
      } as EmotionExchangeDiary;
      
    } catch (error) {
      console.error('일기 조회 오류:', error);
      return null;
    }
  }

  /**
   * 참여자 이름 조회
   */
  private async getParticipantName(participantId: string): Promise<string> {
    try {
      const doc = await this.database.collection('users').doc(participantId).get();
      if (doc.exists) {
        const data = doc.data();
        return data?.displayName || '익명';
      }
      return '익명';
      
    } catch (error) {
      console.error('참여자 이름 조회 오류:', error);
      return '익명';
    }
  }

  /**
   * 폴백 인사이트
   */
  private getFallbackInsights(diary: EmotionExchangeDiary): DiaryInsights {
    return {
      commonThemes: ['감정 공유', '상호 이해'],
      emotionalPatterns: {
        dominantEmotion: '긍정적',
        averageIntensity: 6.5,
        emotionalDiversity: 0.7
      },
      groupCohesion: {
        empathyLevel: 7.0,
        supportLevel: 7.0,
        communicationQuality: 7.0
      },
      individualInsights: diary.participants.map(participantId => ({
        participantId,
        emotionalProfile: '균형잡힌 감정 표현',
        growthAreas: ['감정 인식', '소통 기술'],
        strengths: ['공감 능력', '지지적 태도']
      })),
      recommendations: [
        '정기적인 감정 공유 시간을 가져보세요',
        '서로의 감정을 존중하고 이해하려 노력하세요'
      ]
    };
  }
}
