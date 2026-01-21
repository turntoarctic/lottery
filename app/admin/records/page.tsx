'use client';

/**
 * 抽奖记录页面
 * Client Component - 展示所有中奖记录
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DrawRecord } from '@/app/types';
import { PRIZE_LEVEL_CONFIG } from '@/app/types';

export default function RecordsPage() {
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [filterRound, setFilterRound] = useState<number | 'all'>('all');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const res = await fetch('/api/records');
      const data = await res.json();
      setRecords(data.data || []);
    } catch (error) {
      console.error('加载记录失败:', error);
    }
  };

  // 获取所有轮次
  const rounds = Array.from(new Set(records.map(r => r.round))).sort((a, b) => b - a);

  // 过滤记录
  const filteredRecords = filterRound === 'all'
    ? records
    : records.filter(r => r.round === filterRound);

  // 按轮次分组
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    if (!acc[record.round]) {
      acc[record.round] = [];
    }
    acc[record.round].push(record);
    return acc;
  }, {} as Record<number, DrawRecord[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">抽奖记录</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">筛选轮次:</span>
          <select
            value={filterRound}
            onChange={e => setFilterRound(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-1 border rounded-md bg-background"
          >
            <option value="all">全部</option>
            {rounds.map(round => (
              <option key={round} value={round}>第 {round} 轮</option>
            ))}
          </select>
        </div>
      </div>

      {/* 统计信息 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-600">{records.length}</div>
              <div className="text-sm text-muted-foreground">总中奖数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{rounds.length}</div>
              <div className="text-sm text-muted-foreground">抽奖轮数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {Object.keys(groupedRecords).length}
              </div>
              <div className="text-sm text-muted-foreground">显示轮数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 记录列表 */}
      {Object.entries(groupedRecords)
        .sort(([a], [b]) => parseInt(b) - parseInt(a))
        .map(([round, roundRecords]) => (
          <Card key={round} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                第 {round} 轮抽奖
                <Badge variant="outline">{roundRecords.length} 位中奖者</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roundRecords.map(record => {
                  const config = PRIZE_LEVEL_CONFIG[record.prizeLevel];
                  return (
                    <div
                      key={record.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge style={{ backgroundColor: config.color }}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(record.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="font-semibold text-lg">{record.userName}</div>
                      <div className="text-sm text-muted-foreground">{record.prizeName}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无抽奖记录
          </CardContent>
        </Card>
      )}
    </div>
  );
}
