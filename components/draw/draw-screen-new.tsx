"use client";

/**
 * 年会抽奖大屏 - 重构版
 * 使用组合模式和自定义 Hooks,代码更清晰,更易维护
 */

import { PrizeListSidebar } from './prize-list-sidebar';
import { FloatingButtons } from './floating-buttons';
import { DrawScreenLayout } from './draw-screen/DrawScreenLayout';
import { DrawingArena } from './draw-screen/DrawingArena';
import { DrawScreenDialogs } from './draw-screen/DrawScreenDialogs';
import { useDrawScreen } from '@/hooks/use-draw-screen';
import type { Prize, User, Rule, Theme, DrawRecord } from '@/app/types';

export function DrawScreenNew() {
  const {
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
  } = useDrawScreen();

  // 当前主题
  const currentTheme = themes.find((t: Theme) => t.isActive) || themes[0] || null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent mx-auto mb-8 drop-shadow-[0_0_30px_rgba(250,204,21,1)]" />
          <p className="text-2xl text-purple-200">正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <DrawScreenLayout
      sidebar={
        <PrizeListSidebar
          prizes={availablePrizes}
          selectedPrize={selectedPrize}
          prizeWinners={prizeWinners}
          onSelectPrize={setSelectedPrize}
          onRefresh={() => window.location.reload()}
          onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
          isDrawing={isDrawing}
        />
      }
      arena={
        <DrawingArena
          users={eligibleUsers.map((u) => u.name)}
          isDrawing={isDrawing}
          winners={currentRoundWinners}
        />
      }
      floatingButtons={
        <FloatingButtons
          theme={currentTheme}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onToggleStats={() => setShowStats(!showStats)}
        />
      }
      dialogs={
        <DrawScreenDialogs
          showStats={showStats}
          setShowStats={setShowStats}
          winnersDialogOpen={winnersDialogOpen}
          setWinnersDialogOpen={setWinnersDialogOpen}
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          showKeyboardHelp={showKeyboardHelp}
          setShowKeyboardHelp={setShowKeyboardHelp}
          prizes={prizes}
          users={users}
          records={records}
          selectedPrize={selectedPrize}
          currentRoundWinners={currentRoundWinners}
        />
      }
    />
  );
}
