'use client';

/**
 * 管理后台首页 - 数据概览
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Users, ScrollText, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Prize, User, DrawRecord } from '@/app/types';

export default function AdminHomePage() {
  const [stats, setStats] = useState({
    prizes: 0,
    users: 0,
    records: 0,
    availablePrizes: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [prizesRes, usersRes, recordsRes] = await Promise.all([
        fetch('/api/prizes'),
        fetch('/api/users'),
        fetch('/api/records'),
      ]);

      const prizes: Prize[] = (await prizesRes.json()).data || [];
      const users: User[] = (await usersRes.json()).data || [];
      const records: DrawRecord[] = (await recordsRes.json()).data || [];

      setStats({
        prizes: prizes.length,
        users: users.length,
        records: records.length,
        availablePrizes: prizes.filter(p => p.remainingCount > 0).length,
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">数据概览</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">奖品总数</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.prizes}</div>
            <p className="text-xs text-muted-foreground">
              可抽奖: {stats.availablePrizes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">参与人数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">中奖记录</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.records}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">中奖率</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.users > 0 ? ((stats.records / stats.users) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <a href="/admin/prizes" className="text-blue-600 hover:underline">
              添加奖品 →
            </a>
            <a href="/admin/users" className="text-blue-600 hover:underline">
              导入人员 →
            </a>
            <a href="/" className="text-blue-600 hover:underline">
              开始抽奖 →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
