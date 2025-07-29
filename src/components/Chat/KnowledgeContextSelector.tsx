"use client";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useKnowledgeStore } from "@/store/knowledge";
import { useChatSettingStore } from "@/store/chatSetting";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Search,
  X,
  FileText,
  Calendar,
  Hash,
} from "lucide-react";
import { cn } from "@/utils/style";
import Fuse from "fuse.js";
import dayjs from "dayjs";

interface KnowledgeContextSelectorProps {
  selectedKnowledgeIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  trigger?: React.ReactNode;
}

export default function KnowledgeContextSelector({
  selectedKnowledgeIds,
  onSelectionChange,
  trigger,
}: KnowledgeContextSelectorProps) {
  const { t } = useTranslation();
  const { knowledges } = useKnowledgeStore();
  const { } = useChatSettingStore();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 搜索功能
  const filteredKnowledges = useMemo(() => {
    if (!searchQuery.trim()) {
      return knowledges;
    }

    const options = {
      keys: ["title", "content"],
      threshold: 0.3,
      includeScore: true,
    };

    const fuse = new Fuse(knowledges, options);
    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [knowledges, searchQuery]);

  // 处理知识库项选择
  const handleKnowledgeToggle = useCallback(
    (knowledgeId: string, checked: boolean) => {
      if (checked) {
        onSelectionChange([...selectedKnowledgeIds, knowledgeId]);
      } else {
        onSelectionChange(
          selectedKnowledgeIds.filter((id) => id !== knowledgeId)
        );
      }
    },
    [selectedKnowledgeIds, onSelectionChange]
  );

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedKnowledgeIds.length === filteredKnowledges.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredKnowledges.map((k) => k.id));
    }
  }, [selectedKnowledgeIds, filteredKnowledges, onSelectionChange]);

  // 清除选择
  const handleClearSelection = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);



  // 获取选中的知识库信息
  const selectedKnowledges = useMemo(() => {
    return knowledges.filter((k) => selectedKnowledgeIds.includes(k.id));
  }, [knowledges, selectedKnowledgeIds]);

  // 计算内容长度
  const getTotalContentLength = useCallback(() => {
    return selectedKnowledges.reduce(
      (total, knowledge) => total + (knowledge.content?.length || 0),
      0
    );
  }, [selectedKnowledges]);

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="relative">
      <BookOpen className="w-4 h-4 mr-2" />
      {t("knowledge_context", "知识库上下文")}
      {selectedKnowledgeIds.length > 0 && (
        <Badge
          variant="secondary"
          className="ml-2 h-5 min-w-[20px] px-1 text-xs"
        >
          {selectedKnowledgeIds.length}
        </Badge>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t("knowledge_context_selector", "知识库上下文选择")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "knowledge_context_desc",
              "选择要在对话中使用的知识库内容作为上下文参考"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("search_knowledge", "搜索知识库内容...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredKnowledges.length === 0}
              >
                {selectedKnowledgeIds.length === filteredKnowledges.length
                  ? t("deselect_all", "取消全选")
                  : t("select_all", "全选")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                disabled={selectedKnowledgeIds.length === 0}
              >
                <X className="w-4 h-4 mr-1" />
                {t("clear_selection", "清除选择")}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {t("selected_count", "已选择 {{count}} 项", {
                count: selectedKnowledgeIds.length,
              })}
            </div>
          </div>

          {/* 选中的知识库摘要 */}
          {selectedKnowledgeIds.length > 0 && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {t("selected_knowledge_summary", "选中的知识库摘要")}
                </span>
                <Badge variant="outline">
                  {t("total_chars", "共 {{count}} 字符", {
                    count: getTotalContentLength(),
                  })}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedKnowledges.slice(0, 5).map((knowledge) => (
                  <Badge key={knowledge.id} variant="secondary" className="text-xs">
                    {knowledge.title}
                  </Badge>
                ))}
                {selectedKnowledges.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedKnowledges.length - 5} {t("more", "更多")}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* 知识库列表 */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2">
              {filteredKnowledges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? t("no_search_results", "未找到匹配的知识库内容")
                    : t("no_knowledge_items", "暂无知识库内容")}
                </div>
              ) : (
                filteredKnowledges.map((knowledge) => {
                  const isSelected = selectedKnowledgeIds.includes(knowledge.id);
                  return (
                    <div
                      key={knowledge.id}
                      className={cn(
                        "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50",

                      )}
                      onClick={() => {
                        handleKnowledgeToggle(knowledge.id, !isSelected);
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleKnowledgeToggle(knowledge.id, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <h4 className="font-medium text-sm truncate">
                            {knowledge.title}
                          </h4>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {knowledge.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {knowledge.content?.slice(0, 100)}...
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dayjs(knowledge.createdAt).format("YYYY-MM-DD")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {knowledge.content?.length || 0} {t("chars", "字符")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}