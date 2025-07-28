"use client";

import { useState, useCallback, useRef } from "react";
import { useChatStore } from "@/store/chat";
import { useChatSettingsStore } from "@/store/chatSettings";
import { useKnowledgeStore } from "@/store/knowledge";
import { streamText, generateText, smoothStream } from "ai";
import { ThinkTagStreamProcessor } from "@/utils/text";
import { toast } from "sonner";
import { parseError } from "@/utils/error";
import {
  GEMINI_BASE_URL,
  OPENROUTER_BASE_URL,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  DEEPSEEK_BASE_URL,
  XAI_BASE_URL,
  MISTRAL_BASE_URL,
  OLLAMA_BASE_URL,
  POLLINATIONS_BASE_URL,
} from "@/constants/urls";
import { completePath } from "@/utils/url";

// 聊天Hook返回类型
export interface UseChatReturn {
  // 状态
  isLoading: boolean;
  isGenerating: boolean;
  isStreaming: boolean;
  isThinking: boolean;
  streamingContent: string;
  error: string | null;
  currentMessage: string;
  
  // 会话管理
  createSession: (title?: string) => string;
  loadSession: (sessionId: string) => boolean;
  deleteSession: (sessionId: string) => boolean;
  updateSessionTitle: (sessionId: string, title: string) => boolean;
  
  // 消息管理
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
  
  // 工具方法
  setCurrentMessage: (message: string) => void;
  getSessionHistory: () => ChatHistory[];
}

// 发送消息选项
interface SendMessageOptions {
  useKnowledgeContext?: boolean;
  selectedKnowledgeIds?: string[]; // 选中的知识库ID列表
  customSystemPrompt?: string;
  temperature?: number;
  enableThinking?: boolean; // 是否启用思考模式
  smoothStreamType?: "character" | "word" | "line"; // 流式文本平滑类型
}

// 流式文本平滑处理函数
function smoothTextStream(type: "character" | "word" | "line") {
  return smoothStream({
    chunking: type === "character" ? /./ : type,
    delayInMs: 0,
  });
}

// 错误处理函数
function handleStreamError(error: unknown) {
  const errorMessage = parseError(error);
  toast.error(errorMessage);
  console.error("流式处理错误:", error);
}

// 创建AI提供者的选项
interface ChatAIProviderOptions {
  provider: string;
  model: string;
  apiKey: string;
  baseURL: string;
  headers?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
}

// 聊天专用Hook
export function useChat(): UseChatReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  // 流式处理状态
  const [isStreaming, setIsStreaming] = useState(false);
  // 思考模式状态
  const [isThinking, setIsThinking] = useState(false);
  // 当前流式内容
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Store hooks
  const chatStore = useChatStore();
  const chatSettings = useChatSettingsStore();
  const knowledgeStore = useKnowledgeStore();
  
  // 创建聊天专用的AI提供者
  const createChatAIProvider = useCallback(async (options: ChatAIProviderOptions) => {
    const { provider, model, apiKey, baseURL, headers, temperature, maxTokens } = options;
    
    switch (provider) {
      case "google": {
        const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
        const google = createGoogleGenerativeAI({
          baseURL,
          apiKey,
        });
        return google(model);
      }
      
      case "openai": {
        const { createOpenAI } = await import("@ai-sdk/openai");
        const openai = createOpenAI({
          baseURL,
          apiKey,
        });
        return openai(model);
      }
      
      case "anthropic": {
        const { createAnthropic } = await import("@ai-sdk/anthropic");
        const anthropic = createAnthropic({
          baseURL,
          apiKey,
          headers,
        });
        return anthropic(model);
      }
      
      case "deepseek": {
        const { createDeepSeek } = await import("@ai-sdk/deepseek");
        const deepseek = createDeepSeek({
          baseURL,
          apiKey,
        });
        return deepseek(model);
      }
      
      case "xai": {
        const { createXai } = await import("@ai-sdk/xai");
        const xai = createXai({
          baseURL,
          apiKey,
        });
        return xai(model);
      }
      
      case "mistral": {
        const { createMistral } = await import("@ai-sdk/mistral");
        const mistral = createMistral({
          baseURL,
          apiKey,
        });
        return mistral(model);
      }
      
      case "openrouter": {
        const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
        const openrouter = createOpenRouter({
          baseURL,
          apiKey,
        });
        return openrouter(model);
      }
      
      case "openaicompatible": {
        const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");
        const openaicompatible = createOpenAICompatible({
          name: "openaicompatible",
          baseURL,
          apiKey,
        });
        return openaicompatible(model);
      }
      
      case "pollinations": {
        const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");
        const pollinations = createOpenAICompatible({
          name: "pollinations",
          baseURL,
          apiKey,
        });
        return pollinations(model);
      }
      
      case "ollama": {
        const { createOllama } = await import("ollama-ai-provider");
        const ollama = createOllama({
          baseURL,
        });
        return ollama(model);
      }
      
      default:
        throw new Error(`不支持的AI提供者: ${provider}`);
    }
  }, []);
  
  // 获取API基础URL
  const getBaseURL = useCallback((provider: string, apiProxy?: string) => {
    const proxy = apiProxy || "";
    
    switch (provider) {
      case "google":
        return completePath(proxy || GEMINI_BASE_URL, "/v1beta");
      case "openai":
        return completePath(proxy || OPENAI_BASE_URL, "/v1");
      case "anthropic":
        return completePath(proxy || ANTHROPIC_BASE_URL, "/v1");
      case "deepseek":
        return completePath(proxy || DEEPSEEK_BASE_URL, "/v1");
      case "xai":
        return completePath(proxy || XAI_BASE_URL, "/v1");
      case "mistral":
        return completePath(proxy || MISTRAL_BASE_URL, "/v1");
      case "openrouter":
        return completePath(proxy || OPENROUTER_BASE_URL, "/api/v1");
      case "openaicompatible":
        return completePath(proxy, "/v1");
      case "pollinations":
        return completePath(proxy || POLLINATIONS_BASE_URL, "/v1");
      case "ollama":
        return completePath(proxy || OLLAMA_BASE_URL, "/api");
      default:
        return proxy || "";
    }
  }, []);
  
  // 构建系统提示词
  const buildSystemPrompt = useCallback((customPrompt?: string, useKnowledge = false, selectedKnowledgeIds?: string[]) => {
    let systemPrompt = customPrompt || chatSettings.systemPrompt;
    
    if (useKnowledge && chatSettings.enableKnowledgeContext) {
      let knowledgeItems = knowledgeStore.knowledges;
      
      // 如果指定了选中的知识库ID，则只使用这些知识库
      if (selectedKnowledgeIds && selectedKnowledgeIds.length > 0) {
        knowledgeItems = knowledgeItems.filter((item: any) => 
          selectedKnowledgeIds.includes(item.id)
        );
      }
      
      if (knowledgeItems.length > 0) {
        const knowledgeContext = knowledgeItems
          .filter((item: any) => item.content && item.content.trim())
          .map((item: any) => {
            const title = item.title || '未命名知识';
            const content = item.content.length > 2000 
              ? item.content.substring(0, 2000) + '...' 
              : item.content;
            return `### ${title}\n${content}`;
          })
          .join("\n\n");
        
        if (knowledgeContext.trim()) {
          systemPrompt += `\n\n## 知识库上下文\n以下是相关的知识库内容，请在回答时参考这些信息：\n\n${knowledgeContext}`;
        }
      }
    }
    
    return systemPrompt;
  }, [chatSettings.systemPrompt, chatSettings.enableKnowledgeContext, knowledgeStore]);
  
  // 发送消息
  const sendMessage = useCallback(async (
    content: string,
    options: SendMessageOptions = {}
  ) => {
    if (!content.trim() || chatStore.isLoading || isGenerating) return;
    
    try {
      setIsGenerating(true);
      setIsStreaming(chatSettings.enableStreaming);
      setIsThinking(options.enableThinking || false);
      setStreamingContent("");
      chatStore.setLoading(true);
      chatStore.setError(null);
      
      // 确保有当前会话
      if (!chatStore.currentSession) {
        chatStore.createSession();
      }
      
      // 添加用户消息
      const userMessageId = chatStore.addMessage({
        type: "user",
        content,
      });
      
      // 准备AI提供者配置
      const provider = chatStore.currentSession?.settings.provider || chatSettings.provider;
      const model = chatStore.currentSession?.settings.model || chatSettings.model;
      const temperature = options.temperature ?? chatSettings.temperature;
      
      const apiKey = chatSettings.getApiKey(provider);
      const apiProxy = chatSettings.getApiProxy(provider);
      const baseURL = getBaseURL(provider, apiProxy);
      
      if (!apiKey && !["pollinations", "ollama"].includes(provider)) {
        throw new Error(`请配置 ${provider} 的API密钥`);
      }
      
      // 创建AI提供者
      const aiProvider = await createChatAIProvider({
        provider,
        model,
        apiKey,
        baseURL,
        headers: provider === "anthropic" ? {
          "anthropic-dangerous-direct-browser-access": "true",
        } : undefined,
        temperature,
        maxTokens: chatSettings.maxTokens,
      });
      
      // 构建消息历史
      if (!chatStore.currentSession) {
        console.error('No current session available');
        return;
      }

      const messages = [
        {
          role: "system" as const,
          content: buildSystemPrompt(options.customSystemPrompt, options.useKnowledgeContext, options.selectedKnowledgeIds),
        },
        ...chatStore.currentSession.messages
          .filter(msg => msg.content && msg.content.trim() !== '') // 过滤掉空内容的消息
          .map(msg => ({
            role: msg.type === "user" ? "user" as const : "assistant" as const,
            content: msg.content,
          })),
      ];
      
      // 创建中止控制器
      abortControllerRef.current = new AbortController();
      
      // 先不添加助手消息占位符，等有内容时再添加
      let assistantMessageId: string | null = null;
      
      const startTime = Date.now();
      
      if (chatSettings.enableStreaming) {
        // 流式生成
        const streamConfig: any = {
          model: aiProvider,
          messages,
          temperature: options.temperature ?? chatSettings.temperature,
          maxTokens: chatSettings.maxTokens,
          abortSignal: abortControllerRef.current.signal,
          onError: handleStreamError,
        };
        
        // 添加流式文本平滑处理
        const smoothType = options.smoothStreamType || "character";
        streamConfig.experimental_transform = smoothTextStream(smoothType);
        
        const result = await streamText(streamConfig);
        
        let fullContent = "";
        let reasoning = "";
        
        // 如果启用思考模式，使用ThinkTagStreamProcessor
        if (options.enableThinking) {
          const thinkTagProcessor = new ThinkTagStreamProcessor();
          
          // 处理完整流，包括文本增量和推理
          for await (const part of result.fullStream) {
            if (abortControllerRef.current?.signal.aborted) {
              break;
            }
            
            if (part.type === "text-delta") {
              // 使用ThinkTagStreamProcessor处理文本块
              thinkTagProcessor.processChunk(
                 part.textDelta,
                 (data) => {
                   // 如果还没有创建助手消息，现在创建
                   if (assistantMessageId === null) {
                     assistantMessageId = chatStore.addMessage({
                       type: "assistant",
                       content: "",
                       metadata: {
                         model,
                         tokens: 0,
                         duration: 0,
                       },
                     });
                   }
                   fullContent += data;
                   setStreamingContent(fullContent);
                   chatStore.updateMessage(assistantMessageId, fullContent);
                 },
                 (data) => {
                   reasoning += data;
                   // 可以选择是否显示思考过程
                   console.log("思考过程:", data);
                 }
               );
            } else if (part.type === "reasoning") {
              reasoning += part.textDelta;
              console.log("推理过程:", part.textDelta);
            }
          }
          
          // 输出完整的推理过程
          if (reasoning) {
            console.log("完整推理过程:", reasoning);
          }
          
          // 重置处理器
          thinkTagProcessor.end();
        } else {
          // 标准流式处理
           for await (const delta of result.textStream) {
             if (abortControllerRef.current?.signal.aborted) {
               break;
             }
             
             // 如果还没有创建助手消息，现在创建
             if (assistantMessageId === null) {
               assistantMessageId = chatStore.addMessage({
                 type: "assistant",
                 content: "",
                 metadata: {
                   model,
                   tokens: 0,
                   duration: 0,
                 },
               });
             }
             
             fullContent += delta;
             setStreamingContent(fullContent);
             chatStore.updateMessage(assistantMessageId, fullContent);
           }
        }
        
        // 更新最终元数据
        const duration = Date.now() - startTime;
        if (assistantMessageId !== null) {
          chatStore.updateMessage(assistantMessageId, fullContent, {
            model,
            tokens: fullContent.length, // 简单估算
            duration,
          });
        }
      } else {
        // 非流式生成
        const { text } = await generateText({
          model: aiProvider,
          messages,
          temperature: options.temperature ?? chatSettings.temperature,
          maxTokens: chatSettings.maxTokens,
          abortSignal: abortControllerRef.current.signal,
        });
        
        // 只有在有文本内容时才添加助手消息
        if (text && text.trim()) {
          assistantMessageId = chatStore.addMessage({
            type: "assistant",
            content: text,
            metadata: {
              model,
              tokens: text.length, // 简单估算
              duration: Date.now() - startTime,
            },
          });
        }
      }
      
    } catch (error: any) {
      console.error("发送消息失败:", error);
      
      if (error.name === "AbortError") {
        chatStore.setError("消息生成已停止");
      } else {
        chatStore.setError(error.message || "发送消息失败");
        
        // 添加错误消息
        chatStore.addMessage({
          type: "error",
          content: `错误: ${error.message || "发送消息失败"}`,
        });
      }
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
      setIsThinking(false);
      setStreamingContent("");
      chatStore.setLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    isGenerating,
    chatStore,
    chatSettings,
    createChatAIProvider,
    getBaseURL,
    buildSystemPrompt,
  ]);
  
  // 停止生成
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsStreaming(false);
    setIsThinking(false);
    setStreamingContent("");
    chatStore.setLoading(false);
  }, [chatStore]);
  
  return {
    // 状态
    isLoading: chatStore.isLoading || isGenerating,
    isGenerating,
    isStreaming,
    isThinking,
    streamingContent,
    error: chatStore.error,
    currentMessage: chatStore.currentMessage,
    
    // 会话管理
    createSession: chatStore.createSession,
    loadSession: chatStore.loadSession,
    deleteSession: chatStore.deleteSession,
    updateSessionTitle: chatStore.updateSessionTitle,
    
    // 消息管理
    sendMessage,
    stopGeneration,
    clearMessages: chatStore.clearMessages,
    
    // 工具方法
    setCurrentMessage: chatStore.setCurrentMessage,
    getSessionHistory: chatStore.getSessionHistory,
  };
}

export default useChat;