"use client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Send, Search } from "lucide-react";
import { useState } from "react";

export default function WelcomeSection() {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      // TODO: 实现发送消息的逻辑
      console.log("发送消息:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* 欢迎标题 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            {t("welcome_to_chat", "欢迎使用 AI 助手")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("chat_description", "与 AI 进行智能对话，获取即时回答，或进行深度研究分析")}
          </p>
        </div>

        {/* 聊天输入区域 */}
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Textarea
              placeholder={t("chat_placeholder", "输入您的问题...")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[120px] pr-12 resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              size="sm"
              className="absolute bottom-3 right-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* 深度研究按钮 */}
          <div className="flex justify-center">
            <Link
              href="/research"
              className="inline-flex items-center px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
            >
              <Search className="w-5 h-5 mr-2" />
              {t("deep_research", "深度研究")}
            </Link>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{t("ai_chat", "AI 对话")}</h3>
            <p className="text-muted-foreground">
              {t("ai_chat_desc", "与 AI 进行实时对话，获取即时回答和建议")}
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{t("deep_research", "深度研究")}</h3>
            <p className="text-muted-foreground">
              {t("deep_research_desc", "进行深入的主题研究，生成详细的分析报告")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}