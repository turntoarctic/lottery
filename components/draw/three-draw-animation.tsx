'use client';

/**
 * 3D 球型抽奖动画 - 优雅版
 * 渐进式加速减速：慢速启动 → 加速 → 高速旋转 → 减速 → 停止
 * 聚光灯效果：随机高亮名字
 * 倒计时进度条
 */

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars, Float, PerspectiveCamera, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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

  useEffect(() => {
    if (isDrawing) {
      drawStartTime.current = Date.now();
      setHighlightedIndex(-1);
    }
  }, [isDrawing]);

  useFrame(() => {
    if (!groupRef.current) return;

    if (isDrawing) {
      const elapsed = (Date.now() - drawStartTime.current) / 1000; // 秒
      const totalDuration = 10; // 总时长 10 秒

      // 渐进式速度曲线
      // 0-3秒：加速 (从 0.2 到 3)
      // 3-7秒：高速 (保持 3)
      // 7-10秒：减速 (从 3 到 0.1)
      let speed;
      if (elapsed < 3) {
        // 加速阶段：easeInOutCubic
        const progress = elapsed / 3;
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        speed = 0.2 + eased * 2.8;
      } else if (elapsed < 7) {
        // 高速阶段
        speed = 3;
      } else {
        // 减速阶段：easeInOutCubic
        const progress = (elapsed - 7) / 3;
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        speed = 3 - eased * 2.9;
      }

      // 应用旋转（使用 delta 时间确保平滑）
      groupRef.current.rotation.y += speed * 0.016;
      groupRef.current.rotation.x += speed * 0.008;

      // 聚光灯效果：随机高亮名字（高速旋转阶段）
      if (elapsed > 2 && elapsed < 9) {
        const now = Date.now();
        if (now - lastHighlightTime.current > 150) { // 每 150ms 切换一次高亮
          lastHighlightTime.current = now;
          const randomIndex = Math.floor(Math.random() * names.length);
          setHighlightedIndex(randomIndex);
          onHighlightChange?.(randomIndex);
        }
      } else {
        setHighlightedIndex(-1);
        onHighlightChange?.(-1);
      }
    } else {
      // 待机状态：缓慢旋转
      groupRef.current.rotation.y += 0.05 * 0.016;
      groupRef.current.rotation.x += 0.025 * 0.016;
      setHighlightedIndex(-1);
      onHighlightChange?.(-1);
    }
  });

  // 使用斐波那契球面算法分布名字
  const phi = Math.PI * (3 - Math.sqrt(5));
  const points = names.map((name, i) => {
    const y = 1 - (i / (names.length - 1 || 1)) * 2;
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
            <Float
              speed={isHighlighted ? 3 : 1.5}
              rotationIntensity={isHighlighted ? 0.5 : 0.2}
              floatIntensity={isHighlighted ? 0.5 : 0.3}
            >
              {/* 背景卡片 */}
              <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[isHighlighted ? 2.5 : 1.8, isHighlighted ? 0.8 : 0.6]} />
                <meshBasicMaterial
                  color={isHighlighted ? "#fbbf24" : "#a855f7"}
                  transparent
                  opacity={isHighlighted ? 0.3 : 0.2}
                />
              </mesh>
              <Text
                fontSize={isHighlighted ? 0.6 : 0.4}
                color={isHighlighted ? "#fbbf24" : "#ffffff"}
                anchorX="center"
                anchorY="middle"
                outlineWidth={isHighlighted ? 0.05 : 0.02}
                outlineColor={isHighlighted ? "#f59e0b" : "#a855f7"}
                outlineOpacity={isHighlighted ? 1 : 0.8}
              >
                {point.name}
              </Text>
              {/* 高亮光晕 */}
              {isHighlighted && (
                <pointLight
                  position={[0, 0, 1]}
                  color="#fbbf24"
                  intensity={2}
                  distance={3}
                />
              )}
            </Float>
          </Billboard>
        );
      })}
    </group>
  );
}

// 内部发光球体
function InnerGlowSphere({ isDrawing }: { isDrawing: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const speed = isDrawing ? 0.5 : 0.15;
      meshRef.current.rotation.x = state.clock.elapsedTime * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 1.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial
        color="#8b5cf6"
        emissive="#8b5cf6"
        emissiveIntensity={isDrawing ? 1.2 : 0.8}
        transparent
        opacity={isDrawing ? 0.5 : 0.4}
        wireframe
      />
    </mesh>
  );
}

// 外部光环
function OuterGlowRing({ isDrawing }: { isDrawing: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const speed = isDrawing ? 1.5 : 0.3;
      const scale = 1 + Math.sin(state.clock.elapsedTime * (isDrawing ? 4 : 2)) * 0.1;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.z = state.clock.elapsedTime * speed;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[4.5, 4.7, 64]} />
      <meshBasicMaterial
        color="#ec4899"
        transparent
        opacity={isDrawing ? 0.8 : 0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// 粒子环
function ParticleRing({ isDrawing }: { isDrawing: boolean }) {
  const points = useRef<THREE.Points>(null);
  const particlesCount = 1500;

  const positions = new Float32Array(particlesCount * 3);
  const colors = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const r = 5 + Math.random() * 1;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // 随机颜色：紫色、粉色、蓝色
    const colorChoice = Math.floor(Math.random() * 3);
    if (colorChoice === 0) {
      colors[i * 3] = 0.69; colors[i * 3 + 1] = 0.33; colors[i * 3 + 2] = 0.97; // 紫色
    } else if (colorChoice === 1) {
      colors[i * 3] = 0.93; colors[i * 3 + 1] = 0.27; colors[i * 3 + 2] = 0.6; // 粉色
    } else {
      colors[i * 3] = 0.27; colors[i * 3 + 1] = 0.53; colors[i * 3 + 2] = 0.97; // 蓝色
    }
  }

  useFrame((state) => {
    if (points.current) {
      const speed = isDrawing ? 0.5 : 0.15;
      points.current.rotation.y = state.clock.elapsedTime * speed;
      points.current.rotation.x = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particlesCount}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isDrawing ? 0.12 : 0.08}
        transparent
        opacity={0.9}
        sizeAttenuation
        vertexColors
      />
    </points>
  );
}

// 上升气泡效果
function RisingBubbles({ isDrawing }: { isDrawing: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const speedMultiplier = isDrawing ? 2 : 1;
      groupRef.current.children.forEach((child, i) => {
        const bubble = child as THREE.Mesh;
        const speed = (0.5 + i * 0.1) * speedMultiplier;
        bubble.position.y = ((state.clock.elapsedTime * speed + i * 2) % 10) - 5;
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.3;
        bubble.scale.setScalar(scale);
      });
    }
  });

  const bubbles = Array.from({ length: 20 }, (_, i) => {
    const theta = Math.random() * Math.PI * 2;
    const r = Math.random() * 6;
    return {
      position: [Math.cos(theta) * r, (Math.random() - 0.5) * 10, Math.sin(theta) * r],
    };
  });

  return (
    <group ref={groupRef}>
      {bubbles.map((bubble, i) => (
        <mesh key={i} position={bubble.position as [number, number, number]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={isDrawing ? 0.8 : 0.6}
          />
        </mesh>
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

interface ThreeDrawAnimationProps {
  names: string[];
  isDrawing: boolean;
  winners?: string[];
  onClose?: () => void;
}

export function ThreeDrawAnimation({ names, isDrawing, winners, onClose }: ThreeDrawAnimationProps) {
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
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={60} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />

        {/* 环境光 */}
        <ambientLight intensity={0.6} />
        <pointLight position={[15, 15, 15]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-15, -15, -15]} intensity={1} color="#ec4899" />
        <pointLight position={[0, 10, 0]} intensity={0.8} color="#8b5cf6" />

        {/* 星空背景 */}
        <Stars radius={150} depth={60} count={8000} factor={4} saturation={0} fade speed={0.5} />

        {/* 名字球体 */}
        <NameSphere names={names} isDrawing={isDrawing} onHighlightChange={handleHighlightChange} />

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
                    className="gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-xl border-2 border-white/30 hover:border-white/50 px-6 py-6 rounded-full shadow-xl"
                  >
                    <X className="h-6 w-6" />
                    关闭
                  </Button>
                </div>
              )}

              {/* Modal 内容 */}
              <div className="p-12 text-center">
                {/* 烟花效果背景 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(50)].map((_, i) => (
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
