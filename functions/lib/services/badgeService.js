"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeService = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const admin = __importStar(require("firebase-admin"));
class BadgeService {
    constructor() {
        this.database = firebaseAdmin_1.db;
    }
    /**
     * 사용자 통계 및 뱃지 정보 조회
     */
    async getUserStats(userId) {
        var _a;
        try {
            const userDoc = await this.database.collection('user_stats').doc(userId).get();
            if (!userDoc.exists) {
                // 새 사용자 통계 생성
                return await this.createNewUserStats(userId);
            }
            const userData = userDoc.data();
            return {
                totalPoints: (userData === null || userData === void 0 ? void 0 : userData.totalPoints) || 0,
                level: (userData === null || userData === void 0 ? void 0 : userData.level) || 1,
                experience: (userData === null || userData === void 0 ? void 0 : userData.experience) || 0,
                badges: ((_a = userData === null || userData === void 0 ? void 0 : userData.badges) === null || _a === void 0 ? void 0 : _a.map((badge) => {
                    var _a;
                    return (Object.assign(Object.assign({}, badge), { unlockedAt: ((_a = badge.unlockedAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date() }));
                })) || [],
                achievements: (userData === null || userData === void 0 ? void 0 : userData.achievements) || {
                    moodRecords: 0,
                    chatSessions: 0,
                    groupReports: 0,
                    profilingCompleted: 0,
                    gardenLevel: 0,
                    consecutiveDays: 0
                }
            };
        }
        catch (error) {
            console.error('사용자 통계 조회 오류:', error);
            throw error;
        }
    }
    /**
     * 새 사용자 통계 생성
     */
    async createNewUserStats(userId) {
        try {
            const newStats = {
                totalPoints: 0,
                level: 1,
                experience: 0,
                badges: [],
                achievements: {
                    moodRecords: 0,
                    chatSessions: 0,
                    groupReports: 0,
                    profilingCompleted: 0,
                    gardenLevel: 0,
                    consecutiveDays: 0
                }
            };
            await this.database.collection('user_stats').doc(userId).set(Object.assign(Object.assign({}, newStats), { createdAt: (0, firebaseAdmin_1.serverTimestamp)(), updatedAt: (0, firebaseAdmin_1.serverTimestamp)() }));
            return newStats;
        }
        catch (error) {
            console.error('새 사용자 통계 생성 오류:', error);
            throw error;
        }
    }
    /**
     * 모든 뱃지 목록 조회
     */
    async getAllBadges() {
        try {
            const badgesSnapshot = await this.database.collection('badges').get();
            return badgesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            console.error('뱃지 목록 조회 오류:', error);
            // 폴백으로 기본 뱃지 반환
            return this.getDefaultBadges();
        }
    }
    /**
     * 사용자의 뱃지 진행 상황 조회
     */
    async getUserBadgeProgress(userId) {
        try {
            const [userStats, allBadges] = await Promise.all([
                this.getUserStats(userId),
                this.getAllBadges()
            ]);
            return allBadges.map(badge => {
                const userBadge = userStats.badges.find(b => b.badgeId === badge.id);
                const currentProgress = this.calculateBadgeProgress(badge, userStats);
                return {
                    badgeId: badge.id,
                    currentProgress,
                    targetProgress: badge.requirement.target,
                    isUnlocked: (userBadge === null || userBadge === void 0 ? void 0 : userBadge.isUnlocked) || false,
                    progressPercentage: Math.min(100, (currentProgress / badge.requirement.target) * 100)
                };
            });
        }
        catch (error) {
            console.error('뱃지 진행 상황 조회 오류:', error);
            throw error;
        }
    }
    /**
     * 뱃지 진행 상황 계산
     */
    calculateBadgeProgress(badge, userStats) {
        switch (badge.requirement.type) {
            case 'count':
                switch (badge.category) {
                    case 'mood_tracking':
                        return userStats.achievements.moodRecords;
                    case 'chat_engagement':
                        return userStats.achievements.chatSessions;
                    case 'group_activity':
                        return userStats.achievements.groupReports;
                    case 'profiling':
                        return userStats.achievements.profilingCompleted;
                    case 'garden':
                        return userStats.achievements.gardenLevel;
                    default:
                        return 0;
                }
            case 'streak':
                return userStats.achievements.consecutiveDays;
            case 'level':
                return userStats.level;
            case 'score':
                return userStats.totalPoints;
            default:
                return 0;
        }
    }
    /**
     * 뱃지 획득 체크 및 업데이트
     */
    async checkAndUpdateBadges(userId, activityType, activityData) {
        try {
            const userStats = await this.getUserStats(userId);
            const allBadges = await this.getAllBadges();
            const unlockedBadges = [];
            // 활동 데이터로 통계 업데이트
            const updatedStats = await this.updateUserStats(userId, activityType, activityData);
            // 각 뱃지의 획득 조건 체크
            for (const badge of allBadges) {
                const userBadge = userStats.badges.find(b => b.badgeId === badge.id);
                if (!(userBadge === null || userBadge === void 0 ? void 0 : userBadge.isUnlocked)) {
                    const currentProgress = this.calculateBadgeProgress(badge, updatedStats);
                    if (currentProgress >= badge.requirement.target) {
                        // 뱃지 획득!
                        await this.unlockBadge(userId, badge.id);
                        unlockedBadges.push(badge);
                    }
                }
            }
            return { unlockedBadges, updatedStats };
        }
        catch (error) {
            console.error('뱃지 체크 및 업데이트 오류:', error);
            throw error;
        }
    }
    /**
     * 사용자 통계 업데이트
     */
    async updateUserStats(userId, activityType, activityData) {
        try {
            const userStats = await this.getUserStats(userId);
            let updatedStats = Object.assign({}, userStats);
            // 활동 타입별 통계 업데이트
            switch (activityType) {
                case 'mood_record':
                    updatedStats.achievements.moodRecords += 1;
                    updatedStats.totalPoints += 10;
                    updatedStats.experience += 10;
                    break;
                case 'chat_session':
                    updatedStats.achievements.chatSessions += 1;
                    updatedStats.totalPoints += 15;
                    updatedStats.experience += 15;
                    break;
                case 'group_report':
                    updatedStats.achievements.groupReports += 1;
                    updatedStats.totalPoints += 25;
                    updatedStats.experience += 25;
                    break;
                case 'profiling_completed':
                    updatedStats.achievements.profilingCompleted += 1;
                    updatedStats.totalPoints += 50;
                    updatedStats.experience += 50;
                    break;
                case 'garden_level_up':
                    updatedStats.achievements.gardenLevel = activityData.level || updatedStats.achievements.gardenLevel;
                    updatedStats.totalPoints += 30;
                    updatedStats.experience += 30;
                    break;
                case 'daily_streak':
                    updatedStats.achievements.consecutiveDays += 1;
                    updatedStats.totalPoints += 5;
                    updatedStats.experience += 5;
                    break;
            }
            // 레벨 업 체크
            const requiredExp = updatedStats.level * 100;
            if (updatedStats.experience >= requiredExp) {
                updatedStats.level += 1;
                updatedStats.totalPoints += updatedStats.level * 20; // 레벨업 보너스
            }
            // Firestore 업데이트
            await this.database.collection('user_stats').doc(userId).update(Object.assign(Object.assign({}, updatedStats), { updatedAt: (0, firebaseAdmin_1.serverTimestamp)() }));
            return updatedStats;
        }
        catch (error) {
            console.error('사용자 통계 업데이트 오류:', error);
            throw error;
        }
    }
    /**
     * 뱃지 해금
     */
    async unlockBadge(userId, badgeId) {
        try {
            const userBadge = {
                badgeId,
                unlockedAt: new Date(),
                progress: 100,
                isUnlocked: true
            };
            await this.database.collection('user_stats').doc(userId).update({
                badges: admin.firestore.FieldValue.arrayUnion(userBadge),
                updatedAt: (0, firebaseAdmin_1.serverTimestamp)()
            });
        }
        catch (error) {
            console.error('뱃지 해금 오류:', error);
            throw error;
        }
    }
    /**
     * 기본 뱃지 목록 생성
     */
    getDefaultBadges() {
        return [
            {
                id: 'first_mood',
                title: '첫 마음 기록',
                description: '첫 번째 마음 기록을 작성했습니다',
                category: 'mood_tracking',
                icon: 'Heart',
                color: 'pink',
                points: 10,
                requirement: {
                    type: 'count',
                    target: 1,
                    description: '마음 기록 1회 작성'
                },
                rarity: 'common',
                progress: 0
            },
            {
                id: 'mood_explorer',
                title: '마음 탐험가',
                description: '마음 기록을 10회 작성했습니다',
                category: 'mood_tracking',
                icon: 'Heart',
                color: 'pink',
                points: 50,
                requirement: {
                    type: 'count',
                    target: 10,
                    description: '마음 기록 10회 작성'
                },
                rarity: 'rare',
                progress: 0
            },
            {
                id: 'chat_friend',
                title: '코코의 친구',
                description: '코코와 5번 대화했습니다',
                category: 'chat_engagement',
                icon: 'MessageCircle',
                color: 'blue',
                points: 30,
                requirement: {
                    type: 'count',
                    target: 5,
                    description: '챗봇 대화 5회'
                },
                rarity: 'common',
                progress: 0
            },
            {
                id: 'group_leader',
                title: '그룹 리더',
                description: '그룹 리포트를 3회 생성했습니다',
                category: 'group_activity',
                icon: 'Users',
                color: 'green',
                points: 75,
                requirement: {
                    type: 'count',
                    target: 3,
                    description: '그룹 리포트 3회 생성'
                },
                rarity: 'epic',
                progress: 0
            },
            {
                id: 'self_discovery',
                title: '자기 발견가',
                description: '프로파일링을 완료했습니다',
                category: 'profiling',
                icon: 'Brain',
                color: 'purple',
                points: 100,
                requirement: {
                    type: 'count',
                    target: 1,
                    description: '프로파일링 완료'
                },
                rarity: 'rare',
                progress: 0
            },
            {
                id: 'garden_master',
                title: '정원의 마스터',
                description: '정원 레벨 5에 도달했습니다',
                category: 'garden',
                icon: 'Flower',
                color: 'green',
                points: 150,
                requirement: {
                    type: 'level',
                    target: 5,
                    description: '정원 레벨 5 달성'
                },
                rarity: 'legendary',
                progress: 0
            },
            {
                id: 'consistency_champion',
                title: '꾸준함의 챔피언',
                description: '7일 연속으로 활동했습니다',
                category: 'consistency',
                icon: 'Calendar',
                color: 'yellow',
                points: 100,
                requirement: {
                    type: 'streak',
                    target: 7,
                    description: '7일 연속 활동'
                },
                rarity: 'epic',
                progress: 0
            }
        ];
    }
    /**
     * 칭찬 릴레이 시스템
     */
    async sendPraise(userId, targetUserId, praiseMessage) {
        try {
            // 칭찬 보내기
            await this.database.collection('praises').add({
                fromUserId: userId,
                toUserId: targetUserId,
                message: praiseMessage,
                createdAt: (0, firebaseAdmin_1.serverTimestamp)()
            });
            // 보낸 사람과 받은 사람 모두에게 포인트 지급
            const senderPoints = 10;
            const receiverPoints = 15;
            await Promise.all([
                this.updateUserStats(userId, 'praise_sent', { points: senderPoints }),
                this.updateUserStats(targetUserId, 'praise_received', { points: receiverPoints })
            ]);
            return { success: true, points: senderPoints };
        }
        catch (error) {
            console.error('칭찬 전송 오류:', error);
            throw error;
        }
    }
    /**
     * 칭찬 받은 목록 조회
     */
    async getReceivedPraises(userId) {
        try {
            const praisesSnapshot = await this.database
                .collection('praises')
                .where('toUserId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            return praisesSnapshot.docs.map(doc => {
                var _a;
                return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date() }));
            });
        }
        catch (error) {
            console.error('칭찬 목록 조회 오류:', error);
            throw error;
        }
    }
}
exports.BadgeService = BadgeService;
//# sourceMappingURL=badgeService.js.map