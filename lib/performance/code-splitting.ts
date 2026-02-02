/**
 * 性能优化配置
 * 代码分割和懒加载策略
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// 通用加载状态组件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// 3D 动画组件 - 懒加载
export const ThreeDrawAnimation = dynamic(
  () => import('@/components/draw/three-draw-animation-fixed').then(mod => ({
    default: mod.ThreeDrawAnimationFixed
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

// 管理后台图表 - 懒加载
export const DashboardChart = dynamic(
  () => import('@/components/admin/DashboardChart'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

// Excel 导入组件 - 懒加载
export const ExcelImportButton = dynamic(
  () => import('@/components/admin/ExcelImportButton'),
  {
    loading: () => <button className="btn">加载中...</button>,
  }
);

// 统计面板 - 懒加载
export const StatsPanel = dynamic(
  () => import('@/components/draw/stats-dialog').then(mod => ({ default: mod.StatsDialog })),
  {
    loading: LoadingSpinner,
  }
);

// 中奖名单弹窗 - 懒加载
export const WinnersListModal = dynamic(
  () => import('@/components/draw/winners-dialog').then(mod => ({ default: mod.WinnersDialog })),
  {
    loading: LoadingSpinner,
  }
);
