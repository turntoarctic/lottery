"use client";

import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Prize } from "@/app/types";

interface WinnersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPrize: Prize | null;
  currentRoundWinners: string[];
  prizeWinners: Record<string, string[]>;
}

/**
 * 中奖名单对话框组件
 */
export const WinnersDialog = memo<WinnersDialogProps>(
  ({
    open,
    onOpenChange,
    selectedPrize,
    currentRoundWinners,
    prizeWinners,
  }) => {
    const selectedPrizeWinners = selectedPrize
      ? prizeWinners[selectedPrize.id] || []
      : [];

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-2xl border-4 border-yellow-400/50 shadow-2xl shadow-yellow-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center gap-3 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)]">
              <span className="text-4xl">🏆</span>
              {selectedPrize?.name}
              <span className="text-white/80 text-2xl font-normal">
                - 中奖名单
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
            {/* 当前轮中奖名单 */}
            {currentRoundWinners.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2 pb-3 border-b-2 border-yellow-400/30">
                  <span className="text-2xl">🎉</span> 本轮中奖名单
                  <span className="bg-yellow-400/30 px-3 py-1 rounded-full text-sm ml-auto">
                    {currentRoundWinners.length} 人
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentRoundWinners.map((winner, idx) => (
                    <WinnerCard
                      key={idx}
                      winner={winner}
                      idx={idx}
                      variant="current"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 历史中奖名单 */}
            {selectedPrize && selectedPrizeWinners.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-purple-300 flex items-center gap-2 pb-3 border-b-2 border-purple-400/30">
                  <span className="text-2xl">🏆</span> 历史中奖名单
                  <span className="bg-purple-400/30 px-3 py-1 rounded-full text-sm ml-auto">
                    {selectedPrizeWinners.length} 人
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedPrizeWinners.map((winner, idx) => (
                    <WinnerCard
                      key={idx}
                      winner={winner}
                      idx={idx}
                      variant="history"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 如果没有中奖记录 */}
            {selectedPrizeWinners.length === 0 && currentRoundWinners.length === 0 && (
              <div className="text-center py-16">
                <div className="text-8xl mb-6 animate-bounce">🏆</div>
                <p className="text-2xl text-purple-200 font-semibold">
                  暂无中奖记录
                </p>
                <p className="text-sm text-purple-300 mt-2">
                  开始抽奖后将在此显示中奖名单
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

WinnersDialog.displayName = "WinnersDialog";

interface WinnerCardProps {
  winner: string;
  idx: number;
  variant: "current" | "history";
}

/**
 * 单个中奖者卡片组件
 */
const WinnerCard = memo<WinnerCardProps>(({ winner, idx, variant }) => {
  if (variant === "current") {
    return (
      <div
        className="group relative bg-gradient-to-br from-yellow-400/20 to-orange-600/20 backdrop-blur-xl rounded-2xl border-3 border-yellow-400/60 p-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 hover:scale-105 transition-transform"
        style={{ animationDelay: `${idx * 80}ms` }}
      >
        {/* 发光背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-orange-500/30 to-pink-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />

        {/* 序号 */}
        <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-lg font-bold text-black shadow-lg">
          {idx + 1}
        </div>

        <div className="relative z-10">
          <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
            {winner}
          </div>
          <div className="text-sm text-yellow-200">🎉 中奖者</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border-2 border-purple-400/40 p-4 text-center hover:scale-105 transition-transform">
      <div className="text-lg font-semibold text-white mb-1 drop-shadow">
        {winner}
      </div>
      <div className="text-xs text-purple-200">🏆 中奖者</div>
    </div>
  );
});

WinnerCard.displayName = "WinnerCard";
