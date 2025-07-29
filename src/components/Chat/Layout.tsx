"use client";
import { ReactNode, useEffect } from "react";
import { useGlobalStore } from "@/store/global";

import Sidebar from "./Sidebar";
import MainContent from "./MainContent";

interface ChatLayoutProps {
  children?: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useGlobalStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // 初始设置
    handleResize();

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <>
      {/* 遮罩层 - 移动端 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* 侧边栏 - 固定定位，通过宽度控制显示 */}
      <div className={`
        fixed left-0 top-0 h-full bg-card border-r border-border z-50
        transition-all duration-400 ease-smooth
        ${sidebarOpen ? 'w-80 shadow-xl' : 'w-0 shadow-none'}
        overflow-hidden flex flex-col
      `}>
        <div className={`h-full transition-all duration-300 delay-100 ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
          <Sidebar />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className={`
        flex-1 flex flex-col h-screen transition-all duration-400 ease-smooth
        ${sidebarOpen ? 'ml-80' : 'ml-0'}
      `}>
        <MainContent>
          {children}
        </MainContent>
      </div>
    </>
  );
}