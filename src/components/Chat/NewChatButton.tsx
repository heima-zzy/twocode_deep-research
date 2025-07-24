"use client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useGlobalStore } from "@/store/global";

export default function NewChatButton() {
  const { t } = useTranslation();
  const { setCurrentChatId } = useGlobalStore();

  const handleNewChat = () => {
    // 清除当前选中的对话
    setCurrentChatId(null);
    // TODO: 这里可以添加创建新对话的逻辑
    console.log("创建新对话");
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