"use client";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "@/store/global";
import { Button } from "@/components/ui/button";
import { MessageSquare, MoreHorizontal } from "lucide-react";
import { cn } from "@/utils/style";

// 临时的示例数据类型
interface ChatItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

// 示例数据
const mockChatHistory: ChatItem[] = [
  {
    id: "1",
    title: "关于机器学习的讨论",
    lastMessage: "什么是深度学习？",
    timestamp: "2小时前",
  },
  {
    id: "2",
    title: "编程问题咨询",
    lastMessage: "如何优化React性能？",
    timestamp: "昨天",
  },
  {
    id: "3",
    title: "数据分析方法",
    lastMessage: "Python数据可视化",
    timestamp: "3天前",
  },
];

export default function ChatHistoryList() {
  const { t } = useTranslation();
  const { currentChatId, setCurrentChatId } = useGlobalStore();

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    // TODO: 这里可以添加加载对话历史的逻辑
    console.log("选择对话:", chatId);
  };

  if (mockChatHistory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t("no_chat_history", "暂无对话历史")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {mockChatHistory.map((chat) => (
        <div
          key={chat.id}
          className={cn(
            "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            currentChatId === chat.id
              ? "bg-accent text-accent-foreground"
              : "text-foreground"
          )}
          onClick={() => handleSelectChat(chat.id)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{chat.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {chat.timestamp}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 添加更多操作菜单
              console.log("更多操作:", chat.id);
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}