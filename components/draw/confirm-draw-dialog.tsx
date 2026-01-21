"use client";

import { memo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trophy, Gift, Info, Zap } from "lucide-react";
import type { Prize, Rule, User } from "@/app/types";

interface ConfirmDrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedPrize: Prize | null;
  rule: Rule | null;
  users: User[];
}

/**
 * 抽奖确认对话框组件
 */
export const ConfirmDrawDialog = memo<ConfirmDrawDialogProps>(
  ({
    open,
    onOpenChange,
    onConfirm,
    selectedPrize,
    rule,
    users,
  }) => {
    const eligibleUsersCount = users.filter(
      (u) => !u.hasWon || (rule && rule.allowRepeatWin)
    ).length;

    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-lg bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-2xl border-4 border-yellow-400/50 shadow-2xl shadow-yellow-400/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-bold flex items-center gap-3 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)]">
              <Trophy className="h-10 w-10 animate-bounce" />
              确认开始抽奖
            </AlertDialogTitle>
            <div className="text-lg text-purple-100 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                  <Gift className="h-5 w-5 text-yellow-400" />
                  <span className="font-semibold">奖品：</span>
                  <span className="text-yellow-300 font-bold">
                    {selectedPrize?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                  <Info className="h-5 w-5 text-blue-400" />
                  <span>剩余数量：</span>
                  <span className="text-yellow-300 font-bold">
                    {selectedPrize?.remainingCount}
                  </span>
                  <span className="text-gray-300">
                    / {selectedPrize?.totalCount}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                  <Zap className="h-5 w-5 text-orange-400" />
                  <span>符合条件人数：</span>
                  <span className="text-green-300 font-bold">
                    {eligibleUsersCount}
                  </span>
                </div>
                <div className="mt-4 p-4 bg-yellow-400/20 border-2 border-yellow-400/50 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ 确认后开始10秒抽奖动画，动画结束后将自动抽取中奖者
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8"
            >
              确认开始
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

ConfirmDrawDialog.displayName = "ConfirmDrawDialog";
