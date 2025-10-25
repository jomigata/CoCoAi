"use strict";
/**
 * 🧠 개인 프로파일링 서비스
 * 심리상담가 1,2가 설계한 개인 종합 프로파일링 시스템
 * 연령대별 맞춤형 심리검사 및 마음 지도 생성
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalProfilingService = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const ai_1 = require("../config/ai");
const aiWarningService_1 = require("./aiWarningService");
class PersonalProfilingService {
    constructor() {
        this.database = firebaseAdmin_1.db;
    }
    /**
     * 연령대별 맞춤형 질문 세트 생성
     */
    getAgeGroupQuestions() {
        return {
            '10s': [
                // 자아존중감 (10대 특화)
                {
                    id: 'teen_self_worth',
                    category: 'selfEsteem',
                    question: '나는 나 자신을 소중하게 생각한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['10s'],
                    weight: 1.2
                },
                {
                    id: 'teen_peer_pressure',
                    category: 'selfEsteem',
                    question: '친구들의 의견에 쉽게 휩쓸리지 않는다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['10s'],
                    weight: 1.0
                },
                // 스트레스 대처 (10대 특화)
                {
                    id: 'teen_stress_coping',
                    category: 'stressCoping',
                    question: '스트레스를 받을 때 주로 어떻게 대처하나요? (복수 선택 가능)',
                    type: 'multiple-choice',
                    options: [
                        '친구들과 이야기하기',
                        '음악 듣기',
                        '게임하기',
                        '운동하기',
                        '혼자만의 시간 갖기',
                        '부모님과 상담하기',
                        'SNS에 글 올리기',
                        '공부에 집중하기',
                        '취미 활동하기',
                        '전문가 도움 받기'
                    ],
                    required: true,
                    ageGroup: ['10s']
                }
            ],
            '20s': [
                // 자아존중감 (20대 특화)
                {
                    id: 'twenties_self_identity',
                    category: 'selfEsteem',
                    question: '나는 나만의 정체성을 가지고 있다고 생각한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['20s'],
                    weight: 1.1
                },
                {
                    id: 'twenties_career_confidence',
                    category: 'selfEsteem',
                    question: '나의 미래에 대해 긍정적으로 생각한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['20s'],
                    weight: 1.0
                },
                // 스트레스 대처 (20대 특화)
                {
                    id: 'twenties_stress_coping',
                    category: 'stressCoping',
                    question: '스트레스를 받을 때 주로 어떻게 대처하나요? (복수 선택 가능)',
                    type: 'multiple-choice',
                    options: [
                        '친구들과 만나서 이야기하기',
                        '운동이나 스포츠하기',
                        '취미 활동하기',
                        '혼자만의 시간 갖기',
                        '여행하기',
                        '음식으로 스트레스 해소하기',
                        '영화나 드라마 보기',
                        '독서하기',
                        '명상이나 요가하기',
                        '전문가 상담받기'
                    ],
                    required: true,
                    ageGroup: ['20s']
                }
            ],
            '30s': [
                // 자아존중감 (30대 특화)
                {
                    id: 'thirties_life_satisfaction',
                    category: 'selfEsteem',
                    question: '현재 내 삶에 만족하고 있다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['30s'],
                    weight: 1.1
                },
                {
                    id: 'thirties_balance',
                    category: 'selfEsteem',
                    question: '일과 삶의 균형을 잘 맞추고 있다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['30s'],
                    weight: 1.0
                }
            ],
            '40s': [
                // 자아존중감 (40대 특화)
                {
                    id: 'forties_wisdom',
                    category: 'selfEsteem',
                    question: '나이만큼의 지혜와 경험을 가지고 있다고 생각한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['40s'],
                    weight: 1.0
                },
                {
                    id: 'forties_leadership',
                    category: 'selfEsteem',
                    question: '다른 사람들에게 좋은 조언을 줄 수 있다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['40s'],
                    weight: 1.0
                }
            ],
            '50s': [
                // 자아존중감 (50대 특화)
                {
                    id: 'fifties_acceptance',
                    category: 'selfEsteem',
                    question: '나이에 따른 변화를 자연스럽게 받아들인다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['50s'],
                    weight: 1.0
                },
                {
                    id: 'fifties_legacy',
                    category: 'selfEsteem',
                    question: '내가 남긴 것들에 대해 만족한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['50s'],
                    weight: 1.0
                }
            ],
            '60s+': [
                // 자아존중감 (60대+ 특화)
                {
                    id: 'sixties_wisdom',
                    category: 'selfEsteem',
                    question: '인생의 지혜를 가지고 있다고 생각한다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['60s+'],
                    weight: 1.0
                },
                {
                    id: 'sixties_gratitude',
                    category: 'selfEsteem',
                    question: '삶에 대해 감사하는 마음을 가지고 있다',
                    type: 'scale',
                    scaleRange: {
                        min: 1,
                        max: 5,
                        labels: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']
                    },
                    required: true,
                    ageGroup: ['60s+'],
                    weight: 1.0
                }
            ]
        };
    }
    /**
     * 연령대별 맞춤형 질문 세트 반환
     */
    async getPersonalizedQuestions(ageGroup) {
        const ageGroupQuestions = this.getAgeGroupQuestions();
        const baseQuestions = ageGroupQuestions[ageGroup] || ageGroupQuestions['20s'];
        // 공통 질문 추가
        const commonQuestions = [
            // 대인관계 패턴 (공통)
            {
                id: 'relationship_style',
                category: 'relationshipPattern',
                question: '당신의 대인관계 스타일은 어떤 편인가요?',
                type: 'multiple-choice',
                options: [
                    '외향적이고 사교적인 편',
                    '내향적이고 신중한 편',
                    '상황에 따라 유연하게 적응',
                    '깊고 의미 있는 관계를 선호',
                    '넓고 다양한 관계를 선호',
                    '리더십을 발휘하는 편',
                    '협력하고 지원하는 편',
                    '독립적이고 자율적인 편'
                ],
                required: true
            },
            // 핵심 가치관 (공통)
            {
                id: 'core_values',
                category: 'coreValues',
                question: '당신에게 가장 중요한 가치관은 무엇인가요? (최대 5개 선택)',
                type: 'multiple-choice',
                options: [
                    '가족과의 유대',
                    '개인의 성장',
                    '사회적 기여',
                    '경제적 안정',
                    '창의성과 혁신',
                    '정직과 진실',
                    '자유와 독립',
                    '안정과 보안',
                    '모험과 도전',
                    '조화와 평화',
                    '성취와 성공',
                    '사랑과 관계',
                    '지식과 학습',
                    '건강과 웰빙',
                    '영성과 의미'
                ],
                required: true
            },
            // 강점 발견 (공통)
            {
                id: 'personal_strengths',
                category: 'strengths',
                question: '다음 중 당신의 강점이라고 생각하는 것들을 선택해주세요 (최대 7개)',
                type: 'multiple-choice',
                options: [
                    '공감 능력',
                    '논리적 사고',
                    '창의적 아이디어',
                    '리더십',
                    '협력과 팀워크',
                    '끈기와 인내',
                    '유연성과 적응력',
                    '의사소통 능력',
                    '문제 해결 능력',
                    '계획과 조직력',
                    '호기심과 학습욕',
                    '긍정적 사고',
                    '책임감',
                    '도전 정신',
                    '배려와 친절',
                    '집중력',
                    '직관력',
                    '분석 능력',
                    '예술적 감각',
                    '유머 감각'
                ],
                required: true
            }
        ];
        return [...baseQuestions, ...commonQuestions];
    }
    /**
     * 프로파일링 응답 분석 및 결과 생성
     */
    async analyzeProfilingResponses(userId, ageGroup, responses) {
        try {
            // 1. 기본 점수 계산
            const scores = this.calculateScores(responses, ageGroup);
            // 2. 마음 지도 생성
            const mindMap = this.generateMindMap(scores, responses);
            // 3. AI 기반 심층 분석
            const aiAnalysis = await this.performAIAnalysis(scores, responses, ageGroup);
            // 4. 결과 구성
            const result = {
                userId,
                ageGroup,
                completedAt: new Date(),
                responses,
                scores,
                mindMap,
                aiAnalysis,
                aiWarning: aiWarningService_1.AIWarningService.generateContextualWarning('personal_profiling', {
                    dataPoints: Object.keys(responses).length,
                    analysisDepth: 'advanced'
                })
            };
            // 5. 결과 저장
            await this.saveProfilingResult(result);
            return result;
        }
        catch (error) {
            console.error('프로파일링 분석 오류:', error);
            throw error;
        }
    }
    /**
     * 점수 계산
     */
    calculateScores(responses, ageGroup) {
        // 자아존중감 점수 계산
        const selfEsteemQuestions = Object.keys(responses).filter(key => key.includes('self') || key.includes('worth') || key.includes('confidence'));
        let selfEsteemTotal = 0;
        let selfEsteemCount = 0;
        selfEsteemQuestions.forEach(questionId => {
            const response = responses[questionId];
            if (typeof response === 'number') {
                selfEsteemTotal += response;
                selfEsteemCount++;
            }
        });
        const selfEsteem = selfEsteemCount > 0 ? Math.round((selfEsteemTotal / selfEsteemCount) * 20) : 50;
        // 스트레스 대처 방식 분석
        const stressCoping = responses.stress_coping || responses.teen_stress_coping || responses.twenties_stress_coping || [];
        const stressCopingAnalysis = {
            active: this.categorizeStressCoping(stressCoping, 'active'),
            passive: this.categorizeStressCoping(stressCoping, 'passive'),
            social: this.categorizeStressCoping(stressCoping, 'social'),
            individual: this.categorizeStressCoping(stressCoping, 'individual')
        };
        return {
            selfEsteem,
            stressCoping: stressCopingAnalysis,
            relationshipPattern: responses.relationship_style || '',
            coreValues: responses.core_values || [],
            strengths: responses.personal_strengths || []
        };
    }
    /**
     * 스트레스 대처 방식 분류
     */
    categorizeStressCoping(methods, category) {
        const activeMethods = ['운동이나 신체 활동', '문제 해결에 집중하기', '운동이나 스포츠하기', '운동하기'];
        const passiveMethods = ['일시적으로 피하기', '음악 듣기', '영화나 드라마 보기', '게임하기'];
        const socialMethods = ['친구나 가족과 대화', '친구들과 이야기하기', '친구들과 만나서 이야기하기', '부모님과 상담하기'];
        const individualMethods = ['혼자만의 시간 갖기', '명상이나 요가', '독서하기', '취미 활동하기'];
        let categoryMethods = [];
        switch (category) {
            case 'active':
                categoryMethods = activeMethods;
                break;
            case 'passive':
                categoryMethods = passiveMethods;
                break;
            case 'social':
                categoryMethods = socialMethods;
                break;
            case 'individual':
                categoryMethods = individualMethods;
                break;
        }
        const matches = methods.filter(method => categoryMethods.some(categoryMethod => method.includes(categoryMethod))).length;
        return Math.round((matches / methods.length) * 100) || 0;
    }
    /**
     * 마음 지도 생성
     */
    generateMindMap(scores, responses) {
        // 성격 유형 결정
        let personality = '';
        const relationshipPattern = responses.relationship_style || '';
        if (relationshipPattern.includes('외향적')) {
            personality = '외향형 리더';
        }
        else if (relationshipPattern.includes('내향적')) {
            personality = '내향형 사색가';
        }
        else if (relationshipPattern.includes('유연하게')) {
            personality = '적응형 중재자';
        }
        else {
            personality = '균형형 협력자';
        }
        // 감정 패턴 분석
        let emotionalPattern = '';
        const stressCoping = responses.stress_coping || responses.teen_stress_coping || responses.twenties_stress_coping || [];
        if (stressCoping.some((method) => method.includes('친구') || method.includes('가족'))) {
            emotionalPattern = '관계 중심형';
        }
        else if (stressCoping.some((method) => method.includes('혼자'))) {
            emotionalPattern = '내적 성찰형';
        }
        else if (stressCoping.some((method) => method.includes('문제 해결'))) {
            emotionalPattern = '해결 지향형';
        }
        else {
            emotionalPattern = '감정 표현형';
        }
        // 소통 스타일 결정
        let communicationStyle = '';
        const strengths = responses.personal_strengths || [];
        if (strengths.includes('의사소통 능력')) {
            communicationStyle = '적극적 소통형';
        }
        else if (strengths.includes('공감 능력')) {
            communicationStyle = '공감적 경청형';
        }
        else if (strengths.includes('논리적 사고')) {
            communicationStyle = '논리적 설득형';
        }
        else {
            communicationStyle = '조화로운 대화형';
        }
        // 성장 영역 식별
        const growthAreas = [];
        if (scores.selfEsteem < 60)
            growthAreas.push('자아존중감 향상');
        if (scores.stressCoping.passive > 70)
            growthAreas.push('적극적 대처법 학습');
        if (scores.stressCoping.social < 30)
            growthAreas.push('사회적 지지망 구축');
        if (strengths.length < 5)
            growthAreas.push('강점 발견 및 활용');
        // 맞춤형 추천 생성
        const recommendations = [];
        if (scores.selfEsteem < 60) {
            recommendations.push('매일 자신의 장점 3가지를 적어보는 습관 만들기');
        }
        if (scores.stressCoping.passive > 70) {
            recommendations.push('운동이나 명상 등 적극적 스트레스 해소법 시도하기');
        }
        if (scores.stressCoping.social < 30) {
            recommendations.push('신뢰할 수 있는 사람들과 정기적으로 만나기');
        }
        return {
            personality,
            emotionalPattern,
            communicationStyle,
            growthAreas,
            recommendations
        };
    }
    /**
     * AI 기반 심층 분석
     */
    async performAIAnalysis(scores, responses, ageGroup) {
        try {
            const analysisPrompt = `
당신은 30년 경력의 전문 심리상담가입니다. 다음 프로파일링 결과를 분석해주세요:

연령대: ${ageGroup}
점수 결과: ${JSON.stringify(scores)}
응답 데이터: ${JSON.stringify(responses)}

다음 항목들을 분석해주세요:

1. summary: 전체적인 심리 상태 요약 (2-3문장)
2. insights: 주요 인사이트 3-4개 (구체적이고 실용적)
3. personalizedAdvice: 개인 맞춤형 조언 3-4개 (실천 가능한)
4. monthlyGoals: 다음 달 목표 3개 (구체적이고 달성 가능한)

⚠️ 중요 원칙:
- 긍정적이고 성장 지향적인 관점 유지
- 개인의 연령대와 상황 고려
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
            console.error('AI 분석 오류:', error);
            return {
                summary: "프로파일링이 완료되었습니다. 개인의 고유한 특성을 파악했습니다.",
                insights: [
                    "자아존중감 수준을 확인했습니다.",
                    "스트레스 대처 방식을 분석했습니다.",
                    "대인관계 패턴을 파악했습니다."
                ],
                personalizedAdvice: [
                    "매일 자신을 긍정적으로 대하는 습관을 만들어보세요.",
                    "스트레스 상황에서 건강한 대처법을 연습해보세요.",
                    "주변 사람들과의 관계를 소중히 여기세요."
                ],
                monthlyGoals: [
                    "감정 일기를 꾸준히 작성하기",
                    "새로운 취미 활동 시작하기",
                    "가족이나 친구와의 시간 늘리기"
                ]
            };
        }
    }
    /**
     * 프로파일링 결과 저장
     */
    async saveProfilingResult(result) {
        await this.database.collection('profiling_results').doc(result.userId).set(Object.assign(Object.assign({}, result), { createdAt: (0, firebaseAdmin_1.serverTimestamp)(), updatedAt: (0, firebaseAdmin_1.serverTimestamp)() }));
    }
    /**
     * 사용자 프로파일링 결과 조회
     */
    async getProfilingResult(userId) {
        var _a;
        try {
            const doc = await this.database.collection('profiling_results').doc(userId).get();
            if (!doc.exists) {
                return null;
            }
            const data = doc.data();
            return Object.assign(Object.assign({}, data), { completedAt: ((_a = data === null || data === void 0 ? void 0 : data.completedAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date() });
        }
        catch (error) {
            console.error('프로파일링 결과 조회 오류:', error);
            throw error;
        }
    }
    /**
     * 프로파일링 결과 업데이트
     */
    async updateProfilingResult(userId, updates) {
        try {
            await this.database.collection('profiling_results').doc(userId).update(Object.assign(Object.assign({}, updates), { updatedAt: (0, firebaseAdmin_1.serverTimestamp)() }));
        }
        catch (error) {
            console.error('프로파일링 결과 업데이트 오류:', error);
            throw error;
        }
    }
}
exports.PersonalProfilingService = PersonalProfilingService;
//# sourceMappingURL=personalProfilingService.js.map