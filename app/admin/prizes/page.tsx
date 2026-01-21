'use client';

/**
 * 奖品管理页面
 * Client Component - 包含增删改查操作
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import type { Prize, CreatePrizeDTO, PrizeLevel } from '@/app/types';
import { PRIZE_LEVEL_CONFIG } from '@/app/types';

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [formData, setFormData] = useState<CreatePrizeDTO>({
    name: '',
    level: 'lucky',
    totalCount: 1,
    description: '',
    imageUrl: '',
    sortOrder: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadPrizes();
  }, []);

  const loadPrizes = async () => {
    try {
      const res = await fetch('/api/prizes');
      const data = await res.json();
      setPrizes(data.data || []);
    } catch (error) {
      console.error('加载奖品失败:', error);
    }
  };

  // 通知抽奖页面数据已更新
  const notifyDataUpdate = () => {
    // 方法1: 触发自定义事件（同一页面）
    window.dispatchEvent(new Event('data-updated'));

    // 方法2: 更新 localStorage（跨标签页）
    localStorage.setItem('lottery-data-updated', Date.now().toString());

    // 方法3: 广播频道（跨窗口、跨标签页）
    try {
      const channel = new BroadcastChannel('lottery-data-sync');
      channel.postMessage({ type: 'data-updated', timestamp: Date.now() });
      channel.close();
    } catch (e) {
      console.log('BroadcastChannel not supported');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPrize ? '/api/prizes' : '/api/prizes';
      const method = editingPrize ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPrize ? { ...formData, id: editingPrize.id } : formData),
      });

      if (res.ok) {
        await loadPrizes();
        notifyDataUpdate(); // 通知抽奖页面数据已更新
        setIsDialogOpen(false);
        resetForm();
      } else {
        alert('操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败');
    }
  };

  const handleEdit = (prize: Prize) => {
    setEditingPrize(prize);
    setFormData({
      name: prize.name,
      level: prize.level,
      totalCount: prize.totalCount,
      description: prize.description,
      imageUrl: prize.imageUrl || '',
      sortOrder: prize.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 将图片转换为 Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个奖品吗？')) return;

    try {
      const res = await fetch(`/api/prizes?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadPrizes();
        notifyDataUpdate(); // 通知抽奖页面数据已更新
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const resetForm = () => {
    setEditingPrize(null);
    setFormData({
      name: '',
      level: 'lucky',
      totalCount: 1,
      description: '',
      imageUrl: '',
      sortOrder: 0,
    });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">奖品管理</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              添加奖品
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPrize ? '编辑奖品' : '添加奖品'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">奖品名称</label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">奖项等级</label>
                <select
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value as PrizeLevel })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {Object.entries(PRIZE_LEVEL_CONFIG).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">数量</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.totalCount}
                  onChange={e => setFormData({ ...formData, totalCount: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">描述（可选）</label>
                <Input
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">奖品图片（可选）</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      上传图片
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <Input
                    placeholder="或输入图片 URL"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                  {formData.imageUrl && (
                    <div className="relative h-32 w-full border rounded-md overflow-hidden">
                      <img
                        src={formData.imageUrl}
                        alt="预览"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">排序顺序（数字越小越优先）</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  取消
                </Button>
                <Button type="submit">
                  {editingPrize ? '更新' : '添加'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 奖品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prizes.map(prize => {
          const config = PRIZE_LEVEL_CONFIG[prize.level];
          return (
            <Card key={prize.id} className="overflow-hidden">
              {prize.imageUrl && (
                <div className="relative h-48 w-full bg-muted">
                  <img
                    src={prize.imageUrl}
                    alt={prize.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge style={{ backgroundColor: config.color }} className="mb-2">
                      {config.label}
                    </Badge>
                    <CardTitle>{prize.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(prize)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(prize.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总数量:</span>
                    <span className="font-semibold">{prize.totalCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">剩余:</span>
                    <span className="font-semibold">{prize.remainingCount}</span>
                  </div>
                  {prize.description && (
                    <div className="pt-2 border-t">
                      {prize.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {prizes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="text-6xl mb-4">🎁</div>
            <p className="mb-4 text-lg">暂无奖品</p>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              添加第一个奖品
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
