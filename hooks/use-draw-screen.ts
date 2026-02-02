import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePrizes, useUsers, useRule, useThemes, useDrawRecords, useDrawPrize } from '@/lib/api/use-lottery-api';
import { useLotteryUIStore } from '@/lib/store/lottery-ui-store';
import { useDrawDataSync } from './use-draw-data-sync';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';
import { toast } from 'sonner';

/**
 * 抽奖屏幕主 Hook
 * 整合所有数据和逻辑
 */
export function useDrawScreen() {
  // React Query - 数据管理
  const { data: prizes = [], isLoading: prizesLoading } = usePrizes();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: rule } = useRule();
  const { data: themes = [] } = useThemes();
  const { data: records = [] } = useDrawRecords();
  const drawMutation = useDrawPrize();

  // UI 状态
  const {
    selectedPrize,
    setSelectedPrize,
    isDrawing,
    setIsDrawing,
    currentRoundWinners,
    setCurrentRoundWinners,
    showResult,
    setShowResult,
    isLoading,
    setIsLoading,
    soundEnabled,
    showStats,
    setShowStats,
    showConfirmDialog,
    setShowConfirmDialog,
    showKeyboardHelp,
    setShowKeyboardHelp,
    winnersDialogOpen,
    setWinnersDialogOpen,
    resetDrawState,
    toggleSound,
  } = useLotteryUIStore();

  // 计算属性
  const availablePrizes = useMemo(() => {
    return prizes.filter((p) => p.remainingCount > 0);
  }, [prizes]);

  const eligibleUsers = useMemo(() => {
    if (!rule) return users;
    return rule.allowRepeatWin ? users : users.filter((u) => !u.hasWon);
  }, [users, rule]);

  const prizeWinners = useMemo(() => {
    const winners: Record<string, string[]> = {};
    records.forEach((record) => {
      if (!winners[record.prizeId]) {
        winners[record.prizeId] = [];
      }
      winners[record.prizeId].push(record.userName);
    });
    return winners;
  }, [records]);

  // 数据加载完成
  useEffect(() => {
    if (!prizesLoading && !usersLoading) {
      setIsLoading(false);
    }
  }, [prizesLoading, usersLoading, setIsLoading]);

  // 数据同步
  useDrawDataSync(() => {
    // 触发所有数据重新获取
    window.location.reload();
  });

  // 键盘快捷键
  useKeyboardShortcuts({
    onDraw: () => handleStartDraw(),
    onCancel: () => {
      if (showConfirmDialog) {
        setShowConfirmDialog(false);
      } else if (showResult) {
        setShowResult(false);
        resetDrawState();
      }
    },
    onToggleSound: toggleSound,
    onShowHelp: () => setShowKeyboardHelp(true),
    enabled: !isDrawing,
  });

  // 抽奖逻辑
  const handleStartDraw = () => {
    if (!selectedPrize) {
      toast.error('请先选择奖品');
      return;
    }

    if (selectedPrize.remainingCount < 1) {
      toast.error('该奖品已抽完');
      return;
    }

    if (eligibleUsers.length < 1) {
      toast.error('没有符合条件的中奖者');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmDraw = async () => {
    if (!selectedPrize) return;

    setShowConfirmDialog(false);
    setIsDrawing(true);

    try {
      const result = await drawMutation.mutateAsync(selectedPrize.id);

      if (result.success) {
        setCurrentRoundWinners(result.winners);
        setShowResult(true);
        toast.success(`恭喜 ${result.winners.length} 位中奖者！`);
      }
    } catch (error) {
      console.error('抽奖失败:', error);
      toast.error('抽奖失败，请重试');
    } finally {
      setIsDrawing(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setWinnersDialogOpen(true);
    resetDrawState();
  };

  return {
    // 数据
    prizes,
    users,
    rule,
    themes,
    records,
    availablePrizes,
    eligibleUsers,
    prizeWinners,

    // UI 状态
    selectedPrize,
    isDrawing,
    currentRoundWinners,
    showResult,
    isLoading,
    soundEnabled,
    showStats,
    showConfirmDialog,
    showKeyboardHelp,
    winnersDialogOpen,

    // Actions
    setSelectedPrize,
    setShowStats,
    setShowConfirmDialog,
    setShowKeyboardHelp,
    setWinnersDialogOpen,
    toggleSound,
    handleStartDraw,
    handleConfirmDraw,
    handleCloseResult,
  };
}
