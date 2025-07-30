"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import Link from "next/link";
import {
  Send,
  Search,
  Loader2,
  Square,
  RotateCcw,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/chat";

import ChatMessageList from "./ChatMessageList";
import KnowledgeContextSelector from "./KnowledgeContextSelector";
import UrlContextInjector from "./UrlContextInjector";

import { toast } from "sonner";


export default function UnifiedChatInterface() {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [newChatTransition, setNewChatTransition] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const {
    sendMessage,
    stopGeneration,
    clearMessages,
    isLoading,
    isGenerating,
    isStreaming,
    streamingContent,
  } = useChat();
  
  const { currentSession } = useChatStore();


  // 判断是否有聊天消息
  const hasMessages = currentSession?.messages && currentSession.messages.length > 0;
  
  // 判断是否处于聊天模式






  // 监听会话变化，处理新建对话的过渡效果
  useEffect(() => {
    if (currentSession && !hasMessages) {
      // 检测到新会话创建，触发新建对话过渡动画
      setNewChatTransition(true);
      setIsTransitioning(false);
      
      // 短暂延迟后完成过渡
      const timer = setTimeout(() => {
        setNewChatTransition(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [currentSession?.id, hasMessages, currentSession]);

  // 发送消息
  const handleSend = async () => {
    if (message.trim() && !isLoading && !isSending) {
      try {
        setIsSending(true);
        
        // 短暂延迟以显示发送动画
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const messageToSend = message.trim();
        
        // 添加输入框清空动画
        setMessage("");
        
        // 延迟重置打字状态以保持动画效果
        setTimeout(() => {
          setIsTyping(false);
        }, 200);
        
        // 如果是第一次发送消息，触发过渡动画
        if (!hasMessages) {
          setIsTransitioning(true);
        }
        
        await sendMessage(messageToSend, {
          useKnowledgeContext: selectedKnowledgeIds.length > 0,
          selectedKnowledgeIds: selectedKnowledgeIds,
        });
        
        // 发送成功后的反馈
        setTimeout(() => {
          toast.success(t("message_sent", "消息已发送"), {
            duration: 1500,
            position: "bottom-right"
          });
        }, 500);
        
        // 发送成功后重置过渡状态
        setIsTransitioning(false);
      } catch (error) {
        console.error("发送消息失败:", error);
        toast.error(t("send_message_failed", "发送消息失败"));
        setIsTransitioning(false);
      } finally {
        // 延迟重置发送状态以保持动画效果
        setTimeout(() => {
          setIsSending(false);
        }, 200);
      }
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 停止生成
  const handleStop = () => {
    stopGeneration();
    toast.info(t("generation_stopped", "已停止生成"));
  };

  // 清除消息
  const handleClear = () => {
    clearMessages();
    setIsTransitioning(false);
    toast.success(t("messages_cleared", "消息已清除"));
  };



  // 重新生成
  const handleRegenerate = async () => {
    if (!currentSession?.messages.length) return;
    
    // 找到最后一条用户消息
    const lastUserMessage = [...currentSession.messages]
      .reverse()
      .find(msg => msg.type === "user");
    
    if (lastUserMessage) {
      try {
        await sendMessage(lastUserMessage.content, {
          useKnowledgeContext: selectedKnowledgeIds.length > 0,
          selectedKnowledgeIds: selectedKnowledgeIds,
        });
      } catch (error) {
        console.error("重新生成失败:", error);
        toast.error(t("regenerate_failed", "重新生成失败"));
      }
    }
  };

  const canRegenerate = hasMessages && !isLoading;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {t("welcome_to_chat", "检测行业动态收集分析助手")}
              </h1>
              <p className="text-sm text-gray-500">
                {t("chat_description", "为及时掌握检测行业动态，提升战略决策科学性的智能分析工具")}
              </p>
            </div>
          </div>
          
          {/* 工具栏按钮 */}
          {hasMessages && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={!canRegenerate}
                className="text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                重新生成
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isLoading}
                className="text-gray-600 hover:text-gray-900"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                清除对话
              </Button>
              {isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                  className="text-red-600 hover:text-red-700"
                >
                  <Square className="w-4 h-4 mr-1" />
                  停止生成
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 欢迎界面 - 无消息时显示 */}
        {!hasMessages && !isTransitioning && !newChatTransition && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in-0 duration-500">
            <div className="max-w-2xl text-center space-y-8">
              {/* 欢迎图标 */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              
              {/* 欢迎文字 */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  开始您的检测行业动态分析
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  我是您的专业助手，可以帮助您分析检测行业政策、技术标准、市场趋势及竞争动态等各类问题
                </p>
              </div>

              {/* 核心功能介绍 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 text-center">核心功能介绍</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 智能问答卡片 */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">智能问答</h4>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      与AI进行实时对话，获取即时回答和建议，支持检测行业专业知识问答
                    </p>
                    <div className="flex items-center justify-center text-blue-600 text-sm font-medium">
                      <span>立即开始对话</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* 行业情报分析卡片 */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-purple-300">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Search className="w-5 h-5 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">行业情报分析</h4>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      深度分析检测行业动态，生成详细的分析报告，助力决策制定
                    </p>
                    <Link 
                      href="/research"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('/research', '_blank', 'noopener,noreferrer');
                      }}
                      className="inline-flex items-center text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors"
                    >
                      <span>进入深度研究</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              {/* 示例问题 */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">试试这些问题：</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "分析当前检测行业发展趋势",
                    "检测技术标准政策变化影响",
                    "检测设备技术最新进展",
                    "检测市场竞争格局分析"
                  ].map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(question)}
                      className="p-3 text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left text-gray-700 hover:text-blue-700"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 新建对话过渡界面 */}
        {newChatTransition && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in-0 duration-300">
            <div className="max-w-md text-center space-y-6">
              {/* 过渡动画图标 */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              
              {/* 过渡文字 */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                  准备就绪
                </h3>
                <p className="text-gray-600 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                  开始您的新对话
                </p>
              </div>
              
              {/* 加载指示器 */}
              <div className="flex justify-center animate-in slide-in-from-bottom-4 duration-500 delay-300">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 聊天界面 - 有消息时显示 */}
        {(hasMessages || isTransitioning) && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* 消息列表区域 */}
            <div className="flex-1 min-h-0">
              <ChatMessageList
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              isGenerating={isGenerating}
              className="flex-1"
            />
            </div>
          </div>
        )}
      </div>

      {/* 底部输入区域 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        {/* 底部输入区域 */}
        {(hasMessages || isTransitioning) && (
          <div className="border-b border-gray-100 px-6 py-3 animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <KnowledgeContextSelector
                  selectedKnowledgeIds={selectedKnowledgeIds}
                  onSelectionChange={setSelectedKnowledgeIds}
                />
                <UrlContextInjector
                  selectedKnowledgeIds={selectedKnowledgeIds}
                  onSelectionChange={setSelectedKnowledgeIds}
                />
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/research"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('/research', '_blank', 'noopener,noreferrer');
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium"
                >
                  <Search className="w-4 h-4 mr-1" />
                  深度研究
                </Link>
                <div className="text-xs text-gray-500">
                  {selectedKnowledgeIds.length > 0
                    ? `知识库已启用 (${selectedKnowledgeIds.length} 项)`
                    : "知识库未启用"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 输入框区域 */}
        <div className="px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Textarea
                placeholder={t("chat_placeholder", "输入您的问题...")}
                value={message}
                onChange={(e) => {
                  const value = e.target.value;
                  setMessage(value);
                  
                  // 添加打字动画效果
                  if (value.length > 0 && !isTyping) {
                    setIsTyping(true);
                  } else if (value.length === 0 && isTyping) {
                    setIsTyping(false);
                  }
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(message.length > 0)}
                disabled={isLoading || isSending}
                className={`pr-16 resize-none min-h-[60px] max-h-[200px] w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-300 ${
                  isTyping ? 'ring-2 ring-blue-200 border-blue-400 shadow-lg bg-blue-50/30' : ''
                } ${
                  isSending ? 'bg-gray-50 scale-[0.98] opacity-50' : ''
                } ${
                  message.trim() && isTyping ? 'shadow-xl shadow-blue-500/10' : ''
                }`}
                rows={2}
              />
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                {!hasMessages && !isTransitioning && (
                  <Link
                    href="/research"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/research', '_blank', 'noopener,noreferrer');
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Search className="w-3 h-3 mr-1" />
                    深度研究
                  </Link>
                )}
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || isLoading || isSending}
                  size="sm"
                  className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isSending ? 'scale-90 opacity-50 animate-pulse bg-blue-700' : ''
                  } ${
                    message.trim() && !isSending ? 'shadow-lg shadow-blue-500/25' : ''
                  } ${
                    isTyping && message.trim() && !isSending ? 'animate-bounce' : ''
                  }`}
                >
                  {isLoading || isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className={`w-4 h-4 transition-transform duration-200 ${
                      message.trim() && !isSending ? 'scale-110 rotate-12' : ''
                    } ${
                      isTyping && message.trim() ? 'animate-pulse' : ''
                    }`} />
                  )}
                </Button>
              </div>
            </div>
            
            {/* 提示信息 */}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>按 Enter 发送，Shift+Enter 换行</span>
              {!hasMessages && !isTransitioning && (
                <div className="flex items-center space-x-4">
                  <KnowledgeContextSelector
                    selectedKnowledgeIds={selectedKnowledgeIds}
                    onSelectionChange={setSelectedKnowledgeIds}
                  />
                  <UrlContextInjector
                    selectedKnowledgeIds={selectedKnowledgeIds}
                    onSelectionChange={setSelectedKnowledgeIds}
                  />
                  <span className="text-xs text-gray-400">
                    {selectedKnowledgeIds.length > 0
                      ? `知识库已启用 (${selectedKnowledgeIds.length} 项)`
                      : "知识库未启用"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}