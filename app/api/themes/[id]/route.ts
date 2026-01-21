/**
 * 单个主题 API 路由
 * GET - 获取主题详情
 * PUT - 更新主题
 * DELETE - 删除主题
 * PATCH - 激活主题
 */

import { NextResponse } from 'next/server';
import { storage, now } from '@/app/lib/repositories/memory-storage';
import type { UpdateThemeDTO, Theme } from '@/app/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const theme = storage.getThemeById(id);

    if (!theme) {
      return NextResponse.json(
        { success: false, error: '主题不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: theme,
    });
  } catch (error) {
    console.error('获取主题失败:', error);
    return NextResponse.json(
      { success: false, error: '获取主题失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingTheme = storage.getThemeById(id);

    if (!existingTheme) {
      return NextResponse.json(
        { success: false, error: '主题不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const dto: UpdateThemeDTO = body;

    const updatedTheme: Theme = {
      ...existingTheme,
      ...dto,
      id: id, // 确保 ID 不被覆盖
      createdAt: existingTheme.createdAt, // 保持创建时间
      updatedAt: now(),
    };

    storage.updateTheme(updatedTheme);

    return NextResponse.json({
      success: true,
      data: updatedTheme,
    });
  } catch (error) {
    console.error('更新主题失败:', error);
    return NextResponse.json(
      { success: false, error: '更新主题失败' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('PATCH /api/themes/[id] - ID:', id);

    const theme = storage.getThemeById(id);
    console.log('找到主题:', theme);

    if (!theme) {
      return NextResponse.json(
        { success: false, error: '主题不存在' },
        { status: 404 }
      );
    }

    // 激活主题
    storage.setActiveTheme(id);

    const activeTheme = storage.getActiveTheme();
    console.log('激活后的主题:', activeTheme);

    return NextResponse.json({
      success: true,
      data: activeTheme,
    });
  } catch (error) {
    console.error('激活主题失败:', error);
    return NextResponse.json(
      { success: false, error: '激活主题失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const theme = storage.getThemeById(id);

    if (!theme) {
      return NextResponse.json(
        { success: false, error: '主题不存在' },
        { status: 404 }
      );
    }

    // 不允许删除激活的主题
    if (theme.isActive) {
      return NextResponse.json(
        { success: false, error: '无法删除激活的主题' },
        { status: 400 }
      );
    }

    storage.deleteTheme(id);

    return NextResponse.json({
      success: true,
      message: '主题已删除',
    });
  } catch (error) {
    console.error('删除主题失败:', error);
    return NextResponse.json(
      { success: false, error: '删除主题失败' },
      { status: 500 }
    );
  }
}
