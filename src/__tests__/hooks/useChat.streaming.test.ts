import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/store/chat';
import { useChatSettingStore } from '@/store/chatSetting';
import { useKnowledgeStore } from '@/store/knowledge';
import { streamText, generateText } from 'ai';
import { ThinkTagStreamProcessor } from '@/utils/text';

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
vi.mock('@/store/chatSetting');
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

// Mock ThinkTagStreamProcessor
vi.mock('@/utils/text', () => ({
  ThinkTagStreamProcessor: vi.fn().mockImplementation(() => ({
    processChunk: vi.fn(),
    end: vi.fn(),
  })),
}));

describe('useChat 流式处理测试', () => {
  const mockChatStore = {
    currentSession: {
      id: 'session-1',
      title: '测试会话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
      },
    },
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
    update: vi.fn(),
    resetSettings: vi.fn(),
    getApiKey: vi.fn(() => 'test-api-key'),
    getApiProxy: vi.fn(() => ''),
  };

  const mockKnowledgeStore = {
    knowledges: [],
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
    vi.mocked(useChatSettingStore).mockReturnValue(mockChatSettings);
    vi.mocked(useKnowledgeStore).mockReturnValue(mockKnowledgeStore);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('流式处理状态管理', () => {
    it('应该正确初始化流式处理状态', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.streamingContent).toBe('');
    });

    it('应该在发送消息时正确设置流式处理状态', async () => {
      const { result } = renderHook(() => useChat());
      
      // Mock streamText to return a controllable stream
      const mockTextStream = {
        textStream: (async function* () {
          yield 'Hello';
          yield ' World';
        })(),
        fullStream: (async function* () {
          yield { type: 'text-delta', textDelta: 'Hello' };
          yield { type: 'text-delta', textDelta: ' World' };
        })(),
      };
      
      vi.mocked(streamText).mockResolvedValue(mockTextStream as any);

      await act(async () => {
        await result.current.sendMessage('测试消息');
      });

      expect(mockChatStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockChatStore.addMessage).toHaveBeenCalled();
    });

    it('应该在流式处理完成后重置状态', async () => {
      const { result } = renderHook(() => useChat());
      
      const mockTextStream = {
        textStream: (async function* () {
          yield 'Complete message';
        })(),
        fullStream: (async function* () {
          yield { type: 'text-delta', textDelta: 'Complete message' };
        })(),
      };
      
      vi.mocked(streamText).mockResolvedValue(mockTextStream as any);

      await act(async () => {
        await result.current.sendMessage('测试消息');
      });

      // 验证最终状态重置
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.isStreaming).toBe(false);

      expect(result.current.streamingContent).toBe('');
    });
  });

  describe('思考模式测试', () => {
    it('应该在启用思考模式时正确设置状态', async () => {
      const { result } = renderHook(() => useChat());
      
      const mockProcessor = {
        processChunk: vi.fn(),
        end: vi.fn(),
      };
      
      vi.mocked(ThinkTagStreamProcessor).mockImplementation(() => mockProcessor as any);
      
      const mockTextStream = {
        textStream: (async function* () {
          yield '<think>思考过程</think>回复内容';
        })(),
        fullStream: (async function* () {
          yield { type: 'text-delta', textDelta: '<think>思考过程</think>回复内容' };
        })(),
      };
      
      vi.mocked(streamText).mockResolvedValue(mockTextStream as any);

      await act(async () => {
        await result.current.sendMessage('测试消息');
      });

      expect(ThinkTagStreamProcessor).toHaveBeenCalled();
      expect(mockProcessor.processChunk).toHaveBeenCalled();
      expect(mockProcessor.end).toHaveBeenCalled();
    });

    it('应该正确处理思考内容和回复内容', async () => {
      const { result } = renderHook(() => useChat());
      
      const mockProcessor = {
        processChunk: vi.fn((chunk, contentCb, thinkingCb) => {
          
          // 模拟处理思考内容
          if (chunk.includes('<think>')) {
            thinkingCb?.('思考过程');
          } else {
            contentCb?.('回复内容');
          }
        }),
        end: vi.fn(),
      };
      
      vi.mocked(ThinkTagStreamProcessor).mockImplementation(() => mockProcessor as any);
      
      const mockTextStream = {
        fullStream: (async function* () {
          yield { type: 'text-delta', textDelta: '<think>思考过程</think>' };
          yield { type: 'text-delta', textDelta: '回复内容' };
        })(),
      };
      
      vi.mocked(streamText).mockResolvedValue(mockTextStream as any);

      await act(async () => {
        await result.current.sendMessage('测试消息');
      });

      expect(mockProcessor.processChunk).toHaveBeenCalledTimes(2);
      expect(mockChatStore.updateMessage).toHaveBeenCalled();
    });
  });

  describe('停止生成功能', () => {
    it('应该能够停止正在进行的生成', async () => {
      const { result } = renderHook(() => useChat());
      
      const abortController = new AbortController();
      const abortSpy = vi.spyOn(abortController, 'abort');
      
      // Mock AbortController
      vi.spyOn(global, 'AbortController').mockImplementation(() => abortController);
      
      const mockTextStream = {
        textStream: (async function* () {
          yield 'Start';
          // 模拟长时间运行
          await new Promise(resolve => setTimeout(resolve, 1000));
          yield 'End';
        })(),
        fullStream: (async function* () {
          yield { type: 'text-delta', textDelta: 'Start' };
          await new Promise(resolve => setTimeout(resolve, 1000));
          yield { type: 'text-delta', textDelta: 'End' };
        })(),
      };
      
      vi.mocked(streamText).mockResolvedValue(mockTextStream as any);

      // 开始生成
      const sendPromise = act(async () => {
        await result.current.sendMessage('测试消息');
      });

      // 立即停止生成
      act(() => {
        result.current.stopGeneration();
      });

      await sendPromise;

      expect(abortSpy).toHaveBeenCalled();
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.isStreaming).toBe(false);

      expect(result.current.streamingContent).toBe('');
    });

    it('应该在停止生成时清理所有状态', () => {
      const { result } = renderHook(() => useChat());

      // 手动设置一些状态
      act(() => {
        // 这里需要通过内部方法设置状态，实际实现中可能需要调整
        result.current.stopGeneration();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.isStreaming).toBe(false);

      expect(result.current.streamingContent).toBe('');
      expect(mockChatStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('错误处理', () => {
    it('应该正确处理流式处理中的错误', async () => {
      const { result } = renderHook(() => useChat());
      
      const error = new Error('流式处理错误');
      vi.mocked(streamText).mockRejectedValue(error);

      await act(async () => {
        await result.current.sendMessage('测试消息');
      });

      expect(mockChatStore.setError).toHaveBeenCalledWith('流式处理错误');
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.isStreaming).toBe(false);
    });

    it('应该正确处理中止错误', async () => {
      const { result } = renderHook(() => useChat());
      
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.mocked(streamText).mockRejectedValue(abortError);

      await act(async () => {
        await result.current.sendMessage('测试消息');
      });

      expect(mockChatStore.setError).toHaveBeenCalledWith('消息生成已停止');
    });
  });

  describe('非流式处理', () => {
    it('应该在禁用流式处理时使用generateText', async () => {
      const { result } = renderHook(() => useChat());
      
      // 禁用流式处理
      mockChatSettings.enableStreaming = false;
      
      vi.mocked(generateText).mockResolvedValue({
        text: '非流式回复',
        usage: { totalTokens: 10 },
      } as any);

      await act(async () => {
        await result.current.sendMessage('测试消息');
      });

      expect(generateText).toHaveBeenCalled();
      expect(streamText).not.toHaveBeenCalled();
      expect(mockChatStore.updateMessage).toHaveBeenCalledWith(
        'message-1',
        '非流式回复',
        expect.any(Object)
      );
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大量流式更新而不影响性能', async () => {
      const { result } = renderHook(() => useChat());
      
      const startTime = performance.now();
      
      // 模拟大量快速更新
      const mockTextStream = {
        textStream: (async function* () {
          for (let i = 0; i < 100; i++) {
            yield `内容${i} `;
          }
        })(),
        fullStream: (async function* () {
          for (let i = 0; i < 100; i++) {
            yield { type: 'text-delta', textDelta: `内容${i} ` };
          }
        })(),
      };
      
      vi.mocked(streamText).mockResolvedValue(mockTextStream as any);

      await act(async () => {
        await result.current.sendMessage('性能测试消息');
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证性能指标（这个阈值可能需要根据实际情况调整）
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
      expect(mockChatStore.updateMessage).toHaveBeenCalledTimes(100);
    });
  });

  describe('并发处理', () => {
    it('应该防止并发发送消息', async () => {
      const { result } = renderHook(() => useChat());
      
      const mockTextStream = {
        textStream: (async function* () {
          yield '第一条消息';
        })(),
        fullStream: (async function* () {
          yield { type: 'text-delta', textDelta: '第一条消息' };
        })(),
      };
      
      vi.mocked(streamText).mockResolvedValue(mockTextStream as any);

      // 同时发送两条消息
      const promise1 = act(async () => {
        await result.current.sendMessage('第一条消息');
      });
      
      const promise2 = act(async () => {
        await result.current.sendMessage('第二条消息');
      });

      await Promise.all([promise1, promise2]);

      // 验证只有一条消息被处理（因为第二条应该被阻止）
      expect(mockChatStore.addMessage).toHaveBeenCalledTimes(2); // 一次用户消息，一次助手消息
    });
  });
});