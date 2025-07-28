"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { useChatSettingStore } from "@/store/chatSetting";
import ChatMessageList from "./ChatMessageList";
import KnowledgeContextSelector from "./KnowledgeContextSelector";
import UrlContextInjector from "./UrlContextInjector";
import { cn } from "@/utils/style";
import { toast } from "sonner";

export default function UnifiedChatInterface() {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const {
    sendMessage,
    stopGeneration,
    clearMessages,
    isLoading,
    isStreaming,
    streamingContent,
  } = useChat();
  
  const { currentSession } = useChatStore();
  const {} = useChatSettingStore();

  // 判断是否有聊天消息
  const hasMessages = currentSession?.messages && currentSession.messages.length > 0;
  
  // 判断是否处于聊天模式
  const isChatMode = hasMessages || isTransitioning;

  // 监听会话变化，重置过渡状态
  useEffect(() => {
    if (currentSession && !hasMessages) {
      setIsTransitioning(false);
    }
  }, [currentSession?.id, hasMessages]);

  // 发送消息
  const handleSend = async () => {
    if (message.trim() && !isLoading) {
      try {
        // 如果是第一次发送消息，触发过渡动画
        if (!hasMessages) {
          setIsTransitioning(true);
        }
        
        await sendMessage(message, {
          useKnowledgeContext: selectedKnowledgeIds.length > 0,
          selectedKnowledgeIds: selectedKnowledgeIds,
        });
        setMessage("");
        // 发送成功后重置过渡状态
        setIsTransitioning(false);
      } catch (error) {
        console.error("发送消息失败:", error);
        toast.error(t("send_message_failed", "发送消息失败"));
        setIsTransitioning(false);
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

  // 处理示例点击
  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
    // 自动聚焦到输入框
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 100);
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
                {t("welcome_to_chat", "电力行业情报分析助手")}
              </h1>
              <p className="text-sm text-gray-500">
                {t("chat_description", "专为湖南电科院打造的智能分析工具")}
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
        {!hasMessages && !isTransitioning && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl text-center space-y-8">
              {/* 欢迎图标 */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              
              {/* 欢迎文字 */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  开始您的电力行业情报分析
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  我是您的专业助手，可以帮助您分析电力行业趋势、政策影响、技术发展等各类问题
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
                      与AI进行实时对话，获取即时回答和建议，支持电力行业专业知识问答
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
                      深度分析电力行业趋势，生成详细的分析报告，助力决策制定
                    </p>
                    <Link 
                      href="/research"
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
                    "分析当前电力行业发展趋势",
                    "新能源政策对电网建设的影响",
                    "智能电网技术最新进展",
                    "电力市场化改革现状分析"
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
        {/* 聊天界面 - 有消息时显示 */}
        {(hasMessages || isTransitioning) && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 消息列表区域 */}
            <div className="flex-1 min-h-0">
              <ChatMessageList
                streamingContent={streamingContent}
                isStreaming={isStreaming}
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 底部输入区域 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        {/* 知识库和高级功能选项 - 折叠式 */}
        {(hasMessages || isTransitioning) && (
          <div className="border-b border-gray-100 px-6 py-3">
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
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="pr-16 resize-none min-h-[60px] max-h-[200px] w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                rows={2}
              />
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                {!hasMessages && !isTransitioning && (
                  <Link
                    href="/research"
                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Search className="w-3 h-3 mr-1" />
                    深度研究
                  </Link>
                )}
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || isLoading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
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