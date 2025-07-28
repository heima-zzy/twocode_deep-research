import { create } from "zustand";
import { persist } from "zustand/middleware";

// 聊天AI配置接口
export interface ChatSettingsStore {
  // AI提供者配置
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  
  // API配置
  apiKey: string;
  apiProxy: string;
  
  // 各提供者的API密钥和代理配置
  googleApiKey: string;
  googleApiProxy: string;
  openAIApiKey: string;
  openAIApiProxy: string;
  anthropicApiKey: string;
  anthropicApiProxy: string;
  deepseekApiKey: string;
  deepseekApiProxy: string;
  xAIApiKey: string;
  xAIApiProxy: string;
  mistralApiKey: string;
  mistralApiProxy: string;
  azureApiKey: string;
  azureResourceName: string;
  azureApiVersion: string;
  openRouterApiKey: string;
  openRouterApiProxy: string;
  openAICompatibleApiKey: string;
  openAICompatibleApiProxy: string;
  pollinationsApiProxy: string;
  ollamaApiProxy: string;
  
  // 聊天特定配置
  enableStreaming: boolean;
  enableKnowledgeContext: boolean;
  systemPrompt: string;
}

// 聊天设置功能接口
interface ChatSettingsFunction {
  updateSettings: (values: Partial<ChatSettingsStore>) => void;
  resetSettings: () => void;
  getApiKey: (provider: string) => string;
  getApiProxy: (provider: string) => string;
}

// 默认配置
const defaultChatSettings: ChatSettingsStore = {
  provider: "google",
  // model: "gemini-2.5-flash-lite",
  model: "gemini-2.5-flash-lite",
  temperature: 0.7,
  maxTokens: 2048,
  
  apiKey: "",
  apiProxy: "",
  
  googleApiKey: "AIzaSyAUQLWSy8pfGQV1mDZRoScRGOAr_KzFUP4",
  googleApiProxy: "",
  openAIApiKey: "",
  openAIApiProxy: "",
  anthropicApiKey: "",
  anthropicApiProxy: "",
  deepseekApiKey: "",
  deepseekApiProxy: "",
  xAIApiKey: "",
  xAIApiProxy: "",
  mistralApiKey: "",
  mistralApiProxy: "",
  azureApiKey: "",
  azureResourceName: "",
  azureApiVersion: "",
  openRouterApiKey: "",
  openRouterApiProxy: "",
  openAICompatibleApiKey: "",
  openAICompatibleApiProxy: "",
  pollinationsApiProxy: "",
  ollamaApiProxy: "",
  
  enableStreaming: true,
  enableKnowledgeContext: true,
  systemPrompt: "你是一个智能助手，请根据用户的问题提供准确、有用的回答。",
};

// 创建聊天设置store
export const useChatSettingsStore = create(
  persist<ChatSettingsStore & ChatSettingsFunction>(
    (set, get) => ({
      ...defaultChatSettings,
      
      // 更新设置
      updateSettings: (values) => set(values),
      
      // 重置设置
      resetSettings: () => set(defaultChatSettings),
      
      // 获取指定提供者的API密钥
      getApiKey: (provider: string) => {
        const state = get();
        switch (provider) {
          case "google":
            return state.googleApiKey;
          case "openai":
            return state.openAIApiKey;
          case "anthropic":
            return state.anthropicApiKey;
          case "deepseek":
            return state.deepseekApiKey;
          case "xai":
            return state.xAIApiKey;
          case "mistral":
            return state.mistralApiKey;
          case "azure":
            return state.azureApiKey;
          case "openrouter":
            return state.openRouterApiKey;
          case "openaicompatible":
            return state.openAICompatibleApiKey;
          case "pollinations":
          case "ollama":
            return "";
          default:
            return state.apiKey;
        }
      },
      
      // 获取指定提供者的API代理
      getApiProxy: (provider: string) => {
        const state = get();
        switch (provider) {
          case "google":
            return state.googleApiProxy;
          case "openai":
            return state.openAIApiProxy;
          case "anthropic":
            return state.anthropicApiProxy;
          case "deepseek":
            return state.deepseekApiProxy;
          case "xai":
            return state.xAIApiProxy;
          case "mistral":
            return state.mistralApiProxy;
          case "openrouter":
            return state.openRouterApiProxy;
          case "openaicompatible":
            return state.openAICompatibleApiProxy;
          case "pollinations":
            return state.pollinationsApiProxy;
          case "ollama":
            return state.ollamaApiProxy;
          default:
            return state.apiProxy;
        }
      },
    }),
    {
      name: "chatSettings",
    }
  )
);