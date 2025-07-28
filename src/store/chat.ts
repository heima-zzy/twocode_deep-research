import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { researchStore } from "@/utils/storage";
import { customAlphabet } from "nanoid";
import { clone, pick } from "radash";
import { useChatSettingsStore } from "@/store/chatSettings";

// 聊天状态接口
export interface ChatStore {
  // 当前活跃的聊天会话
  currentSession: ChatSession | null;  // 存储当前正在进行的聊天会话，可以为空
  // 所有聊天会话列表
  sessions: ChatSession[];  // 存储所有历史聊天会话的数组
  // 当前消息发送状态
  isLoading: boolean;  // 标识是否正在发送/接收消息的状态标志
  // 错误信息
  error: string | null;  // 存储可能出现的错误信息，无错误时为null
  // 当前正在输入的消息
  currentMessage: string;  // 存储用户当前正在输入但尚未发送的消息内容
}

// 聊天功能接口
interface ChatFunction {
  // 会话管理相关方法
  /**
   * 创建新的聊天会话
   * @param title 可选的会话标题,默认为"新对话"
   * @returns 返回新创建会话的ID
   */
  createSession: (title?: string) => string;

  /**
   * 加载指定ID的聊天会话
   * @param sessionId 要加载的会话ID
   * @returns 加载成功返回true,失败返回false
   */
  loadSession: (sessionId: string) => boolean;

  /**
   * 删除指定ID的聊天会话
   * @param sessionId 要删除的会话ID
   * @returns 删除成功返回true,失败返回false
   */
  deleteSession: (sessionId: string) => boolean;

  /**
   * 更新指定会话的标题
   * @param sessionId 要更新的会话ID
   * @param title 新的标题
   * @returns 更新成功返回true,失败返回false
   */
  updateSessionTitle: (sessionId: string, title: string) => boolean;
  
  // 消息管理相关方法
  /**
   * 添加新消息到当前会话
   * @param message 要添加的消息内容(不包含id和时间戳)
   * @returns 返回新添加消息的ID
   */
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;

  /**
   * 更新指定消息的内容
   * @param messageId 要更新的消息ID
   * @param content 新的消息内容
   * @param metadata 可选的元数据
   * @returns 更新成功返回true,失败返回false
   */
  updateMessage: (messageId: string, content: string, metadata?: ChatMessage['metadata']) => boolean;

  /**
   * 删除指定的消息
   * @param messageId 要删除的消息ID
   * @returns 删除成功返回true,失败返回false
   */
  deleteMessage: (messageId: string) => boolean;

  /**
   * 清空当前会话的所有消息
   */
  clearMessages: () => void;
  
  // 状态管理相关方法
  /**
   * 设置加载状态
   * @param loading 是否正在加载
   */
  setLoading: (loading: boolean) => void;

  /**
   * 设置错误信息
   * @param error 错误信息,null表示无错误
   */
  setError: (error: string | null) => void;

  /**
   * 设置当前正在输入的消息
   * @param message 消息内容
   */
  setCurrentMessage: (message: string) => void;
  
  // 工具函数
  /**
   * 获取所有会话的历史记录
   * @returns 返回会话历史记录数组
   */
  getSessionHistory: () => ChatHistory[];

  /**
   * 导出指定会话的数据
   * @param sessionId 要导出的会话ID
   * @returns 返回会话数据,不存在则返回null
   */
  exportSession: (sessionId: string) => ChatSession | null;

  /**
   * 导入会话数据
   * @param session 要导入的会话数据
   * @returns 导入成功返回true,失败返回false
   */
  importSession: (session: ChatSession) => boolean;

  /**
   * 清空所有数据,恢复到初始状态
   */
  clear: () => void;
}

// 生成唯一ID的工具
// 使用customAlphabet创建一个ID生成器函数
// 这个函数会生成12位长度的字符串ID，字符范围限制在数字和小写字母之间
// 用于在应用中生成唯一的会话ID和消息ID
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

// 默认值
// 实现ChatStore接口的默认初始值
// 包含了聊天状态的所有必要字段的初始状态
const defaultValues: ChatStore = {
  currentSession: null,    // 初始无活跃会话
  sessions: [],           // 初始会话列表为空
  isLoading: false,       // 初始非加载状态
  error: null,            // 初始无错误信息
  currentMessage: "",     // 初始输入消息为空
};

// 创建聊天store
export const useChatStore = create(
// persist中间件用于将store数据持久化到存储中
// 这里将ChatStore和ChatFunction的类型合并,确保store包含状态和方法
// 使用泛型来保证类型安全
persist<ChatStore & ChatFunction>(
    (set, get) => ({
      ...defaultValues, // 初始化默认值
      
      // 创建新的聊天会话
      createSession: (title = "新对话") => {
        // 生成唯一ID
        const id = nanoid();
        // 获取当前时间戳
        const now = Date.now();
        // 获取当前聊天设置
        const chatSettings = useChatSettingsStore.getState();
        // 创建新会话对象
        const newSession: ChatSession = {
          id,
          title,
          messages: [],
          createdAt: now,
          updatedAt: now,
          settings: {
            model: chatSettings.model,
            provider: chatSettings.provider,
            temperature: chatSettings.temperature,
          },
          knowledgeContext: [],
        };
        
        // 更新状态:
        // 1. 将新会话添加到会话列表的开头
        // 2. 将新会话设置为当前活跃会话
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession,
        }));
        
        return id;
      },
      
      // 加载指定的聊天会话
      loadSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (session) {
          set({ currentSession: clone(session) });
          return true;
        }
        return false;
      },
      
      // 删除聊天会话
      deleteSession: (sessionId) => {
        const state = get();
        const newSessions = state.sessions.filter(s => s.id !== sessionId);
        const newCurrentSession = state.currentSession?.id === sessionId 
          ? null 
          : state.currentSession;
        
        set({
          sessions: newSessions,
          currentSession: newCurrentSession,
        });
        
        return true;
      },
      
      // 更新会话标题
      updateSessionTitle: (sessionId, title) => {
        const state = get();
        const newSessions = state.sessions.map(session => 
          session.id === sessionId 
            ? { ...session, title, updatedAt: Date.now() }
            : session
        );
        
        const newCurrentSession = state.currentSession?.id === sessionId
          ? { ...state.currentSession, title, updatedAt: Date.now() }
          : state.currentSession;
        
        set({
          sessions: newSessions,
          currentSession: newCurrentSession,
        });
        
        return true;
      },
      
      // 添加消息到当前会话
      addMessage: (message) => {
        const state = get();
        if (!state.currentSession) {
          // 如果没有当前会话，创建一个新会话
          const sessionId = get().createSession();
        }
        
        const messageId = nanoid();
        const newMessage: ChatMessage = {
          ...message,
          id: messageId,
          timestamp: Date.now(),
        };
        
        const currentSession = get().currentSession;
        if (!currentSession) return messageId;
        
        const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, newMessage],
          updatedAt: Date.now(),
        };
        
        // 如果是第一条用户消息且会话标题是默认标题，使用消息内容作为会话标题
        if (currentSession.messages.length === 0 && message.type === 'user' && currentSession.title === '新对话') {
          updatedSession.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
        }
        
        const newSessions = get().sessions.map(session => 
          session.id === currentSession.id ? updatedSession : session
        );
        
        set({
          currentSession: updatedSession,
          sessions: newSessions,
        });
        
        return messageId;
      },
      
      // 更新消息内容
      updateMessage: (messageId, content, metadata) => {
        const state = get();
        if (!state.currentSession) return false;
        
        const updatedMessages = state.currentSession.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content, metadata: metadata || msg.metadata }
            : msg
        );
        
        const updatedSession = {
          ...state.currentSession,
          messages: updatedMessages,
          updatedAt: Date.now(),
        };
        
        const newSessions = state.sessions.map(session => 
          session.id === state.currentSession!.id ? updatedSession : session
        );
        
        set({
          currentSession: updatedSession,
          sessions: newSessions,
        });
        
        return true;
      },
      
      // 删除消息
      deleteMessage: (messageId) => {
        const state = get();
        if (!state.currentSession) return false;
        
        const updatedMessages = state.currentSession.messages.filter(msg => msg.id !== messageId);
        const updatedSession = {
          ...state.currentSession,
          messages: updatedMessages,
          updatedAt: Date.now(),
        };
        
        const newSessions = state.sessions.map(session => 
          session.id === state.currentSession!.id ? updatedSession : session
        );
        
        set({
          currentSession: updatedSession,
          sessions: newSessions,
        });
        
        return true;
      },
      
      // 清空当前会话的所有消息
      clearMessages: () => {
        const state = get();
        if (!state.currentSession) return;
        
        const updatedSession = {
          ...state.currentSession,
          messages: [],
          updatedAt: Date.now(),
        };
        
        const newSessions = state.sessions.map(session => 
          session.id === state.currentSession!.id ? updatedSession : session
        );
        
        set({
          currentSession: updatedSession,
          sessions: newSessions,
        });
      },
      
      // 设置加载状态
      setLoading: (loading) => set({ isLoading: loading }),
      
      // 设置错误信息
      setError: (error) => set({ error }),
      
      // 设置当前输入的消息
      setCurrentMessage: (message) => set({ currentMessage: message }),
      
      // 获取会话历史列表
      getSessionHistory: () => {
        return get().sessions.map(session => {
          const lastMessage = session.messages[session.messages.length - 1];
          return {
            id: session.id,
            title: session.title,
            lastMessage: lastMessage ? lastMessage.content.slice(0, 50) + (lastMessage.content.length > 50 ? '...' : '') : '暂无消息',
            timestamp: new Date(session.updatedAt).toLocaleString(),
            messageCount: session.messages.length,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          };
        }).sort((a, b) => b.updatedAt - a.updatedAt);
      },
      
      // 导出会话数据
      exportSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        return session ? clone(session) : null;
      },
      
      // 导入会话数据
      importSession: (session) => {
        const existingSession = get().sessions.find(s => s.id === session.id);
        if (existingSession) {
          // 如果会话已存在，更新它
          const newSessions = get().sessions.map(s => 
            s.id === session.id ? session : s
          );
          set({ sessions: newSessions });
        } else {
          // 如果会话不存在，添加它
          set((state) => ({
            sessions: [session, ...state.sessions],
          }));
        }
        return true;
      },
      
      // 清空所有数据
      clear: () => set(defaultValues),
    }),
    // 第二个参数: 配置选项
    {
      // 存储配置名称
      name: "chatStore",
      // 存储版本号,用于数据迁移
      version: 1,
      // 自定义存储实现
      storage: {
        // 获取存储数据
        // 从 researchStore 中异步读取指定 key 的数据
        getItem: async (key: string) => {
          return await researchStore.getItem<
            StorageValue<ChatStore & ChatFunction>
          >(key);
        },
        // 保存存储数据
        // 将数据异步保存到 researchStore
        // 只保存 currentSession 和 sessions 这两个关键状态
        setItem: async (
          key: string,
          store: StorageValue<ChatStore & ChatFunction>
        ) => {
          return await researchStore.setItem(key, {
            state: pick(store.state, ["currentSession", "sessions"]),
            version: store.version,
          });
        },
        // 删除存储数据
        // 从 researchStore 中异步删除指定 key 的数据
        removeItem: async (key: string) => await researchStore.removeItem(key),
      },
    }
  )
);