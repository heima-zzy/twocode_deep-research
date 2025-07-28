"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Loader2,
  Square,
  RotateCcw,
  Settings,
  Trash2,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/chat";
import { useChatSettingStore } from "@/store/chatSetting";
import ChatMessageList from "./ChatMessageList";
import KnowledgeContextSelector from "./KnowledgeContextSelector";
import { cn } from "@/utils/style";
import { toast } from "sonner";

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);
  
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

  // 发送消息
  const handleSend = async () => {
    if (message.trim() && !isLoading) {
      try {
        await sendMessage(message, {
          useKnowledgeContext: selectedKnowledgeIds.length > 0,
          selectedKnowledgeIds: selectedKnowledgeIds,
        });
        setMessage("");
      } catch (error) {
        console.error("发送消息失败:", error);
        toast.error(t("send_message_failed", "发送消息失败"));
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

  const hasMessages = currentSession?.messages.length > 0;
  const canRegenerate = hasMessages && !isLoading;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 消息列表区域 */}
      <div className="flex-1 min-h-0">
        <ChatMessageList
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          className="h-full"
        />
      </div>

      {/* 输入区域 */}
      <div className="flex-shrink-0 border-t bg-background">
        <div className="p-4 space-y-4">
          {/* 工具栏 */}
          {hasMessages && (
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
          )}

          {/* 知识库上下文选择器 */}
          <div className="flex items-center justify-between">
            <KnowledgeContextSelector
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

          {/* 输入框 */}
          <div className="relative">
            <Textarea
              placeholder={t("chat_placeholder", "输入您的问题...")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="min-h-[80px] max-h-[200px] pr-12 resize-none"
              rows={3}
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

          {/* 提示信息 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("chat_tip", "按 Enter 发送，Shift + Enter 换行")}
            </span>
            {message.length > 0 && (
              <span>
                {message.length} {t("characters", "字符")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}