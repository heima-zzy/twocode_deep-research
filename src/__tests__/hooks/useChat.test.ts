import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/store/chat';
import { useChatSettingsStore } from '@/store/chatSettings';
import { useKnowledgeStore } from '@/store/knowledge';

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(),
  generateText: vi.fn(),
}));

// Mock AI providers
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn()),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn()),
}));

// Mock stores
vi.mock('@/store/chat');
vi.mock('@/store/chatSettings');
vi.mock('@/store/knowledge');

// Mock constants
vi.mock('@/constants/urls', () => ({
  OPENAI_BASE_URL: 'https://api.openai.com',
  GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com',
  ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
  DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
  XAI_BASE_URL: 'https://api.x.ai',
  MISTRAL_BASE_URL: 'https://api.mistral.ai',
  OPENROUTER_BASE_URL: 'https://openrouter.ai',
  OLLAMA_BASE_URL: 'http://localhost:11434',
  POLLINATIONS_BASE_URL: 'https://text.pollinations.ai',
}));

// Mock utils
vi.mock('@/utils/url', () => ({
  completePath: vi.fn((base, path) => `${base}${path}`),
}));

describe('useChat Hook', () => {
  const mockChatStore = {
    currentSession: null,
    sessions: [],
    isLoading: false,
    error: null,
    currentMessage: '',
    createSession: vi.fn(() => 'session-1'),
    loadSession: vi.fn(() => true),
    deleteSession: vi.fn(() => true),
    updateSessionTitle: vi.fn(() => true),
    addMessage: vi.fn(() => 'message-1'),
    updateMessage: vi.fn(() => true),
    deleteMessage: vi.fn(() => true),
    clearMessages: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    setCurrentMessage: vi.fn(),
    getSessionHistory: vi.fn(() => []),
    exportSession: vi.fn(),
    importSession: vi.fn(),
    clear: vi.fn(),
  };

  const mockChatSettings = {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2048,
    apiKey: '',
    apiProxy: '',
    enableStreaming: true,

    systemPrompt: '你是一个智能助手',
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    getApiKey: vi.fn(() => 'test-api-key'),
    getApiProxy: vi.fn(() => ''),
  };

  const mockKnowledgeStore = {
    getAll: vi.fn(() => []),
    save: vi.fn(),
    check: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup store mocks
    vi.mocked(useChatStore).mockReturnValue(mockChatStore);
    vi.mocked(useChatSettingsStore).mockReturnValue(mockChatSettings);
    vi.mocked(useKnowledgeStore).mockReturnValue(mockKnowledgeStore);
  });

  it('应该正确初始化Hook', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('currentMessage');
    expect(result.current).toHaveProperty('createSession');
    expect(result.current).toHaveProperty('sendMessage');
    expect(result.current).toHaveProperty('stopGeneration');
  });

  it("应该返回正确的初始状态", () => {
    const { result } = renderHook(() => useChat());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isThinking).toBe(false);
    expect(result.current.streamingContent).toBe("");
    expect(result.current.error).toBe(null);
    expect(result.current.currentMessage).toBe("");
  });

  it('应该能够创建新会话', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      const sessionId = result.current.createSession('测试会话');
      expect(sessionId).toBe('session-1');
    });

    expect(mockChatStore.createSession).toHaveBeenCalledWith('测试会话');
  });

  it('应该能够加载会话', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      const success = result.current.loadSession('session-1');
      expect(success).toBe(true);
    });

    expect(mockChatStore.loadSession).toHaveBeenCalledWith('session-1');
  });

  it('应该能够删除会话', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      const success = result.current.deleteSession('session-1');
      expect(success).toBe(true);
    });

    expect(mockChatStore.deleteSession).toHaveBeenCalledWith('session-1');
  });

  it('应该能够更新会话标题', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      const success = result.current.updateSessionTitle('session-1', '新标题');
      expect(success).toBe(true);
    });

    expect(mockChatStore.updateSessionTitle).toHaveBeenCalledWith('session-1', '新标题');
  });

  it('应该能够设置当前消息', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setCurrentMessage('测试消息');
    });

    expect(mockChatStore.setCurrentMessage).toHaveBeenCalledWith('测试消息');
  });

  it('应该能够清空消息', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.clearMessages();
    });

    expect(mockChatStore.clearMessages).toHaveBeenCalled();
  });

  it('应该能够获取会话历史', () => {
    const { result } = renderHook(() => useChat());

    const history = result.current.getSessionHistory();
    expect(history).toEqual([]);
    expect(mockChatStore.getSessionHistory).toHaveBeenCalled();
  });

  it('应该能够停止生成', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.stopGeneration();
    });

    expect(mockChatStore.setLoading).toHaveBeenCalledWith(false);
  });

  it("应该支持流式处理选项", async () => {
    const { result } = renderHook(() => useChat());
    
    // 模拟启用流式处理的设置
    mockChatSettings.enableStreaming = true;
    
    // 确保有当前会话
    mockChatStore.currentSession = {
      id: 'session-1',
      title: '测试会话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await act(async () => {
      await result.current.sendMessage("测试消息", {
        smoothStreamType: "word"
      });
    });
    
    expect(mockChatStore.addMessage).toHaveBeenCalled();
  });
  
  it("应该处理思考模式", async () => {
    const { result } = renderHook(() => useChat());
    
    // 模拟启用流式处理和思考模式
    mockChatSettings.enableStreaming = true;
    
    // 确保有当前会话
    mockChatStore.currentSession = {
      id: 'session-1',
      title: '测试会话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await act(async () => {
      await result.current.sendMessage("测试消息");
    });
    
    // 验证消息被添加
    expect(mockChatStore.addMessage).toHaveBeenCalled();
  });

  it('sendMessage应该在没有内容时直接返回', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('');
    });

    expect(mockChatStore.addMessage).not.toHaveBeenCalled();
  });

  it('sendMessage应该在正在生成时直接返回', async () => {
    // 模拟正在加载状态
    const loadingChatStore = { ...mockChatStore, isLoading: true };
    vi.mocked(useChatStore).mockReturnValue(loadingChatStore);

    const { result } = renderHook(() => useChat());

    // 由于isLoading为true，sendMessage应该直接返回
    await act(async () => {
      await result.current.sendMessage('测试消息');
    });

    // 验证没有调用addMessage
    expect(loadingChatStore.addMessage).not.toHaveBeenCalled();
  });
});