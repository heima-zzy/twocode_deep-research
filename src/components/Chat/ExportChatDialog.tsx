"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileText, FileJson } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChatStore } from "@/store/chat";
import { downloadFile } from "@/utils/file";

interface ExportChatDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function ExportChatDialog({
  open,
  onClose,
  sessionId,
}: ExportChatDialogProps) {
  const { t } = useTranslation();
  const [exportFormat, setExportFormat] = useState<"json" | "markdown">("json");
  const [isExporting, setIsExporting] = useState(false);
  const { exportSession, sessions } = useChatStore();

  const handleExport = async () => {
    if (!sessionId) {
      toast.error(t("no_session_selected", "请选择要导出的对话"));
      return;
    }

    setIsExporting(true);
    try {
      const session = exportSession(sessionId);
      if (!session) {
        toast.error(t("session_not_found", "对话不存在"));
        return;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (exportFormat === "json") {
        content = JSON.stringify(session, null, 2);
        filename = `chat-${session.title}-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = "application/json";
      } else {
        // Markdown format
        content = generateMarkdownContent(session);
        filename = `chat-${session.title}-${new Date().toISOString().split('T')[0]}.md`;
        mimeType = "text/markdown";
      }

      await downloadFile(content, filename, mimeType);
      toast.success(t("export_success", "导出成功"));
      onClose();
    } catch (error) {
      console.error("导出失败:", error);
      toast.error(t("export_failed", "导出失败"));
    } finally {
      setIsExporting(false);
    }
  };

  const generateMarkdownContent = (session: ChatSession): string => {
    const lines = [
      `# ${session.title}`,
      "",
      `**创建时间**: ${new Date(session.createdAt).toLocaleString()}`,
      `**更新时间**: ${new Date(session.updatedAt).toLocaleString()}`,
      `**消息数量**: ${session.messages.length}`,
      `**AI模型**: ${session.settings.model} (${session.settings.provider})`,
      "",
      "---",
      "",
    ];

    session.messages.forEach((message, index) => {
      const timestamp = new Date(message.timestamp).toLocaleString();
      const role = message.type === "user" ? "👤 用户" : "🤖 AI助手";
      
      lines.push(`## ${role} - ${timestamp}`);
      lines.push("");
      lines.push(message.content);
      lines.push("");
      
      if (message.metadata) {
        lines.push("**元数据**:");
        if (message.metadata.model) {
          lines.push(`- 模型: ${message.metadata.model}`);
        }
        if (message.metadata.tokens) {
          lines.push(`- Token数: ${message.metadata.tokens}`);
        }
        if (message.metadata.duration) {
          lines.push(`- 耗时: ${message.metadata.duration}ms`);
        }
        lines.push("");
      }
      
      if (index < session.messages.length - 1) {
        lines.push("---");
        lines.push("");
      }
    });

    return lines.join("\n");
  };

  const selectedSession = sessionId ? sessions.find(s => s.id === sessionId) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            {t("export_chat", "导出对话")}
          </DialogTitle>
          <DialogDescription>
            {selectedSession
              ? t("export_chat_description", `导出对话 "${selectedSession.title}" 到本地文件`)
              : t("select_session_to_export", "请选择要导出的对话")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {selectedSession && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">{selectedSession.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedSession.messages.length} 条消息 • {" "}
                {new Date(selectedSession.updatedAt).toLocaleString()}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("export_format", "导出格式")}
            </label>
            <Select
              value={exportFormat}
              onValueChange={(value: "json" | "markdown") => setExportFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    JSON {t("format", "格式")}
                  </div>
                </SelectItem>
                <SelectItem value="markdown">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Markdown {t("format", "格式")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel", "取消")}
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selectedSession || isExporting}
          >
            {isExporting ? (
              t("exporting", "导出中...")
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {t("export", "导出")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}