import { useMemo } from 'react';

/**
 * 🚨 AI 편향성 경고 Hook
 * AI 분석 결과에 표준화된 경고 메시지를 추가하는 Hook
 * 
 * 심리상담가 팀의 검토를 거친 표준 경고 문구 제공
 */

export interface AIWarningData {
  message: string;
  details: string[];
  timestamp: string;
  type: 'warning' | 'info' | 'critical';
  version?: string;
}

interface UseAIWarningOptions {
  analysisType?: 'profiling' | 'mood' | 'group' | 'chat' | 'general' | 'communication';
  severity?: 'low' | 'medium' | 'high';
  includeEmergencyContact?: boolean;
}

export const useAIWarning = (options: UseAIWarningOptions = {}): AIWarningData => {
  const {
    analysisType = 'general',
    severity = 'medium',
    includeEmergencyContact = true
  } = options;

  const warningData = useMemo(() => {
    const baseDetails = [
      "이 분석은 AI 기반으로 제공되며, 완전하지 않을 수 있습니다.",
      "개인의 복잡한 심리 상태와 상황을 완전히 반영하지 못할 수 있습니다.",
      "AI 모델의 학습 데이터에 따른 편향이 있을 수 있습니다."
    ];

    // 분석 유형별 맞춤 경고 메시지
    const typeSpecificDetails: Record<string, string[]> = {
      profiling: [
        ...baseDetails,
        "개인 프로파일링은 설문 응답 시점의 상태만을 반영합니다.",
        "시간이 지나면서 개인의 특성과 상황이 변할 수 있습니다.",
        "정확한 심리 평가를 위해서는 전문가와의 면담이 필요합니다."
      ],
      mood: [
        ...baseDetails,
        "감정 패턴 분석은 기록된 데이터만을 바탕으로 합니다.",
        "외부 환경이나 개인적 상황이 고려되지 않을 수 있습니다.",
        "지속적인 우울감이나 불안감이 있다면 전문가 상담을 받으세요."
      ],
      group: [
        ...baseDetails,
        "그룹 분석은 각 멤버의 기록을 종합한 결과입니다.",
        "실제 관계의 복잡성과 맥락을 완전히 파악하지 못할 수 있습니다.",
        "중요한 관계 결정은 충분한 대화를 통해 내려주세요."
      ],
      chat: [
        ...baseDetails,
        "AI 챗봇은 정서적 지지를 제공하지만 전문 상담을 대체할 수 없습니다.",
        "위기 상황이나 심각한 고민은 전문가의 도움을 받으세요.",
        "AI 응답은 일반적인 조언으로, 개인 상황에 맞지 않을 수 있습니다."
      ],
      communication: [
        ...baseDetails,
        "소통 도구는 관계 개선을 위한 보조 수단입니다.",
        "실제 소통의 복잡성과 맥락을 완전히 반영하지 못할 수 있습니다.",
        "중요한 관계 문제는 전문가와의 상담을 통해 해결하세요."
      ],
      general: baseDetails
    };

    // 심각도별 메시지 설정
    const severityConfig = {
      low: {
        message: "💡 AI 분석 결과 안내",
        type: 'info' as const
      },
      medium: {
        message: "⚠️ AI 분석 결과 안내",
        type: 'warning' as const
      },
      high: {
        message: "🚨 중요: AI 분석 결과 안내",
        type: 'critical' as const
      }
    };

    let details = typeSpecificDetails[analysisType] || typeSpecificDetails.general;

    // 공통 권장사항 추가
    const commonRecommendations = [
      "이 결과는 참고용으로만 활용해주세요.",
      "정확한 진단이나 치료를 위해서는 전문 심리상담사와 상담하시기를 권장합니다."
    ];

    details = [...details, ...commonRecommendations];

    // 응급 상황 연락처 추가 (필요시)
    if (includeEmergencyContact && (severity === 'high' || analysisType === 'mood')) {
      details.push("위기 상황 시 즉시 전문가의 도움을 받으세요. (상담전화: 1588-9191)");
    }

    return {
      message: severityConfig[severity].message,
      details,
      timestamp: new Date().toISOString(),
      type: severityConfig[severity].type,
      version: '2.0'
    };
  }, [analysisType, severity, includeEmergencyContact]);

  return warningData;
};

/**
 * 특정 분석 유형에 대한 미리 정의된 경고 Hook들
 */
export const useProfilingWarning = () => useAIWarning({ 
  analysisType: 'profiling', 
  severity: 'medium' 
});

export const useMoodWarning = () => useAIWarning({ 
  analysisType: 'mood', 
  severity: 'medium',
  includeEmergencyContact: true 
});

export const useGroupWarning = () => useAIWarning({ 
  analysisType: 'group', 
  severity: 'medium' 
});

export const useChatWarning = () => useAIWarning({ 
  analysisType: 'chat', 
  severity: 'low' 
});

/**
 * 개인 성장 분석용 경고
 */
export const usePersonalWarning = () => useAIWarning({ 
  analysisType: 'profiling', 
  severity: 'medium',
  includeEmergencyContact: false 
});

/**
 * 위기 상황용 고위험 경고
 */
export const useCrisisWarning = () => useAIWarning({ 
  analysisType: 'mood', 
  severity: 'high',
  includeEmergencyContact: true 
});

export default useAIWarning;
