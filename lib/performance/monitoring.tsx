/**
 * 性能监控和 Web Vitals
 */

import { Metric } from 'web-vitals';

// 性能指标收集
let metrics: Record<string, Metric> = {};

// 收集性能指标
export function reportWebVitals(metric: Metric) {
  metrics = { ...metrics, [metric.name]: metric };

  // 在开发环境打印
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric);
  }

  // 在生产环境发送到分析服务
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // 发送到分析服务 (例如: Google Analytics, Sentry)
    sendToAnalytics(metric);
  }
}

// 发送到分析服务
function sendToAnalytics(metric: Metric) {
  // TODO: 替换为实际的分析服务
  const endpoint = '/api/analytics';

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      endpoint,
      JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
      })
    );
  } else {
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(metric),
      keepalive: true,
    });
  }
}

// 性能监控 Hook
export function usePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // 监控内存使用
  if ('memory' in navigator) {
    setInterval(() => {
      const memory = (navigator as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
      const percentage = ((usedMB / limitMB) * 100).toFixed(2);

      // 内存使用超过 80% 时警告
      if (parseFloat(percentage) > 80) {
        console.warn(`[Memory] High usage: ${usedMB}MB / ${limitMB}MB (${percentage}%)`);
      }
    }, 10000); // 每 10 秒检查一次
  }

  // 监控 FPS
  let lastTime = performance.now();
  let frames = 0;

  function measureFPS() {
    const now = performance.now();
    frames++;

    if (now >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (now - lastTime));

      if (fps < 30) {
        console.warn(`[FPS] Low frame rate: ${fps} FPS`);
      }

      frames = 0;
      lastTime = now;
    }

    requestAnimationFrame(measureFPS);
  }

  requestAnimationFrame(measureFPS);
}

// 性能评分
export function getPerformanceScore(): {
  lcp: 'good' | 'needs-improvement' | 'poor';
  fid: 'good' | 'needs-improvement' | 'poor';
  cls: 'good' | 'needs-improvement' | 'poor';
  overall: number;
} {
  const lcp = metrics.LCP?.value || 0;
  const fid = metrics.FID?.value || 0;
  const cls = metrics.CLS?.value || 0;

  return {
    lcp: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
    fid: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
    cls: cls < 0.1 ? 'good' : cls < 0.25 ? 'needs-improvement' : 'poor',
    overall: Math.round(
      (lcp < 2500 ? 33 : lcp < 4000 ? 16 : 0) +
      (fid < 100 ? 33 : fid < 300 ? 16 : 0) +
      (cls < 0.1 ? 34 : cls < 0.25 ? 17 : 0)
    ),
  };
}

// 资源加载性能监控
export function observeResourceLoading() {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming;

        // 加载时间超过 3 秒的资源
        if (resource.duration > 3000) {
          console.warn(`[Slow Resource] ${resource.name}: ${Math.round(resource.duration)}ms`);
        }
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
}

// 长任务监控 (检测卡顿)
export function observeLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`[Long Task] Blocked main thread for ${Math.round(entry.duration)}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // longtask not supported
  }
}

// 初始化所有监控
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  observeResourceLoading();
  observeLongTasks();
}
