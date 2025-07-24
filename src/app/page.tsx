"use client";
import dynamic from "next/dynamic";
import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";
import { useSettingStore } from "@/store/setting";
import { useGlobalStore } from "@/store/global";
import Link from "next/link";
import { useTranslation } from "react-i18next";

// 动态导入组件以优化性能
const ChatLayout = dynamic(() => import("@/components/Chat/Layout"));
const WelcomeSection = dynamic(() => import("@/components/Chat/WelcomeSection"));
const Setting = dynamic(() => import("@/components/Setting"));
const History = dynamic(() => import("@/components/History"));
const Knowledge = dynamic(() => import("@/components/Knowledge"));

function ChatHomePage() {
 
  const { theme } = useSettingStore();
  const { setTheme } = useTheme();
  const { openSetting, openHistory, openKnowledge, setOpenSetting, setOpenHistory, setOpenKnowledge } = useGlobalStore();

  useLayoutEffect(() => {
    const settingStore = useSettingStore.getState();
    setTheme(settingStore.theme);
  }, [theme, setTheme]);

  return (
    <>
      {/* 主布局 */}
      <ChatLayout>
        <WelcomeSection />
      </ChatLayout>

      {/* 侧边栏组件 - 保持与原有功能的兼容性 */}
      <aside className="print:hidden">
        <Setting open={openSetting} onClose={() => setOpenSetting(false)} />
        <History open={openHistory} onClose={() => setOpenHistory(false)} />
        <Knowledge open={openKnowledge} onClose={() => setOpenKnowledge(false)} />
      </aside>
    </>
  );
}

export default ChatHomePage;
