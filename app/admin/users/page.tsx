'use client';

/**
 * 人员管理页面
 * Client Component - 包含 Excel 导入功能
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { User, CreateUserDTO } from '@/app/types';

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('请选择文件');
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      // 转换数据格式
      const usersToImport: CreateUserDTO[] = jsonData.map((row: any) => ({
        name: row['姓名'] || row['name'] || '',
        department: row['部门'] || row['department'] || undefined,
        employeeId: row['工号'] || row['employeeId'] || undefined,
        phone: row['手机号'] || row['phone'] || undefined,
      })).filter(u => u.name.trim()); // 过滤空名字

      if (usersToImport.length === 0) {
        alert('未找到有效数据，请检查 Excel 格式');
        return;
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: usersToImport }),
      });

      if (res.ok) {
        await loadUsers();
        setFile(null);
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        alert(`成功导入 ${usersToImport.length} 位用户`);
      } else {
        alert('导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败: ' + error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('确定要清空所有用户吗？此操作不可恢复！')) return;

    try {
      const res = await fetch('/api/users', { method: 'DELETE' });

      if (res.ok) {
        await loadUsers();
        alert('用户列表已清空');
      } else {
        alert('清空失败');
      }
    } catch (error) {
      console.error('清空失败:', error);
      alert('清空失败');
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        '姓名': '张三',
        '部门': '技术部',
        '工号': '001',
        '手机号': '13800138000'
      },
      {
        '姓名': '李四',
        '部门': '市场部',
        '工号': '002',
        '手机号': '13900139000'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户列表');
    XLSX.writeFile(workbook, '用户导入模板.xlsx');
  };

  const stats = {
    total: users.length,
    won: users.filter(u => u.hasWon).length,
    eligible: users.filter(u => !u.hasWon).length,
  };

  // 分页计算
  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentUsers = users.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">人员管理</h2>
        <Button variant="destructive" onClick={handleClearAll} className="gap-2">
          <Trash2 className="h-4 w-4" />
          清空所有
        </Button>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">总人数</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.eligible}</div>
              <div className="text-sm text-muted-foreground">待抽奖</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.won}</div>
              <div className="text-sm text-muted-foreground">已中奖</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Excel 导入 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Excel 导入</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Excel 文件需包含以下列：姓名（必填）、部门、工号、手机号
              </p>
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                下载导入模板
              </Button>
            </div>

            <div className="flex gap-4">
              <Input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button onClick={handleImport} disabled={!file} className="gap-2">
                <Upload className="h-4 w-4" />
                导入
              </Button>
            </div>

            {file && (
              <p className="text-sm text-muted-foreground">
                已选择: {file.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            用户列表 ({users.length})
            {totalPages > 1 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                第 {currentPage} / {totalPages} 页
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">姓名</th>
                  <th className="text-left p-2">部门</th>
                  <th className="text-left p-2">工号</th>
                  <th className="text-left p-2">手机号</th>
                  <th className="text-left p-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.department || '-'}</td>
                    <td className="p-2">{user.employeeId || '-'}</td>
                    <td className="p-2">{user.phone || '-'}</td>
                    <td className="p-2">
                      {user.hasWon ? (
                        <span className="text-green-600 font-semibold">已中奖</span>
                      ) : (
                        <span className="text-muted-foreground">待抽奖</span>
                      )}
                    </td>
                  </tr>
                ))}
                {currentUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      {users.length === 0 ? '暂无用户数据，请导入 Excel' : '没有数据'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                显示 {startIndex + 1} - {Math.min(endIndex, users.length)} / 共 {users.length} 条
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // 显示首页、末页和当前页附近的页码
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    );
                  }
                  // 显示省略号
                  if (
                    (page === currentPage - 2 && page > 1) ||
                    (page === currentPage + 2 && page < totalPages)
                  ) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
