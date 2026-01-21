'use client';

/**
 * 管理后台布局
 * Client Component - 包含导航和交互
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gift, Users, ScrollText, Home, Settings, Palette } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                年会抽奖管理后台
              </h1>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                返回抽奖大屏
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* 侧边栏导航 */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              <Link href="/admin/prizes">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Gift className="h-4 w-4" />
                  奖品管理
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  人员管理
                </Button>
              </Link>
              <Link href="/admin/records">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <ScrollText className="h-4 w-4" />
                  抽奖记录
                </Button>
              </Link>
              <Link href="/admin/rules">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  抽奖规则
                </Button>
              </Link>
              <Link href="/admin/themes">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Palette className="h-4 w-4" />
                  主题风格
                </Button>
              </Link>
            </nav>
          </aside>

          {/* 主内容区 */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
