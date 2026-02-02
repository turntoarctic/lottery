// import {type THREE} from "three"

/**
 * 3D 性能优化配置
 * 用于优化 Three.js 渲染性能
 */

// 性能配置
export const PERFORMANCE_CONFIG = {
  // 限制显示的名字数量
  maxNames: 200,

  // 限制星星数量
  maxStars: 500,

  // 渲染距离
  renderDistance: 100,

  // 帧率限制 (节省资源)
  targetFPS: 60,

  // 像素比 (降低以提高性能)
  pixelRatio: Math.min(window.devicePixelRatio, 2), // 最多 2x

  // 是否启用抗锯齿
  antialias: typeof window !== 'undefined' && window.innerWidth < 1920, // 小屏幕启用

  // 阴影质量
  shadows: typeof window !== 'undefined' && window.innerWidth >= 1920, // 大屏幕启用

  // LOD (Level of Detail) 设置
  lod: {
    high: 1000,   // 距离 < 1000: 高质量
    medium: 2000, // 距离 < 2000: 中等质量
    low: Infinity, // 距离 >= 2000: 低质量
  },
};

// 检测设备性能
export function detectDevicePerformance(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'medium';

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) return 'low';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return 'medium';

  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

  // 检测 GPU
  if (renderer.includes('Apple M') || renderer.includes('NVIDIA') || renderer.includes('RTX')) {
    return 'high';
  }

  // 检测内存 (仅 Chrome)
  if ('memory' in navigator) {
    const memory = (navigator as any).memory;
    if (memory.jsHeapSizeLimit > 2000000000) { // > 2GB
      return 'high';
    }
  }

  return 'medium';
}

// 根据设备性能调整配置
export function getOptimizedConfig() {
  const performance = detectDevicePerformance();

  switch (performance) {
    case 'high':
      return {
        maxNames: 100,
        maxStars: 1000,
        pixelRatio: 2,
        antialias: true,
        shadows: true,
      };
    case 'medium':
      return {
        maxNames: 50,
        maxStars: 500,
        pixelRatio: 1.5,
        antialias: true,
        shadows: false,
      };
    case 'low':
      return {
        maxNames: 30,
        maxStars: 200,
        pixelRatio: 1,
        antialias: false,
        shadows: false,
      };
  }
}

// 内存清理工具
export class MemoryManager {
  private static textures: Set<THREE.Texture> = new Set();
  private static geometries: Set<THREE.BufferGeometry> = new Set();
  private static materials: Set<THREE.Material> = new Set();

  static trackTexture(texture: THREE.Texture) {
    this.textures.add(texture);
  }

  static trackGeometry(geometry: THREE.BufferGeometry) {
    this.geometries.add(geometry);
  }

  static trackMaterial(material: THREE.Material) {
    this.materials.add(material);
  }

  static disposeAll() {
    // 清理纹理
    this.textures.forEach(texture => texture.dispose());
    this.textures.clear();

    // 清理几何体
    this.geometries.forEach(geometry => geometry.dispose());
    this.geometries.clear();

    // 清理材质
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
  }

  static forceGarbageCollection() {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }
}

// FPS 监控
export class FPSMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();

  recordFrame() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.frames.push(1000 / delta);

    if (this.frames.length > 60) {
      this.frames.shift();
    }

    this.lastTime = now;
  }

  getAverageFPS(): number {
    if (this.frames.length === 0) return 0;
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frames.length);
  }

  isLowFPS(): boolean {
    return this.getAverageFPS() < 30;
  }
}
