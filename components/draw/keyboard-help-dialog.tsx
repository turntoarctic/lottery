"use client";

import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

interface KeyboardHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 快捷键帮助对话框组件
 */
export const KeyboardHelpDialog = memo<KeyboardHelpDialogProps>(
  ({ open, onOpenChange }) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-2xl border-4 border-purple-400/50 shadow-2xl shadow-purple-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-purple-300">
              <Info className="h-8 w-8" />
              快捷键帮助
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <ShortcutItem keys={["空格"]} description="开始抽奖" />
            <ShortcutItem keys={["ESC"]} description="关闭弹窗" />
            <ShortcutItem keys={["S"]} description="统计面板" />
            <ShortcutItem keys={["R"]} description="刷新数据" />
            <ShortcutItem keys={["M"]} description="切换音效" />
            <ShortcutItem
              keys={["1", "2", "3", "..."]}
              description="快速选择奖品"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

KeyboardHelpDialog.displayName = "KeyboardHelpDialog";

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

/**
 * 单个快捷键说明项
 */
const ShortcutItem = memo<ShortcutItemProps>(({ keys, description }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {keys.map((key) => (
            <kbd
              key={key}
              className="px-3 py-1 bg-white/20 rounded-md text-sm font-mono"
            >
              {key}
            </kbd>
          ))}
        </div>
        <span className="text-purple-200">{description}</span>
      </div>
    </div>
  );
});

ShortcutItem.displayName = "ShortcutItem";
