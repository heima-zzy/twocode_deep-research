"use client";
import { ReactNode } from "react";
import { useGlobalStore } from "@/store/global";
import { cn } from "@/utils/style";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";

interface ChatLayoutProps {
  children?: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useGlobalStore();

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 - 只有在打开时才占据布局空间 */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <Sidebar />
        </div>
      )}
      
      {/* 移动端侧边栏 - 固定定位覆盖层 */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* 遮罩层 - 仅在移动端显示 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        <MainContent>
          {children}
        </MainContent>
      </div>
    </div>
  );
}