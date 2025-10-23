import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Users, 
  Heart, 
  Home, 
  Briefcase,
  Settings,
  Plus,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface GroupFormData {
  name: string;
  description: string;
  type: 'family' | 'couple' | 'friends' | 'team' | 'custom';
  characteristics: string[];
  isPrivate: boolean;
  allowInvites: boolean;
  weeklyReportDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
}

const CreateGroupPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    type: 'friends',
    characteristics: [],
    isPrivate: false,
    allowInvites: true,
    weeklyReportDay: 'sunday'
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 그룹 유형 옵션
  const groupTypes = [
    {
      id: 'family',
      name: '가족',
      description: '가족 구성원들과 함께하는 그룹',
      icon: <Home className="w-8 h-8" />,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'couple',
      name: '연인/부부',
      description: '연인이나 부부가 함께하는 그룹',
      icon: <Heart className="w-8 h-8" />,
      color: 'bg-pink-100 text-pink-600'
    },
    {
      id: 'friends',
      name: '친구',
      description: '친구들과 함께하는 그룹',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'team',
      name: '팀/회사',
      description: '직장 동료나 팀원들과 함께하는 그룹',
      icon: <Briefcase className="w-8 h-8" />,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'custom',
      name: '커스텀',
      description: '나만의 특별한 그룹',
      icon: <Settings className="w-8 h-8" />,
      color: 'bg-gray-100 text-gray-600'
    }
  ];

  // 그룹 특성 옵션
  const characteristicOptions = [
    '소통 개선',
    '갈등 해결',
    '감정 지원',
    '목표 설정',
    '스트레스 관리',
    '관계 강화',
    '자기 성장',
    '팀워크 향상',
    '신뢰 구축',
    '공감 능력',
    '리더십 개발',
    '창의성 증진',
    '문제 해결',
    '의사결정',
    '협력 증진'
  ];

  // 주간 리포트 요일 옵션
  const weeklyReportDays = [
    { id: 'sunday', name: '일요일' },
    { id: 'monday', name: '월요일' },
    { id: 'tuesday', name: '화요일' },
    { id: 'wednesday', name: '수요일' },
    { id: 'thursday', name: '목요일' },
    { id: 'friday', name: '금요일' },
    { id: 'saturday', name: '토요일' }
  ];

  const handleInputChange = (field: keyof GroupFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCharacteristicToggle = (characteristic: string) => {
    setFormData(prev => ({
      ...prev,
      characteristics: prev.characteristics.includes(characteristic)
        ? prev.characteristics.filter(c => c !== characteristic)
        : [...prev.characteristics, characteristic]
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        toast.error('그룹 이름을 입력해주세요.');
        return;
      }
      if (formData.characteristics.length === 0) {
        toast.error('그룹 특성을 최소 1개 이상 선택해주세요.');
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 그룹 생성
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        characteristics: formData.characteristics,
        members: {
          [user.uid]: {
            role: 'owner',
            joinedAt: new Date(),
            status: 'active',
            nickname: user.displayName || '그룹장'
          }
        },
        settings: {
          isPrivate: formData.isPrivate,
          allowInvites: formData.allowInvites,
          weeklyReportDay: formData.weeklyReportDay
        },
        stats: {
          totalMembers: 1,
          activeMembers: 1,
          completedTests: 0,
          weeklyReportsGenerated: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid
      };

      const docRef = await addDoc(collection(db, 'groups'), groupData);
      
      toast.success('그룹이 성공적으로 생성되었습니다!');
      navigate(`/groups/${docRef.id}`);
    } catch (error) {
      console.error('그룹 생성 오류:', error);
      toast.error('그룹 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* 그룹 유형 선택 */}
      <div>
        <h3 className="text-headline-small text-gray-900 mb-6">
          어떤 종류의 그룹을 만드시나요?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleInputChange('type', type.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                formData.type === type.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
              }`}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${type.color}`}>
                {type.icon}
              </div>
              <h4 className="text-title-medium text-gray-900 mb-2">
                {type.name}
              </h4>
              <p className="text-body-small text-gray-600">
                {type.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 그룹 이름 */}
      <div>
        <label className="block text-title-medium text-gray-900 mb-3">
          그룹 이름 *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="예: 우리 가족, 친한 친구들, 개발팀"
          className="input-field"
          maxLength={50}
        />
        <p className="text-body-small text-gray-500 mt-2">
          {formData.name.length}/50자
        </p>
      </div>

      {/* 그룹 설명 */}
      <div>
        <label className="block text-title-medium text-gray-900 mb-3">
          그룹 설명 (선택사항)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="그룹에 대한 간단한 설명을 작성해주세요."
          className="input-field h-24 resize-none"
          maxLength={200}
        />
        <p className="text-body-small text-gray-500 mt-2">
          {formData.description.length}/200자
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      {/* 그룹 특성 선택 */}
      <div>
        <h3 className="text-headline-small text-gray-900 mb-4">
          그룹이 중점적으로 다루고 싶은 영역을 선택해주세요
        </h3>
        <p className="text-body-medium text-gray-600 mb-6">
          선택한 특성에 따라 맞춤형 심리검사와 활동을 추천해드립니다. (복수 선택 가능)
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {characteristicOptions.map((characteristic) => (
            <button
              key={characteristic}
              onClick={() => handleCharacteristicToggle(characteristic)}
              className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                formData.characteristics.includes(characteristic)
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                {formData.characteristics.includes(characteristic) && (
                  <CheckCircle className="w-5 h-5 text-pink-600" />
                )}
              </div>
              <span className="text-body-medium font-medium">
                {characteristic}
              </span>
            </button>
          ))}
        </div>
        
        <p className="text-body-small text-gray-500 mt-4">
          선택된 특성: {formData.characteristics.length}개
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      {/* 그룹 설정 */}
      <div>
        <h3 className="text-headline-small text-gray-900 mb-6">
          그룹 설정을 완료해주세요
        </h3>
        
        <div className="space-y-6">
          {/* 프라이버시 설정 */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-title-medium text-gray-900 mb-2">
                  비공개 그룹
                </h4>
                <p className="text-body-medium text-gray-600">
                  그룹을 비공개로 설정하면 초대받은 사람만 참여할 수 있습니다.
                </p>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => handleInputChange('isPrivate', !formData.isPrivate)}
                  className={`toggle-switch ${formData.isPrivate ? 'active' : ''}`}
                >
                  <span className={`toggle-thumb ${formData.isPrivate ? 'active' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 초대 권한 설정 */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-title-medium text-gray-900 mb-2">
                  멤버 초대 허용
                </h4>
                <p className="text-body-medium text-gray-600">
                  모든 멤버가 새로운 사람을 초대할 수 있도록 허용합니다.
                </p>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => handleInputChange('allowInvites', !formData.allowInvites)}
                  className={`toggle-switch ${formData.allowInvites ? 'active' : ''}`}
                >
                  <span className={`toggle-thumb ${formData.allowInvites ? 'active' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 주간 리포트 요일 설정 */}
          <div className="card">
            <h4 className="text-title-medium text-gray-900 mb-4">
              주간 리포트 발송 요일
            </h4>
            <p className="text-body-medium text-gray-600 mb-4">
              매주 그룹 분석 리포트를 받을 요일을 선택해주세요.
            </p>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {weeklyReportDays.map((day) => (
                <button
                  key={day.id}
                  onClick={() => handleInputChange('weeklyReportDay', day.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                    formData.weeklyReportDay === day.id
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className="text-body-small font-medium">
                    {day.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container-responsive py-8">
        {/* 헤더 */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/groups')}
            className="btn-ghost mr-4 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-display-medium text-gray-900 mb-2">
              새 그룹 만들기
            </h1>
            <p className="text-body-large text-gray-600">
              함께 성장할 그룹을 만들어보세요.
            </p>
          </div>
        </div>

        {/* 진행률 표시 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              {currentStep} / 3 단계
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round((currentStep / 3) * 100)}% 완료
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* 단계별 콘텐츠 */}
        <div className="max-w-4xl mx-auto">
          <div className="card-elevated fade-in">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  currentStep === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                이전
              </button>

              <button
                onClick={handleNext}
                disabled={isLoading}
                className="btn-primary flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2" />
                    생성 중...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    그룹 생성하기
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    다음
                    <Plus className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 도움말 */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="alert-info">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">그룹 생성 안내</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>그룹을 생성하면 자동으로 그룹장이 됩니다.</li>
                  <li>그룹 특성에 따라 맞춤형 심리검사와 활동이 추천됩니다.</li>
                  <li>언제든지 그룹 설정을 변경할 수 있습니다.</li>
                  <li>모든 그룹 데이터는 암호화되어 안전하게 보호됩니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupPage;
