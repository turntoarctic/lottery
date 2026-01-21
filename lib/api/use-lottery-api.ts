import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Prize, User, DrawRecord, Rule, Theme } from '@/app/types';

// API 基础配置
const API_BASE = '/api';

// 通用 fetch 函数
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

// ============ Queries ============

/**
 * 获取所有奖品
 */
export function usePrizes() {
  return useQuery({
    queryKey: ['prizes'],
    queryFn: () => fetchAPI<Prize[]>('/prizes'),
  });
}

/**
 * 获取所有用户
 */
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetchAPI<User[]>('/users'),
  });
}

/**
 * 获取抽奖记录
 */
export function useDrawRecords() {
  return useQuery({
    queryKey: ['records'],
    queryFn: () => fetchAPI<DrawRecord[]>('/records'),
  });
}

/**
 * 获取规则
 */
export function useRule() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: () => fetchAPI<Rule>('/rules'),
  });
}

/**
 * 获取主题
 */
export function useThemes() {
  return useQuery({
    queryKey: ['themes'],
    queryFn: () => fetchAPI<Theme[]>('/themes'),
  });
}

// ============ Mutations ============

/**
 * 执行抽奖
 */
export function useDrawPrize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prizeId: string) => {
      const response = await fetch(`${API_BASE}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId }),
      });

      if (!response.ok) {
        throw new Error(`抽奖失败: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // 使相关查询失效,触发重新获取
      queryClient.invalidateQueries({ queryKey: ['prizes'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}

/**
 * 刷新所有数据
 */
export function useRefreshData() {
  const queryClient = useQueryClient();

  return {
    refresh: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['prizes'] }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['records'] }),
        queryClient.invalidateQueries({ queryKey: ['rules'] }),
        queryClient.invalidateQueries({ queryKey: ['themes'] }),
      ]),
  };
}
