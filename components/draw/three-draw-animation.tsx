"use client";

/**
 * 3D 球型抽奖动画 - 优雅版
 * 渐进式加速减速：慢速启动 → 加速 → 高速旋转 → 减速 → 停止
 * 聚光灯效果：随机高亮名字
 * 倒计时进度条
 */

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Stars,
  PerspectiveCamera,
  Billboard,
} from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NameSphereProps {
  names: string[];
  isDrawing: boolean;
  onHighlightChange?: (highlightedIndex: number) => void;
}

// 名字球体组件 - 优雅版（使用 Billboard 始终面向相机）
function NameSphere({ names, isDrawing, onHighlightChange }: NameSphereProps) {
  const groupRef = useRef<THREE.Group>(null);
  const drawStartTime = useRef<number>(0);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const lastHighlightTime = useRef(0);
  const highlightedIndexRef = useRef(-1);

  // 同步 ref 和 state
  useEffect(() => {
    highlightedIndexRef.current = highlightedIndex;
  }, [highlightedIndex]);

  useEffect(() => {
    if (isDrawing) {
      drawStartTime.current = Date.now();
      highlightedIndexRef.current = -1;
    }
  }, [isDrawing]);

  // 在 isDrawing 变化时重置高亮索引
  useEffect(() => {
    if (isDrawing && highlightedIndex !== -1) {
      // 使用 setTimeout 避免在 effect 中同步调用 setState
      const timer = setTimeout(() => {
        setHighlightedIndex(-1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isDrawing, highlightedIndex]);

  // 使用 useMemo 缓存位置计算
  const points = useMemo(() => {
    const phi = Math.PI * (3 - Math.sqrt(5));
    return names.map((name, i) => {
      const y = 1 - (i / (names.length - 1 || 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      return { x, y, z, name };
    });
  }, [names]);

  // 使用 useCallback 缓存回调
  const handleHighlightChange = useCallback((index: number) => {
    if (highlightedIndexRef.current !== index) {
      setHighlightedIndex(index);
      onHighlightChange?.(index);
    }
  }, [onHighlightChange]);

  useFrame(() => {
    if (!groupRef.current) return;

    if (isDrawing) {
      const elapsed = (Date.now() - drawStartTime.current) / 1000; // 秒

      // 渐进式速度曲线（简化计算）
      let speed;
      if (elapsed < 3) {
        const progress = elapsed / 3;
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        speed = 0.2 + eased * 2.8;
      } else if (elapsed < 7) {
        speed = 3;
      } else {
        const progress = (elapsed - 7) / 3;
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        speed = 3 - eased * 2.9;
      }

      // 应用旋转
      groupRef.current.rotation.y += speed * 0.016;
      groupRef.current.rotation.x += speed * 0.008;

      // 聚光灯效果：减少状态更新频率到500ms
      if (elapsed > 2 && elapsed < 9) {
        const now = Date.now();
        if (now - lastHighlightTime.current > 500) {
          lastHighlightTime.current = now;
          const randomIndex = Math.floor(Math.random() * names.length);
          handleHighlightChange(randomIndex);
        }
      } else if (highlightedIndexRef.current !== -1) {
        handleHighlightChange(-1);
      }
    } else {
      // 待机状态：缓慢旋转
      groupRef.current.rotation.y += 0.03 * 0.016;
      groupRef.current.rotation.x += 0.015 * 0.016;
      if (highlightedIndexRef.current !== -1) {
        handleHighlightChange(-1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {points.map((point, index) => {
        const isHighlighted = highlightedIndex === index;
        return (
          <Billboard
            key={index}
            position={[point.x * 4, point.y * 4, point.z * 4]}
          >
            {/* 移除Float组件以提升性能，改用简单的缩放动画 */}
            <group scale={isHighlighted ? 1.2 : 1}>
              {/* 背景卡片 */}
              <mesh position={[0, 0, -0.05]}>
                <planeGeometry
                  args={[isHighlighted ? 2 : 1.5, isHighlighted ? 0.6 : 0.5]}
                />
                <meshBasicMaterial
                  color={isHighlighted ? "#fbbf24" : "#a855f7"}
                  transparent
                  opacity={isHighlighted ? 0.25 : 0.15}
                />
              </mesh>
              {/* Text组件 - 减少outline宽度 */}
              <Text
                fontSize={isHighlighted ? 0.5 : 0.35}
                color={isHighlighted ? "#fbbf24" : "#ffffff"}
                anchorX="center"
                anchorY="middle"
                outlineWidth={isHighlighted ? 0.03 : 0.01} // 减少outline宽度
                outlineColor={isHighlighted ? "#f59e0b" : "#a855f7"}
                outlineOpacity={0.7}
              >
                {point.name}
              </Text>
            </group>
          </Billboard>
        );
      })}
    </group>
  );
}

// 内部发光球体 - 优化版（使用 useMemo 缓存）
function InnerGlowSphere({ isDrawing }: { isDrawing: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const speed = isDrawing ? 0.3 : 0.1; // 进一步降低速度
      meshRef.current.rotation.x = state.clock.elapsedTime * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 1.3;
    }

    // 更新材质属性
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = isDrawing ? 0.8 : 0.5;
      materialRef.current.opacity = isDrawing ? 0.4 : 0.3;
    }
  });

  // 使用 useMemo 缓存几何体和材质
  const { geometry, material } = useMemo(() => {
    return {
      geometry: new THREE.SphereGeometry(2.5, 20, 20), // 从24减少到20
      material: new THREE.MeshStandardMaterial({
        color: "#8b5cf6",
        emissive: "#8b5cf6",
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.3,
        wireframe: true,
      }),
    };
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} />
    </mesh>
  );
}

// 外部光环 - 优化版（使用 useMemo 缓存）
function OuterGlowRing({ isDrawing }: { isDrawing: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const speed = isDrawing ? 0.8 : 0.2; // 进一步降低速度
      const scale = 1 + Math.sin(state.clock.elapsedTime * (isDrawing ? 2 : 1)) * 0.06;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.z = state.clock.elapsedTime * speed;
    }

    // 更新材质透明度
    if (materialRef.current) {
      materialRef.current.opacity = isDrawing ? 0.6 : 0.4;
    }
  });

  // 使用 useMemo 缓存几何体和材质
  const { geometry, material } = useMemo(() => {
    return {
      geometry: new THREE.RingGeometry(4.5, 4.7, 40), // 从48减少到40
      material: new THREE.MeshBasicMaterial({
        color: "#ec4899",
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      }),
    };
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[Math.PI / 2, 0, 0]}>
      <primitive object={material} ref={materialRef} />
    </mesh>
  );
}

// 粒子环 - 优化版（使用 useMemo 缓存几何体）
function ParticleRing({ isDrawing }: { isDrawing: boolean }) {
  const points = useRef<THREE.Points>(null);
  const particlesCount = 400;

  // 使用 useMemo 缓存粒子位置和颜色（使用确定性计算）
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    // 使用索引生成确定性但看起来随机的分布
    for (let i = 0; i < particlesCount; i++) {
      // 使用索引和质数生成确定性值
      const theta = ((i * 137) % 1000) / 1000 * Math.PI * 2;
      const phi = Math.acos((((i * 97) % 1000) / 1000) * 2 - 1);
      const r = 5 + (((i * 251) % 100) / 100) * 1;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // 确定性颜色选择
      const colorChoice = i % 3;
      if (colorChoice === 0) {
        colors[i * 3] = 0.69;
        colors[i * 3 + 1] = 0.33;
        colors[i * 3 + 2] = 0.97;
      } else if (colorChoice === 1) {
        colors[i * 3] = 0.93;
        colors[i * 3 + 1] = 0.27;
        colors[i * 3 + 2] = 0.6;
      } else {
        colors[i * 3] = 0.27;
        colors[i * 3 + 1] = 0.53;
        colors[i * 3 + 2] = 0.97;
      }
    }
    return { positions, colors };
  }, [particlesCount]);

  useFrame((state) => {
    if (points.current) {
      const speed = isDrawing ? 0.3 : 0.1; // 进一步降低速度
      points.current.rotation.y = state.clock.elapsedTime * speed;
      points.current.rotation.x = state.clock.elapsedTime * 0.02;
    }
  });

  // 使用 useMemo 缓存几何体
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={isDrawing ? 0.08 : 0.05}
        transparent
        opacity={0.8}
        sizeAttenuation
        vertexColors
      />
    </points>
  );
}

// 上升气泡效果 - 优化版（使用 useMemo 缓存）
function RisingBubbles({ isDrawing }: { isDrawing: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  // 使用 useMemo 缓存气泡位置（使用确定性种子）
  const bubbles = useMemo(() => {
    // 使用索引生成确定性位置，完全避免随机数
    return Array.from({ length: 8 }, (_, i) => {
      // 使用索引和质数生成确定性但看起来随机的值
      const theta = ((i * 137) % 256) / 256 * Math.PI * 2;
      const r = ((i * 97) % 100) / 100 * 6;
      const y = (((i * 251) % 200) - 100) / 100 * 5;

      return {
        position: [
          Math.cos(theta) * r,
          y,
          Math.sin(theta) * r,
        ] as [number, number, number],
      };
    });
  }, []);

  // 使用 useMemo 缓存几何体和材质
  const { geometry, material } = useMemo(() => {
    return {
      geometry: new THREE.SphereGeometry(0.06, 6, 6),
      material: new THREE.MeshBasicMaterial({
        color: "#fbbf24",
        transparent: true,
        opacity: 0.6,
      }),
    };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const speedMultiplier = isDrawing ? 1.2 : 0.6; // 进一步降低速度
      groupRef.current.children.forEach((child, i) => {
        const bubble = child as THREE.Mesh;
        const speed = (0.3 + i * 0.06) * speedMultiplier;
        bubble.position.y =
          ((state.clock.elapsedTime * speed + i * 2) % 10) - 5;
        const scale = 1 + Math.sin(state.clock.elapsedTime * 1.2 + i) * 0.15;
        bubble.scale.setScalar(scale);

        // 更新材质透明度
        if (bubble.material instanceof THREE.MeshBasicMaterial) {
          bubble.material.opacity = isDrawing ? 0.6 : 0.4;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {bubbles.map((bubble, i) => (
        <mesh key={i} position={bubble.position} geometry={geometry} material={material} />
      ))}
    </group>
  );
}

// 倒计时进度条（使用 React hooks，不在 Canvas 内）
function CountdownProgress({ isDrawing }: { isDrawing: boolean }) {
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState(10);
  const startTime = useRef<number>(0);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isDrawing) {
      startTime.current = Date.now();

      let isCancelled = false;

      const updateProgress = () => {
        if (isCancelled) return;

        const elapsed = (Date.now() - startTime.current) / 1000;
        const newProgress = Math.min((elapsed / 10) * 100, 100);
        const newRemaining = Math.max(0, 10 - elapsed);

        // 批量更新状态
        setProgress(newProgress);
        setRemaining(newRemaining);

        if (elapsed < 10) {
          requestRef.current = requestAnimationFrame(updateProgress);
        }
      };

      requestRef.current = requestAnimationFrame(updateProgress);

      return () => {
        isCancelled = true;
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
    } else {
      // 延迟重置,避免在 effect 中同步调用 setState
      const resetTimer = setTimeout(() => {
        setProgress(0);
        setRemaining(10);
      }, 0);

      return () => clearTimeout(resetTimer);
    }
  }, [isDrawing]);

  if (!isDrawing) return null;

  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-black/50 backdrop-blur-xl rounded-full px-8 py-4 border-2 border-yellow-400/50">
        <div className="text-center mb-2">
          <span className="text-2xl font-bold text-yellow-400 drop-shadow-lg">
            抽奖进行中...
          </span>
        </div>
        <div className="w-80 h-3 bg-white/20 rounded-full overflow-hidden border border-white/30">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full transition-all duration-100 ease-linear relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="text-sm text-yellow-200">
            {remaining.toFixed(1)} 秒
          </span>
        </div>
      </div>
    </div>
  );
}

interface ThreeDrawAnimationProps {
  names: string[];
  isDrawing: boolean;
  winners?: string[];
  onClose?: () => void;
}

export function ThreeDrawAnimation({
  names,
  isDrawing,
  winners,
  onClose,
}: ThreeDrawAnimationProps) {
  const [highlightedName, setHighlightedName] = useState("");

  // 使用 useCallback 缓存回调
  const handleHighlightChange = useCallback((index: number) => {
    if (index >= 0 && index < names.length) {
      setHighlightedName(names[index]);
    } else {
      setHighlightedName("");
    }
  }, [names]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        dpr={[1, 1.5]} // 降低 DPR 范围
        performance={{ min: 0.4 }} // 降低最小性能阈值
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />

        {/* 环境光 - 减少光源数量 */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.0} color="#ffffff" />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.6}
          color="#ec4899"
        />

        {/* 星空背景 - 减少数量 */}
        <Stars
          radius={150}
          depth={60}
          count={3000} // 从4000减少到3000
          factor={4}
          saturation={0}
          fade
          speed={0.4} // 降低速度
        />

        {/* 名字球体 */}
        <NameSphere
          names={names}
          isDrawing={isDrawing}
          onHighlightChange={handleHighlightChange}
        />

        {/* 内部发光球体 */}
        <InnerGlowSphere isDrawing={isDrawing} />

        {/* 外部光环 */}
        <OuterGlowRing isDrawing={isDrawing} />

        {/* 粒子环 */}
        <ParticleRing isDrawing={isDrawing} />

        {/* 上升气泡 */}
        <RisingBubbles isDrawing={isDrawing} />
      </Canvas>

      {/* 倒计时进度条 */}
      <CountdownProgress isDrawing={isDrawing} />

      {/* 聚光灯显示 */}
      {isDrawing && highlightedName && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/70 backdrop-blur-xl rounded-2xl px-12 py-6 border-3 border-yellow-400/60 shadow-2xl shadow-yellow-400/30">
            <div className="text-center">
              <div className="text-sm text-yellow-200 mb-2">聚光灯</div>
              <div className="text-5xl font-bold text-yellow-400 drop-shadow-lg animate-pulse">
                {highlightedName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 中奖结果 Modal 弹窗 */}
      {winners && winners.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" />

          {/* Modal 内容卡片 */}
          <div className="relative z-10 w-full max-w-6xl mx-4 animate-in zoom-in-95 duration-500">
            <div className="bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-2xl rounded-3xl border-4 border-yellow-400/50 shadow-2xl shadow-yellow-400/30 overflow-hidden">
              {/* 顶部装饰栏 */}
              <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500" />

              {/* 关闭按钮 */}
              {onClose && (
                <div className="absolute top-4 right-4 z-20">
                  <Button
                    onClick={onClose}
                    size="lg"
                    variant="outline"
                    className="gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-xl border-2 border-white/30 hover:border-white/50 px-6 py-6 rounded-full shadow-xl text-white"
                  >
                    <X className="h-6 w-6 text-white" />
                      <span className="text-white">关闭</span>
                  </Button>
                </div>
              )}

              {/* Modal 内容 */}
              <div className="p-12 text-center">
                {/* 烟花效果背景 - 使用静态预计算位置 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 30 }, (_, i) => {
                    // 使用索引生成确定性位置，避免 Math.random
                    const left = ((i * 137) % 100);
                    const top = ((i * 251) % 100);
                    const delay = ((i * 73) % 2000);
                    const duration = 1000 + ((i * 97) % 1000);
                    return (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          animationDelay: `${delay}ms`,
                          animationDuration: `${duration}ms`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* 奖杯图标 */}
                <div className="mb-6 relative">
                  <div className="inline-block relative">
                    <div className="absolute inset-0 bg-yellow-400 blur-3xl animate-pulse"></div>
                    <div className="text-9xl relative z-10">🏆</div>
                  </div>
                </div>

                {/* 标题 */}
                <h2 className="text-7xl font-bold mb-12 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
                  恭喜中奖
                </h2>

                {/* 中奖者卡片网格 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                  {winners.map((winner, index) => (
                    <div
                      key={index}
                      className="group relative"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      {/* 发光背景 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-orange-500/30 to-pink-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />

                      <div className="relative bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-xl rounded-2xl border-3 border-yellow-400/60 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:scale-105 transition-transform">
                        {/* 序号 */}
                        <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-lg font-bold text-black shadow-lg">
                          {index + 1}
                        </div>

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

              {/* 底部装饰栏 */}
              <div className="h-2 bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
