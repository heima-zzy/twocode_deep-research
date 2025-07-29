"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Internal/Button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  Plus,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import useKnowledge from "@/hooks/useKnowledge";
import { useKnowledgeStore } from "@/store/knowledge";


interface UrlContextInjectorProps {
  selectedKnowledgeIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  trigger?: React.ReactNode;
}

interface UrlItem {
  url: string;
  status: "pending" | "loading" | "success" | "error";
  title?: string;
  error?: string;
}

export default function UrlContextInjector({
  selectedKnowledgeIds,
  onSelectionChange,
  trigger,
}: UrlContextInjectorProps) {
  const { t } = useTranslation();
  const { knowledges } = useKnowledgeStore();
  const { getKnowledgeFromUrl } = useKnowledge();
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [crawler, setCrawler] = useState("jina");
  const [urlList, setUrlList] = useState<UrlItem[]>([]);

  // 验证URL格式
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // 添加URL到列表
  const handleAddUrl = () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      toast.error(t("knowledge.urlContext.messages.urlRequired"));
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      toast.error(t("knowledge.urlContext.messages.invalidUrl"));
      return;
    }

    // 检查是否已存在
    if (urlList.some((item) => item.url === trimmedUrl)) {
      toast.error("该网站地址已存在");
      return;
    }

    setUrlList((prev) => [
      ...prev,
      { url: trimmedUrl, status: "pending" },
    ]);
    setUrlInput("");
  };

  // 移除URL
  const handleRemoveUrl = (url: string) => {
    setUrlList((prev) => prev.filter((item) => item.url !== url));
  };

  // 抓取单个URL内容
  const handleFetchUrl = async (url: string) => {
    setUrlList((prev) =>
      prev.map((item) =>
        item.url === url ? { ...item, status: "loading" } : item
      )
    );

    try {
      await getKnowledgeFromUrl(url, crawler);
      setUrlList((prev) =>
        prev.map((item) =>
          item.url === url
            ? { ...item, status: "success", title: url }
            : item
        )
      );
      toast.success(t("knowledge.urlContext.messages.fetchSuccess"));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "抓取失败";
      setUrlList((prev) =>
        prev.map((item) =>
          item.url === url
            ? { ...item, status: "error", error: errorMessage }
            : item
        )
      );
      toast.error(t("knowledge.urlContext.messages.fetchError"));
    }
  };

  // 批量抓取所有URL
  const handleFetchAllUrls = async () => {
    const pendingUrls = urlList.filter((item) => item.status === "pending");
    if (pendingUrls.length === 0) {
      toast.error("没有待抓取的网站");
      return;
    }

    for (const urlItem of pendingUrls) {
      await handleFetchUrl(urlItem.url);
      // 添加延迟避免请求过于频繁
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  // 获取已成功抓取的URL对应的知识库项
  const getSuccessfulKnowledgeItems = () => {
    const successfulUrls = urlList.filter((item) => item.status === "success");
    return knowledges.filter((knowledge) =>
      knowledge.type === "url" &&
      successfulUrls.some((urlItem) => urlItem.url === knowledge.url)
    );
  };

  // 选择所有成功抓取的知识库项
  const handleSelectAllSuccessful = () => {
    const successfulKnowledgeItems = getSuccessfulKnowledgeItems();
    const newSelectedIds = [
      ...selectedKnowledgeIds,
      ...successfulKnowledgeItems
        .filter((item) => !selectedKnowledgeIds.includes(item.id))
        .map((item) => item.id),
    ];
    onSelectionChange(newSelectedIds);
    toast.success("已选择所有成功抓取的网站内容");
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="relative">
      <Globe className="w-4 h-4 mr-2" />
      {t("knowledge.urlContext.title")}
      {urlList.filter((item) => item.status === "success").length > 0 && (
        <Badge
          variant="secondary"
          className="ml-2 h-5 min-w-[20px] px-1 text-xs"
        >
          {urlList.filter((item) => item.status === "success").length}
        </Badge>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t("knowledge.urlContext.title")}
          </DialogTitle>
          <DialogDescription>
            {t("knowledge.urlContext.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* URL输入区域 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {t("knowledge.urlContext.addUrl")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 爬虫选择 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium min-w-[60px]">
                  {t("knowledge.urlContext.crawlerType")}:
                </label>
                <Select value={crawler} onValueChange={setCrawler}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jina">{t("knowledge.urlContext.jina")}</SelectItem>
                    <SelectItem value="local">{t("knowledge.urlContext.local")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* URL输入 */}
              <div className="flex gap-2">
                <Input
                  placeholder={t("knowledge.urlContext.urlPlaceholder")}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddUrl();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleAddUrl} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  {t("knowledge.add")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* URL列表 */}
          {urlList.length > 0 && (
            <Card className="flex-1 min-h-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    网站列表 ({urlList.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFetchAllUrls}
                      disabled={urlList.filter((item) => item.status === "pending").length === 0}
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      {t("knowledge.urlContext.fetchAll")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllSuccessful}
                      disabled={getSuccessfulKnowledgeItems().length === 0}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      选择全部成功项
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {urlList.map((urlItem, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        {/* 状态图标 */}
                        <div className="flex-shrink-0">
                          {urlItem.status === "pending" && (
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-gray-400" />
                            </div>
                          )}
                          {urlItem.status === "loading" && (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          )}
                          {urlItem.status === "success" && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {urlItem.status === "error" && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>

                        {/* URL信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {urlItem.title || urlItem.url}
                            </span>
                            <ExternalLink
                              className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600"
                              onClick={() => window.open(urlItem.url, "_blank")}
                            />
                          </div>
                          {urlItem.url !== urlItem.title && (
                            <div className="text-xs text-gray-500 truncate">
                              {urlItem.url}
                            </div>
                          )}
                          {urlItem.error && (
                            <div className="text-xs text-red-500 mt-1">
                              {urlItem.error}
                            </div>
                          )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1">
                          {urlItem.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFetchUrl(urlItem.url)}
                            >
                              <Globe className="w-3 h-3 mr-1" />
                              {t("knowledge.urlContext.actions.fetch")}
                            </Button>
                          )}
                          {urlItem.status === "error" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFetchUrl(urlItem.url)}
                            >
                              {t("knowledge.urlContext.actions.retry")}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUrl(urlItem.url)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* 统计信息 */}
          {urlList.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground p-2 bg-gray-50 rounded">
              <div className="flex gap-4">
                <span>
                  总计: {urlList.length}
                </span>
                <span className="text-blue-600">
                  {t("knowledge.urlContext.status.pending")}: {urlList.filter((item) => item.status === "pending").length}
                </span>
                <span className="text-green-600">
                  {t("knowledge.urlContext.status.success")}: {urlList.filter((item) => item.status === "success").length}
                </span>
                <span className="text-red-600">
                  {t("knowledge.urlContext.status.error")}: {urlList.filter((item) => item.status === "error").length}
                </span>
              </div>
              <div>
                已选入上下文: {getSuccessfulKnowledgeItems().filter((item) => selectedKnowledgeIds.includes(item.id)).length}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}