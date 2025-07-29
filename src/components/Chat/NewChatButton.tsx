"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/chat";
import { toast } from "sonner";

export default function NewChatButton() {
  const { t } = useTranslation();
  const { createSession } = useChatStore();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewChat = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    
    // 添加短暂延迟以显示加载动画
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const sessionId = createSession();
      if (sessionId) {
        // 延迟显示成功提示，让界面过渡更自然
        setTimeout(() => {
          toast.success(t("new_chat_created", "新对话已创建"), {
            duration: 2000,
            style: {
              background: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }
          });
        }, 200);
      } else {
        toast.error(t("new_chat_failed", "创建新对话失败"));
      }
    } catch {
      toast.error(t("new_chat_failed", "创建新对话失败"));
    } finally {
      setIsCreating(false);
    }

  };

  return (
    <Button
      onClick={handleNewChat}

      disabled={isCreating}
      className="
        w-full justify-start transition-all duration-300 ease-smooth
        hover:scale-[1.02] active:scale-[0.98]
        hover:shadow-md hover:bg-accent/80
        disabled:opacity-70 disabled:cursor-not-allowed
        btn-enhanced micro-bounce
      "
      variant="outline"
    >
      {isCreating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Plus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
      )}
      {isCreating ? t("creating_chat", "创建中...") : t("new_chat", "新建对话")}


    </Button>
  );
}