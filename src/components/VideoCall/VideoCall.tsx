import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Settings, Maximize2, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface VideoCallProps {
  roomId: string;
  userId: string;
  userName: string;
  onCallEnd: () => void;
  isCounselor?: boolean;
}

interface Participant {
  id: string;
  name: string;
  stream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isCounselor: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({
  roomId,
  userId,
  userName,
  onCallEnd,
  isCounselor = false
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // 미디어 스트림 초기화
  const initializeMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      toast.success('카메라와 마이크가 활성화되었습니다');
    } catch (error) {
      console.error('미디어 스트림 초기화 실패:', error);
      toast.error('카메라나 마이크 접근 권한이 필요합니다');
    }
  }, []);

  // 비디오 토글
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        toast.success(videoTrack.enabled ? '비디오가 활성화되었습니다' : '비디오가 비활성화되었습니다');
      }
    }
  }, [localStream]);

  // 오디오 토글
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        toast.success(audioTrack.enabled ? '마이크가 활성화되었습니다' : '마이크가 비활성화되었습니다');
      }
    }
  }, [localStream]);

  // 화면 공유
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        toast.success('화면 공유가 시작되었습니다');
        
        // 화면 공유 종료 감지
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
          }
        };
      } else {
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }
        setIsScreenSharing(false);
        toast.success('화면 공유가 종료되었습니다');
      }
    } catch (error) {
      console.error('화면 공유 실패:', error);
      toast.error('화면 공유를 시작할 수 없습니다');
    }
  }, [isScreenSharing, localStream]);

  // 전체화면 토글
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // 통화 종료
  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setCallStatus('disconnected');
    onCallEnd();
    toast.success('통화가 종료되었습니다');
  }, [localStream, onCallEnd]);

  // 컴포넌트 마운트 시 미디어 스트림 초기화
  useEffect(() => {
    initializeMediaStream();
    setCallStatus('connected');
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeMediaStream, localStream]);

  return (
    <div className={`fixed inset-0 bg-gray-900 z-50 ${isFullscreen ? '' : 'p-4'}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h2 className="text-xl font-semibold">화상 상담</h2>
          <span className="text-sm text-gray-300">방 ID: {roomId}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            title={isFullscreen ? "축소" : "전체화면"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 비디오 영역 */}
      <div className="flex-1 flex gap-4 mb-4">
        {/* 원격 비디오 (메인) */}
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* 원격 사용자 정보 */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
            <p className="font-medium">상담사</p>
            <p className="text-sm text-gray-300">연결됨</p>
          </div>
        </div>

        {/* 로컬 비디오 (작은 화면) */}
        <div className="w-80 bg-gray-800 rounded-lg overflow-hidden relative">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* 로컬 사용자 정보 */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {userName} (나)
          </div>
          
          {/* 비디오 상태 표시 */}
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="h-12 w-12 text-gray-500" />
            </div>
          )}
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="flex items-center justify-center space-x-4">
        {/* 비디오 토글 */}
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${
            isVideoEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={isVideoEnabled ? "비디오 끄기" : "비디오 켜기"}
        >
          {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </button>

        {/* 오디오 토글 */}
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${
            isAudioEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={isAudioEnabled ? "마이크 끄기" : "마이크 켜기"}
        >
          {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </button>

        {/* 화면 공유 */}
        <button
          onClick={toggleScreenShare}
          className={`p-4 rounded-full transition-colors ${
            isScreenSharing 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isScreenSharing ? "화면 공유 중지" : "화면 공유"}
        >
          <Users className="h-6 w-6" />
        </button>

        {/* 설정 */}
        <button
          className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          title="설정"
        >
          <Settings className="h-6 w-6" />
        </button>

        {/* 통화 종료 */}
        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="통화 종료"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>

      {/* 상태 표시 */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            callStatus === 'connected' ? 'bg-green-500' : 
            callStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm">
            {callStatus === 'connected' ? '연결됨' : 
             callStatus === 'connecting' ? '연결 중...' : '연결 끊김'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
