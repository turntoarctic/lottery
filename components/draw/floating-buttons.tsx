"use client";

import { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, BarChart3 } from "lucide-react";
import type { Theme } from "@/app/types";

interface FloatingButtonsProps {
  theme: Theme | null;
  soundEnabled: boolean;
  onToggleStats: () => void;
  onToggleSound: () => void;
}

/**
 * 浮动按钮组组件
 * 包含统计面板、音效开关、管理后台按钮
 */
export const FloatingButtons = memo<FloatingButtonsProps>(
  ({ theme, soundEnabled, onToggleStats, onToggleSound }) => {
    const buttonStyle = {
      background: `linear-gradient(to bottom right, ${theme?.primaryColor || "#A855F7"}CC, ${theme?.secondaryColor || "#EC4899"}CC)`,
      boxShadow: `0 25px 50px -12px ${theme?.primaryColor || "#A855F7"}80`,
    };

    const hoverStyle = {
      background: `linear-gradient(to bottom right, ${theme?.primaryColor || "#A855F7"}, ${theme?.secondaryColor || "#EC4899"})`,
    };

    return (
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {/* 统计面板按钮 */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleStats}
          className="h-14 w-14 rounded-full shadow-2xl backdrop-blur-xl border-3 border-white/40 hover:scale-110 hover:shadow-lg transition-all duration-300 relative group"
          style={buttonStyle}
        >
          <BarChart3 className="h-7 w-7 text-white drop-shadow-lg" />
          <span className="absolute right-full mr-4 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            统计面板
          </span>
        </Button>

        {/* 管理后台按钮 */}
        <Link href="/admin" className="group">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl backdrop-blur-xl border-3 border-white/40 hover:scale-110 hover:shadow-lg relative"
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hoverStyle.background;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = buttonStyle.background;
            }}
          >
            <Settings className="h-8 w-8 text-white drop-shadow-lg" />
            <span className="absolute right-full mr-4 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              管理后台
            </span>
          </Button>
        </Link>
      </div>
    );
  }
);

FloatingButtons.displayName = "FloatingButtons";
