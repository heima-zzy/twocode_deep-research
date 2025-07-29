"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useChat, UseChatReturn } from '@/hooks/useChat';

// 创建聊天上下文
const ChatContext = createContext<UseChatReturn | undefined>(undefined);

// ChatProvider 组件的 props 接口
interface ChatProviderProps {
  children: ReactNode;
}

/**
 * ChatProvider 组件
 * 为子组件提供聊天功能的上下文
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const chatValue = useChat();

  return (
    <ChatContext.Provider value={chatValue}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * 使用聊天上下文的 hook
 * @returns 聊天功能相关的状态和方法
 * @throws 如果在 ChatProvider 外部使用会抛出错误
 */
export const useChatContext = (): UseChatReturn => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  
  return context;
};

// 默认导出 ChatContext
export default ChatContext;