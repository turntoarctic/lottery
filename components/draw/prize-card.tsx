'use client';

/**
 * 奖品卡片组件
 * 显示奖品信息、抽奖状态和中奖人员
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Users, Gift, Sparkles, ChevronDown } from 'lucide-react';
import type { Prize, DrawRecord } from '@/app/types';
import { PRIZE_LEVEL_CONFIG } from '@/app/types';

interface PrizeCardProps {
  prize: Prize;
  onDraw: (prizeId: string) => void;
  isDrawing?: boolean;
}

interface Winner extends DrawRecord {
  userDepartment?: string;
  userEmployeeId?: string;
}

export function PrizeCard({ prize, onDraw, isDrawing }: PrizeCardProps) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showWinners, setShowWinners] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFinished = prize.remainingCount === 0;
  const config = PRIZE_LEVEL_CONFIG[prize.level];
  const progress = prize.totalCount > 0 ? ((prize.totalCount - prize.remainingCount) / prize.totalCount) * 100 : 0;

  useEffect(() => {
    if (showWinners && winners.length === 0) {
      loadWinners();
    }
  }, [showWinners]);

  const loadWinners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prizes/${prize.id}`);
      const data = await res.json();
      if (data.success) {
        setWinners(data.data.winners || []);
      }
    } catch (error) {
      console.error('加载中奖记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDraw = () => {
    if (!isFinished && !isDrawing) {
      onDraw(prize.id);
    }
  };

  const handleToggleWinners = () => {
    setShowWinners(!showWinners);
  };

  return (
    <>
      <Card
        className={`
          relative overflow-hidden transition-all duration-300 hover:shadow-2xl
          ${isFinished ? 'opacity-75' : 'hover:scale-105'}
        `}
        style={{
          background: isFinished
            ? 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
            : `linear-gradient(135deg, ${config.color}15 0%, ${config.color}05 100%)`,
        }}
      >
        {/* 顶部状态条 */}
        <div
          className="h-2 transition-all duration-500"
          style={{
            width: `${progress}%`,
            backgroundColor: config.color,
          }}
        />

        <CardHeader className="text-center pb-3">
          {/* 奖项等级标签 */}
          <Badge
            className="w-fit mx-auto mb-2 text-base"
            style={{
              backgroundColor: config.color,
              color: '#fff',
            }}
          >
            {config.label}
          </Badge>

          {/* 奖品名称 */}
          <CardTitle className="text-2xl font-bold">{prize.name}</CardTitle>

          {/* 奖品描述 */}
          {prize.description && (
            <p className="text-sm text-muted-foreground mt-1">{prize.description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 数量统计 */}
          <div className="flex items-center justify-center gap-4 py-3">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: config.color }}>
                {prize.remainingCount}
              </div>
              <div className="text-xs text-muted-foreground">剩余</div>
            </div>
            <div className="text-2xl text-muted-foreground">/</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{prize.totalCount}</div>
              <div className="text-xs text-muted-foreground">总数</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: config.color,
              }}
            />
          </div>

          {/* 按钮组 */}
          <div className="flex gap-2">
            {isFinished ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleToggleWinners}
                >
                  <Users className="h-4 w-4 mr-2" />
                  查看中奖人员
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="flex-1"
                  style={{
                    backgroundColor: config.color,
                    color: '#fff',
                  }}
                  onClick={handleDraw}
                  disabled={isDrawing}
                >
                  {isDrawing ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      抽奖中...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      开始抽奖
                    </>
                  )}
                </Button>

                {winners.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleWinners}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* 中奖人数提示 */}
          {winners.length > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              已中奖 {winners.length} 人
            </div>
          )}
        </CardContent>
      </Card>

      {/* 中奖人员弹窗 */}
      <Dialog open={showWinners} onOpenChange={setShowWinners}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" style={{ color: config.color }} />
              {prize.name} - 中奖人员名单
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : winners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无中奖记录
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {winners.map((winner, index) => (
                  <div
                    key={winner.id}
                    className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className="text-xs"
                        style={{ backgroundColor: config.color }}
                      >
                        第 {winner.round} 轮
                      </Badge>
                    </div>
                    <div className="font-semibold text-lg">{winner.userName}</div>
                    {winner.userDepartment && (
                      <div className="text-sm text-muted-foreground">
                        {winner.userDepartment}
                      </div>
                    )}
                    {winner.userEmployeeId && (
                      <div className="text-xs text-muted-foreground">
                        工号: {winner.userEmployeeId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
