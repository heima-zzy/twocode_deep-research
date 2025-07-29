"use client";
import dynamic from "next/dynamic";

import { useLayoutEffect, useState, useEffect } from "react";

import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useGlobalStore } from "@/store/global";
import { useSettingStore } from "@/store/setting";

import { useTaskStore } from "@/store/task";
import LoadingProgress from "@/components/LoadingProgress";

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

const ResearchSidebar = dynamic(() => import("@/components/Research/ResearchSidebar"));


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

  const { reset } = useTaskStore();
  
  // 左侧边栏状态
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // 页面加载状态
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  
  // 新建研究
  const handleNewResearch = () => {
    reset();
    setSidebarOpen(false);
  };
  
  // 页面加载完成处理
  const handlePageLoadComplete = () => {
    setIsPageLoading(false);
    // 延迟显示内容，创造渐入效果
    setTimeout(() => {
      setShowContent(true);
    }, 100);
  };
  
  // 页面初始化加载效果
  useEffect(() => {
    // 模拟页面加载时间
    const timer = setTimeout(() => {
      handlePageLoadComplete();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);


  useLayoutEffect(() => {
    const settingStore = useSettingStore.getState();
    setTheme(settingStore.theme);
  }, [theme, setTheme]);
  return (

    <>
      {/* 页面加载动画 */}
      <LoadingProgress
        isVisible={isPageLoading}
        onComplete={handlePageLoadComplete}
        duration={1500}
      />
      
      <div className={`min-h-screen bg-gradient-to-br from-background via-background to-accent/5 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {/* 左侧边栏 */}
      <ResearchSidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewResearch={handleNewResearch}
      />
      
      {/* 主内容区域 */}
       <div className={`transition-all duration-400 ease-smooth ${sidebarOpen ? 'lg:ml-96 ml-0' : 'ml-0'}`}>
        <Header 
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="container mx-auto px-6 py-8 animate-smooth">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8 content-fade-in">
              <Topic />
              <Feedback />
              <SearchResult />
              <FinalReport />
            </div>
            <aside className="space-y-6 animate-scale-in">
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
      </div>
      <footer className="border-t bg-card/50 backdrop-blur-sm py-8 text-center print:hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">电</span>
              </div>
              <span className="text-sm font-medium text-foreground">湖南电科院深度研究平台</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>© 2025 湖南电科院</span>
              <span>•</span>
              <a
                href="https://github.com/heima-zzy/twocode_deep-research"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                {t("copyright", {
                  name: "USC",
                })}
              </a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>

  );
}

export default Home;