'use client';

/**
 * 主题管理页面
 * 管理系统的样式风格配置
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Check, Palette } from 'lucide-react';
import type { Theme, CreateThemeDTO, ThemeStyle } from '@/app/types';
import { THEME_PRESETS } from '@/app/types';

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<ThemeStyle>('gradient');

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      setThemes(data.data || []);
      const active = data.data?.find((t: Theme) => t.isActive);
      if (active) setActiveTheme(active);
    } catch (error) {
      console.error('加载主题失败:', error);
    }
  };

  const handleCreateFromPreset = async (style: ThemeStyle) => {
    const preset = THEME_PRESETS[style];
    const newTheme: CreateThemeDTO = {
      name: `${preset.name} - ${new Date().toLocaleDateString()}`,
      style,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      backgroundColor: preset.backgroundColor,
      textColor: preset.textColor,
    };

    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTheme),
      });

      if (res.ok) {
        await loadThemes();
        setIsDialogOpen(false);
      } else {
        alert('创建主题失败');
      }
    } catch (error) {
      console.error('创建主题失败:', error);
      alert('创建主题失败');
    }
  };

  const handleOpenDialog = () => {
    setSelectedPreset('gradient');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/themes/${id}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        await loadThemes();
      } else {
        alert('激活主题失败');
      }
    } catch (error) {
      console.error('激活主题失败:', error);
      alert('激活主题失败');
    }
  };

  const handleDelete = async (id: string) => {
    const theme = themes.find(t => t.id === id);
    if (theme?.isActive) {
      alert('无法删除激活的主题');
      return;
    }

    if (!confirm('确定要删除这个主题吗？')) return;

    try {
      const res = await fetch(`/api/themes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadThemes();
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Palette className="h-8 w-8" />
          主题风格管理
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4" />
              创建主题
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>从预设模板创建主题</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      selectedPreset === key ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedPreset(key as ThemeStyle)}
                  >
                    <div
                      className={`h-24 bg-gradient-to-br ${preset.gradient} rounded-t-lg`}
                    />
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{preset.name}</h3>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCloseDialog}>
                  取消
                </Button>
                <Button
                  onClick={() => handleCreateFromPreset(selectedPreset)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  创建{THEME_PRESETS[selectedPreset].name}主题
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 主题列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map(theme => {
          const preset = THEME_PRESETS[theme.style];
          return (
            <Card
              key={theme.id}
              className={`overflow-hidden ${
                theme.isActive ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div
                className={`h-32 bg-gradient-to-br ${preset.gradient} relative`}
              >
                {theme.isActive && (
                  <Badge className="absolute top-2 right-2 bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    使用中
                  </Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{theme.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{preset.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>主色: {theme.primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: theme.secondaryColor }}
                    />
                    <span>辅助色: {theme.secondaryColor}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!theme.isActive && (
                    <Button
                      size="sm"
                      onClick={() => handleActivate(theme.id)}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      应用
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(theme.id)}
                    disabled={theme.isActive}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {themes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Palette className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-4">还没有创建任何主题</p>
            <Button onClick={handleOpenDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              创建第一个主题
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
