"use client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useChatStore } from "@/store/chat";
import { toast } from "sonner";

export default function NewChatButton() {
  const { t } = useTranslation();
  const { createSession } = useChatStore();

  const handleNewChat = () => {
    const sessionId = createSession();
    if (sessionId) {
      // createSession已经自动设置了currentSession，无需额外调用loadSession
      toast.success(t("new_chat_created", "新对话已创建"));
    } else {
      toast.error(t("new_chat_failed", "创建新对话失败"));
    }
  };

  return (
    <Button
      onClick={handleNewChat}
      className="w-full justify-start"
      variant="outline"
    >
      <Plus className="w-4 h-4 mr-2" />
      {t("new_chat", "新建对话")}
    </Button>
  );
}