/**
 * ⚠️ AI 편향성 경고 시스템 (강화된 버전)
 * 심리상담가 1,2가 설계한 AI 윤리 및 편향성 방지 시스템
 */

// AI 경고 타입 정의
export interface AIWarning {
  message: string;
  details: string[];
  timestamp: string;
  version: string;
  severity: 'info' | 'warning' | 'critical';
  context: string;
  limitations: string[];
  recommendations: string[];
}

// AI 분석 컨텍스트 타입
export type AIAnalysisContext = 
  | 'personal_profiling' 
  | 'group_analysis' 
  | 'relationship_pattern' 
  | 'mood_analysis' 
  | 'chat_response'
  | 'recommendation'
  | 'crisis_detection';

export class AIWarningService {
  
  /**
   * 컨텍스트별 AI 경고 생성
   */
  static generateContextualWarning(
    context: AIAnalysisContext,
    additionalInfo?: {
      dataPoints?: number;
      analysisDepth?: 'basic' | 'intermediate' | 'advanced';
      culturalContext?: string;
      timeframe?: string;
    }
  ): AIWarning {
    
    const baseWarning = this.getBaseWarning(context);
    const contextualLimitations = this.getContextualLimitations(context, additionalInfo);
    const recommendations = this.getContextualRecommendations(context);
    
    return {
      ...baseWarning,
      limitations: contextualLimitations,
      recommendations,
      timestamp: new Date().toISOString(),
      version: "2.0"
    };
  }

  /**
   * 기본 경고 메시지 생성
   */
  private static getBaseWarning(context: AIAnalysisContext): Omit<AIWarning, 'limitations' | 'recommendations' | 'timestamp' | 'version'> {
    const warnings = {
      personal_profiling: {
        message: "⚠️ AI 기반 개인 프로파일링 결과 안내",
        details: [
          "이 분석은 AI 알고리즘을 통해 생성된 결과입니다.",
          "개인의 복잡하고 다면적인 성격을 완전히 반영하지 못할 수 있습니다.",
          "문화적 배경, 개인적 경험, 현재 상황 등이 충분히 고려되지 않을 수 있습니다.",
          "심리학적 진단이나 치료를 대체할 수 없습니다."
        ],
        severity: 'warning' as const,
        context: "개인 심리 프로파일링"
      },
      
      group_analysis: {
        message: "⚠️ AI 기반 그룹 관계 분석 결과 안내",
        details: [
          "이 분석은 데이터 패턴을 기반으로 한 AI 해석입니다.",
          "실제 관계의 복잡성과 미묘한 감정적 뉘앙스를 완전히 파악하지 못할 수 있습니다.",
          "그룹 내 개인적 사정이나 외부 환경 요인이 반영되지 않을 수 있습니다.",
          "관계 개선을 위한 참고 자료로만 활용해주세요."
        ],
        severity: 'warning' as const,
        context: "그룹 관계 분석"
      },
      
      relationship_pattern: {
        message: "⚠️ AI 관계 패턴 인식 결과 안내",
        details: [
          "관계 패턴은 AI가 데이터를 통해 추론한 결과입니다.",
          "실제 관계는 이보다 훨씬 복잡하고 역동적일 수 있습니다.",
          "개인의 의도, 감정, 상황적 맥락이 충분히 반영되지 않을 수 있습니다.",
          "패턴 분석 결과를 절대적 진실로 받아들이지 마세요."
        ],
        severity: 'warning' as const,
        context: "관계 패턴 분석"
      },
      
      mood_analysis: {
        message: "⚠️ AI 감정 분석 결과 안내",
        details: [
          "감정 분석은 텍스트나 선택 데이터를 기반으로 합니다.",
          "실제 감정의 복잡성과 개인적 의미를 완전히 이해하지 못할 수 있습니다.",
          "문화적 표현 방식의 차이가 반영되지 않을 수 있습니다.",
          "감정 상태의 일시적 변화나 외부 요인이 고려되지 않을 수 있습니다."
        ],
        severity: 'info' as const,
        context: "감정 상태 분석"
      },
      
      chat_response: {
        message: "⚠️ AI 챗봇 응답 안내",
        details: [
          "이 응답은 AI가 생성한 것으로, 전문 상담사의 조언을 대체하지 않습니다.",
          "개인의 구체적 상황과 맥락을 완전히 이해하지 못할 수 있습니다.",
          "응급 상황이나 심각한 심리적 위기 시에는 전문가의 도움을 받으세요.",
          "AI의 조언은 참고용으로만 활용해주세요."
        ],
        severity: 'info' as const,
        context: "AI 챗봇 대화"
      },
      
      recommendation: {
        message: "⚠️ AI 추천 시스템 안내",
        details: [
          "추천 내용은 데이터 패턴 분석을 기반으로 생성됩니다.",
          "개인의 고유한 선호도나 상황이 완전히 반영되지 않을 수 있습니다.",
          "문화적, 개인적 가치관의 차이가 고려되지 않을 수 있습니다.",
          "추천 내용을 맹목적으로 따르지 마시고 본인의 판단을 우선하세요."
        ],
        severity: 'info' as const,
        context: "개인화 추천"
      },
      
      crisis_detection: {
        message: "⚠️ AI 위기 상황 감지 안내",
        details: [
          "위기 상황 감지는 키워드와 패턴 분석을 기반으로 합니다.",
          "실제 위험도를 정확히 판단하지 못할 수 있습니다.",
          "과도한 감지(false positive)나 놓침(false negative)이 발생할 수 있습니다.",
          "실제 위기 상황에서는 즉시 전문기관에 연락하세요."
        ],
        severity: 'critical' as const,
        context: "위기 상황 감지"
      }
    };

    return warnings[context];
  }

  /**
   * 컨텍스트별 한계점 설명
   */
  private static getContextualLimitations(
    context: AIAnalysisContext,
    additionalInfo?: any
  ): string[] {
    const baseLimitations = [
      "AI는 인간의 복잡한 감정과 상황을 완전히 이해할 수 없습니다.",
      "문화적, 사회적 맥락의 차이가 충분히 고려되지 않을 수 있습니다.",
      "개인의 고유한 경험과 가치관이 반영되지 않을 수 있습니다."
    ];

    const contextualLimitations: { [key in AIAnalysisContext]: string[] } = {
      personal_profiling: [
        "성격은 상황과 시간에 따라 변할 수 있습니다.",
        "제한된 질문으로는 전체 성격을 파악하기 어렵습니다.",
        "개인의 성장 가능성과 변화 잠재력이 반영되지 않습니다."
      ],
      
      group_analysis: [
        "그룹 역학은 매우 복잡하고 역동적입니다.",
        "비언어적 소통과 미묘한 상호작용이 누락될 수 있습니다.",
        "그룹 외부의 영향 요인들이 고려되지 않습니다."
      ],
      
      relationship_pattern: [
        "관계는 지속적으로 변화하고 발전합니다.",
        "과거 패턴이 미래를 완전히 예측하지 못합니다.",
        "개인의 의식적 노력으로 패턴을 바꿀 수 있습니다."
      ],
      
      mood_analysis: [
        "감정은 순간적이고 변화무쌍합니다.",
        "표현된 감정과 실제 느낌이 다를 수 있습니다.",
        "신체적, 환경적 요인이 감정에 미치는 영향이 고려되지 않습니다."
      ],
      
      chat_response: [
        "대화의 맥락과 뉘앙스를 완전히 파악하기 어렵습니다.",
        "개인의 커뮤니케이션 스타일 차이가 반영되지 않습니다.",
        "실시간 감정 변화를 즉각 감지하기 어렵습니다."
      ],
      
      recommendation: [
        "개인의 현재 상황과 제약 조건이 충분히 고려되지 않습니다.",
        "추천의 실용성과 실현 가능성이 검증되지 않았습니다.",
        "개인의 가치관과 우선순위가 반영되지 않을 수 있습니다."
      ],
      
      crisis_detection: [
        "언어적 표현만으로는 실제 위험도를 정확히 판단하기 어렵습니다.",
        "개인의 평소 표현 방식과 성격이 고려되지 않습니다.",
        "즉각적인 전문적 개입의 필요성을 정확히 판단하기 어렵습니다."
      ]
    };

    const limitations = [...baseLimitations, ...contextualLimitations[context]];

    // 추가 정보에 따른 한계점 보완
    if (additionalInfo?.dataPoints && additionalInfo.dataPoints < 10) {
      limitations.push("분석에 사용된 데이터가 제한적이어서 정확도가 낮을 수 있습니다.");
    }

    if (additionalInfo?.analysisDepth === 'basic') {
      limitations.push("기본 수준의 분석으로 깊이 있는 인사이트가 부족할 수 있습니다.");
    }

    return limitations;
  }

  /**
   * 컨텍스트별 권장사항 제공
   */
  private static getContextualRecommendations(context: AIAnalysisContext): string[] {
    const baseRecommendations = [
      "AI 결과는 참고용으로만 활용하세요.",
      "중요한 결정은 충분한 숙고와 전문가 상담을 통해 하세요.",
      "본인의 직감과 경험을 신뢰하세요."
    ];

    const contextualRecommendations: { [key in AIAnalysisContext]: string[] } = {
      personal_profiling: [
        "결과에 대해 가족이나 친구들과 대화해보세요.",
        "시간을 두고 자신을 관찰하며 결과를 검증해보세요.",
        "성장과 변화의 가능성을 열어두세요."
      ],
      
      group_analysis: [
        "그룹 멤버들과 분석 결과에 대해 열린 대화를 나누세요.",
        "서로의 관점과 느낌을 직접 확인해보세요.",
        "관계 개선을 위한 구체적 행동을 함께 계획해보세요."
      ],
      
      relationship_pattern: [
        "패턴을 인식하되 고정된 것으로 받아들이지 마세요.",
        "의식적인 노력으로 건강한 패턴을 만들어가세요.",
        "상대방과 솔직한 소통을 통해 관계를 발전시키세요."
      ],
      
      mood_analysis: [
        "감정 변화를 지속적으로 관찰하고 기록하세요.",
        "감정에 영향을 미치는 요인들을 스스로 파악해보세요.",
        "필요시 전문 상담사의 도움을 받으세요."
      ],
      
      chat_response: [
        "AI 조언을 본인 상황에 맞게 해석하고 적용하세요.",
        "궁금한 점은 추가로 질문하거나 다른 관점에서 접근해보세요.",
        "심각한 고민은 전문 상담사와 상담하세요."
      ],
      
      recommendation: [
        "추천 내용을 본인의 상황과 가치관에 맞게 조정하세요.",
        "실행 전에 현실적 제약 조건들을 고려하세요.",
        "다양한 의견을 수집하고 종합적으로 판단하세요."
      ],
      
      crisis_detection: [
        "위기 상황이 감지되면 즉시 전문기관에 연락하세요.",
        "신뢰할 수 있는 사람들에게 도움을 요청하세요.",
        "AI 판단에만 의존하지 말고 본인의 직감도 중요하게 여기세요."
      ]
    };

    return [...baseRecommendations, ...contextualRecommendations[context]];
  }

  /**
   * 위기 상황별 긴급 연락처 제공
   */
  static getEmergencyContacts(): {
    title: string;
    contacts: Array<{
      name: string;
      number: string;
      description: string;
      available: string;
    }>;
  } {
    return {
      title: "🆘 긴급 상황 시 연락처",
      contacts: [
        {
          name: "생명의전화",
          number: "1588-9191",
          description: "24시간 자살예방 상담",
          available: "연중무휴 24시간"
        },
        {
          name: "청소년전화",
          number: "1388",
          description: "청소년 위기상담",
          available: "연중무휴 24시간"
        },
        {
          name: "정신건강위기상담전화",
          number: "1577-0199",
          description: "정신건강 위기상담",
          available: "연중무휴 24시간"
        },
        {
          name: "응급실",
          number: "119",
          description: "응급의료상황",
          available: "연중무휴 24시간"
        }
      ]
    };
  }

  /**
   * AI 편향성 체크리스트 제공
   */
  static getBiasChecklist(): {
    title: string;
    items: Array<{
      category: string;
      questions: string[];
    }>;
  } {
    return {
      title: "🔍 AI 편향성 자가 체크리스트",
      items: [
        {
          category: "문화적 편향성",
          questions: [
            "이 결과가 나의 문화적 배경을 충분히 고려했는가?",
            "서구 중심적 관점에 치우쳐 있지는 않은가?",
            "나의 가치관과 상충하는 부분이 있는가?"
          ]
        },
        {
          category: "성별 편향성",
          questions: [
            "성별에 따른 고정관념이 반영되어 있지는 않은가?",
            "성역할에 대한 편견이 포함되어 있지는 않은가?",
            "개인의 고유성보다 성별 특성을 강조하고 있지는 않은가?"
          ]
        },
        {
          category: "연령 편향성",
          questions: [
            "연령대별 고정관념이 반영되어 있지는 않은가?",
            "세대 차이를 과도하게 일반화하고 있지는 않은가?",
            "개인의 성숙도와 경험을 충분히 고려했는가?"
          ]
        },
        {
          category: "상황적 편향성",
          questions: [
            "현재 나의 특수한 상황이 고려되었는가?",
            "일반적 패턴에만 의존하고 있지는 않은가?",
            "개인차와 예외 상황을 인정하고 있는가?"
          ]
        }
      ]
    };
  }
}
