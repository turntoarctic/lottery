import { ReactNode } from 'react';

interface DrawScreenLayoutProps {
  sidebar: ReactNode;
  arena: ReactNode;
  floatingButtons: ReactNode;
  dialogs: ReactNode;
}

/**
 * 抽奖屏幕布局组件
 * 组合侧边栏、舞台、浮动按钮和弹窗
 */
export function DrawScreenLayout({
  sidebar,
  arena,
  floatingButtons,
  dialogs,
}: DrawScreenLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* 左侧奖品列表 */}
      {sidebar}

      {/* 右侧 3D 舞台 */}
      {arena}

      {/* 浮动按钮组 */}
      {floatingButtons}

      {/* 所有弹窗 */}
      {dialogs}
    </div>
  );
}
