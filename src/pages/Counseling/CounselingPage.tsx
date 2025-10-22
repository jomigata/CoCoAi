import React, { useState } from 'react';
import { MessageCircle, Send, Smile, Paperclip, MoreVertical } from 'lucide-react';

const CounselingPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: '안녕하세요! 오늘은 어떤 이야기를 나누고 싶으신가요?',
      sender: 'ai',
      timestamp: new Date(),
    },
    {
      id: 2,
      text: '요즘 스트레스가 많이 받아서 상담을 받고 싶어요.',
      sender: 'user',
      timestamp: new Date(),
    },
    {
      id: 3,
      text: '스트레스를 받고 계시는군요. 구체적으로 어떤 상황에서 스트레스를 느끼시나요?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      
      // AI 응답 시뮬레이션
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          text: '이해했습니다. 그런 상황이 정말 힘드셨을 것 같아요. 더 자세히 말씀해 주시겠어요?',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI 상담사 코코
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                온라인 상태
              </p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${
                msg.sender === 'user' ? 'text-pink-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {msg.timestamp.toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 입력 영역 */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Smile className="h-5 w-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounselingPage;
