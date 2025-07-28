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
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* 欢迎界面 - 使用绝对定位和动画 */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out",
          isChatMode
            ? "opacity-0 pointer-events-none transform translate-y-[-20px]"
            : "opacity-100 pointer-events-auto transform translate-y-0"
        )}
      >
        <div className="w-full max-w-4xl space-y-10 relative">
          {/* 欢迎标题 */}
          <div className="text-center space-y-6 pt-8">
            <h1 className="text-5xl font-bold text-foreground">
              {t("welcome_to_chat", "欢迎使用 AI 助手")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("chat_description", "与 AI 进行智能对话，获取即时回答，或进行深度研究分析")}
            </p>
          </div>

          {/* 示例问题 */}
          <div className="text-center space-y-6">
            <h3 className="text-xl font-semibold text-foreground">
              {t("example_questions", "试试这些问题")}
            </h3>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {[
                "如何提高工作效率？",
                "解释一下人工智能的发展历程",
                "推荐一些学习编程的方法",
                "分析当前科技趋势"
              ].map((question, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(question)}
                  className="px-4 py-3 text-sm bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all duration-200 text-gray-700 hover:text-gray-900 font-medium shadow-sm hover:shadow-md"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* 功能说明 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-3">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{t("ai_chat", "AI 对话")}</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t("ai_chat_desc", "与 AI 进行实时对话，获取即时回答和建议")}
              </p>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">💡 试试这些提示词：</p>
                <div className="space-y-2">
                  <p 
                    className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handlePromptClick("请帮我制定一个学习计划，我想在3个月内掌握Python编程")}
                  >
                    • "请帮我制定一个学习计划，我想在3个月内掌握Python编程"
                  </p>
                  <p 
                    className="text-sm text-blue-600 bg-white/50 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/70 transition-colors"
                    onClick={() => handlePromptClick("分析一下这段代码的性能问题并给出优化建议")}
                  >
                    • "分析一下这段代码的性能问题并给出优化建议"
                  </p>
                  <p 
                    className="text-sm text-blue-600 bg-white/50 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/70 transition-colors"
                    onClick={() => handlePromptClick("解释一下机器学习中的过拟合现象，并提供解决方案")}
                  >
                    • "解释一下机器学习中的过拟合现象，并提供解决方案"
                  </p>
                  <p 
                    className="text-sm text-blue-600 bg-white/50 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/70 transition-colors"
                    onClick={() => handlePromptClick("帮我写一份项目提案，主题是智能家居系统")}
                  >
                    • "帮我写一份项目提案，主题是智能家居系统"
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-3">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{t("deep_research", "深度研究")}</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t("deep_research_desc", "进行深入的主题研究，生成详细的分析报告")}
              </p>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">🔍 深度研究主题示例：</p>
                <div className="space-y-2">
                  <p 
                    className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handlePromptClick("2024年人工智能在教育领域的最新应用与发展趋势")}
                  >
                    • "2024年人工智能在教育领域的最新应用与发展趋势"
                  </p>
                  <p 
                    className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handlePromptClick("新能源汽车产业链分析：技术突破与市场机遇")}
                  >
                    • "新能源汽车产业链分析：技术突破与市场机遇"
                  </p>
                  <p 
                    className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handlePromptClick("元宇宙技术发展现状及对未来社交方式的影响")}
                  >
                    • "元宇宙技术发展现状及对未来社交方式的影响"
                  </p>
                  <p 
                    className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handlePromptClick("碳中和目标下的绿色金融创新模式研究")}
                  >
                    • "碳中和目标下的绿色金融创新模式研究"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天界面 - 使用绝对定位和动画 */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col transition-all duration-700 ease-in-out",
          isChatMode
            ? "opacity-100 pointer-events-auto transform translate-y-0"
            : "opacity-0 pointer-events-none transform translate-y-[20px]"
        )}
      >
        {/* 工具栏 - 移到顶部 */}
        {hasMessages && (
          <div className="flex-shrink-0 border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={!canRegenerate}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("regenerate", "重新生成")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("clear_messages", "清除消息")}
                </Button>
              </div>
              
              {isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                >
                  <Square className="w-4 h-4 mr-2" />
                  {t("stop_generation", "停止生成")}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 消息列表区域 */}
        <div className="flex-1 min-h-0">
          <ChatMessageList
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            className="h-full"
          />
        </div>

        {/* 知识库上下文选择器 - 仅在聊天模式显示 */}
        {isChatMode && (
          <div className="flex-shrink-0 border-t bg-background p-4 pb-32">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KnowledgeContextSelector
                  selectedKnowledgeIds={selectedKnowledgeIds}
                  onSelectionChange={setSelectedKnowledgeIds}
                />
                <UrlContextInjector
                  selectedKnowledgeIds={selectedKnowledgeIds}
                  onSelectionChange={setSelectedKnowledgeIds}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedKnowledgeIds.length > 0
                  ? t("knowledge_context_enabled", "知识库上下文已启用 ({{count}} 项)", {
                      count: selectedKnowledgeIds.length,
                    })
                  : t("knowledge_context_disabled", "知识库上下文未启用")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 统一的输入框 - 固定在底部，支持平滑过渡 */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-background transition-all duration-700 ease-in-out z-10",
          isChatMode
            ? "border-t p-4"
            : "border-0 p-8 flex justify-center items-end"
        )}
      >
        <div
          className={cn(
            "transition-all duration-700 ease-in-out",
            isChatMode
              ? "w-full"
              : "w-full max-w-3xl mx-auto"
          )}
        >
          {/* 知识库选择器和深度研究按钮 - 仅在欢迎模式显示 */}
          {!isChatMode && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-4">
                  <KnowledgeContextSelector
                    selectedKnowledgeIds={selectedKnowledgeIds}
                    onSelectionChange={setSelectedKnowledgeIds}
                  />
                  <UrlContextInjector
                    selectedKnowledgeIds={selectedKnowledgeIds}
                    onSelectionChange={setSelectedKnowledgeIds}
                  />
                  <div className="text-xs text-muted-foreground">
                    {selectedKnowledgeIds.length > 0
                      ? t("knowledge_context_enabled", "知识库上下文已启用 ({{count}} 项)", {
                          count: selectedKnowledgeIds.length,
                        })
                      : t("knowledge_context_disabled", "知识库上下文未启用")}
                  </div>
                </div>
              </div>
              {/* 深度研究按钮 - 移动到输入框附近 */}
              <div className="flex justify-center">
                <Link
                  href="/research"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {t("deep_research", "深度研究")}
                </Link>
              </div>
            </div>
          )}
          
          {/* 输入框 */}
          <div className={cn(
            "relative",
            !isChatMode && "max-w-2xl mx-auto"
          )}>
            <Textarea
              placeholder={t("chat_placeholder", "输入您的问题...")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className={cn(
                "pr-12 resize-none transition-all duration-300 w-full",
                isChatMode
                  ? "min-h-[80px] max-h-[200px]"
                  : "min-h-[120px]"
              )}
              rows={isChatMode ? 3 : 5}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              size="sm"
              className="absolute bottom-3 right-3"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* 提示信息 - 仅在聊天模式显示 */}
          {isChatMode && (
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>{t("enter_to_send", "按 Enter 发送，Shift+Enter 换行")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}