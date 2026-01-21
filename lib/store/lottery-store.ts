import { create } from 'zustand';
import type { Prize, User, Rule, Theme, DrawRecord } from '@/app/types';

interface LotteryState {
  // 数据状态
  prizes: Prize[];
  users: User[];
  prizeWinners: Record<string, string[]>;
  rule: Rule | null;
  theme: Theme | null;

  // UI 状态
  selectedPrize: Prize | null;
  isDrawing: boolean;
  currentRoundWinners: string[];
  showResult: boolean;
  isLoading: boolean;
  soundEnabled: boolean;
  showStats: boolean;
  showConfirmDialog: boolean;
  showKeyboardHelp: boolean;
  winnersDialogOpen: boolean;

  // Actions
  setPrizes: (prizes: Prize[]) => void;
  setUsers: (users: User[]) => void;
  setPrizeWinners: (winners: Record<string, string[]>) => void;
  setRule: (rule: Rule | null) => void;
  setTheme: (theme: Theme | null) => void;

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
  updatePrize: (prizeId: string, updates: Partial<Prize>) => void;
}

/**
 * 抽奖系统全局状态管理
 * 使用 Zustand 管理抽奖相关的所有状态
 */
export const useLotteryStore = create<LotteryState>((set) => ({
  // 初始状态
  prizes: [],
  users: [],
  prizeWinners: {},
  rule: null,
  theme: null,
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
  setPrizes: (prizes) => set({ prizes }),
  setUsers: (users) => set({ users }),
  setPrizeWinners: (prizeWinners) => set({ prizeWinners }),
  setRule: (rule) => set({ rule }),
  setTheme: (theme) => set({ theme }),
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

  updatePrize: (prizeId, updates) =>
    set((state) => ({
      prizes: state.prizes.map((p) =>
        p.id === prizeId ? { ...p, ...updates } : p
      ),
      selectedPrize:
        state.selectedPrize?.id === prizeId
          ? { ...state.selectedPrize, ...updates }
          : state.selectedPrize,
    })),
}));
