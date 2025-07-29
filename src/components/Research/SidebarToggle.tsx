"use client";
import { Button } from "@/components/ui/button";
import { ChevronRight, Menu } from "lucide-react";

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SidebarToggle({ isOpen, onToggle }: SidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={`
        fixed top-4 z-50 transition-all duration-400 ease-smooth
        ${isOpen ? 'left-[25rem]' : 'left-4'}
        hover:bg-accent/80 backdrop-blur-sm btn-enhanced micro-bounce
        hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl
      `}
      title={isOpen ? '收起侧边栏' : '展开侧边栏'}
    >
      {isOpen ? (
        <ChevronRight className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
      ) : (
        <Menu className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
      )}
    </Button>
  );
}