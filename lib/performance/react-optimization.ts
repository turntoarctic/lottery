/**
 * React 性能优化工具
 */

import { useMemo, useCallback, useRef, useEffect, useState, React } from 'react';

/**
 * 防抖 Hook
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * 节流 Hook
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRunRef.current >= delay) {
        callback(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, delay - (now - lastRunRef.current));
      }
    },
    [callback, delay]
  );
}

/**
 * 虚拟化列表 Hook
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      totalHeight,
      offsetY: startIndex * itemHeight,
      startIndex,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    scrollTop,
  };
}

/**
 * 懒加载图片 Hook
 */
export function useLazyImage(src: string, threshold = 0.1) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.src = src;
    }
  }, [isInView, src]);

  return { imgRef, isLoaded, isInView };
}

/**
 * 优化的 useMemo 依赖检查
 * 避免不必要的重新计算
 */
export function useDeepMemo<T>(factory: () => T, deps: any[]) {
  const depsRef = useRef(deps);
  const resultRef = useRef<T>();

  const hasChanged = useMemo(() => {
    return deps.some((dep, i) => {
      const prevDep = depsRef.current[i];
      return dep !== prevDep;
    });
  }, deps);

  if (hasChanged) {
    depsRef.current = deps;
    resultRef.current = factory();
  }

  return resultRef.current as T;
}

/**
 * 批量状态更新 Hook
 * 避免多次重新渲染
 */
export function useBatchUpdate<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdatesRef = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((updates: Partial<T>) => {
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        ...pendingUpdatesRef.current,
      }));
      pendingUpdatesRef.current = {};
    }, 0);
  }, []);

  return [state, batchUpdate] as const;
}

/**
 * 优化的列表渲染
 * 使用 key 和 memo 避免不必要的重新渲染
 */
export function createOptimizedListComponent<T>(
  Component: React.ComponentType<{ item: T; index: number }>,
  areEqual?: (prevProps: { item: T; index: number }, nextProps: { item: T; index: number }) => boolean
) {
  return React.memo(Component, areEqual);
}
