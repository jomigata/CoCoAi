"use strict";
/**
 * 🧠 그룹 심층 진단 서비스
 * 심리상담가 1,2가 설계한 그룹별 맞춤형 진단 시스템
 * 그룹 유형에 따른 맞춤형 질문 및 AI 다각도 분석
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupDiagnosisService = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const ai_1 = require("../config/ai");
const aiWarningService_1 = require("./aiWarningService");
class GroupDiagnosisService {
    constructor() {
        this.database = firebaseAdmin_1.db;
    }
    /**
     * 그룹 유형별 맞춤형 질문 세트 생성
     */
    getGroupTypeQuestions() {
        return {
            'family': [
                // 가족 특화 질문들
                {
                    id: 'family_communication',
                    category: 'communication',
                    question: '가족 내에서 서로의 감정을 솔직하게 표현할 수 있다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    groupTypes: ['family'],
                    weight: 1.2
                },
                {
                    id: 'family_support',
                    category: 'support',
                    question: '가족 구성원들이 서로를 지지하고 격려한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    groupTypes: ['family'],
                    weight: 1.1
                },
                {
                    id: 'family_conflict',
                    category: 'conflict',
                    question: '가족 내 갈등이 발생했을 때 주로 어떻게 해결하나요?',
                    type: 'choice',
                    options: [
                        '모두 모여서 대화로 해결',
                        '시간을 두고 자연스럽게 해결',
                        '부모님이 중재',
                        '각자 양보하며 해결',
                        '무시하고 넘어감'
                    ],
                    required: true,
                    groupTypes: ['family'],
                    weight: 1.0
                }
            ],
            'couple': [
                // 연인/부부 특화 질문들
                {
                    id: 'couple_intimacy',
                    category: 'intimacy',
                    question: '서로의 사랑의 언어를 이해하고 표현한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    groupTypes: ['couple'],
                    weight: 1.3
                },
                {
                    id: 'couple_trust',
                    category: 'trust',
                    question: '서로를 완전히 신뢰하고 의존할 수 있다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    groupTypes: ['couple'],
                    weight: 1.2
                },
                {
                    id: 'couple_goals',
                    category: 'goals',
                    question: '미래에 대한 공통된 비전을 가지고 있다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    groupTypes: ['couple'],
                    weight: 1.1
                }
            ],
            'friends': [
                // 친구 그룹 특화 질문들
                {
                    id: 'friends_cohesion',
                    category: 'cohesion',
                    question: '우리 친구 그룹의 유대감이 강하다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    groupTypes: ['friends'],
                    weight: 1.2
                },
                {
                    id: 'friends_support',
                    category: 'support',
                    question: '친구들이 서로를 도와주고 격려한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    groupTypes: ['friends'],
                    weight: 1.1
                }
            ],
            'team': [
                // 팀/직장 특화 질문들
                {
                    id: 'team_leadership',
                    category: 'leadership',
                    question: '팀 리더십이 명확하고 효과적이다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    groupTypes: ['team'],
                    weight: 1.2
                },
                {
                    id: 'team_goals',
                    category: 'goals',
                    question: '팀의 목표가 명확하고 모든 멤버가 이해한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    groupTypes: ['team'],
                    weight: 1.1
                }
            ]
        };
    }
    /**
     * 공통 질문들 (모든 그룹 유형에 적용)
     */
    getCommonQuestions() {
        return [
            {
                id: 'common_communication',
                category: 'communication',
                question: '그룹 내에서 서로의 의견을 자유롭게 표현할 수 있다',
                type: 'scale',
                scaleRange: {
                    min: 1,
                    max: 5,
                    labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                },
                required: true,
                groupTypes: ['family', 'couple', 'friends', 'team'],
                weight: 1.0
            },
            {
                id: 'common_trust',
                category: 'trust',
                question: '그룹 멤버들을 완전히 신뢰한다',
                type: 'scale',
                scaleRange: {
                    min: 1,
                    max: 5,
                    labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                },
                required: true,
                groupTypes: ['family', 'couple', 'friends', 'team'],
                weight: 1.0
            },
            {
                id: 'common_support',
                category: 'support',
                question: '어려운 일이 있을 때 그룹 멤버들에게 도움을 요청할 수 있다',
                type: 'scale',
                scaleRange: {
                    min: 1,
                    max: 5,
                    labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                },
                required: true,
                groupTypes: ['family', 'couple', 'friends', 'team'],
                weight: 1.0
            },
            {
                id: 'common_conflict',
                category: 'conflict',
                question: '그룹 내 갈등이 발생했을 때 주로 어떻게 해결하나요?',
                type: 'choice',
                options: [
                    '직접 대화로 해결',
                    '시간을 두고 자연스럽게',
                    '제3자 중재',
                    '각자 양보',
                    '리더가 결정'
                ],
                required: true,
                groupTypes: ['family', 'couple', 'friends', 'team'],
                weight: 1.0
            },
            {
                id: 'common_goals',
                category: 'goals',
                question: '우리 그룹의 공통 목표가 명확하다',
                type: 'scale',
                scaleRange: {
                    min: 1,
                    max: 5,
                    labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                },
                required: true,
                groupTypes: ['family', 'couple', 'friends', 'team'],
                weight: 1.0
            }
        ];
    }
    /**
     * 그룹 유형별 맞춤형 질문 세트 반환
     */
    async getGroupDiagnosisQuestions(groupType) {
        const groupTypeQuestions = this.getGroupTypeQuestions();
        const commonQuestions = this.getCommonQuestions();
        const typeSpecificQuestions = groupTypeQuestions[groupType] || [];
        const applicableCommonQuestions = commonQuestions.filter(q => q.groupTypes.includes(groupType));
        return [...typeSpecificQuestions, ...applicableCommonQuestions];
    }
    /**
     * 그룹 진단 응답 분석 및 결과 생성
     */
    async analyzeGroupDiagnosis(groupId, groupType, responses) {
        try {
            // 1. 기본 점수 계산
            const categoryScores = this.calculateCategoryScores(responses);
            // 2. 전체 점수 계산
            const overallScore = this.calculateOverallScore(categoryScores);
            // 3. 강점과 약점 분석
            const strengths = this.identifyStrengths(categoryScores);
            const weaknesses = this.identifyWeaknesses(categoryScores);
            // 4. 멤버별 개인화 분석
            const memberAnalysis = await this.analyzeMemberContributions(groupId, responses);
            // 5. 그룹 역학 분석
            const groupDynamics = this.analyzeGroupDynamics(responses, groupType);
            // 6. AI 기반 심층 분석
            const aiInsights = await this.performAIGroupAnalysis(groupType, categoryScores, memberAnalysis, groupDynamics);
            // 7. 맞춤형 추천 생성
            const recommendations = await this.generateGroupRecommendations(groupType, categoryScores, strengths, weaknesses);
            const result = {
                groupId,
                groupType,
                memberCount: responses.length,
                completedAt: new Date(),
                responses,
                analysis: {
                    overallScore,
                    categoryScores,
                    strengths,
                    weaknesses,
                    recommendations
                },
                memberAnalysis,
                groupDynamics,
                aiInsights,
                aiWarning: aiWarningService_1.AIWarningService.generateContextualWarning('group_analysis', {
                    dataPoints: responses.length,
                    analysisDepth: 'advanced'
                })
            };
            // 8. 결과 저장
            await this.saveGroupDiagnosisResult(result);
            return result;
        }
        catch (error) {
            console.error('그룹 진단 분석 오류:', error);
            throw error;
        }
    }
    /**
     * 카테고리별 점수 계산
     */
    calculateCategoryScores(responses) {
        const categoryTotals = {};
        responses.forEach(response => {
            const question = this.getQuestionById(response.questionId);
            if (!question)
                return;
            const category = question.category;
            if (!categoryTotals[category]) {
                categoryTotals[category] = { sum: 0, count: 0 };
            }
            let score = 0;
            if (typeof response.response === 'number') {
                score = response.response;
            }
            else if (typeof response.response === 'string') {
                // 선택형 답변의 경우 가중치 적용
                score = this.getChoiceScore(response.response, question);
            }
            categoryTotals[category].sum += score * question.weight;
            categoryTotals[category].count += question.weight;
        });
        const categoryScores = {};
        Object.keys(categoryTotals).forEach(category => {
            const total = categoryTotals[category];
            categoryScores[category] = total.count > 0 ?
                Math.round((total.sum / total.count) * 20) : 0; // 100점 만점으로 변환
        });
        return categoryScores;
    }
    /**
     * 전체 점수 계산
     */
    calculateOverallScore(categoryScores) {
        const scores = Object.values(categoryScores);
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
    /**
     * 강점 식별
     */
    identifyStrengths(categoryScores) {
        const strengths = [];
        if (categoryScores.communication >= 80) {
            strengths.push('효과적인 소통');
        }
        if (categoryScores.trust >= 80) {
            strengths.push('강한 신뢰 관계');
        }
        if (categoryScores.support >= 80) {
            strengths.push('상호 지지 체계');
        }
        if (categoryScores.goals >= 80) {
            strengths.push('명확한 목표 공유');
        }
        if (categoryScores.conflict >= 80) {
            strengths.push('건강한 갈등 해결');
        }
        return strengths;
    }
    /**
     * 약점 식별
     */
    identifyWeaknesses(categoryScores) {
        const weaknesses = [];
        if (categoryScores.communication < 60) {
            weaknesses.push('소통 개선 필요');
        }
        if (categoryScores.trust < 60) {
            weaknesses.push('신뢰 관계 강화 필요');
        }
        if (categoryScores.support < 60) {
            weaknesses.push('상호 지지 체계 구축 필요');
        }
        if (categoryScores.goals < 60) {
            weaknesses.push('목표 공유 및 정렬 필요');
        }
        if (categoryScores.conflict < 60) {
            weaknesses.push('갈등 해결 방식 개선 필요');
        }
        return weaknesses;
    }
    /**
     * 멤버별 기여도 분석
     */
    async analyzeMemberContributions(groupId, responses) {
        // 멤버별 응답 그룹화
        const memberResponses = {};
        responses.forEach(response => {
            if (!memberResponses[response.userId]) {
                memberResponses[response.userId] = [];
            }
            memberResponses[response.userId].push(response);
        });
        const memberAnalysis = {};
        Object.keys(memberResponses).forEach(userId => {
            const userResponses = memberResponses[userId];
            const userScores = this.calculateCategoryScores(userResponses);
            memberAnalysis[userId] = {
                individualScores: userScores,
                roleInGroup: this.determineRoleInGroup(userScores),
                contributionAreas: this.identifyContributionAreas(userScores),
                growthAreas: this.identifyGrowthAreas(userScores),
                personalizedAdvice: this.generatePersonalizedAdvice(userScores, userResponses)
            };
        });
        return memberAnalysis;
    }
    /**
     * 그룹 역학 분석
     */
    analyzeGroupDynamics(responses, groupType) {
        const categoryScores = this.calculateCategoryScores(responses);
        return {
            leadershipStyle: this.determineLeadershipStyle(categoryScores),
            communicationPattern: this.determineCommunicationPattern(categoryScores),
            conflictResolutionStyle: this.determineConflictResolutionStyle(categoryScores),
            supportNetwork: this.determineSupportNetwork(categoryScores),
            goalAlignment: categoryScores.goals || 0
        };
    }
    /**
     * AI 기반 그룹 분석
     */
    async performAIGroupAnalysis(groupType, categoryScores, memberAnalysis, groupDynamics) {
        try {
            const analysisPrompt = `
당신은 30년 경력의 전문 심리상담가입니다. 다음 그룹 진단 결과를 분석해주세요:

그룹 유형: ${groupType}
카테고리 점수: ${JSON.stringify(categoryScores)}
멤버 분석: ${JSON.stringify(memberAnalysis)}
그룹 역학: ${JSON.stringify(groupDynamics)}

다음 항목들을 분석해주세요:

1. summary: 그룹의 전체적인 관계 상태 요약 (2-3문장)
2. keyFindings: 주요 발견사항 3-4개 (구체적이고 실용적)
3. relationshipPatterns: 관계 패턴 분석 2-3개
4. improvementStrategies: 개선 전략 3-4개 (실천 가능한)

⚠️ 중요 원칙:
- 그룹 유형의 특성을 고려한 분석
- 긍정적이고 성장 지향적인 관점 유지
- 실천 가능한 구체적 조언 제공
- AI 분석의 한계 인정

JSON 형태로 응답해주세요.
`;
            const completion = await ai_1.openai.chat.completions.create({
                model: ai_1.AI_MODELS.ANALYSIS,
                messages: [{ role: "user", content: analysisPrompt }],
                temperature: 0.7,
            });
            return JSON.parse(completion.choices[0].message.content || '{}');
        }
        catch (error) {
            console.error('AI 그룹 분석 오류:', error);
            return {
                summary: "그룹 진단이 완료되었습니다. 멤버들의 관계를 분석했습니다.",
                keyFindings: [
                    "그룹의 소통 패턴을 파악했습니다.",
                    "신뢰 관계의 수준을 확인했습니다.",
                    "상호 지지 체계를 분석했습니다."
                ],
                relationshipPatterns: [
                    "소통 방식의 특징",
                    "갈등 해결 패턴",
                    "지지 네트워크 구조"
                ],
                improvementStrategies: [
                    "정기적인 소통 시간 마련하기",
                    "서로의 감정을 존중하는 문화 만들기",
                    "공통 목표를 위한 협력 강화하기"
                ]
            };
        }
    }
    /**
     * 그룹 맞춤형 추천 생성
     */
    async generateGroupRecommendations(groupType, categoryScores, strengths, weaknesses) {
        const recommendations = [];
        // 그룹 유형별 특화 추천
        switch (groupType) {
            case 'family':
                if (categoryScores.communication < 70) {
                    recommendations.push('가족 회의 시간을 정기적으로 마련하기');
                }
                if (categoryScores.support < 70) {
                    recommendations.push('서로의 감정을 들어주는 시간 늘리기');
                }
                break;
            case 'couple':
                if (categoryScores.intimacy < 70) {
                    recommendations.push('사랑의 언어를 배우고 실천하기');
                }
                if (categoryScores.trust < 70) {
                    recommendations.push('서로에 대한 신뢰를 쌓는 활동하기');
                }
                break;
            case 'friends':
                if (categoryScores.cohesion < 70) {
                    recommendations.push('함께하는 활동을 늘리기');
                }
                if (categoryScores.support < 70) {
                    recommendations.push('서로를 격려하고 응원하는 문화 만들기');
                }
                break;
            case 'team':
                if (categoryScores.leadership < 70) {
                    recommendations.push('리더십 역할을 명확히 하기');
                }
                if (categoryScores.goals < 70) {
                    recommendations.push('팀 목표를 함께 설정하고 공유하기');
                }
                break;
        }
        // 공통 추천
        if (categoryScores.communication < 70) {
            recommendations.push('서로의 의견을 존중하는 대화 문화 만들기');
        }
        if (categoryScores.conflict < 70) {
            recommendations.push('건강한 갈등 해결 방법 배우기');
        }
        return recommendations.slice(0, 5); // 최대 5개 추천
    }
    /**
     * 그룹 진단 결과 저장
     */
    async saveGroupDiagnosisResult(result) {
        await this.database.collection('group_diagnosis_results').doc(result.groupId).set(Object.assign(Object.assign({}, result), { createdAt: (0, firebaseAdmin_1.serverTimestamp)(), updatedAt: (0, firebaseAdmin_1.serverTimestamp)() }));
    }
    /**
     * 그룹 진단 결과 조회
     */
    async getGroupDiagnosisResult(groupId) {
        var _a;
        try {
            const doc = await this.database.collection('group_diagnosis_results').doc(groupId).get();
            if (!doc.exists) {
                return null;
            }
            const data = doc.data();
            return Object.assign(Object.assign({}, data), { completedAt: ((_a = data === null || data === void 0 ? void 0 : data.completedAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date() });
        }
        catch (error) {
            console.error('그룹 진단 결과 조회 오류:', error);
            throw error;
        }
    }
    // 헬퍼 메서드들
    getQuestionById(questionId) {
        // 실제 구현에서는 질문 데이터베이스에서 조회
        return null;
    }
    getChoiceScore(choice, question) {
        // 선택형 답변의 점수 계산 로직
        return 3; // 기본값
    }
    determineRoleInGroup(scores) {
        if (scores.leadership >= 80)
            return '리더';
        if (scores.support >= 80)
            return '지지자';
        if (scores.communication >= 80)
            return '소통자';
        return '참여자';
    }
    identifyContributionAreas(scores) {
        const areas = [];
        if (scores.communication >= 70)
            areas.push('소통');
        if (scores.support >= 70)
            areas.push('지지');
        if (scores.goals >= 70)
            areas.push('목표 달성');
        return areas;
    }
    identifyGrowthAreas(scores) {
        const areas = [];
        if (scores.communication < 60)
            areas.push('소통 능력');
        if (scores.trust < 60)
            areas.push('신뢰 구축');
        if (scores.support < 60)
            areas.push('지지 제공');
        return areas;
    }
    generatePersonalizedAdvice(scores, responses) {
        const advice = [];
        if (scores.communication < 70) {
            advice.push('더 적극적으로 의견을 표현해보세요');
        }
        if (scores.support < 70) {
            advice.push('다른 멤버들을 격려하는 습관을 만들어보세요');
        }
        return advice;
    }
    determineLeadershipStyle(scores) {
        if (scores.leadership >= 80)
            return '민주적 리더십';
        if (scores.leadership >= 60)
            return '협력적 리더십';
        return '자연스러운 리더십';
    }
    determineCommunicationPattern(scores) {
        if (scores.communication >= 80)
            return '개방적 소통';
        if (scores.communication >= 60)
            return '균형적 소통';
        return '신중한 소통';
    }
    determineConflictResolutionStyle(scores) {
        if (scores.conflict >= 80)
            return '협력적 해결';
        if (scores.conflict >= 60)
            return '타협적 해결';
        return '회피적 해결';
    }
    determineSupportNetwork(scores) {
        if (scores.support >= 80)
            return '강한 지지 네트워크';
        if (scores.support >= 60)
            return '적당한 지지 네트워크';
        return '약한 지지 네트워크';
    }
}
exports.GroupDiagnosisService = GroupDiagnosisService;
//# sourceMappingURL=groupDiagnosisService.js.map