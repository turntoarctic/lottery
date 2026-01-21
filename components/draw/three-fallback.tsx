"use client";

/**
 * 3D 组件的降级版本 - 使用纯 CSS 动画
 * 当 Three.js 加载失败或性能不足时使用
 */

import { useEffect, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import type { ThreeDrawAnimationProps } from "./three-draw-animation-fixed";

export function ThreeFallback({
  names,
  isDrawing,
  winners,
  onClose,
}: ThreeDrawAnimationProps) {
  const [rotatingNames, setRotatingNames] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isDrawing && names.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= names.length) {
            // 打乱顺序重新开始
            const shuffled = [...names].sort(() => Math.random() - 0.5);
            setRotatingNames(shuffled);
            return 0;
          }
          return next;
        });
      }, 100); // 每 100ms 切换一个名字

      setRotatingNames(names);

      return () => clearInterval(interval);
    }
  }, [isDrawing, names]);

  const displayName = isDrawing
    ? rotatingNames[currentIndex] || ""
    : winners && winners.length > 0
    ? ""
    : "准备抽奖";

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      {/* 背景动画 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse bg-purple-500/30" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse bg-pink-500/30" />
      </div>

      {/* 抽奖中的状态 */}
      {isDrawing && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="h-32 w-32 animate-spin text-yellow-400 mx-auto mb-8 drop-shadow-[0_0_30px_rgba(250,204,21,1)]" />
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 blur-3xl animate-pulse" />
              <h1 className="relative text-9xl font-bold text-white mb-4 drop-shadow-2xl">
                {displayName}
              </h1>
            </div>
            <p className="text-3xl text-purple-200 mt-8">抽奖中...</p>
          </div>
        </div>
      )}

      {/* 中奖结果 */}
      {winners && winners.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 backdrop-blur-xl">
          <div className="text-center max-w-5xl mx-auto px-8">
            <Trophy className="h-32 w-32 text-yellow-400 mx-auto mb-8 animate-bounce drop-shadow-[0_0_30px_rgba(250,204,21,1)]" />

            <h2 className="text-7xl font-bold mb-12 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl">
              恭喜中奖
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {winners.map((winner, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-xl rounded-2xl border-3 border-yellow-400/60 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-orange-500/30 to-pink-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />

                  <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-lg font-bold text-black shadow-lg">
                    {index + 1}
                  </div>

                  <div className="relative z-10">
                    <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                      {winner}
                    </div>
                    <div className="text-base text-yellow-200">中奖者</div>
                    <div className="mt-3 text-5xl">🎉</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-xl rounded-lg shadow-2xl hover:scale-105 transition-all duration-300"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 初始状态 */}
      {!isDrawing && (!winners || winners.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-9xl mb-8">🎁</div>
            <h3 className="text-4xl font-bold text-purple-200 mb-4">
              {names.length} 位候选人
            </h3>
            <p className="text-xl text-purple-300">选择奖品后点击开始抽奖</p>
          </div>
        </div>
      )}
    </div>
  );
}
