"use client";

import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useChatSettingsStore } from '@/store/chatSettings';

/**
 * 流式对话功能测试面板
 * 用于在界面中测试和验证流式处理、思考模式、状态管理等功能
 */
const StreamingTestPanel: React.FC = () => {
  const chat = useChat();
  const chatSettings = useChatSettingsStore();
  const [testMessage, setTestMessage] = useState('');
  const [enableThinking, setEnableThinking] = useState(false);
  const [smoothStreamType, setSmoothStreamType] = useState<'character' | 'word' | 'line'>('character');
  const [testResults, setTestResults] = useState<string[]>([]);

  // 预设测试消息
  const testMessages = [
    {
      name: '短消息测试',
      content: '你好，请简单介绍一下自己。',
      description: '测试短消息的流式处理效果'
    },
    {
      name: '长消息测试',
      content: '请详细解释什么是人工智能，包括其历史发展、主要技术分支、当前应用领域以及未来发展趋势。',
      description: '测试长消息的流式处理效果和性能'
    },
    {
      name: '思考模式测试',
      content: '如果我有100元，买了3个苹果每个5元，2个橙子每个8元，还剩多少钱？请详细说明计算过程。',
      description: '测试思考模式的显示效果'
    },
    {
      name: '复杂推理测试',
      content: '请分析一下为什么机器学习在图像识别领域如此成功，从技术原理、数据特性和算法优势三个角度来解释。',
      description: '测试复杂推理的思考过程显示'
    }
  ];

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleSendMessage = async (message: string, options: { enableThinking?: boolean } = {}) => {
    if (!message.trim()) return;

    addTestResult(`开始发送消息: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    addTestResult(`配置 - 流式处理: ${chatSettings.enableStreaming ? '启用' : '禁用'}, 思考模式: ${options.enableThinking ? '启用' : '禁用'}, 流式类型: ${smoothStreamType}`);

    try {
      await chat.sendMessage(message, {
        enableThinking: options.enableThinking,
        smoothStreamType: smoothStreamType
      });
      addTestResult('消息发送完成');
    } catch (error) {
      addTestResult(`发送失败: ${error}`);
    }
  };

  const handleStopGeneration = () => {
    chat.stopGeneration();
    addTestResult('已停止生成');
  };
  const clearTestResults = () => {
    setTestResults([]);
  };

  const runAutoTest = async () => {
    addTestResult('开始自动测试流程...');
    
    // 测试1: 基本流式处理
    addTestResult('测试1: 基本流式处理');
    await handleSendMessage('测试流式处理功能');
    
    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试2: 思考模式
    addTestResult('测试2: 思考模式');
    await handleSendMessage('1+1等于几？请详细说明计算过程。', { enableThinking: true });
    
    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试3: 停止生成
    addTestResult('测试3: 停止生成功能');
    handleSendMessage('请写一篇很长的文章关于人工智能的发展历史...');
    
    // 1秒后停止
    setTimeout(() => {
      handleStopGeneration();
      addTestResult('自动测试完成');
    }, 1000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">流式对话功能测试面板</h2>
        
        {/* 状态显示 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-3 rounded-lg text-center ${
            chat.isGenerating ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className="font-semibold">生成状态</div>
            <div>{chat.isGenerating ? '生成中' : '空闲'}</div>
          </div>
          
          <div className={`p-3 rounded-lg text-center ${
            chat.isStreaming ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className="font-semibold">流式状态</div>
            <div>{chat.isStreaming ? '流式中' : '非流式'}</div>
          </div>
          
          <div className={`p-3 rounded-lg text-center ${
            chat.isThinking ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className="font-semibold">思考状态</div>
            <div>{chat.isThinking ? '思考中' : '非思考'}</div>
          </div>
          
          <div className="p-3 rounded-lg text-center bg-green-100 text-green-800">
            <div className="font-semibold">内容长度</div>
            <div>{chat.streamingContent.length}</div>
          </div>
        </div>

        {/* 设置面板 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">测试设置</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">AI 提供者</label>
              <select
                value={chatSettings.provider}
                onChange={(e) => chatSettings.updateSettings({ provider: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="google">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="deepseek">DeepSeek</option>
                <option value="xai">xAI Grok</option>
                <option value="mistral">Mistral</option>
                <option value="openrouter">OpenRouter</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={chatSettings.enableStreaming}
                  onChange={(e) => chatSettings.updateSettings({ enableStreaming: e.target.checked })}
                  className="rounded"
                />
                <span>启用流式处理</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableThinking}
                  onChange={(e) => setEnableThinking(e.target.checked)}
                  className="rounded"
                />
                <span>启用思考模式</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">流式类型</label>
              <select
                value={smoothStreamType}
                onChange={(e) => setSmoothStreamType(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="character">逐字符</option>
                <option value="word">逐词</option>
                <option value="line">逐行</option>
              </select>
            </div>
          </div>
          
          {/* 当前配置信息显示 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">当前配置</h4>
            <div className="text-sm text-blue-700">
              <div>提供者: {chatSettings.provider}</div>
              <div>模型: {chatSettings.model}</div>
              <div>API密钥状态: {chatSettings.getApiKey(chatSettings.provider) ? '已配置' : '未配置'}</div>
            </div>
          </div>
        </div>

        {/* 自定义消息输入 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">自定义测试消息</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="输入测试消息..."
              className="flex-1 p-2 border rounded-md"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(testMessage, { enableThinking });
                  setTestMessage('');
                }
              }}
            />
            <button
              onClick={() => {
                handleSendMessage(testMessage, { enableThinking });
                setTestMessage('');
              }}
              disabled={!testMessage.trim() || chat.isGenerating}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
            >
              发送
            </button>
            <button
              onClick={handleStopGeneration}
              disabled={!chat.isGenerating}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300"
            >
              停止
            </button>
          </div>
        </div>

        {/* 预设测试消息 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">预设测试消息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testMessages.map((msg, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800">{msg.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{msg.description}</p>
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{msg.content}</p>
                <button
                  onClick={() => handleSendMessage(msg.content, { 
                    enableThinking: msg.name.includes('思考') || msg.name.includes('推理') 
                  })}
                  disabled={chat.isGenerating}
                  className="w-full px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 text-sm"
                >
                  测试
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 自动测试 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">自动测试</h3>
          <button
            onClick={runAutoTest}
            disabled={chat.isGenerating}
            className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-300"
          >
            运行自动测试流程
          </button>
        </div>

        {/* 实时内容显示 */}
        {chat.streamingContent && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">实时流式内容</h3>
            <div className="bg-gray-100 rounded-lg p-4 max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{chat.streamingContent}</pre>
            </div>
          </div>
        )}

        {/* 测试结果日志 */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">测试日志</h3>
            <button
              onClick={clearTestResults}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              清空日志
            </button>
          </div>
          <div className="bg-black text-green-400 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <div className="text-gray-500">暂无测试日志...</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingTestPanel;