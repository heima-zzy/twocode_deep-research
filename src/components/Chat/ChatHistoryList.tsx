"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreVertical, Download, Trash2, Edit } from "lucide-react";
import { cn } from "@/utils/style";
import { useChatStore } from "@/store/chat";
import { toast } from "sonner";
import ExportChatDialog from "./ExportChatDialog";

export default function ChatHistoryList() {
  const { t } = useTranslation();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const {
    sessions,
    currentSession,
    loadSession,
    deleteSession,
    updateSessionTitle,
    getSessionHistory,
  } = useChatStore();

  // 确保水合完成后再获取聊天历史，避免水合错误
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const chatHistory = isHydrated ? getSessionHistory() : [];

  const handleSelectChat = (sessionId: string) => {
    const success = loadSession(sessionId);
    if (success) {
      toast.success(t("session_loaded", "对话已加载"));
    } else {
      toast.error(t("session_load_failed", "加载对话失败"));
    }
  };

  const handleDeleteChat = (sessionId: string) => {
    const success = deleteSession(sessionId);
    if (success) {
      toast.success(t("session_deleted", "对话已删除"));
    } else {
      toast.error(t("session_delete_failed", "删除对话失败"));
    }
  };

  const handleExportChat = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setExportDialogOpen(true);
  };

  const handleRenameChat = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const newTitle = prompt(t("enter_new_title", "请输入新标题（最多10个字符）"), session.title);
    if (newTitle && newTitle.trim() && newTitle !== session.title) {
      const trimmedTitle = newTitle.trim();
      if (trimmedTitle.length > 10) {
        toast.error(t("title_too_long", "标题过长，已自动截取前10个字符"));
      }
      const success = updateSessionTitle(sessionId, trimmedTitle);
      if (success) {
        toast.success(t("title_updated", "标题已更新"));
      } else {
        toast.error(t("title_update_failed", "更新标题失败"));
      }
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground px-3 py-2">
          {t("chat_history", "聊天历史")}
        </div>
        
        {!isHydrated || chatHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("no_chat_history", "暂无聊天记录")}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                  "hover:bg-accent",
                  currentSession?.id === chat.id
                    ? "bg-accent border border-border"
                    : "border border-transparent"
                )}
                onClick={() => handleSelectChat(chat.id)}
              >
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <h3 className="text-sm font-medium truncate max-w-[calc(100%-20px)]" title={chat.title}>
                      {chat.title.length > 20 ? `${chat.title.substring(0, 20)}...` : chat.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {chat.timestamp}
                  </p>
                </div>
                
                <div className="flex-shrink-0 ml-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRenameChat(chat.id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        {t("rename", "重命名")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportChat(chat.id)}>
                        <Download className="w-4 h-4 mr-2" />
                        {t("export", "导出")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteChat(chat.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("delete", "删除")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <ExportChatDialog
        open={exportDialogOpen}
        onClose={() => {
          setExportDialogOpen(false);
          setSelectedSessionId(null);
        }}
        sessionId={selectedSessionId || undefined}
      />
    </>

  );
}