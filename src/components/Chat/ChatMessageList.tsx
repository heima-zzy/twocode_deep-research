"use client";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bot,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/utils/style";
import { useState } from "react";
import copy from "copy-to-clipboard";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import dayjs from "dayjs";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

interface ChatMessageListProps {
  streamingContent?: string;
  isStreaming?: boolean;
  className?: string;
}

export default function ChatMessageList({
  streamingContent = "",
  isStreaming = false,
  className,
}: ChatMessageListProps) {
  const { t } = useTranslation();
  const { currentSession } = useChatStore();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, streamingContent]);

  // 复制消息内容
  const handleCopyMessage = (content: string, messageId: string) => {
    if (copy(content)) {
      setCopiedMessageId(messageId);
      toast.success(t("copied_to_clipboard", "已复制到剪贴板"));
      setTimeout(() => setCopiedMessageId(null), 2000);
    } else {
      toast.error(t("copy_failed", "复制失败"));
    }
  };

  // 格式化消息时间
  const formatMessageTime = (timestamp: number) => {
    return dayjs(timestamp).format("HH:mm:ss");
  };

  // 格式化模型信息
  const formatModelInfo = (metadata?: any) => {
    if (!metadata) return null;
    
    const { model, tokens, duration } = metadata;
    const parts = [];
    
    if (model) parts.push(model);
    if (tokens) parts.push(`${tokens} tokens`);
    if (duration) parts.push(`${(duration / 1000).toFixed(1)}s`);
    
    return parts.join(" • ");
  };

  if (!currentSession) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t("no_conversation", "暂无对话")}</p>
        </div>
      </div>
    );
  }

  const messages = currentSession.messages || [];
  const hasMessages = messages.length > 0 || streamingContent;

  if (!hasMessages) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t("start_conversation", "开始对话吧！")}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-6 p-4">
        {messages.map((message, index) => {
          const isUser = message.type === "user";
          const isError = message.type === "error";
          const isLast = index === messages.length - 1;
          
          // 如果正在流式显示且这是最后一条助手消息，跳过显示（避免重复显示）
          if (isStreaming && streamingContent && isLast && !isUser && !isError) {
            return null;
          }

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-4",
                isUser ? "justify-end" : "justify-start"
              )}
            >
              {!isUser && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={cn(
                    "text-xs",
                    isError ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                  )}>
                    {isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "flex flex-col max-w-[80%] min-w-0",
                  isUser ? "items-end" : "items-start"
                )}
              >
                {/* 消息内容 */}
                <div
                  className={cn(
                    "relative group rounded-lg px-4 py-3 break-words",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : isError
                      ? "bg-destructive/10 border border-destructive/20 text-destructive"
                      : "bg-muted",
                    "hover:shadow-sm transition-shadow"
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
                        components={{
                          code: ({ node, inline, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || "");
                            return !inline && match ? (
                              <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code
                                className="bg-muted px-1 py-0.5 rounded text-sm"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* 复制按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                      isUser ? "text-primary-foreground/70 hover:text-primary-foreground" : ""
                    )}
                    onClick={() => handleCopyMessage(message.content, message.id)}
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* 消息元数据 */}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatMessageTime(message.timestamp)}</span>
                  
                  {!isUser && message.metadata && (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <Zap className="w-3 h-3" />
                      <span>{formatModelInfo(message.metadata)}</span>
                    </>
                  )}
                </div>
              </div>

              {isUser && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}

        {/* 流式内容显示 */}
        {isStreaming && streamingContent && (
          <div className="flex gap-4 justify-start">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col max-w-[80%] min-w-0">
              <div className="relative group rounded-lg px-4 py-3 bg-muted break-words">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
                    components={{
                      code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code
                            className="bg-muted px-1 py-0.5 rounded text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {streamingContent}
                  </ReactMarkdown>
                </div>
                
                {/* 流式指示器 */}
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {t("generating", "生成中...")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatMessageTime(Date.now())}</span>
              </div>
            </div>
          </div>
        )}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}