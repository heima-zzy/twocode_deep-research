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
    <div className="flex flex-col h-full">
      {/* 头部 - 包含汉堡菜单按钮 */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          {/* 汉堡菜单按钮 - 仅在移动端显示 */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* 桌面端展开侧边栏按钮 - 仅在侧边栏关闭时显示 */}
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex p-1 h-8 w-8"
              onClick={() => setSidebarOpen(true)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          
          {/* 页面标题区域 */}
          <div className="flex items-center space-x-2">
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