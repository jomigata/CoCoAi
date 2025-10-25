import React, { useState, useEffect } from 'react';
import { useAuth } from '@store/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { 
  Flower, 
  TreePine, 
  Sun, 
  Cloud, 
  Droplets, 
  Sparkles,
  Heart,
  Users,
  Star,
  Zap,
  Leaf,
  Cherry,
  RefreshCw,
  Info,
  Plus,
  Scissors,
  Package
} from 'lucide-react';
import { AIWarning } from '../../components/Common/AIWarning';
import { useAIWarning } from '../../hooks/useAIWarning';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

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
}

interface Garden {
  id: string;
  userId: string;
  level: number;
  size: { width: number; height: number };
  plants: Plant[];
  resources: {
    water: number;
    fertilizer: number;
    seeds: number;
  };
  weather: 'sunny' | 'cloudy' | 'rainy';
  lastVisited: Date;
  totalGrowthPoints: number;
}

interface GardenAction {
  id: string;
  type: 'water' | 'fertilize' | 'plant' | 'harvest';
  plantId?: string;
  cost: number;
  effect: string;
  available: boolean;
}

/**
 * 🌸 관계의 정원 가꾸기 페이지
 * 긍정적 상호작용을 시각적으로 표현하는 게이미피케이션 요소
 * 
 * 심리상담가 1,2가 설계한 관계 성장 메타포
 * 개인과 그룹의 관계 발전을 식물 성장으로 시각화
 */
const RelationshipGardenPage: React.FC = () => {
  const { user } = useAuth();
  const functions = getFunctions();
  
  const [garden, setGarden] = useState<Garden | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [availableActions, setAvailableActions] = useState<GardenAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [growthEvents, setGrowthEvents] = useState<any[]>([]);

  // AI 경고 시스템
  const aiWarning = useAIWarning({
    analysisType: 'general',
    severity: 'low',
    includeEmergencyContact: false
  });

  useEffect(() => {
    if (user) {
      loadGarden();
    }
  }, [user]);

  const loadGarden = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Firebase Functions를 통한 실제 정원 데이터 로드
      const getUserGarden = httpsCallable(functions, 'getUserGarden');
      const result = await getUserGarden({ userId: user.uid });
      const data = result.data as { success: boolean; garden: Garden };
      
      if (data.success && data.garden) {
        setGarden(data.garden);
        setAvailableActions(getAvailableActions(data.garden));
        toast.success('정원을 불러왔습니다!');
      } else {
        // 폴백으로 목업 데이터 사용
        const mockGarden = getMockGarden(user.uid);
        setGarden(mockGarden);
        setAvailableActions(getAvailableActions(mockGarden));
      }
    } catch (error) {
      console.error('정원 로드 오류:', error);
      toast.error('정원을 불러오는 중 오류가 발생했습니다.');
      
      // 폴백으로 목업 데이터 사용
      const mockGarden = getMockGarden(user.uid);
      setGarden(mockGarden);
      setAvailableActions(getAvailableActions(mockGarden));
    } finally {
      setIsLoading(false);
    }
  };

  const performGardenAction = async (action: GardenAction) => {
    if (!user || !garden || isPerformingAction) return;

    setIsPerformingAction(true);
    try {
      // Firebase Functions를 통한 실제 정원 액션 수행
      const performAction = httpsCallable(functions, 'performGardenAction');
      const result = await performAction({
        userId: user.uid,
        action: {
          type: action.type,
          plantId: action.plantId,
          plantType: action.type === 'plant' ? 'flower' : undefined,
          points: action.cost,
          description: action.effect
        }
      });
      
      const data = result.data as { success: boolean; garden: Garden; events: any[] };
      
      if (data.success) {
        setGarden(data.garden);
        setAvailableActions(getAvailableActions(data.garden));
        
        // 성장 이벤트 표시
        if (data.events && data.events.length > 0) {
          setGrowthEvents(data.events);
          data.events.forEach(event => {
            toast.success(event.message);
          });
        }
        
        toast.success(`${action.effect} 완료!`);
      }
      
    } catch (error) {
      console.error('정원 액션 수행 오류:', error);
      toast.error('액션 수행 중 오류가 발생했습니다.');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const simulateGrowth = async () => {
    if (!user) return;

    try {
      const simulateGrowth = httpsCallable(functions, 'simulatePlantGrowth');
      const result = await simulateGrowth({ userId: user.uid });
      const data = result.data as { success: boolean; events: any[] };
      
      if (data.success && data.events && data.events.length > 0) {
        setGrowthEvents(data.events);
        data.events.forEach(event => {
          toast.success(event.message);
        });
        // 정원 다시 로드
        loadGarden();
      } else {
        toast.success('아직 성장할 식물이 없습니다.');
      }
      
    } catch (error) {
      console.error('성장 시뮬레이션 오류:', error);
      toast.error('성장 시뮬레이션 중 오류가 발생했습니다.');
    }
  };

  const getMockGarden = (userId: string): Garden => {
    return {
      id: `garden_${userId}`,
      userId,
      level: 3,
      size: { width: 8, height: 6 },
      plants: [
        {
          id: 'plant_1',
          type: 'flower',
          name: '우정의 꽃',
          description: '친구와의 따뜻한 대화에서 피어난 꽃입니다',
          stage: 'blooming',
          health: 85,
          happiness: 90,
          position: { x: 2, y: 2 },
          plantedAt: new Date('2024-10-15'),
          lastWatered: new Date('2024-10-21'),
          relationshipSource: {
            type: 'individual',
            sourceId: 'friend_1',
            sourceName: '김친구'
          },
          growthFactors: {
            positiveInteractions: 15,
            consistentCare: 12,
            groupHarmony: 8
          }
        },
        {
          id: 'plant_2',
          type: 'tree',
          name: '가족의 나무',
          description: '가족과의 깊은 유대감이 자라나는 나무입니다',
          stage: 'growing',
          health: 70,
          happiness: 75,
          position: { x: 5, y: 3 },
          plantedAt: new Date('2024-10-10'),
          lastWatered: new Date('2024-10-20'),
          relationshipSource: {
            type: 'group',
            sourceId: 'family_group',
            sourceName: '우리 가족'
          },
          growthFactors: {
            positiveInteractions: 20,
            consistentCare: 18,
            groupHarmony: 22
          }
        },
        {
          id: 'plant_3',
          type: 'herb',
          name: '자기사랑 허브',
          description: '자신을 돌보는 마음에서 자라나는 허브입니다',
          stage: 'sprout',
          health: 60,
          happiness: 65,
          position: { x: 1, y: 4 },
          plantedAt: new Date('2024-10-18'),
          lastWatered: new Date('2024-10-19'),
          relationshipSource: {
            type: 'individual',
            sourceId: userId,
            sourceName: '나 자신'
          },
          growthFactors: {
            positiveInteractions: 8,
            consistentCare: 5,
            groupHarmony: 3
          }
        }
      ],
      resources: {
        water: 15,
        fertilizer: 8,
        seeds: 3
      },
      weather: 'sunny',
      lastVisited: new Date(),
      totalGrowthPoints: 245
    };
  };

  const getAvailableActions = (garden: Garden): GardenAction[] => {
    return [
      {
        id: 'water',
        type: 'water',
        cost: 1,
        effect: '식물의 건강도 +10',
        available: garden.resources.water > 0
      },
      {
        id: 'fertilize',
        type: 'fertilize',
        cost: 1,
        effect: '식물의 행복도 +15',
        available: garden.resources.fertilizer > 0
      },
      {
        id: 'plant_seed',
        type: 'plant',
        cost: 1,
        effect: '새로운 식물 심기',
        available: garden.resources.seeds > 0
      }
    ];
  };

  const getPlantIcon = (plant: Plant) => {
    switch (plant.type) {
      case 'flower':
        return plant.stage === 'blooming' ? <Cherry className="w-8 h-8" /> : <Flower className="w-8 h-8" />;
      case 'tree':
        return <TreePine className="w-8 h-8" />;
      case 'herb':
        return <Leaf className="w-8 h-8" />;
      case 'fruit':
        return <Cherry className="w-8 h-8" />;
      default:
        return <Leaf className="w-8 h-8" />;
    }
  };

  const getPlantColor = (plant: Plant) => {
    const healthColor = plant.health > 70 ? 'text-green-600' : 
                       plant.health > 40 ? 'text-yellow-600' : 'text-red-600';
    
    switch (plant.stage) {
      case 'seed': return 'text-gray-600';
      case 'sprout': return 'text-green-400';
      case 'growing': return 'text-green-500';
      case 'blooming': return 'text-pink-500';
      case 'mature': return healthColor;
      default: return 'text-gray-600';
    }
  };

  const getStageLabel = (stage: Plant['stage']) => {
    switch (stage) {
      case 'seed': return '씨앗';
      case 'sprout': return '새싹';
      case 'growing': return '성장';
      case 'blooming': return '개화';
      case 'mature': return '성숙';
      default: return '알 수 없음';
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny': return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rainy': return <Droplets className="w-6 h-6 text-blue-500" />;
      default: return <Sun className="w-6 h-6 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="정원을 불러오고 있습니다..." />;
  }

  if (!garden) {
    return <ErrorMessage message="정원을 불러올 수 없습니다." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-pink-100 rounded-full mb-6">
            <Flower className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-display-medium text-gray-900 mb-4">
            관계의 정원
          </h1>
          <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-6">
            긍정적인 상호작용으로 아름다운 관계의 정원을 가꿔보세요.
          </p>
          
          {/* 성장 시뮬레이션 버튼 */}
          <div className="flex justify-center gap-4">
            <button
              onClick={simulateGrowth}
              disabled={isPerformingAction}
              className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              성장 시뮬레이션
            </button>
            <button
              onClick={() => loadGarden()}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* 정원 상태 */}
          <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* 날씨 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getWeatherIcon(garden.weather)}
                </div>
                <p className="text-body-small text-gray-600">
                  {garden.weather === 'sunny' ? '맑음' : 
                   garden.weather === 'cloudy' ? '흐림' : '비'}
                </p>
              </div>

              {/* 레벨 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-body-small text-gray-600">
                  레벨 {garden.level}
                </p>
              </div>

              {/* 자원들 */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Droplets className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-body-small text-gray-600">
                  물 {garden.resources.water}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-body-small text-gray-600">
                  영양분 {garden.resources.fertilizer}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Leaf className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-body-small text-gray-600">
                  씨앗 {garden.resources.seeds}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 정원 메인 영역 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-headline-medium text-gray-900">
                    나의 정원
                  </h3>
                  <button
                    onClick={() => setShowTutorial(true)}
                    className="btn-ghost p-2"
                    title="도움말"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>

                {/* 정원 그리드 */}
                <div 
                  className="grid gap-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-4 min-h-[400px]"
                  style={{ 
                    gridTemplateColumns: `repeat(${garden.size.width}, 1fr)`,
                    gridTemplateRows: `repeat(${garden.size.height}, 1fr)`
                  }}
                >
                  {Array.from({ length: garden.size.width * garden.size.height }, (_, index) => {
                    const x = index % garden.size.width;
                    const y = Math.floor(index / garden.size.width);
                    const plant = garden.plants.find(p => p.position.x === x && p.position.y === y);
                    
                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded border-2 border-dashed border-green-300 flex items-center justify-center cursor-pointer transition-colors ${
                          plant ? 'bg-green-50 border-green-400' : 'hover:bg-green-50'
                        } ${selectedPlant?.id === plant?.id ? 'ring-2 ring-pink-500' : ''}`}
                        onClick={() => plant && setSelectedPlant(plant)}
                      >
                        {plant ? (
                          <div className={`${getPlantColor(plant)} transform hover:scale-110 transition-transform`}>
                            {getPlantIcon(plant)}
                          </div>
                        ) : (
                          <div className="text-green-300">
                            <Leaf className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 사이드바 */}
            <div className="space-y-6">
              {/* 선택된 식물 정보 */}
              {selectedPlant && (
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-headline-medium text-gray-900 mb-4">
                    {selectedPlant.name}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* 식물 상태 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-body-medium text-gray-600">건강도</span>
                        <span className="text-body-medium font-medium">{selectedPlant.health}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedPlant.health}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-body-medium text-gray-600">행복도</span>
                        <span className="text-body-medium font-medium">{selectedPlant.happiness}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedPlant.happiness}%` }}
                        />
                      </div>
                    </div>

                    {/* 식물 정보 */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-body-small text-gray-700 mb-2">
                        <strong>성장 단계:</strong> {getStageLabel(selectedPlant.stage)}
                      </p>
                      <p className="text-body-small text-gray-700 mb-2">
                        <strong>관계:</strong> {selectedPlant.relationshipSource.sourceName}
                      </p>
                      <p className="text-body-small text-gray-700">
                        {selectedPlant.description}
                      </p>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="space-y-2">
                      {availableActions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => performGardenAction(action)}
                          disabled={!action.available || isPerformingAction}
                          className={`w-full btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                            action.type === 'water' ? 'border-blue-300 text-blue-600 hover:bg-blue-50' :
                            action.type === 'fertilize' ? 'border-purple-300 text-purple-600 hover:bg-purple-50' :
                            'border-green-300 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {action.type === 'water' && <Droplets className="w-4 h-4 mr-2" />}
                          {action.type === 'fertilize' && <Package className="w-4 h-4 mr-2" />}
                          {action.type === 'plant' && <Plus className="w-4 h-4 mr-2" />}
                          {action.type === 'harvest' && <Scissors className="w-4 h-4 mr-2" />}
                          
                          {action.type === 'water' ? '물주기' :
                           action.type === 'fertilize' ? '영양분 주기' :
                           action.type === 'plant' ? '씨앗 심기' : '액션'}
                          
                          <span className="ml-2 text-xs">(-{action.cost})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 성장 팁 */}
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-headline-medium text-gray-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  성장 팁
                </h3>
                
                <div className="space-y-3 text-body-small text-gray-600">
                  <div className="flex items-start">
                    <Heart className="w-4 h-4 text-pink-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p>긍정적인 대화와 상호작용이 식물을 더 건강하게 만듭니다.</p>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p>그룹 활동 참여로 관계의 나무가 더 크게 자랍니다.</p>
                  </div>
                  
                  <div className="flex items-start">
                    <Star className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p>꾸준한 관심과 돌봄이 아름다운 꽃을 피웁니다.</p>
                  </div>
                </div>
              </div>

              {/* 새로고침 */}
              <button
                onClick={loadGarden}
                className="w-full btn-outline flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                정원 새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 튜토리얼 모달 */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-headline-medium text-gray-900 mb-4">
                관계의 정원 가이드
              </h3>
              
              <div className="space-y-4 text-body-medium text-gray-700">
                <p>🌱 <strong>식물 키우기:</strong> 긍정적인 상호작용으로 식물이 자랍니다.</p>
                <p>💧 <strong>물주기:</strong> 정기적인 관심으로 건강도를 유지하세요.</p>
                <p>✨ <strong>영양분:</strong> 특별한 순간들이 행복도를 높입니다.</p>
                <p>🌸 <strong>개화:</strong> 관계가 깊어질수록 아름다운 꽃이 핍니다.</p>
              </div>
              
              <button
                onClick={() => setShowTutorial(false)}
                className="w-full btn-primary mt-6"
              >
                이해했어요
              </button>
            </div>
          </div>
        )}

        {/* 성장 이벤트 표시 */}
        {growthEvents.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {growthEvents.map((event, index) => (
              <div
                key={index}
                className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse"
              >
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  <span className="font-medium">{event.message}</span>
                </div>
                {event.rewards && (
                  <div className="text-sm mt-1 opacity-90">
                    +{event.rewards.experience} 경험치, +{event.rewards.points} 포인트
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* AI 경고 */}
        <div className="mt-8">
          <AIWarning {...aiWarning} />
        </div>
      </div>
    </div>
  );
};

export default RelationshipGardenPage;
