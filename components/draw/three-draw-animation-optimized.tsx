'use client';

/**
 * 3D 球型抽奖动画 - 性能优化版
 * 针对低端电脑优化，减少粒子数量、几何体复杂度
 * 添加性能自适应机制
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars, PerspectiveCamera, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { X, Cpu } from 'lucide-react';

// 性能配置
const PERFORMANCE_CONFIG = {
  low: {
    particlesCount: 300,
    starsCount: 2000,
    sphereSegments: 16,
    ringSegments: 32,
    bubbleCount: 8,
    textOutlineWidth: 0.01,
    maxVisibleNames: 30, // 最多显示30个名字
  },
  medium: {
    particlesCount: 600,
    starsCount: 4000,
    sphereSegments: 24,
    ringSegments: 48,
    bubbleCount: 15,
    textOutlineWidth: 0.02,
    maxVisibleNames: 50,
  },
  high: {
    particlesCount: 1000,
    starsCount: 6000,
    sphereSegments: 32,
    ringSegments: 64,
    bubbleCount: 20,
    textOutlineWidth: 0.03,
    maxVisibleNames: 100,
  },
};

// 检测设备性能
function detectPerformance(): 'low' | 'medium' | 'high' {
  if (typeof window === 'undefined') return 'medium';

  // 检测硬件并发数
  const cores = navigator.hardwareConcurrency || 2;

  // 检测设备内存
  const memory = (navigator as any).deviceMemory || 4;

  // 检测屏幕分辨率
  const pixelRatio = window.devicePixelRatio;

  // 综合评分
  let score = 0;
  if (cores >= 8) score += 3;
  else if (cores >= 4) score += 2;
  else score += 1;

  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else score += 1;

  if (pixelRatio <= 1.5) score += 2;
  else if (pixelRatio <= 2) score += 1;

  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

interface NameSphereProps {
  names: string[];
  isDrawing: boolean;
  config: typeof PERFORMANCE_CONFIG.low;
  onHighlightChange?: (highlightedIndex: number) => void;
}

// 名字球体组件 - 优化版
function NameSphere({ names, isDrawing, config, onHighlightChange }: NameSphereProps) {
  const groupRef = useRef<THREE.Group>(null);
  const drawStartTime = useRef<number>(0);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const lastHighlightTime = useRef(0);

  // 根据性能限制显示的名字数量
  const visibleNames = useMemo(() => {
    if (names.length <= config.maxVisibleNames) return names;
    // 随机采样，避免总是显示前面的名字
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, config.maxVisibleNames);
  }, [names, config.maxVisibleNames]);

  useEffect(() => {
    if (isDrawing) {
      drawStartTime.current = Date.now();
      setHighlightedIndex(-1);
    }
  }, [isDrawing]);

  useFrame(() => {
    if (!groupRef.current) return;

    if (isDrawing) {
      const elapsed = (Date.now() - drawStartTime.current) / 1000;

      // 简化的速度曲线
      let speed;
      if (elapsed < 3) {
        const progress = elapsed / 3;
        speed = 0.2 + progress * 2;
      } else if (elapsed < 7) {
        speed = 2.2;
      } else {
        const progress = (elapsed - 7) / 3;
        speed = 2.2 - progress * 2;
      }

      groupRef.current.rotation.y += speed * 0.016;
      groupRef.current.rotation.x += speed * 0.008;

      // 减少高亮频率以降低渲染压力
      if (elapsed > 2 && elapsed < 9) {
        const now = Date.now();
        if (now - lastHighlightTime.current > 300) { // 从150ms增加到300ms
          lastHighlightTime.current = now;
          const randomIndex = Math.floor(Math.random() * visibleNames.length);
          setHighlightedIndex(randomIndex);
          onHighlightChange?.(randomIndex);
        }
      } else {
        setHighlightedIndex(-1);
        onHighlightChange?.(-1);
      }
    } else {
      // 待机状态：更缓慢的旋转
      groupRef.current.rotation.y += 0.03 * 0.016;
      groupRef.current.rotation.x += 0.015 * 0.016;
      setHighlightedIndex(-1);
      onHighlightChange?.(-1);
    }
  });

  // 使用斐波那契球面算法分布名字
  const phi = Math.PI * (3 - Math.sqrt(5));
  const points = visibleNames.map((name, i) => {
    const y = 1 - (i / (visibleNames.length - 1 || 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    return { x, y, z, name };
  });

  return (
    <group ref={groupRef}>
      {points.map((point, index) => {
        const isHighlighted = highlightedIndex === index;
        return (
          <Billboard key={index} position={[point.x * 4, point.y * 4, point.z * 4]}>
            {/* 移除Float组件以提升性能，改用简单的缩放动画 */}
            <group scale={isHighlighted ? 1.2 : 1}>
              {/* 背景卡片 - 使用更简单的几何体 */}
              <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[isHighlighted ? 2 : 1.5, isHighlighted ? 0.6 : 0.5]} />
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
                outlineWidth={config.textOutlineWidth}
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

// 内部发光球体 - 减少面数
function InnerGlowSphere({ isDrawing, segments }: { isDrawing: boolean; segments: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const speed = isDrawing ? 0.4 : 0.12;
      meshRef.current.rotation.x = state.clock.elapsedTime * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 1.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.5, segments, segments]} />
      <meshStandardMaterial
        color="#8b5cf6"
        emissive="#8b5cf6"
        emissiveIntensity={isDrawing ? 1 : 0.7}
        transparent
        opacity={isDrawing ? 0.45 : 0.35}
        wireframe
      />
    </mesh>
  );
}

// 外部光环 - 减少段数
function OuterGlowRing({ isDrawing, segments }: { isDrawing: boolean; segments: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const speed = isDrawing ? 1.2 : 0.25;
      const scale = 1 + Math.sin(state.clock.elapsedTime * (isDrawing ? 3 : 1.5)) * 0.08;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.z = state.clock.elapsedTime * speed;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[4.5, 4.7, segments]} />
      <meshBasicMaterial
        color="#ec4899"
        transparent
        opacity={isDrawing ? 0.7 : 0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// 粒子环 - 减少粒子数量
function ParticleRing({ isDrawing, count }: { isDrawing: boolean; count: number }) {
  const points = useRef<THREE.Points>(null);

  // 使用useMemo缓存位置和颜色数据
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 5 + Math.random() * 1;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorChoice = Math.floor(Math.random() * 3);
      if (colorChoice === 0) {
        colors[i * 3] = 0.69; colors[i * 3 + 1] = 0.33; colors[i * 3 + 2] = 0.97;
      } else if (colorChoice === 1) {
        colors[i * 3] = 0.93; colors[i * 3 + 1] = 0.27; colors[i * 3 + 2] = 0.6;
      } else {
        colors[i * 3] = 0.27; colors[i * 3 + 1] = 0.53; colors[i * 3 + 2] = 0.97;
      }
    }

    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      const speed = isDrawing ? 0.4 : 0.12;
      points.current.rotation.y = state.clock.elapsedTime * speed;
      points.current.rotation.x = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isDrawing ? 0.1 : 0.06}
        transparent
        opacity={0.85}
        sizeAttenuation
        vertexColors
      />
    </points>
  );
}

// 上升气泡 - 减少数量和复杂度
function RisingBubbles({ isDrawing, count }: { isDrawing: boolean; count: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // 使用useMemo缓存气泡位置
  const bubbles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 6;
      return {
        position: [Math.cos(theta) * r, (Math.random() - 0.5) * 10, Math.sin(theta) * r],
      };
    });
  }, [count]);

  useFrame((state) => {
    if (groupRef.current) {
      const speedMultiplier = isDrawing ? 1.5 : 0.8;
      groupRef.current.children.forEach((child, i) => {
        const bubble = child as THREE.Mesh;
        const speed = (0.4 + i * 0.08) * speedMultiplier;
        bubble.position.y = ((state.clock.elapsedTime * speed + i * 2) % 10) - 5;
        // 简化缩放动画
        const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5 + i) * 0.2;
        bubble.scale.setScalar(scale);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {bubbles.map((bubble, i) => (
        <mesh key={i} position={bubble.position as [number, number, number]}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={isDrawing ? 0.7 : 0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// 倒计时进度条
function CountdownProgress({ isDrawing }: { isDrawing: boolean }) {
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState(10);
  const startTime = useRef<number>(0);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isDrawing) {
      startTime.current = Date.now();
      setProgress(0);
      setRemaining(10);

      const updateProgress = () => {
        const elapsed = (Date.now() - startTime.current) / 1000;
        const newProgress = Math.min((elapsed / 10) * 100, 100);
        const newRemaining = Math.max(0, 10 - elapsed);
        setProgress(newProgress);
        setRemaining(newRemaining);

        if (elapsed < 10) {
          requestRef.current = requestAnimationFrame(updateProgress);
        }
      };

      requestRef.current = requestAnimationFrame(updateProgress);
    } else {
      setProgress(0);
      setRemaining(10);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
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

// 帧率监控组件
function FPSCounter({ fps }: { fps: number }) {
  const getColor = () => {
    if (fps >= 50) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
      <Cpu className="h-4 w-4 text-white" />
      <span className={`text-sm font-mono font-bold ${getColor()}`}>
        {fps.toFixed(1)} FPS
      </span>
    </div>
  );
}

interface ThreeDrawAnimationProps {
  names: string[];
  isDrawing: boolean;
  winners?: string[];
  onClose?: () => void;
}

export function ThreeDrawAnimation({ names, isDrawing, winners, onClose }: ThreeDrawAnimationProps) {
  const [performanceLevel, setPerformanceLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [manualPerformance, setManualPerformance] = useState<'low' | 'medium' | 'high' | null>(null);
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());

  // 检测性能
  useEffect(() => {
    const detected = detectPerformance();
    setPerformanceLevel(detected);
    console.log('检测到的性能级别:', detected);
  }, []);

  // FPS计算
  useFrame(() => {
    frameCount.current++;
    const now = Date.now();
    if (now - lastTime.current >= 1000) {
      setFps(frameCount.current);
      frameCount.current = 0;
      lastTime.current = now;

      // 自动调整性能级别
      if (!manualPerformance) {
        if (fps < 25 && performanceLevel !== 'low') {
          console.log('FPS过低，自动降低性能级别');
          setPerformanceLevel('low');
        } else if (fps > 50 && performanceLevel !== 'high') {
          console.log('FPS良好，自动提升性能级别');
          setPerformanceLevel('high');
        }
      }
    }
  });

  // 使用手动设置的性能级别或自动检测的级别
  const config = PERFORMANCE_CONFIG[manualPerformance || performanceLevel];

  const [highlightedName, setHighlightedName] = useState('');

  const handleHighlightChange = (index: number) => {
    if (index >= 0 && index < names.length) {
      setHighlightedName(names[index]);
    } else {
      setHighlightedName('');
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* 性能控制面板 */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <Button
          size="sm"
          variant={performanceLevel === 'low' ? 'default' : 'outline'}
          onClick={() => {
            setManualPerformance('low');
            setPerformanceLevel('low');
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          低配
        </Button>
        <Button
          size="sm"
          variant={performanceLevel === 'medium' ? 'default' : 'outline'}
          onClick={() => {
            setManualPerformance('medium');
            setPerformanceLevel('medium');
          }}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          中配
        </Button>
        <Button
          size="sm"
          variant={performanceLevel === 'high' ? 'default' : 'outline'}
          onClick={() => {
            setManualPerformance('high');
            setPerformanceLevel('high');
          }}
          className="bg-red-600 hover:bg-red-700"
        >
          高配
        </Button>
      </div>

      {/* FPS显示 */}
      <FPSCounter fps={fps} />

      <Canvas dpr={[1, 2]} performance={{ min: 0.5 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />

        {/* 环境光 - 减少光源数量 */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#ec4899" />

        {/* 星空背景 - 使用配置的数量 */}
        <Stars
          radius={150}
          depth={60}
          count={config.starsCount}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />

        {/* 名字球体 */}
        <NameSphere
          names={names}
          isDrawing={isDrawing}
          config={config}
          onHighlightChange={handleHighlightChange}
        />

        {/* 内部发光球体 */}
        <InnerGlowSphere isDrawing={isDrawing} segments={config.sphereSegments} />

        {/* 外部光环 */}
        <OuterGlowRing isDrawing={isDrawing} segments={config.ringSegments} />

        {/* 粒子环 */}
        <ParticleRing isDrawing={isDrawing} count={config.particlesCount} />

        {/* 上升气泡 */}
        <RisingBubbles isDrawing={isDrawing} count={config.bubbleCount} />
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
                    className="gap-2 bg-black/50  backdrop-blur-xl border-2 border-white/30 hover:border-white/50 hover:text-white px-6 py-6 rounded-full shadow-xl"
                  >
                    <X className="h-6 w-6 text-white" />
                    关闭
                  </Button>
                </div>
              )}

              {/* Modal 内容 */}
              <div className="p-12 text-center">
                {/* 烟花效果背景 - 减少数量 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2000}ms`,
                        animationDuration: `${1000 + Math.random() * 1000}ms`,
                      }}
                    />
                  ))}
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
