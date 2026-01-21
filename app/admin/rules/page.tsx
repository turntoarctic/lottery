'use client';

/**
 * 抽奖规则配置页面
 * 可以配置抽奖参数和行为
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Settings, Save, RotateCcw } from 'lucide-react';
import type { Rule } from '@/app/types';

export default function RulesPage() {
  const [rule, setRule] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRule();
  }, []);

  const loadRule = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      setRule(data.data);
    } catch (error) {
      console.error('加载规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!rule) return;

    setSaving(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowRepeatWin: rule.allowRepeatWin,
          drawCountPerRound: rule.drawCountPerRound,
        }),
      });

      if (res.ok) {
        alert('规则保存成功');
        await loadRule();
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('确定要重置抽奖轮数吗？这将重新开始第一轮抽奖。')) return;

    try {
      const res = await fetch('/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRound: 1,
        }),
      });

      if (res.ok) {
        alert('重置成功');
        await loadRule();
      } else {
        alert('重置失败');
      }
    } catch (error) {
      console.error('重置失败:', error);
      alert('重置失败');
    }
  };

  if (loading || !rule) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">抽奖规则配置</h2>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* 基本规则 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              基本规则
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 允许重复中奖 */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="font-semibold mb-1 block">允许重复中奖</label>
                <p className="text-sm text-muted-foreground">
                  开启后，已中奖的用户可以继续参与后续抽奖
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setRule({ ...rule, allowRepeatWin: false })}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${!rule.allowRepeatWin
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  不允许
                </button>
                <button
                  onClick={() => setRule({ ...rule, allowRepeatWin: true })}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${rule.allowRepeatWin
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  允许
                </button>
              </div>
            </div>

            {/* 每轮抽奖数量 */}
            <div>
              <label className="font-semibold mb-2 block">每轮抽奖数量</label>
              <p className="text-sm text-muted-foreground mb-3">
                每次抽奖时默认抽取的人数（可在抽奖时临时调整）
              </p>
              <Input
                type="number"
                min="1"
                max="100"
                value={rule.drawCountPerRound}
                onChange={e => setRule({ ...rule, drawCountPerRound: parseInt(e.target.value) || 1 })}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* 当前状态 */}
        <Card>
          <CardHeader>
            <CardTitle>当前状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">当前抽奖轮数</div>
                <div className="text-3xl font-bold text-purple-600">第 {rule.currentRound} 轮</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">中奖模式</div>
                <div className="text-3xl font-bold text-blue-600">
                  {rule.allowRepeatWin ? '可重复' : '不可重复'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作说明 */}
        <Card>
          <CardHeader>
            <CardTitle>规则说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-semibold">不允许重复中奖：</span>
              <span className="text-muted-foreground">
                每个用户在整个抽奖过程中只能中奖一次，抽中后自动从候选池移除
              </span>
            </div>
            <div>
              <span className="font-semibold">允许重复中奖：</span>
              <span className="text-muted-foreground">
                已中奖的用户可以继续参与后续抽奖，有机会多次中奖
              </span>
            </div>
            <div>
              <span className="font-semibold">每轮抽奖数量：</span>
              <span className="text-muted-foreground">
                设置默认值后，在首页点击抽奖按钮时会自动抽取对应数量。也可以在抽奖时临时调整
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 危险操作 */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600">危险操作</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              重置轮数会重新开始第一轮抽奖，不影响已中奖记录和奖品数量
            </p>
            <Button variant="destructive" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              重置抽奖轮数
            </Button>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={loadRule}>
            恢复默认
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存规则'}
          </Button>
        </div>
      </div>
    </div>
  );
}
