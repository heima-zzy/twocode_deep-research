import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '@/store/chat';
import { act, renderHook } from '@testing-library/react';

// Mock nanoid
let idCounter = 0;
vi.mock('nanoid', () => ({
  customAlphabet: () => () => `test-id-${++idCounter}`
}));

// Mock storage
vi.mock('@/utils/storage', () => ({
  researchStore: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

/**
 * 聊天存储测试套件
 * 包含了对聊天存储功能的各项测试
 */
describe('ChatStore', () => {
  /**
   * 每个测试用例执行前的准备工作
   * 1. 重置ID计数器，确保每次测试的ID生成是可预测的
   * 2. 重置store状态，确保每个测试用例都从干净的状态开始
   */
  beforeEach(() => {
    // 重置ID计数器
    idCounter = 0;
    // 重置store状态
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.clear();
    });
  });

  describe('会话管理', () => {
    // 测试创建新的聊天会话的功能
    it('应该能够创建新的聊天会话', () => {
      // 获取 chat store 的 hook
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        // 创建一个新会话并验证返回的会话ID
        const sessionId = result.current.createSession('测试会话');
        expect(sessionId).toBe('test-id-1');
      });
      
      // 验证当前会话是否存在
      expect(result.current.currentSession).toBeTruthy();
      // 验证会话标题是否正确
      expect(result.current.currentSession?.title).toBe('测试会话');
      // 验证新会话的消息列表是否为空
      expect(result.current.currentSession?.messages).toEqual([]);
      // 验证会话列表中是否只有一个会话
      expect(result.current.sessions).toHaveLength(1);
    });

    it('应该能够加载指定的聊天会话', () => {
      const { result } = renderHook(() => useChatStore());
      
      let sessionId1: string;


      
      // 创建第一个会话
      act(() => {
        sessionId1 = result.current.createSession('会话1');
      });
      
      // 创建第二个会话
      act(() => {

        result.current.createSession('会话2');

      });
      
      // 当前会话应该是最后创建的'会话2'
      expect(result.current.currentSession?.title).toBe('会话2');
      
      // 加载第一个会话
      act(() => {
        const loaded = result.current.loadSession(sessionId1);// 加载第一个会话
        expect(loaded).toBe(true);
      });
      
      // 加载后当前会话应该变为'会话1'
      expect(result.current.currentSession?.title).toBe('会话1');
    });

    it('应该能够删除聊天会话', () => {
      const { result } = renderHook(() => useChatStore());
      
      let sessionId: string;
      act(() => {
        sessionId = result.current.createSession('待删除会话');
      });
      
      act(() => {
        const deleted = result.current.deleteSession(sessionId);// 删除会话
        expect(deleted).toBe(true);
      });
      
      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.currentSession).toBeNull();
    });

    it('应该能够更新会话标题', () => {
      const { result } = renderHook(() => useChatStore());
      
      let sessionId: string;
      act(() => {
        sessionId = result.current.createSession('原标题');
      });
      
      act(() => {
        const updated = result.current.updateSessionTitle(sessionId, '新标题');// 更新会话标题
        expect(updated).toBe(true);
      });
      
      expect(result.current.currentSession?.title).toBe('新标题');
      expect(result.current.sessions[0].title).toBe('新标题');
    });
  });

  describe('消息管理', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useChatStore());
      act(() => {
        result.current.createSession('测试会话');
      });
    });

    it('应该能够添加用户消息', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        const messageId = result.current.addMessage({// 添加用户消息
          type: 'user', 
          content: '你好，AI助手！'
        });
        expect(messageId).toBe('test-id-2');
      });
      
      expect(result.current.currentSession?.messages).toHaveLength(1);
      expect(result.current.currentSession?.messages[0].content).toBe('你好，AI助手！');
      expect(result.current.currentSession?.messages[0].type).toBe('user');
    });

    it('应该能够添加AI回复消息', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.addMessage({
          type: 'assistant',
          content: '你好！我是AI助手，很高兴为您服务。',
          metadata: {
            model: 'gpt-3.5-turbo',
            tokens: 15,
            duration: 1200
          }
        });
      });
      
      const message = result.current.currentSession?.messages[0];
      expect(message?.type).toBe('assistant');
      expect(message?.metadata?.model).toBe('gpt-3.5-turbo');
      expect(message?.metadata?.tokens).toBe(15);
    });

    it('应该能够更新消息内容', () => {
      const { result } = renderHook(() => useChatStore());
      
      let messageId: string;
      act(() => {
        messageId = result.current.addMessage({
          type: 'user',
          content: '原始内容'
        });
      });
      
      act(() => {
        const updated = result.current.updateMessage(messageId, '更新后的内容');
        expect(updated).toBe(true);
      });
      
      expect(result.current.currentSession?.messages[0].content).toBe('更新后的内容');
    });

    it('应该能够删除消息', () => {
      const { result } = renderHook(() => useChatStore());
      
      let messageId: string;
      act(() => {
        messageId = result.current.addMessage({
          type: 'user',
          content: '待删除的消息'
        });
      });
      
      act(() => {
        const deleted = result.current.deleteMessage(messageId);
        expect(deleted).toBe(true);
      });
      
      expect(result.current.currentSession?.messages).toHaveLength(0);
    });

    it('应该能够清空所有消息', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.addMessage({ type: 'user', content: '消息1' });
        result.current.addMessage({ type: 'assistant', content: '回复1' });
        result.current.addMessage({ type: 'user', content: '消息2' });
      });
      
      expect(result.current.currentSession?.messages).toHaveLength(3);
      
      act(() => {
        result.current.clearMessages();
      });
      
      expect(result.current.currentSession?.messages).toHaveLength(0);
    });

    it('第一条用户消息应该自动设置为会话标题（仅当标题为默认值时）', () => {
      const { result } = renderHook(() => useChatStore());
      
      // 创建默认标题的会话
      act(() => {
        result.current.createSession(); // 使用默认标题"新对话"
      });
      
      act(() => {
        result.current.addMessage({
          type: 'user',
          content: '这是一个很长的用户消息，应该被截断作为会话标题使用'
        });
      });
      
      expect(result.current.currentSession?.title).toBe('这是一个很长的用户消息，应该被截断作为会话标题使用');
    });

    it('超长消息应该被截断作为会话标题', () => {
      const { result } = renderHook(() => useChatStore());
      
      // 创建默认标题的会话
      act(() => {
        result.current.createSession(); // 使用默认标题"新对话"
      });
      
      const longMessage = '这是一个非常非常长的用户消息，超过了30个字符的限制，应该被截断';
      
      act(() => {
        result.current.addMessage({
          type: 'user',
          content: longMessage
        });
      });
      
      expect(result.current.currentSession?.title).toBe('这是一个非常非常长的用户消息，超过了30个字符的限制，应该被...');
    });
  });

  describe('状态管理', () => {
    it('应该能够设置加载状态', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });

    it('应该能够设置错误信息', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setError('网络连接失败');
      });
      
      expect(result.current.error).toBe('网络连接失败');
      
      act(() => {
        result.current.setError(null);
      });
      
      expect(result.current.error).toBeNull();
    });

    it('应该能够设置当前输入消息', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setCurrentMessage('正在输入的消息...');
      });
      
      expect(result.current.currentMessage).toBe('正在输入的消息...');
    });
  });

  describe('工具函数', () => {
    it('应该能够获取会话历史列表', () => {
      const { result } = renderHook(() => useChatStore());
      

      // 创建第一个会话并添加消息
      act(() => {
        result.current.createSession('会话1');

      });
      
      act(() => {
        result.current.addMessage({ type: 'assistant', content: '第一条消息' });
      });
      
      // 创建第二个会话并添加消息
      act(() => {

        result.current.createSession('会话2');

      });
      
      act(() => {
        result.current.addMessage({ type: 'assistant', content: '第二条消息' });
        result.current.addMessage({ type: 'user', content: 'AI回复' });
      });
      
      const history = result.current.getSessionHistory();
      
      expect(history).toHaveLength(2);
      // 会话2是最后更新的，应该排在前面
      expect(history[0].title).toBe('会话2');
      expect(history[0].messageCount).toBe(2);
      expect(history[1].title).toBe('会话1');
      expect(history[1].messageCount).toBe(1);
    });

    it('应该能够导出会话数据', () => {
      const { result } = renderHook(() => useChatStore());
      

      let sessionId: string = '';

      act(() => {
        sessionId = result.current.createSession('导出测试');
        result.current.addMessage({ type: 'assistant', content: '测试消息' }); // 使用assistant消息避免标题被覆盖
      });
      
      const exportedSession = result.current.exportSession(sessionId);
      
      expect(exportedSession).toBeTruthy();
      expect(exportedSession?.title).toBe('导出测试');
      expect(exportedSession?.messages).toHaveLength(1);
    });

    it('应该能够导入会话数据', () => {
      const { result } = renderHook(() => useChatStore());
      
      const importSession: ChatSession = {
        id: 'imported-session',
        title: '导入的会话',
        messages: [
          {
            id: 'msg-1',
            type: 'user',
            content: '导入的消息',
            timestamp: Date.now()
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: {
          model: 'gpt-4',
          provider: 'openai'
        }
      };
      
      act(() => {
        const imported = result.current.importSession(importSession);
        expect(imported).toBe(true);
      });
      
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].title).toBe('导入的会话');
    });
  });

  describe('数据类型验证', () => {
    it('ChatMessage应该包含所有必需字段', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.createSession();
        result.current.addMessage({
          type: 'user',
          content: '测试消息'
        });
      });
      
      const message = result.current.currentSession?.messages[0];
      
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('type');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('timestamp');
      expect(typeof message?.id).toBe('string');
      expect(typeof message?.timestamp).toBe('number');
    });

    it('ChatSession应该包含所有必需字段', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.createSession('测试会话');
      });
      
      const session = result.current.currentSession;
      
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('title');
      expect(session).toHaveProperty('messages');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
      expect(session).toHaveProperty('settings');
      expect(session?.settings).toHaveProperty('model');
      expect(session?.settings).toHaveProperty('provider');
      expect(Array.isArray(session?.messages)).toBe(true);
    });
  });
});