import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ThreeErrorBoundary } from '../3d-error-boundary';
import { ThreeFallback } from '../three-fallback';

// 懒加载 3D 组件
const ThreeDrawAnimation = dynamic(
  () => import('../three-draw-animation-fixed').then((mod) => ({
    default: mod.ThreeDrawAnimationFixed,
  })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <Loader2 className="h-20 w-20 animate-spin text-yellow-400 mx-auto mb-8 drop-shadow-[0_0_30px_rgba(250,204,21,1)]" />
          <p className="text-2xl text-purple-200">正在加载 3D 场景...</p>
          <p className="text-sm text-purple-400 mt-2">首次加载可能需要几秒钟</p>
        </div>
      </div>
    ),
  }
);

interface DrawingArenaProps {
  users: string[];
  isDrawing: boolean;
  winners: string[];
}

/**
 * 抽奖主舞台组件
 * 显示 3D 动画或回退动画
 */
export function DrawingArena({ users, isDrawing, winners }: DrawingArenaProps) {
  return (
    <Card className="flex-1 overflow-hidden border-0 shadow-2xl">
      <ThreeErrorBoundary
        fallbackProps={{
          names: users,
          isDrawing,
          winners,
        }}
      >
        <ThreeDrawAnimation
          names={users}
          isDrawing={isDrawing}
          winners={winners}
        />
      </ThreeErrorBoundary>
    </Card>
  );
}
