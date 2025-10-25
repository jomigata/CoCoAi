"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GardenService = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
class GardenService {
    constructor() {
        this.database = firebaseAdmin_1.db;
    }
    /**
     * 사용자의 정원 정보 조회
     */
    async getUserGarden(userId) {
        var _a, _b, _c, _d;
        try {
            const gardenDoc = await this.database.collection('gardens').doc(userId).get();
            if (!gardenDoc.exists) {
                // 새 정원 생성
                return await this.createNewGarden(userId);
            }
            const gardenData = gardenDoc.data();
            return Object.assign(Object.assign({ id: gardenDoc.id }, gardenData), { createdAt: ((_a = gardenData === null || gardenData === void 0 ? void 0 : gardenData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date(), updatedAt: ((_b = gardenData === null || gardenData === void 0 ? void 0 : gardenData.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate()) || new Date(), lastActivity: ((_c = gardenData === null || gardenData === void 0 ? void 0 : gardenData.lastActivity) === null || _c === void 0 ? void 0 : _c.toDate()) || new Date(), plants: ((_d = gardenData === null || gardenData === void 0 ? void 0 : gardenData.plants) === null || _d === void 0 ? void 0 : _d.map((plant) => {
                    var _a, _b;
                    return (Object.assign(Object.assign({}, plant), { plantedAt: ((_a = plant.plantedAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date(), lastWatered: ((_b = plant.lastWatered) === null || _b === void 0 ? void 0 : _b.toDate()) || new Date() }));
                })) || [] });
        }
        catch (error) {
            console.error('정원 정보 조회 오류:', error);
            throw error;
        }
    }
    /**
     * 새 정원 생성
     */
    async createNewGarden(userId) {
        try {
            const newGarden = {
                id: userId,
                userId,
                level: 1,
                experience: 0,
                plants: [],
                unlockedPlants: ['sunflower', 'rose', 'lavender'], // 기본 해금 식물
                totalPositiveInteractions: 0,
                lastActivity: new Date(),
                achievements: ['first_garden'],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await this.database.collection('gardens').doc(userId).set(Object.assign(Object.assign({}, newGarden), { createdAt: (0, firebaseAdmin_1.serverTimestamp)(), updatedAt: (0, firebaseAdmin_1.serverTimestamp)(), lastActivity: (0, firebaseAdmin_1.serverTimestamp)() }));
            return newGarden;
        }
        catch (error) {
            console.error('새 정원 생성 오류:', error);
            throw error;
        }
    }
    /**
     * 정원 액션 수행 (물주기, 비료주기 등)
     */
    async performGardenAction(userId, action) {
        try {
            const garden = await this.getUserGarden(userId);
            if (!garden)
                throw new Error('정원을 찾을 수 없습니다.');
            const events = [];
            let updatedGarden = Object.assign({}, garden);
            // 액션 타입별 처리
            switch (action.type) {
                case 'water':
                    updatedGarden = await this.waterPlants(updatedGarden, action);
                    break;
                case 'plant':
                    updatedGarden = await this.plantNewSeed(updatedGarden, action);
                    break;
                case 'harvest':
                    updatedGarden = await this.harvestPlant(updatedGarden, action);
                    break;
                default:
                    updatedGarden = await this.performGeneralAction(updatedGarden, action);
            }
            // 경험치 및 레벨 업데이트
            updatedGarden.experience += action.points;
            updatedGarden.totalPositiveInteractions += 1;
            updatedGarden.lastActivity = new Date();
            updatedGarden.updatedAt = new Date();
            // 레벨 업 체크
            const levelUpEvent = this.checkLevelUp(updatedGarden);
            if (levelUpEvent) {
                events.push(levelUpEvent);
            }
            // 정원 저장
            await this.database.collection('gardens').doc(userId).update(Object.assign(Object.assign({}, updatedGarden), { updatedAt: (0, firebaseAdmin_1.serverTimestamp)(), lastActivity: (0, firebaseAdmin_1.serverTimestamp)() }));
            return {
                success: true,
                garden: updatedGarden,
                events
            };
        }
        catch (error) {
            console.error('정원 액션 수행 오류:', error);
            throw error;
        }
    }
    /**
     * 식물에 물주기
     */
    async waterPlants(garden, action) {
        const updatedGarden = Object.assign({}, garden);
        updatedGarden.plants = updatedGarden.plants.map(plant => {
            if (action.plantId && plant.id === action.plantId) {
                const newHealth = Math.min(100, plant.health + 10);
                const newHappiness = Math.min(100, plant.happiness + 5);
                return Object.assign(Object.assign({}, plant), { health: newHealth, happiness: newHappiness, lastWatered: new Date(), experience: plant.experience + 5 });
            }
            return plant;
        });
        return updatedGarden;
    }
    /**
     * 새 씨앗 심기
     */
    async plantNewSeed(garden, action) {
        const updatedGarden = Object.assign({}, garden);
        if (!action.plantType)
            throw new Error('식물 타입이 필요합니다.');
        const newPlant = {
            id: `plant_${Date.now()}`,
            type: action.plantType,
            name: this.getPlantName(action.plantType),
            description: this.getPlantDescription(action.plantType),
            stage: 'seed',
            health: 50,
            happiness: 50,
            position: this.generateRandomPosition(),
            plantedAt: new Date(),
            lastWatered: new Date(),
            relationshipSource: {
                type: 'individual',
                sourceId: garden.userId,
                sourceName: '나의 정원'
            },
            growthFactors: {
                positiveInteractions: 0,
                consistentCare: 0,
                groupHarmony: 0
            },
            experience: 0,
            level: 1
        };
        updatedGarden.plants.push(newPlant);
        return updatedGarden;
    }
    /**
     * 식물 수확
     */
    async harvestPlant(garden, action) {
        const updatedGarden = Object.assign({}, garden);
        updatedGarden.plants = updatedGarden.plants.filter(plant => {
            if (action.plantId && plant.id === action.plantId) {
                // 수확 경험치 추가
                updatedGarden.experience += plant.experience * 2;
                return false; // 식물 제거
            }
            return true;
        });
        return updatedGarden;
    }
    /**
     * 일반 액션 수행
     */
    async performGeneralAction(garden, action) {
        const updatedGarden = Object.assign({}, garden);
        // 모든 식물의 행복도 증가
        updatedGarden.plants = updatedGarden.plants.map(plant => (Object.assign(Object.assign({}, plant), { happiness: Math.min(100, plant.happiness + 2), experience: plant.experience + 1 })));
        return updatedGarden;
    }
    /**
     * 레벨 업 체크
     */
    checkLevelUp(garden) {
        const requiredExp = garden.level * 100;
        if (garden.experience >= requiredExp) {
            const newLevel = garden.level + 1;
            const unlockedPlants = this.getUnlockedPlants(newLevel);
            return {
                plantId: 'garden',
                eventType: 'level_up',
                message: `정원 레벨이 ${newLevel}로 상승했습니다!`,
                rewards: {
                    experience: 0,
                    points: newLevel * 50,
                    unlockedItems: unlockedPlants
                }
            };
        }
        return null;
    }
    /**
     * 그룹 활동과 연동된 정원 업데이트
     */
    async updateGardenFromGroupActivity(userId, groupId, activityType) {
        try {
            const garden = await this.getUserGarden(userId);
            if (!garden)
                throw new Error('정원을 찾을 수 없습니다.');
            const action = {
                type: 'fertilize',
                interactionType: activityType,
                points: this.getActivityPoints(activityType),
                description: this.getActivityDescription(activityType)
            };
            return await this.performGardenAction(userId, action);
        }
        catch (error) {
            console.error('그룹 활동 정원 업데이트 오류:', error);
            throw error;
        }
    }
    /**
     * 식물 성장 시뮬레이션 (AI 기반)
     */
    async simulatePlantGrowth(userId) {
        try {
            const garden = await this.getUserGarden(userId);
            if (!garden)
                throw new Error('정원을 찾을 수 없습니다.');
            const events = [];
            const updatedGarden = Object.assign({}, garden);
            // 각 식물의 성장 체크
            for (const plant of updatedGarden.plants) {
                const growthEvent = await this.checkPlantGrowth(plant);
                if (growthEvent) {
                    events.push(growthEvent);
                }
            }
            // 정원 저장
            await this.database.collection('gardens').doc(userId).update({
                plants: updatedGarden.plants,
                updatedAt: (0, firebaseAdmin_1.serverTimestamp)()
            });
            return {
                success: true,
                events
            };
        }
        catch (error) {
            console.error('식물 성장 시뮬레이션 오류:', error);
            throw error;
        }
    }
    /**
     * 개별 식물 성장 체크
     */
    async checkPlantGrowth(plant) {
        const now = new Date();
        const daysSincePlanted = Math.floor((now.getTime() - plant.plantedAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceWatered = Math.floor((now.getTime() - plant.lastWatered.getTime()) / (1000 * 60 * 60 * 24));
        // 성장 조건 체크
        const canGrow = plant.health > 70 && plant.happiness > 60 && daysSinceWatered < 3;
        if (canGrow && this.shouldStageUp(plant, daysSincePlanted)) {
            const newStage = this.getNextStage(plant.stage);
            plant.stage = newStage;
            plant.level += 1;
            plant.experience += 20;
            return {
                plantId: plant.id,
                eventType: 'stage_up',
                message: `${plant.name}이 ${newStage} 단계로 성장했습니다!`,
                rewards: {
                    experience: 20,
                    points: 30,
                    unlockedItems: newStage === 'mature' ? [`${plant.type}_seed`] : []
                }
            };
        }
        return null;
    }
    // 헬퍼 메서드들
    getPlantName(type) {
        const names = {
            'flower': '해바라기',
            'tree': '사과나무',
            'herb': '라벤더',
            'fruit': '딸기'
        };
        return names[type] || '신비한 식물';
    }
    getPlantDescription(type) {
        const descriptions = {
            'flower': '밝고 긍정적인 에너지를 가진 꽃',
            'tree': '강인하고 안정적인 나무',
            'herb': '차분하고 치유적인 허브',
            'fruit': '달콤하고 영양가 있는 과일'
        };
        return descriptions[type] || '특별한 식물';
    }
    generateRandomPosition() {
        return {
            x: Math.random() * 400 + 50,
            y: Math.random() * 300 + 50
        };
    }
    getUnlockedPlants(level) {
        const unlockMap = {
            2: ['cherry_blossom', 'oak_tree'],
            3: ['mint', 'strawberry'],
            4: ['rose', 'pine_tree'],
            5: ['jasmine', 'grape']
        };
        return unlockMap[level] || [];
    }
    getActivityPoints(activityType) {
        const points = {
            'positive_interaction': 15,
            'group_harmony': 25,
            'daily_check': 10
        };
        return points[activityType] || 5;
    }
    getActivityDescription(activityType) {
        const descriptions = {
            'positive_interaction': '긍정적인 상호작용으로 식물들이 기뻐합니다',
            'group_harmony': '그룹의 조화로운 분위기가 정원에 전해집니다',
            'daily_check': '꾸준한 관심이 식물들의 성장을 돕습니다'
        };
        return descriptions[activityType] || '정원 활동';
    }
    shouldStageUp(plant, daysSincePlanted) {
        const stageRequirements = {
            'seed': 1,
            'sprout': 3,
            'growing': 7,
            'blooming': 14
        };
        return daysSincePlanted >= (stageRequirements[plant.stage] || 0);
    }
    getNextStage(currentStage) {
        const stages = ['seed', 'sprout', 'growing', 'blooming', 'mature'];
        const currentIndex = stages.indexOf(currentStage);
        return stages[currentIndex + 1] || 'mature';
    }
}
exports.GardenService = GardenService;
//# sourceMappingURL=gardenService.js.map