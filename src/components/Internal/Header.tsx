"use client";
import { useTranslation } from "react-i18next";
import { Settings, Github, History, BookText, Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/Internal/Button";
import { useGlobalStore } from "@/store/global";

interface HeaderProps {
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

function Header({ sidebarOpen, onSidebarToggle }: HeaderProps) {
  const { t } = useTranslation();
  const { setOpenSetting, setOpenHistory, setOpenKnowledge } = useGlobalStore();

  return (
    <>
      <header className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary/5 to-accent/10 backdrop-blur-sm print:hidden">
        <div className="flex items-center space-x-6">
          {/* 侧边栏切换按钮 */}
          {onSidebarToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="p-1 h-8 w-8"
              title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
            >
              {sidebarOpen ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          )}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">电</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-primary">深度研究平台</h1>
              <p className="text-sm text-muted-foreground">湖南电科院</p>
            </div>
          </div>
          <a
            href="https://github.com/heima-zzy/twocode_deep-research"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors p-2 rounded-md hover:bg-accent"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenHistory(true)}
            className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            <History className="w-4 h-4" />
            <span className="ml-2 font-medium">{t("history.title")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenKnowledge(true)}
            className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            <BookText className="w-4 h-4" />
            <span className="ml-2 font-medium">{t("knowledge.title")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenSetting(true)}
            className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
            <span className="ml-2 font-medium">{t("setting.title")}</span>
          </Button>
        </div>
      </header>
    </>
  );
}

export default Header;
