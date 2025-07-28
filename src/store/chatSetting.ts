import { create } from "zustand";
import { persist } from "zustand/middleware";

// 聊天AI配置接口
export interface ChatSettingStore {
  // AI提供者配置
  provider: string;
  mode: string;
  model: string;
  googleApiKey: string;
  googleApiProxy: string;
  
  // 聊天参数
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enableStreaming: boolean;
  smoothStreamType: "character" | "word" | "line";
  
  // 各提供者的API密钥和代理配置
  openRouterApiKey: string;
  openRouterApiProxy: string;
  openRouterThinkingModel: string;
  openRouterNetworkingModel: string;
  openAIApiKey: string;
  openAIApiProxy: string;
  openAIThinkingModel: string;
  openAINetworkingModel: string;
  anthropicApiKey: string;
  anthropicApiProxy: string;
  anthropicThinkingModel: string;
  anthropicNetworkingModel: string;
  deepseekApiKey: string;
  deepseekApiProxy: string;
  deepseekThinkingModel: string;
  deepseekNetworkingModel: string;
  xAIApiKey: string;
  xAIApiProxy: string;
  xAIThinkingModel: string;
  xAINetworkingModel: string;
  mistralApiKey: string;
  mistralApiProxy: string;
  mistralThinkingModel: string;
  mistralNetworkingModel: string;
  azureApiKey: string;
  azureResourceName: string;
  azureApiVersion: string;
  azureThinkingModel: string;
  azureNetworkingModel: string;
  openAICompatibleApiKey: string;
  openAICompatibleApiProxy: string;
  openAICompatibleThinkingModel: string;
  openAICompatibleNetworkingModel: string;
  pollinationsApiProxy: string;
  pollinationsThinkingModel: string;
  pollinationsNetworkingModel: string;
  ollamaApiProxy: string;
  ollamaThinkingModel: string;
  ollamaNetworkingModel: string;
  accessPassword: string;
  thinkingModel: string;
  networkingModel: string;
}

interface ChatSettingFunction {
  update: (values: Partial<ChatSettingStore>) => void;
  reset: () => void;
  getApiKey: (provider: string) => string;
  getApiProxy: (provider: string) => string;
}

export const defaultChatValues: ChatSettingStore = {
  provider: "google",
  mode: "proxy",
  model: "gemini-2.0-flash",
  googleApiKey: "",
  googleApiProxy: "",
  temperature: 0.7,
  maxTokens: 4000,
  systemPrompt: "你是一个有用的AI助手。",
  enableStreaming: true,
  smoothStreamType: "word",
  thinkingModel: "gemini-2.0-flash-thinking-exp",
  networkingModel: "gemini-2.0-flash",
  openRouterApiKey: "",
  openRouterApiProxy: "",
  openRouterThinkingModel: "",
  openRouterNetworkingModel: "",
  openAIApiKey: "",
  openAIApiProxy: "",
  openAIThinkingModel: "gpt-4o",
  openAINetworkingModel: "gpt-4o-mini",
  anthropicApiKey: "",
  anthropicApiProxy: "",
  anthropicThinkingModel: "",
  anthropicNetworkingModel: "",
  deepseekApiKey: "",
  deepseekApiProxy: "",
  deepseekThinkingModel: "deepseek-reasoner",
  deepseekNetworkingModel: "deepseek-chat",
  xAIApiKey: "",
  xAIApiProxy: "",
  xAIThinkingModel: "",
  xAINetworkingModel: "",
  mistralApiKey: "",
  mistralApiProxy: "",
  mistralThinkingModel: "mistral-large-latest",
  mistralNetworkingModel: "mistral-medium-latest",
  azureApiKey: "",
  azureResourceName: "",
  azureApiVersion: "",
  azureThinkingModel: "",
  azureNetworkingModel: "",
  openAICompatibleApiKey: "",
  openAICompatibleApiProxy: "",
  openAICompatibleThinkingModel: "",
  openAICompatibleNetworkingModel: "",
  pollinationsApiProxy: "",
  pollinationsThinkingModel: "",
  pollinationsNetworkingModel: "",
  ollamaApiProxy: "",
  ollamaThinkingModel: "",
  ollamaNetworkingModel: "",
  accessPassword: "",
};

export const useChatSettingStore = create(
  persist<ChatSettingStore & ChatSettingFunction>(
    (set, get) => ({
      ...defaultChatValues,
      update: (values) => set(values),
      reset: () => set(defaultChatValues),
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
          case "openrouter":
            return state.openRouterApiKey;
          case "openaicompatible":
            return state.openAICompatibleApiKey;
          case "pollinations":
            return ""; // Pollinations不需要API密钥
          case "ollama":
            return ""; // Ollama不需要API密钥
          default:
            return "";
        }
      },
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
            return "";
        }
      },
    }),
    { name: "chatSetting" }
  )
);