import React from 'react';
import StreamingTestPanel from '@/components/StreamingTestPanel';
import { ChatProvider } from '@/contexts/ChatContext';

/**
 * 流式对话功能测试页面
 * 提供完整的界面测试环境
 */
const StreamingTestPage: React.FC = () => {
  return (
    <ChatProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              流式对话功能测试
            </h1>
            <p className="text-gray-600">
              在这里测试实时流式处理、思考模式、状态管理和停止生成等功能
            </p>
          </div>
          
          <StreamingTestPanel />
          
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">测试说明</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-800">🔄 实时流式处理</h3>
                <p>启用流式处理后，AI回复会逐字符/逐词/逐行实时显示，观察流式内容的实时更新效果。</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800">🧠 思考模式</h3>
                <p>启用思考模式后，可以看到AI的思考过程，特别适合数学计算或复杂推理问题。</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800">📊 状态管理</h3>
                <p>观察顶部状态指示器的变化：生成状态、流式状态、思考状态和内容长度。</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800">⏹️ 停止生成</h3>
                <p>在生成过程中点击"停止"按钮，测试中断功能是否正常工作。</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800">🔧 测试建议</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>先测试短消息，观察基本流式效果</li>
                  <li>再测试长消息，观察性能和流畅度</li>
                  <li>测试思考模式，观察思考过程显示</li>
                  <li>测试停止功能，确保能正确中断</li>
                  <li>尝试不同的流式类型（逐字符/逐词/逐行）</li>
                  <li>观察状态指示器的实时变化</li>
                  <li>查看测试日志了解详细执行过程</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default StreamingTestPage;