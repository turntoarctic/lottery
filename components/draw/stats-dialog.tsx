"use client";

import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import type { Prize, User } from "@/app/types";

interface StatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  prizes: Prize[];
}

/**
 * 统计面板对话框组件
 */
export const StatsDialog = memo<StatsDialogProps>(
  ({ open, onOpenChange, users, prizes }) => {
    const totalUsers = users.length;
    const wonUsers = users.filter((u) => u.hasWon).length;
    const remainingUsers = users.filter((u) => !u.hasWon).length;
    const remainingPrizes = prizes.reduce((sum, p) => sum + p.remainingCount, 0);
    const awardedPrizes = prizes.reduce(
      (sum, p) => sum + (p.totalCount - p.remainingCount),
      0
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-2xl border-4 border-yellow-400/50 shadow-2xl shadow-yellow-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center gap-3 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)]">
              <BarChart3 className="h-10 w-10 animate-bounce" />
              抽奖统计
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-xl border-2 border-yellow-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-yellow-400 mb-2 drop-shadow-lg">
                {totalUsers}
              </div>
              <div className="text-lg text-yellow-200">总人数</div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl border-2 border-purple-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-purple-400 mb-2 drop-shadow-lg">
                {wonUsers}
              </div>
              <div className="text-lg text-purple-200">已中奖人数</div>
            </Card>
            <Card className="bg-gradient-to-br from-pink-500/20 to-rose-600/20 backdrop-blur-xl border-2 border-pink-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-pink-400 mb-2 drop-shadow-lg">
                {remainingUsers}
              </div>
              <div className="text-lg text-pink-200">待抽奖人数</div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-xl border-2 border-blue-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-blue-400 mb-2 drop-shadow-lg">
                {remainingPrizes}
              </div>
              <div className="text-lg text-blue-200">剩余奖品数</div>
            </Card>
            <Card className="col-span-2 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border-2 border-green-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-green-400 mb-2 drop-shadow-lg">
                {awardedPrizes}
              </div>
              <div className="text-lg text-green-200">已发放奖品总数</div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

StatsDialog.displayName = "StatsDialog";
