"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  FileText, 
  Calendar,
  Download,
  Trash2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useHistoryStore, type ResearchHistory } from "@/store/history";
import { useTaskStore } from "@/store/task";
import { downloadFile } from "@/utils/file";
import dayjs from "dayjs";
import Fuse from "fuse.js";

interface ResearchSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewResearch: () => void;
}

function formatDate(timestamp: number) {
  const now = dayjs();
  const date = dayjs(timestamp);
  
  if (date.isSame(now, 'day')) {
    return '今天';
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天';
  } else if (date.isSame(now, 'week')) {
    return '本周';
  } else if (date.isSame(now, 'month')) {
    return '本月';
  } else {
    return date.format('YYYY-MM-DD');
  }
}

function groupHistoryByDate(history: ResearchHistory[]) {
  const groups: { [key: string]: ResearchHistory[] } = {};
  
  history.forEach(item => {
    const dateKey = formatDate(item.updatedAt || item.createdAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });
  
  return groups;
}

export default function ResearchSidebar({ isOpen, onToggle, onNewResearch }: ResearchSidebarProps) {
  const { t } = useTranslation();
  const { history, load, remove } = useHistoryStore();
  const { restore, reset } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<ResearchHistory[]>(history);

  // 搜索功能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
    } else {
      const options = { 
        keys: ['title', 'question', 'finalReport'],
        threshold: 0.3
      };
      const fuse = new Fuse(history, options);
      const results = fuse.search(searchQuery);
      setFilteredHistory(results.map(result => result.item));
    }
  }, [searchQuery, history]);

  // 键盘快捷键
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onToggle();
    }
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      if (isOpen) {
        const searchInput = document.querySelector('input[placeholder="搜索研究记录..."]') as HTMLInputElement;
        searchInput?.focus();
      }
    }
  }, [isOpen, onToggle]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 加载研究记录
  const handleLoadResearch = (id: string) => {
    const research = load(id);
    if (research) {
      reset();
      restore(research);
      // 可以添加导航到研究页面的逻辑
    }
  };

  // 导出研究记录
  const handleExportResearch = (item: ResearchHistory) => {
    const data = {
      title: item.title,
      question: item.question,
      finalReport: item.finalReport,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    downloadFile(blob, `${item.title || '研究报告'}.json`);
  };

  // 删除研究记录
  const handleDeleteResearch = (id: string) => {
    if (confirm('确定要删除这个研究记录吗？')) {
      remove(id);
    }
  };

  const groupedHistory = groupHistoryByDate(filteredHistory);

  return (
    <>
      {/* 遮罩层 - 移动端 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* 侧边栏 */}
      <div className={`
        fixed left-0 top-0 h-full bg-card border-r border-border z-50
        transition-all duration-400 ease-smooth
        ${isOpen ? 'w-96 shadow-xl' : 'w-0 shadow-none'}
        overflow-hidden flex flex-col
      `}>
        {/* 侧边栏头部 */}
        <div className={`p-4 space-y-4 transition-all duration-300 delay-100 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-semibold text-lg">{t("deep_research", "深度研究")}</h1>
            </div>
            
            {/* 桌面端折叠按钮 */}
           { /*<Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex p-1 h-8 w-8"
              onClick={onToggle}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>*/}
          </div>

          {/* 新建研究按钮 */}
          <Button
            onClick={onNewResearch}
            className="w-full justify-start btn-enhanced micro-bounce"
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2 transition-transform duration-200" />
            新建研究
          </Button>
        </div>

        <Separator />

        {/* 中间内容区域 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full custom-scrollbar">
            <div className={`p-4 space-y-4 transition-all duration-300 delay-150 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              {/* 搜索框 */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索研究记录... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 animate-smooth-fast focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <Separator />

              {/* 历史记录列表 */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {t("research_history", "研究历史")}
                </h3>
                {Object.keys(groupedHistory).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无研究记录</p>
                    <p className="text-sm mt-2">开始你的第一个深度研究吧</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedHistory).map(([dateGroup, items]) => (
                      <div key={dateGroup}>
                        <div className="flex items-center space-x-2 mb-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {dateGroup}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {items.length}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="group p-3 rounded-lg border border-border card-hover animate-smooth transition-all duration-200 cursor-pointer hover:shadow-sm"
                              onClick={() => handleLoadResearch(item.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 pr-2">
                                  <h4 className="font-medium text-sm text-foreground truncate" title={item.title || item.question}>
                                    {(item.title || item.question).length > 20 
                                      ? `${(item.title || item.question).substring(0, 20)}...` 
                                      : (item.title || item.question)
                                    }
                                  </h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {dayjs(item.updatedAt || item.createdAt).format('HH:mm')}
                                    </span>
                                  </div>
                                  {item.finalReport && (
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                      {item.finalReport.substring(0, 80)}...
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 micro-bounce animate-smooth-fast"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportResearch(item);
                                    }}
                                    title="导出"
                                  >
                                    <Download className="h-3 w-3 transition-transform duration-200" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive micro-bounce animate-smooth-fast"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteResearch(item.id);
                                    }}
                                    title="删除"
                                  >
                                    <Trash2 className="h-3 w-3 transition-transform duration-200" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* 底部信息 */}
        <div className={`p-4 transition-all duration-300 delay-200 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
          <div className="text-xs text-muted-foreground text-center animate-smooth">
            共 {history.length} 个研究记录
          </div>
        </div>
      </div>
    </>
  );
}