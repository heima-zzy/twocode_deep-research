"use client";
import { ReactNode } from "react";
import { useGlobalStore } from "@/store/global";
import { Button } from "@/components/ui/button";
import { Menu, ChevronRight } from "lucide-react";

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { sidebarOpen, setSidebarOpen } = useGlobalStore();

  return (
    <div className="flex flex-col h-full relative">
      {/* 浮动侧边栏切换按钮 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`
          fixed top-4 z-50 transition-all duration-400 ease-smooth
          ${sidebarOpen ? 'left-[21rem]' : 'left-4'}
          hover:bg-accent/80 backdrop-blur-sm btn-enhanced micro-bounce
          hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl
        `}
        title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
      >
        {sidebarOpen ? (
          <ChevronRight className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
        ) : (
          <Menu className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
        )}
      </Button>

      {/* 头部 */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          {/* 页面标题区域 */}
          <div className="flex items-center space-x-2 ml-12">
            <h2 className="text-lg font-semibold">湖南电科院</h2>
          </div>
        </div>

        {/* 右侧操作区域 - 可以添加其他按钮 */}
        <div className="flex items-center space-x-2">
          {/* 预留给其他操作按钮 */}
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}