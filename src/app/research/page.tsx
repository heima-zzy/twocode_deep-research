"use client";
import dynamic from "next/dynamic";
import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useGlobalStore } from "@/store/global";
import { useSettingStore } from "@/store/setting";

const Header = dynamic(() => import("@/components/Internal/Header"));
const Setting = dynamic(() => import("@/components/Setting"));
const Topic = dynamic(() => import("@/components/Research/Topic"));
const Feedback = dynamic(() => import("@/components/Research/Feedback"));
const SearchResult = dynamic(
  () => import("@/components/Research/SearchResult")
);
const FinalReport = dynamic(() => import("@/components/Research/FinalReport"));
const History = dynamic(() => import("@/components/History"));
const Knowledge = dynamic(() => import("@/components/Knowledge"));

function Home() {
  const { t } = useTranslation();
  const {
    openSetting,
    setOpenSetting,
    openHistory,
    setOpenHistory,
    openKnowledge,
    setOpenKnowledge,
  } = useGlobalStore();

  const { theme } = useSettingStore();
  const { setTheme } = useTheme();

  useLayoutEffect(() => {
    const settingStore = useSettingStore.getState();
    setTheme(settingStore.theme);
  }, [theme, setTheme]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Topic />
            <Feedback />
            <SearchResult />
            <FinalReport />
          </div>
          <aside className="space-y-6">
            <div className="sticky top-8">
              <Setting open={openSetting} onClose={() => setOpenSetting(false)} />
              <History open={openHistory} onClose={() => setOpenHistory(false)} />
              <Knowledge
                open={openKnowledge}
                onClose={() => setOpenKnowledge(false)}
              />
            </div>
          </aside>
        </div>
      </main>
      <footer className="border-t bg-card/50 backdrop-blur-sm py-8 text-center print:hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">电</span>
              </div>
              <span className="text-sm font-medium text-foreground">电子科技研究院深度研究平台</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>© 2024 电子科技研究院</span>
              <span>•</span>
              <a
                href="https://github.com/u14app/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                {t("copyright", {
                  name: "U14App",
                })}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;