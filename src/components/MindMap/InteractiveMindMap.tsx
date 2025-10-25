import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Brain, 
  Heart, 
  Users, 
  Target, 
  Zap, 
  Shield, 
  Star, 
  Compass,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface MindMapNode {
  id: string;
  name: string;
  category: 'personality' | 'emotion' | 'relationship' | 'values' | 'strengths' | 'growth';
  value: number; // 0-100
  color: string;
  size: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface MindMapLink {
  source: string;
  target: string;
  strength: number; // 0-1
  color: string;
}

interface MindMapData {
  nodes: MindMapNode[];
  links: MindMapLink[];
}

interface InteractiveMindMapProps {
  profilingData: {
    personality: string;
    emotionalPattern: string;
    communicationStyle: string;
    growthAreas: string[];
    recommendations: string[];
    scores: {
      selfEsteem: number;
      stressCoping: {
        active: number;
        passive: number;
        social: number;
        individual: number;
      };
      relationshipPattern: string;
      coreValues: string[];
      strengths: string[];
    };
  };
  onNodeClick?: (node: MindMapNode) => void;
  onNodeHover?: (node: MindMapNode | null) => void;
}

const InteractiveMindMap: React.FC<InteractiveMindMapProps> = ({
  profilingData,
  onNodeClick,
  onNodeHover
}) => {
  const graphRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MindMapNode | null>(null);

  // 색상 팔레트 정의
  const colorPalette = {
    personality: '#6366f1', // 인디고
    emotion: '#ec4899', // 핑크
    relationship: '#10b981', // 에메랄드
    values: '#f59e0b', // 앰버
    strengths: '#8b5cf6', // 바이올렛
    growth: '#ef4444', // 레드
  };

  // 마음 지도 데이터 생성
  const mindMapData: MindMapData = useMemo(() => {
    const nodes: MindMapNode[] = [];
    const links: MindMapLink[] = [];

    // 중심 노드 (개인)
    const centerNode: MindMapNode = {
      id: 'center',
      name: '나의 마음',
      category: 'personality',
      value: 100,
      color: colorPalette.personality,
      size: 20,
      fx: 0,
      fy: 0
    };
    nodes.push(centerNode);

    // 성격 특성 노드들
    const personalityTraits = [
      { name: '자아존중감', value: profilingData.scores.selfEsteem },
      { name: '스트레스 대처', value: (profilingData.scores.stressCoping.active + profilingData.scores.stressCoping.social) / 2 },
      { name: '대인관계', value: 75 }, // 기본값
    ];

    personalityTraits.forEach((trait, index) => {
      const node: MindMapNode = {
        id: `personality-${index}`,
        name: trait.name,
        category: 'personality',
        value: trait.value,
        color: colorPalette.personality,
        size: Math.max(8, trait.value / 10)
      };
      nodes.push(node);

      links.push({
        source: 'center',
        target: node.id,
        strength: trait.value / 100,
        color: colorPalette.personality
      });
    });

    // 감정 패턴 노드들
    const emotionPatterns = [
      { name: '긍정적 감정', value: 80 },
      { name: '스트레스 관리', value: profilingData.scores.stressCoping.active },
      { name: '감정 조절', value: 70 },
    ];

    emotionPatterns.forEach((emotion, index) => {
      const node: MindMapNode = {
        id: `emotion-${index}`,
        name: emotion.name,
        category: 'emotion',
        value: emotion.value,
        color: colorPalette.emotion,
        size: Math.max(6, emotion.value / 12)
      };
      nodes.push(node);

      links.push({
        source: 'center',
        target: node.id,
        strength: emotion.value / 100,
        color: colorPalette.emotion
      });
    });

    // 관계 패턴 노드들
    const relationshipPatterns = [
      { name: '소통 스타일', value: 75 },
      { name: '갈등 해결', value: 65 },
      { name: '공감 능력', value: 85 },
    ];

    relationshipPatterns.forEach((rel, index) => {
      const node: MindMapNode = {
        id: `relationship-${index}`,
        name: rel.name,
        category: 'relationship',
        value: rel.value,
        color: colorPalette.relationship,
        size: Math.max(6, rel.value / 12)
      };
      nodes.push(node);

      links.push({
        source: 'center',
        target: node.id,
        strength: rel.value / 100,
        color: colorPalette.relationship
      });
    });

    // 핵심 가치 노드들
    profilingData.scores.coreValues.slice(0, 3).forEach((value, index) => {
      const node: MindMapNode = {
        id: `value-${index}`,
        name: value,
        category: 'values',
        value: 90,
        color: colorPalette.values,
        size: 10
      };
      nodes.push(node);

      links.push({
        source: 'center',
        target: node.id,
        strength: 0.9,
        color: colorPalette.values
      });
    });

    // 강점 노드들
    profilingData.scores.strengths.slice(0, 3).forEach((strength, index) => {
      const node: MindMapNode = {
        id: `strength-${index}`,
        name: strength,
        category: 'strengths',
        value: 95,
        color: colorPalette.strengths,
        size: 12
      };
      nodes.push(node);

      links.push({
        source: 'center',
        target: node.id,
        strength: 0.95,
        color: colorPalette.strengths
      });
    });

    // 성장 영역 노드들
    profilingData.growthAreas.slice(0, 2).forEach((area, index) => {
      const node: MindMapNode = {
        id: `growth-${index}`,
        name: area,
        category: 'growth',
        value: 60,
        color: colorPalette.growth,
        size: 8
      };
      nodes.push(node);

      links.push({
        source: 'center',
        target: node.id,
        strength: 0.6,
        color: colorPalette.growth
      });
    });

    return { nodes, links };
  }, [profilingData, colorPalette]);

  // 노드 클릭 핸들러
  const handleNodeClick = (node: MindMapNode) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  };

  // 노드 호버 핸들러
  const handleNodeHover = (node: MindMapNode | null) => {
    setHoveredNode(node);
    onNodeHover?.(node);
  };

  // 줌 컨트롤
  const handleZoomIn = () => {
    graphRef.current?.zoomToFit(400);
  };

  const handleZoomOut = () => {
    graphRef.current?.zoomToFit(1000);
  };

  const handleReset = () => {
    graphRef.current?.zoomToFit(800);
    graphRef.current?.centerAt(0, 0);
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 전체화면 모드에서 크기 조정
  useEffect(() => {
    if (isFullscreen) {
      setDimensions({ width: window.innerWidth - 100, height: window.innerHeight - 100 });
    } else {
      setDimensions({ width: 800, height: 600 });
    }
  }, [isFullscreen]);

  // 노드 렌더링 함수
  const nodeCanvasObject = (node: MindMapNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(12, node.size * 0.8);
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = node.color;
    ctx.fillText(label, node.x!, node.y!);
  };

  // 링크 렌더링 함수
  const linkCanvasObject = (link: MindMapLink, ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = link.color;
    ctx.lineWidth = link.strength * 3;
    ctx.globalAlpha = link.strength;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* 컨트롤 패널 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-primary-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            인터랙티브 마음 지도
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="확대"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="축소"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="초기화"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={isFullscreen ? "축소" : "전체화면"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 mb-4">
        {Object.entries(colorPalette).map(([category, color]) => (
          <div key={category} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
              {category === 'personality' ? '성격' :
               category === 'emotion' ? '감정' :
               category === 'relationship' ? '관계' :
               category === 'values' ? '가치' :
               category === 'strengths' ? '강점' :
               category === 'growth' ? '성장' : category}
            </span>
          </div>
        ))}
      </div>

      {/* 마음 지도 그래프 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <ForceGraph2D
          ref={graphRef}
          graphData={mindMapData}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          nodeColor={(node: MindMapNode) => node.color}
          nodeVal={(node: MindMapNode) => node.size}
          linkColor={(link: MindMapLink) => link.color}
          linkWidth={(link: MindMapLink) => link.strength * 3}
          cooldownTicks={100}
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.3}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          enableNodeDrag={true}
        />
      </div>

      {/* 선택된 노드 정보 */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: selectedNode.color }}
            />
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {selectedNode.name}
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            카테고리: {
              selectedNode.category === 'personality' ? '성격 특성' :
              selectedNode.category === 'emotion' ? '감정 패턴' :
              selectedNode.category === 'relationship' ? '관계 패턴' :
              selectedNode.category === 'values' ? '핵심 가치' :
              selectedNode.category === 'strengths' ? '주요 강점' :
              selectedNode.category === 'growth' ? '성장 영역' : selectedNode.category
            }
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            강도: {selectedNode.value}%
          </p>
        </div>
      )}

      {/* 호버된 노드 정보 */}
      {hoveredNode && !selectedNode && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: hoveredNode.color }}
            />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {hoveredNode.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMindMap;
