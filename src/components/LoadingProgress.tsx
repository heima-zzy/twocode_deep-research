"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProgressProps {
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

export function LoadingProgress({
  isVisible,
  onComplete,
  duration = 2000,
  className
}: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setProgress(0);
      
      // 模拟进度条动画
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsAnimating(false);
              onComplete?.();
            }, 300);
            return 100;
          }
          // 使用非线性进度，开始快，后面慢
          const increment = prev < 50 ? 3 : prev < 80 ? 2 : 1;
          return Math.min(prev + increment, 100);
        });
      }, duration / 100);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
      setIsAnimating(false);
    }
  }, [isVisible, duration, onComplete]);

  if (!isVisible && !isAnimating) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        "transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-6">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">正在跳转到深度研究</h3>
          <p className="text-sm text-muted-foreground">
            正在为您准备研究环境...
          </p>
        </div>
        
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <div className="text-center text-sm text-muted-foreground">
            {progress.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingProgress;