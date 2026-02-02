import { Fragment } from 'react';
import { StatsDialog } from '../stats-dialog';
import { WinnersDialog } from '../winners-dialog';
import { ConfirmDrawDialog } from '../confirm-draw-dialog';
import { KeyboardHelpDialog } from '../keyboard-help-dialog';

interface DrawScreenDialogsProps {
  showStats: boolean;
  setShowStats: (show: boolean) => void;
  winnersDialogOpen: boolean;
  setWinnersDialogOpen: (open: boolean) => void;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  showKeyboardHelp: boolean;
  setShowKeyboardHelp: (show: boolean) => void;
  prizes: any[];
  users: any[];
  records: any[];
  selectedPrize: any;
  currentRoundWinners: string[];
}

/**
 * 抽奖屏幕所有弹窗组件
 */
export function DrawScreenDialogs({
  showStats,
  setShowStats,
  winnersDialogOpen,
  setWinnersDialogOpen,
  showConfirmDialog,
  setShowConfirmDialog,
  showKeyboardHelp,
  setShowKeyboardHelp,
  prizes,
  users,
  records,
  selectedPrize,
  currentRoundWinners,
}: DrawScreenDialogsProps) {
  return (
    <Fragment>
      <StatsDialog
        open={showStats}
        onOpenChange={setShowStats}
        prizes={prizes}
        users={users}
      />

      <WinnersDialog
        open={winnersDialogOpen}
        onOpenChange={setWinnersDialogOpen}
        prizeWinners={records}
        users={users}
        prizes={prizes}
      />

      <ConfirmDrawDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        prize={selectedPrize}
        onConfirm={() => {/* 由父组件处理 */}}
      />

      <KeyboardHelpDialog
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />
    </Fragment>
  );
}
