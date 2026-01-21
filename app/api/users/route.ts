/**
 * 人员管理 API Routes
 * GET    /api/users - 获取所有用户
 * POST   /api/users - 批量创建用户（Excel 导入）
 * DELETE /api/users - 删除用户
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage, generateId, now } from '../../lib/repositories/memory-storage';
import type { User, CreateUserDTO, ImportUsersDTO, ApiResponse } from '../../types';

// GET - 获取所有用户
export async function GET() {
  try {
    const users = storage.getUsers();
    return NextResponse.json<ApiResponse<User[]>>({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

// POST - 批量创建用户（Excel 导入）
export async function POST(request: NextRequest) {
  try {
    const body: ImportUsersDTO = await request.json();

    if (!body.users || !Array.isArray(body.users)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: '数据格式错误',
        },
        { status: 400 }
      );
    }

    // 创建用户
    const createdUsers: User[] = [];
    for (const userData of body.users) {
      if (!userData.name) {
        continue; // 跳过没有姓名的记录
      }

      const newUser: User = {
        id: generateId(),
        name: userData.name,
        department: userData.department,
        employeeId: userData.employeeId,
        phone: userData.phone,
        hasWon: false,
        createdAt: now(),
        updatedAt: now(),
      };

      storage.createUser(newUser);
      createdUsers.push(newUser);
    }

    return NextResponse.json<ApiResponse<User[]>>(
      {
        success: true,
        data: createdUsers,
        message: `成功导入 ${createdUsers.length} 位用户`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除所有用户（清空列表）
export async function DELETE() {
  try {
    storage.clearUsers();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '用户列表已清空',
    });
  } catch (error) {
    console.error('清空用户失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
