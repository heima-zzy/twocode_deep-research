import { create } from "zustand";

interface GlobalStore {
  openSetting: boolean;
  openHistory: boolean;
  openKnowledge: boolean;
  // 侧边栏是否打开的状态
  sidebarOpen: boolean;
  // 当前选中的聊天会话ID
  currentChatId: string | null;
  // 聊天相关状态
  chatHistoryOpen: boolean;
  currentView: 'research' | 'chat';
}

interface GlobalFunction {
  setOpenSetting: (visible: boolean) => void;
  setOpenHistory: (visible: boolean) => void;
  setOpenKnowledge: (visible: boolean) => void;
  // 设置侧边栏开关状态
  setSidebarOpen: (open: boolean) => void;
  // 设置当前选中的聊天会话ID
  setCurrentChatId: (chatId: string | null) => void;
  setChatHistoryOpen: (open: boolean) => void;
  setCurrentView: (view: 'research' | 'chat') => void;
}

export const useGlobalStore = create<GlobalStore & GlobalFunction>((set) => ({
  openSetting: false,
  openHistory: false,
  openKnowledge: false,
  // 侧边栏的开关状态，桌面端默认打开，移动端默认关闭
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  // 当前选中的聊天会话ID，默认为空
  currentChatId: null,
  chatHistoryOpen: false,
  currentView: 'research',
  setOpenSetting: (visible) => set({ openSetting: visible }),
  setOpenHistory: (visible) => set({ openHistory: visible }),
  setOpenKnowledge: (visible) => set({ openKnowledge: visible }),
  // 设置侧边栏的开关状态，true为打开，false为关闭
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  // 设置当前选中的聊天会话ID，传入null则表示取消选中
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
  setChatHistoryOpen: (open) => set({ chatHistoryOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
}));
