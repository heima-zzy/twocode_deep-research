"use client";
import { useGlobalStore } from "@/store/global";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import NewChatButton from "./NewChatButton";
import ChatHistoryList from "./ChatHistoryList";
import ChatSetting from "@/components/ChatSetting";
import Link from "next/link";
import {
  MessageSquarePlus,
  History,
  Settings,
  BookOpen,
  Search,

} from "lucide-react";

export default function Sidebar() {
  const { t } = useTranslation();
  const {
    openChatSetting,
    setOpenChatSetting,
    setOpenHistory,
    setOpenKnowledge,
  } = useGlobalStore();

  const handleOpenChatSetting = () => {
    setOpenChatSetting(true);
  };

  const handleCloseChatSetting = () => {
    setOpenChatSetting(false);
  };

  const handleOpenHistory = () => {
    setOpenHistory(true);
  };

  const handleOpenKnowledge = () => {
    setOpenKnowledge(true);
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* 顶部区域 */}
      <div className="p-4 space-y-4">
        {/* Logo 和标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-lg">{t("app_name", "湖南电科院")}</h1>
          </div>
          
          {/* 桌面端折叠按钮 */}
         {/*  <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex p-1 h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          */}
        </div>

        {/* 新建对话按钮 */}
        <div className="btn-enhanced micro-bounce">
          <NewChatButton />
        </div>
      </div>

      <Separator />

      {/* 中间内容区域 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full custom-scrollbar">
          <div className="p-4 space-y-4">
            {/* 历史对话列表 */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("recent_chats", "最近对话")}
              </h3>
              <div className="card-hover animate-smooth">
                <ChatHistoryList />
              </div>
            </div>

            <Separator />

            {/* 快速操作 */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("quick_actions", "快速操作")}
              </h3>
              <div className="space-y-1">
                <Link
                  href="/research"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('/research', '_blank', 'noopener,noreferrer');
              }}
                  className="flex items-center space-x-3 w-full p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>{t("deep_research", "深度研究")}</span>
                </Link>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* 底部操作区域 */}
      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start btn-enhanced micro-bounce animate-smooth"
          onClick={handleOpenHistory}
        >
          <History className="w-4 h-4 mr-2 transition-transform duration-200" />
          {t("history.title", "历史记录")}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start btn-enhanced micro-bounce animate-smooth"
          onClick={handleOpenKnowledge}
        >
          <BookOpen className="w-4 h-4 mr-2 transition-transform duration-200" />
          {t("knowledge.title", "知识库")}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start btn-enhanced micro-bounce animate-smooth"
          onClick={handleOpenChatSetting}
        >
          <Settings className="w-4 h-4 mr-2 transition-transform duration-200" />
          {t("chat_settings", "聊天设置")}
        </Button>
      </div>
      
      {/* 聊天设置对话框 */}
      <ChatSetting 
        open={openChatSetting} 
        onClose={handleCloseChatSetting} 
      />
    </div>
  );
}