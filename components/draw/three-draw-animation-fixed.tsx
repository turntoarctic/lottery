"use client";

/**
 * 3D 抽奖动画 - 修复版
 * 增强的抽奖效果
 */

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, X, Trophy } from "lucide-react";

export interface ThreeDrawAnimationProps {
  names: string[];
  isDrawing: boolean;
  winners?: string[];
  onClose?: () => void;
}

interface NameSphereProps {
  names: string[];
  isDrawing: boolean;
  onHighlightChange?: (index: number) => void;
}

// 增强的名字球体组件 - 支持随机高亮
function SimpleNameSphere({ names, isDrawing, onHighlightChange }: NameSphereProps) {
  const groupRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);
  const highlightIndexRef = useRef(-1);
  const lastHighlightTime = useRef(0);

  useFrame(() => {
    if (groupRef.current) {
      // 抽奖时加速旋转
      const speed = isDrawing ? 0.05 : 0.002; // 增加旋转速度
      rotationRef.current += speed;
      groupRef.current.rotation.y = rotationRef.current;

      // 抽奖时随机高亮名字
      if (isDrawing) {
        const now = Date.now();
        // 每 150ms 切换一次高亮 (加快切换频率)
        if (now - lastHighlightTime.current > 150) {
          lastHighlightTime.current = now;
          const newIndex = Math.floor(Math.random() * names.length);
          highlightIndexRef.current = newIndex;
          onHighlightChange?.(newIndex);
        }
      } else {
        highlightIndexRef.current = -1;
        onHighlightChange?.(-1);
      }
    }
  });

  // 只显示前 50 个名字以减少负载
  const displayNames = names.slice(0, 50);

  return (
    <group ref={groupRef}>
      {displayNames.map((name, i) => {
        // 使用斐波那契球形分布
        const phi = Math.acos(-1 + (2 * i) / displayNames.length);
        const theta = Math.sqrt(displayNames.length * Math.PI) * phi;
        const r = 6;
        const x = r * Math.cos(theta) * Math.sin(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(phi);

        const isHighlighted = highlightIndexRef.current === i;

        return (
          <Text
            key={i}
            position={[x, y, z]}
            fontSize={isHighlighted ? 0.6 : 0.3} // 高亮时放大
            color={isHighlighted ? "#FFD700" : "#ffffff"} // 高亮时金色
            anchorX="center"
            anchorY="middle"
          >
            {name}
          </Text>
        );
      })}
    </group>
  );
}

// 3D 场景内容 - 延迟加载
function SceneContent({ names, isDrawing, onHighlightChange }: {
  names: string[];
  isDrawing: boolean;
  onHighlightChange?: (index: number) => void;
}) {
  // 使用 null 作为初始值,延迟渲染
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 延迟 500ms 再渲染,给 WebGL 上下文初始化时间
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={!isDrawing}
        autoRotateSpeed={isDrawing ? 2 : 0.5}
      />

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />

      {/* 大幅减少星星数量 */}
      <Stars
        radius={100}
        depth={50}
        count={500}
        factor={4}
        saturation={0}
        fade
        speed={isDrawing ? 2 : 0.3}
      />

      <Suspense fallback={null}>
        <SimpleNameSphere
          names={names}
          isDrawing={isDrawing}
          onHighlightChange={onHighlightChange}
        />
      </Suspense>
    </>
  );
}

export function ThreeDrawAnimationFixed({
  names,
  isDrawing,
  winners,
  onClose,
}: ThreeDrawAnimationProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [highlightedName, setHighlightedName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 处理高亮变化
  const handleHighlightChange = useCallback((index: number) => {
    if (index >= 0 && index < names.length) {
      setHighlightedName(names[index]);
    } else {
      setHighlightedName("");
    }
  }, [names]);

  useEffect(() => {
    // 检测 WebGL 支持
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        console.error('WebGL 不支持');
        setHasError(true);
        return;
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('WebGL 初始化失败:', error);
      setHasError(true);
    }
  }, []);

  // 如果 WebGL 不支持,显示错误
  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-white mb-4">3D 渲染不可用</h2>
          <p className="text-lg text-purple-200">
            您的设备不支持 WebGL,已自动切换到简化模式
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* 加载状态 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 z-10">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-yellow-400 mx-auto mb-4" />
            <p className="text-xl text-purple-200">正在初始化 3D 场景...</p>
          </div>
        </div>
      )}

      {/* 3D Canvas - 添加错误边界 */}
      {isLoaded && (
        <Canvas
          ref={canvasRef}
          dpr={[1, 1]} // 降低 DPR
          gl={{
            antialias: false, // 禁用抗锯齿以提升性能
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false, // 即使性能不佳也不失败
          }}
          onCreated={({ gl }) => {
            // 捕获 WebGL 上下文丢失事件
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.error('WebGL context lost');
              setHasError(true);
            }, false);

            // 监听上下文恢复
            gl.domElement.addEventListener('webglcontextrestored', () => {
              console.log('WebGL context restored');
              setHasError(false);
            }, false);
          }}
        >
          <Suspense fallback={null}>
            <SceneContent
              names={names}
              isDrawing={isDrawing}
              onHighlightChange={handleHighlightChange}
            />
          </Suspense>
        </Canvas>
      )}

      {/* 抽奖时的聚光灯效果 - 显示当前高亮的名字 */}
      {isDrawing && highlightedName && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/70 backdrop-blur-xl rounded-2xl px-12 py-6 border-3 border-yellow-400/60 shadow-2xl shadow-yellow-400/30 animate-pulse">
            <div className="text-center">
              <div className="text-sm text-yellow-200 mb-2">正在抽奖...</div>
              <div className="text-5xl font-bold text-yellow-400 drop-shadow-lg">
                {highlightedName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 中奖结果覆盖层 - 使用纯 HTML/CSS */}
      {winners && winners.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-xl">
          <div className="text-center max-w-5xl mx-auto px-8 relative">
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
            >
              <X className="h-6 w-6" />
            </button>

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
          </div>
        </div>
      )}
    </div>
  );
}
