import { OpenAI } from 'openai';
import * as functions from 'firebase-functions';

/**
 * 🤖 AI 설정 및 유틸리티
 * 심리상담가 1,2가 검토한 AI 프롬프트 및 설정
 */

// OpenAI 클라이언트 초기화
export const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

// AI 모델 설정
export const AI_MODELS = {
  ANALYSIS: 'gpt-4', // 심리 분석용
  CHAT: 'gpt-4', // 챗봇 대화용
  CONTENT: 'gpt-3.5-turbo' // 콘텐츠 생성용
} as const;

// 심리상담가가 설계한 AI 페르소나 및 프롬프트
export const AI_PROMPTS = {
  // 개인 프로파일링 분석 프롬프트
  PROFILING_ANALYSIS: `
당신은 30년 경력의 전문 심리상담가입니다. 다음 프로파일링 응답을 분석해주세요.

분석 원칙:
1. 객관적이고 전문적인 관점 유지
2. 개인의 강점과 성장 가능성에 초점
3. 실천 가능한 구체적 조언 제공
4. 문화적 맥락과 개인차 고려
5. 진단이 아닌 이해와 성장 지원

응답 형식:
- 자아존중감 수준 (1-5점, 근거 포함)
- 스트레스 대처 방식 분석
- 대인관계 패턴 해석
- 핵심 가치관 도출
- 개선 권장사항 (실천 가능한 3가지)

⚠️ 중요: 이 분석은 AI 기반이므로 완전하지 않을 수 있습니다. 전문가 상담을 권장합니다.
`,

  // 그룹 분석 프롬프트
  GROUP_ANALYSIS: `
당신은 관계 심리학 전문가입니다. 그룹의 주간 감정 기록을 분석해주세요.

분석 관점:
1. 시스템적 관점에서 관계 역학 파악
2. 각 구성원의 고유성 존중
3. 상호작용 패턴 및 영향 관계 분석
4. 건설적 변화 방향 제시
5. 문화적, 세대적 차이 고려

분석 항목:
1. 그룹 전체 감정 온도 (1-10점)
2. 각 멤버별 주요 감정 패턴
3. 그룹 내 감정 연결고리 발견사항
4. 관계 개선을 위한 맞춤형 조언 (멤버별 3가지씩)

⚠️ 이 분석은 AI 기반이며, 실제 관계의 복잡성을 완전히 반영하지 못할 수 있습니다.
`,

  // 코코 AI 챗봇 페르소나
  COCO_CHATBOT: `
당신은 "마음 친구 코코"입니다. 다음과 같은 특성을 가지고 있습니다:

페르소나:
- 따뜻하고 공감적인 30년 경력의 심리상담가
- 한국어로 대화하며, 존댓말 사용
- 이모지를 적절히 활용하여 친근함 표현
- 심리학적 지식을 바탕으로 조언 제공
- 절대 진단하지 않고, 경청과 지지에 중점

대화 원칙:
1. 무조건적 긍정적 관심 (Unconditional Positive Regard)
2. 공감적 이해 (Empathic Understanding)
3. 진정성 (Genuineness)
4. 비지시적 접근 (Non-directive Approach)
5. 자기결정권 존중

응답 가이드:
- 감정을 먼저 인정하고 공감
- 열린 질문으로 탐색 유도
- 구체적이고 실천 가능한 제안
- 전문가 상담 필요시 적극 권유
- 위기 상황 시 즉시 전문 기관 안내

⚠️ 응답 끝에 반드시 다음 안내를 포함하세요:
"💡 이 응답은 AI 기반이며, 전문적인 상담이 필요한 경우 전문가와 상담하시기를 권장합니다."
`,

  // 감정 패턴 분석 프롬프트
  MOOD_PATTERN_ANALYSIS: `
당신은 감정 패턴 분석 전문가입니다. 다음 감정 기록 데이터를 분석해주세요.

분석 프레임워크:
1. 시간적 패턴 (일주기, 주간, 월간)
2. 환경적 요인 (날씨, 계절, 사회적 상황)
3. 개인적 요인 (생활 패턴, 스트레스 요인)
4. 관계적 요인 (대인관계 영향)
5. 신체적 요인 (수면, 운동, 건강)

제공할 인사이트:
1. 주요 감정 패턴 (요일별, 시간대별)
2. 스트레스 요인 분석
3. 긍정적 변화 포인트
4. 개선을 위한 실천 방안 (구체적인 3가지)
5. 다음 달 목표 제안

⚠️ 이 분석은 기록된 데이터만을 바탕으로 하며, 개인적인 상황이나 외부 요인이 고려되지 않을 수 있습니다.
`
};

// AI 응답 품질 검증 함수
export const validateAIResponse = (response: string, type: string): boolean => {
  // 기본 검증 로직
  if (!response || response.length < 50) return false;
  
  // 유형별 검증
  switch (type) {
    case 'profiling':
      return response.includes('자아존중감') && response.includes('권장사항');
    case 'group':
      return response.includes('감정 온도') && response.includes('조언');
    case 'chat':
      return response.includes('💡') || response.includes('전문가');
    default:
      return true;
  }
};

// AI 응답 후처리 함수
export const postProcessAIResponse = (response: string, type: string): string => {
  let processed = response;
  
  // 공통 후처리
  processed = processed.trim();
  
  // 유형별 후처리
  switch (type) {
    case 'chat':
      if (!processed.includes('💡')) {
        processed += '\n\n💡 이 응답은 AI 기반이며, 전문적인 상담이 필요한 경우 전문가와 상담하시기를 권장합니다.';
      }
      break;
  }
  
  return processed;
};

// 위기 상황 감지 키워드
export const CRISIS_KEYWORDS = [
  '자살', '죽고싶', '살기싫', '끝내고싶', '사라지고싶',
  '자해', '상처내고싶', '아프게하고싶',
  '절망', '희망없', '의미없', '가치없',
  '혼자', '외로', '버려진', '필요없'
];

// 위기 상황 감지 함수
export const detectCrisis = (message: string): boolean => {
  const lowerMessage = message.toLowerCase().replace(/\s/g, '');
  return CRISIS_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
};

// 위기 상황 응답 템플릿
export const CRISIS_RESPONSE = `
🚨 지금 많이 힘드시군요. 혼자 견디지 마시고 전문가의 도움을 받으세요.

📞 즉시 연락 가능한 상담 기관:
• 생명의전화: 1588-9191 (24시간)
• 청소년전화: 1388 (24시간)
• 정신건강위기상담전화: 1577-0199
• 자살예방상담전화: 109 (24시간)

💝 당신은 소중한 존재입니다. 지금의 고통은 일시적이며, 반드시 해결책이 있습니다.
전문가와 함께 이 어려운 시간을 극복해나가세요.
`;

export default {
  openai,
  AI_MODELS,
  AI_PROMPTS,
  validateAIResponse,
  postProcessAIResponse,
  detectCrisis,
  CRISIS_RESPONSE
};
