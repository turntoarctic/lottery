"use client";

import { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, RefreshCw, Crown, Info } from "lucide-react";
import type { Prize } from "@/app/types";
import { PRIZE_LEVEL_CONFIG } from "@/app/types";

interface PrizeListSidebarProps {
  prizes: Prize[];
  selectedPrize: Prize | null;
  prizeWinners: Record<string, string[]>;
  isDrawing: boolean;
  onSelectPrize: (prize: Prize) => void;
  onRefresh: () => void;
  onShowKeyboardHelp: () => void;
}

/**
 * 奖品列表侧边栏组件
 * 使用 memo 避免不必要的重渲染
 */
export const PrizeListSidebar = memo<PrizeListSidebarProps>(
  ({
    prizes,
    selectedPrize,
    prizeWinners,
    isDrawing,
    onSelectPrize,
    onRefresh,
    onShowKeyboardHelp,
  }) => {
    return (
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <h2 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
            <Gift className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]" />
            奖品列表
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar gap-2">
          {prizes.map((prize) => {
            const config = PRIZE_LEVEL_CONFIG[prize.level];
            const isSelected = selectedPrize?.id === prize.id;
            const isFinished = prize.remainingCount === 0;
            const progress =
              prize.totalCount > 0
                ? ((prize.totalCount - prize.remainingCount) /
                    prize.totalCount) *
                  100
                : 0;

            return (
              <PrizeCard
                key={prize.id}
                prize={prize}
                config={config}
                isSelected={isSelected}
                isFinished={isFinished}
                progress={progress}
                winners={prizeWinners[prize.id] || []}
                isDrawing={isDrawing}
                onSelect={() => onSelectPrize(prize)}
              />
            );
          })}

          {prizes.length === 0 && (
            <Card className="bg-white/5 border-white/10 border-2">
              <CardContent className="py-12 text-center text-purple-200">
                <div className="text-6xl mb-4 animate-bounce">🎁</div>
                <p className="mb-4 text-lg">暂无奖品</p>
                <Link href="/admin/prizes">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 border-2 border-white/20"
                  >
                    前往添加
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowKeyboardHelp}
            className="w-full hover:bg-white/10 gap-2 text-purple-300"
          >
            <Info className="h-4 w-4" />
            快捷键帮助 (?)
          </Button>
        </div>
      </div>
    );
  }
);

PrizeListSidebar.displayName = "PrizeListSidebar";

interface PrizeCardProps {
  prize: Prize;
  config: { label: string; color: string };
  isSelected: boolean;
  isFinished: boolean;
  progress: number;
  winners: string[];
  isDrawing: boolean;
  onSelect: () => void;
}

/**
 * 单个奖品卡片组件
 * 使用 memo 优化渲染性能
 */
const PrizeCard = memo<PrizeCardProps>(
  ({ prize, config, isSelected, isFinished, progress, winners, isDrawing, onSelect }) => {
    return (
      <Card
        className={`
          cursor-pointer transition-all duration-500 backdrop-blur-xl border-2 relative overflow-hidden group
          ${
            isSelected
              ? "bg-gradient-to-br from-white/30 to-white/10 border-yellow-400 shadow-2xl shadow-yellow-400/30 scale-105"
              : "bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:bg-white/15 hover:scale-102"
          }
          ${isFinished ? "opacity-40 grayscale" : ""}
        `}
        onClick={() => !isDrawing && onSelect()}
      >
        <CardContent className="p-4 relative flex flex-col items-center">
          {prize.imageUrl && (
            <div className="relative h-32 w-full -mx-4 -mt-4 mb-3 cursor-pointer group">
              <img
                src={prize.imageUrl}
                alt={prize.name}
                className="w-full rounded-b-sm h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          )}
          <div className="flex items-center justify-between mb-3 w-full">
            <Badge
              style={{
                backgroundColor: config.color,
                boxShadow: `0 0 15px ${config.color}`,
              }}
              className="text-sm font-bold border-2 border-white/30 px-3 py-1"
            >
              {config.label}
            </Badge>
            {isFinished ? (
              <Badge className="text-xs bg-gray-600 border-2 border-white/20">
                已抽完
              </Badge>
            ) : (
              isSelected && (
                <Crown className="h-6 w-6 text-yellow-400 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,1)]" />
              )
            )}
          </div>

          <div className="flex w-full justify-between items-center">
            <div className="font-bold text-xl mb-3 drop-shadow-lg text-white">
              {prize.name}
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-purple-200">剩余</span>
              <span
                className="font-bold text-2xl"
                style={{
                  color: config.color,
                  textShadow: `0 0 15px ${config.color}`,
                }}
              >
                {prize.remainingCount}
              </span>
              <span className="text-purple-200">/ {prize.totalCount}</span>
            </div>
          </div>

          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
            <div
              className="h-full transition-all duration-700 rounded-full relative"
              style={{
                width: `${progress}%`,
                backgroundColor: config.color,
                boxShadow: `0 0 20px ${config.color}, inset 0 0 10px rgba(255,255,255,0.3)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* 中奖名单 */}
          <div className="w-full">
            {winners.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-purple-200 mb-2">
                  🎉 中奖名单 ({winners.length}人)
                </div>
                <div className="flex flex-wrap gap-1">
                  {winners.slice(0, 6).map((winner, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/90"
                    >
                      {winner}
                    </span>
                  ))}
                  {winners.length > 6 && (
                    <span className="text-xs text-purple-300 px-2 py-1">
                      +{winners.length - 6}人
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

PrizeCard.displayName = "PrizeCard";
