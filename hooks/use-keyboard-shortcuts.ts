import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onDraw?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onShowStats?: () => void;
  onShowHelp?: () => void;
  onToggleSound?: () => void;
  enabled?: boolean;
}

/**
 * 键盘快捷键 Hook
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  const {
    onDraw,
    onConfirm,
    onCancel,
    onShowStats,
    onShowHelp,
    onToggleSound,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果用户正在输入，不触发快捷键
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          onDraw?.();
          break;
        case 'Escape':
          e.preventDefault();
          onCancel?.();
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleSound?.();
          }
          break;
        case '?':
          e.preventDefault();
          onShowHelp?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onDraw, onCancel, onToggleSound, onShowHelp]);
}
