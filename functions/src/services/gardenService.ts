import { db, serverTimestamp } from '../config/firebaseAdmin';

/**
 * 🌱 관계의 정원 가꾸기 서비스
 * 긍정적 상호작용으로 가상 정원을 키우는 게이미피케이션 시스템
 * 
 * 심리상담가 1,2가 설계한 관계 개선 도구
 * 시각적 리워드를 통한 동기부여 시스템
 */

interface Plant {
  id: string;
  type: 'flower' | 'tree' | 'herb' | 'fruit';
  name: string;
  description: string;
  stage: 'seed' | 'sprout' | 'growing' | 'blooming' | 'mature';
  health: number; // 0-100
  happiness: number; // 0-100
  position: { x: number; y: number };
  plantedAt: Date;
  lastWatered: Date;
  relationshipSource: {
    type: 'individual' | 'group';
    sourceId: string;
    sourceName: string;
  };
  growthFactors: {
    positiveInteractions: number;
    consistentCare: number;
    groupHarmony: number;
  };
  experience: number; // 성장 경험치
  level: number; // 식물 레벨
}

interface Garden {
  id: string;
  userId: string;
  level: number;
  experience: number;
  plants: Plant[];
  unlockedPlants: string[];
  totalPositiveInteractions: number;
  lastActivity: Date;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface GardenAction {
  type: 'water' | 'fertilize' | 'prune' | 'harvest' | 'plant';
  plantId?: string;
  plantType?: string;
  interactionType?: 'positive' | 'group_activity' | 'daily_care';
  points: number;
  description: string;
}

interface PlantGrowthEvent {
  plantId: string;
  eventType: 'stage_up' | 'level_up' | 'unlock' | 'achievement';
  message: string;
  rewards: {
    experience: number;
    points: number;
    unlockedItems?: string[];
  };
}

export class GardenService {
  private database = db;

  /**
   * 사용자의 정원 정보 조회
   */
  async getUserGarden(userId: string): Promise<Garden | null> {
    try {
      const gardenDoc = await this.database.collection('gardens').doc(userId).get();
      
      if (!gardenDoc.exists) {
        // 새 정원 생성
        return await this.createNewGarden(userId);
      }
      
      const gardenData = gardenDoc.data();
      return {
        id: gardenDoc.id,
        ...gardenData,
        createdAt: gardenData?.createdAt?.toDate() || new Date(),
        updatedAt: gardenData?.updatedAt?.toDate() || new Date(),
        lastActivity: gardenData?.lastActivity?.toDate() || new Date(),
        plants: gardenData?.plants?.map((plant: any) => ({
          ...plant,
          plantedAt: plant.plantedAt?.toDate() || new Date(),
          lastWatered: plant.lastWatered?.toDate() || new Date()
        })) || []
      } as Garden;
      
    } catch (error) {
      console.error('정원 정보 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 새 정원 생성
   */
  private async createNewGarden(userId: string): Promise<Garden> {
    try {
      const newGarden: Garden = {
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

      await this.database.collection('gardens').doc(userId).set({
        ...newGarden,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      return newGarden;
      
    } catch (error) {
      console.error('새 정원 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 정원 액션 수행 (물주기, 비료주기 등)
   */
  async performGardenAction(
    userId: string, 
    action: GardenAction
  ): Promise<{ success: boolean; garden: Garden; events: PlantGrowthEvent[] }> {
    try {
      const garden = await this.getUserGarden(userId);
      if (!garden) throw new Error('정원을 찾을 수 없습니다.');

      const events: PlantGrowthEvent[] = [];
      let updatedGarden = { ...garden };

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
      await this.database.collection('gardens').doc(userId).update({
        ...updatedGarden,
        updatedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      return {
        success: true,
        garden: updatedGarden,
        events
      };
      
    } catch (error) {
      console.error('정원 액션 수행 오류:', error);
      throw error;
    }
  }

  /**
   * 식물에 물주기
   */
  private async waterPlants(garden: Garden, action: GardenAction): Promise<Garden> {
    const updatedGarden = { ...garden };
    
    updatedGarden.plants = updatedGarden.plants.map(plant => {
      if (action.plantId && plant.id === action.plantId) {
        const newHealth = Math.min(100, plant.health + 10);
        const newHappiness = Math.min(100, plant.happiness + 5);
        
        return {
          ...plant,
          health: newHealth,
          happiness: newHappiness,
          lastWatered: new Date(),
          experience: plant.experience + 5
        };
      }
      return plant;
    });

    return updatedGarden;
  }

  /**
   * 새 씨앗 심기
   */
  private async plantNewSeed(garden: Garden, action: GardenAction): Promise<Garden> {
    const updatedGarden = { ...garden };
    
    if (!action.plantType) throw new Error('식물 타입이 필요합니다.');

    const newPlant: Plant = {
      id: `plant_${Date.now()}`,
      type: action.plantType as any,
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
  private async harvestPlant(garden: Garden, action: GardenAction): Promise<Garden> {
    const updatedGarden = { ...garden };
    
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
  private async performGeneralAction(garden: Garden, action: GardenAction): Promise<Garden> {
    const updatedGarden = { ...garden };
    
    // 모든 식물의 행복도 증가
    updatedGarden.plants = updatedGarden.plants.map(plant => ({
      ...plant,
      happiness: Math.min(100, plant.happiness + 2),
      experience: plant.experience + 1
    }));

    return updatedGarden;
  }

  /**
   * 레벨 업 체크
   */
  private checkLevelUp(garden: Garden): PlantGrowthEvent | null {
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
  async updateGardenFromGroupActivity(
    userId: string,
    groupId: string,
    activityType: 'positive' | 'group_activity' | 'daily_care'
  ): Promise<{ success: boolean; garden: Garden; events: PlantGrowthEvent[] }> {
    try {
      const garden = await this.getUserGarden(userId);
      if (!garden) throw new Error('정원을 찾을 수 없습니다.');

      const action: GardenAction = {
        type: 'fertilize',
        interactionType: activityType,
        points: this.getActivityPoints(activityType),
        description: this.getActivityDescription(activityType)
      };

      return await this.performGardenAction(userId, action);
      
    } catch (error) {
      console.error('그룹 활동 정원 업데이트 오류:', error);
      throw error;
    }
  }

  /**
   * 식물 성장 시뮬레이션 (AI 기반)
   */
  async simulatePlantGrowth(userId: string): Promise<{ success: boolean; events: PlantGrowthEvent[] }> {
    try {
      const garden = await this.getUserGarden(userId);
      if (!garden) throw new Error('정원을 찾을 수 없습니다.');

      const events: PlantGrowthEvent[] = [];
      const updatedGarden = { ...garden };

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
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        events
      };
      
    } catch (error) {
      console.error('식물 성장 시뮬레이션 오류:', error);
      throw error;
    }
  }

  /**
   * 개별 식물 성장 체크
   */
  private async checkPlantGrowth(plant: Plant): Promise<PlantGrowthEvent | null> {
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
  private getPlantName(type: string): string {
    const names: { [key: string]: string } = {
      'flower': '해바라기',
      'tree': '사과나무',
      'herb': '라벤더',
      'fruit': '딸기'
    };
    return names[type] || '신비한 식물';
  }

  private getPlantDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      'flower': '밝고 긍정적인 에너지를 가진 꽃',
      'tree': '강인하고 안정적인 나무',
      'herb': '차분하고 치유적인 허브',
      'fruit': '달콤하고 영양가 있는 과일'
    };
    return descriptions[type] || '특별한 식물';
  }

  private generateRandomPosition(): { x: number; y: number } {
    return {
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50
    };
  }

  private getUnlockedPlants(level: number): string[] {
    const unlockMap: { [key: number]: string[] } = {
      2: ['cherry_blossom', 'oak_tree'],
      3: ['mint', 'strawberry'],
      4: ['rose', 'pine_tree'],
      5: ['jasmine', 'grape']
    };
    return unlockMap[level] || [];
  }

  private getActivityPoints(activityType: string): number {
    const points: { [key: string]: number } = {
      'positive_interaction': 15,
      'group_harmony': 25,
      'daily_check': 10
    };
    return points[activityType] || 5;
  }

  private getActivityDescription(activityType: string): string {
    const descriptions: { [key: string]: string } = {
      'positive_interaction': '긍정적인 상호작용으로 식물들이 기뻐합니다',
      'group_harmony': '그룹의 조화로운 분위기가 정원에 전해집니다',
      'daily_check': '꾸준한 관심이 식물들의 성장을 돕습니다'
    };
    return descriptions[activityType] || '정원 활동';
  }

  private shouldStageUp(plant: Plant, daysSincePlanted: number): boolean {
    const stageRequirements: { [key: string]: number } = {
      'seed': 1,
      'sprout': 3,
      'growing': 7,
      'blooming': 14
    };
    return daysSincePlanted >= (stageRequirements[plant.stage] || 0);
  }

  private getNextStage(currentStage: string): 'seed' | 'sprout' | 'growing' | 'blooming' | 'mature' {
    const stages: ('seed' | 'sprout' | 'growing' | 'blooming' | 'mature')[] = ['seed', 'sprout', 'growing', 'blooming', 'mature'];
    const currentIndex = stages.indexOf(currentStage as any);
    return stages[currentIndex + 1] || 'mature';
  }
}
