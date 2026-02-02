import { create } from 'zustand';
import type { Prize } from '@/app/types';

/**
 * 抽奖系统 UI 状态管理 (仅 UI 状态,不包含数据)
 * 数据状态由 React Query 管理 (see: lib/api/use-lottery-api.ts)
 */
interface LotteryUIState {
  // 选中状态
  selectedPrizeId: string | null;
  selectedPrize: Prize | null;

  // 抽奖流程状态
  isDrawing: boolean;
  currentRoundWinners: string[];
  showResult: boolean;

  // UI 显隐状态
  isLoading: boolean;
  soundEnabled: boolean;
  showStats: boolean;
  showConfirmDialog: boolean;
  showKeyboardHelp: boolean;
  winnersDialogOpen: boolean;

  // Actions
  setSelectedPrizeId: (prizeId: string | null) => void;
  setSelectedPrize: (prize: Prize | null) => void;

  setIsDrawing: (isDrawing: boolean) => void;
  setCurrentRoundWinners: (winners: string[]) => void;
  setShowResult: (show: boolean) => void;

  setIsLoading: (loading: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setShowStats: (show: boolean) => void;
  setShowConfirmDialog: (show: boolean) => void;
  setShowKeyboardHelp: (show: boolean) => void;
  setWinnersDialogOpen: (open: boolean) => void;

  // 复合操作
  resetDrawState: () => void;
  toggleSound: () => void;
}

export const useLotteryUIStore = create<LotteryUIState>((set) => ({
  // 初始状态
  selectedPrizeId: null,
  selectedPrize: null,
  isDrawing: false,
  currentRoundWinners: [],
  showResult: false,
  isLoading: true,
  soundEnabled: true,
  showStats: false,
  showConfirmDialog: false,
  showKeyboardHelp: false,
  winnersDialogOpen: false,

  // Setters
  setSelectedPrizeId: (selectedPrizeId) => set({ selectedPrizeId }),
  setSelectedPrize: (selectedPrize) => set({ selectedPrize }),

  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setCurrentRoundWinners: (currentRoundWinners) => set({ currentRoundWinners }),
  setShowResult: (showResult) => set({ showResult }),

  setIsLoading: (isLoading) => set({ isLoading }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setShowStats: (showStats) => set({ showStats }),
  setShowConfirmDialog: (showConfirmDialog) => set({ showConfirmDialog }),
  setShowKeyboardHelp: (showKeyboardHelp) => set({ showKeyboardHelp }),
  setWinnersDialogOpen: (winnersDialogOpen) => set({ winnersDialogOpen }),

  // 复合操作
  resetDrawState: () =>
    set({
      currentRoundWinners: [],
      showResult: false,
      isDrawing: false,
    }),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));
