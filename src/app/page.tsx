"use client";
import dynamic from "next/dynamic";
import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";
import { useSettingStore } from "@/store/setting";
import { useGlobalStore } from "@/store/global";
import Link from "next/link";
import { useTranslation } from "react-i18next";

// 动态导入组件以优化性能
const Header = dynamic(() => import("@/components/Internal/Header"));
const Setting = dynamic(() => import("@/components/Setting"));
const History = dynamic(() => import("@/components/History"));
const Knowledge = dynamic(() => import("@/components/Knowledge"));

function ChatHomePage() {
  const { t } = useTranslation();
  const { theme } = useSettingStore();
  const { setTheme } = useTheme();
  const { openSetting, openHistory, openKnowledge, setOpenSetting, setOpenHistory, setOpenKnowledge } = useGlobalStore();

  useLayoutEffect(() => {
    const settingStore = useSettingStore.getState();
    setTheme(settingStore.theme);
  }, [theme, setTheme]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* 主要内容区域 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          {/* 欢迎标题 */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              {t("welcome_to_chat", "欢迎使用 AI 助手")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {t("chat_description", "与 AI 进行智能对话，获取即时回答，或进行深度研究分析")}
            </p>
          </div>

          {/* 聊天输入区域 - 临时简化版本 */}
          <div className="w-full max-w-2xl space-y-4">
            <div className="relative">
              <textarea
                placeholder={t("chat_placeholder", "输入您的问题...")}
                className="w-full min-h-[120px] p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                disabled
              />
              <div className="absolute bottom-4 right-4">
                <button
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  disabled
                >
                  {t("send", "发送")}
                </button>
              </div>
            </div>
            
            {/* 深度研究按钮 */}
            <div className="flex justify-center">
              <Link
                href="/research"
                className="inline-flex items-center px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t("deep_research", "深度研究")}
              </Link>
            </div>
          </div>

          {/* 功能说明 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-12">
            <div className="p-6 border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">{t("ai_chat", "AI 对话")}</h3>
              <p className="text-muted-foreground">
                {t("ai_chat_desc", "与 AI 进行实时对话，获取即时回答和建议")}
              </p>
            </div>
            <div className="p-6 border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">{t("deep_research", "深度研究")}</h3>
              <p className="text-muted-foreground">
                {t("deep_research_desc", "进行深入的主题研究，生成详细的分析报告")}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-auto py-4 text-center text-sm text-muted-foreground">
        <a href="https://github.com/u14app/" target="_blank">
          {t("copyright", {
            name: "U14App",
          })}
        </a>
      </footer>

      {/* 侧边栏组件 - 保持与原有功能的兼容性 */}
      <aside className="print:hidden">
        <Setting open={openSetting} onClose={() => setOpenSetting(false)} />
        <History open={openHistory} onClose={() => setOpenHistory(false)} />
        <Knowledge open={openKnowledge} onClose={() => setOpenKnowledge(false)} />
      </aside>
    </div>
  );
}

export default ChatHomePage;
