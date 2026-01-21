/**
 * 主题 API 路由
 * GET - 获取所有主题
 * POST - 创建新主题
 */

import { NextResponse } from 'next/server';
import { storage, generateId, now } from '@/app/lib/repositories/memory-storage';
import type { CreateThemeDTO, Theme } from '@/app/types';

export async function GET() {
  try {
    const themes = storage.getThemes();
    console.log('GET /api/themes - 主题数量:', themes.length);
    console.log('主题列表:', themes);
    return NextResponse.json({
      success: true,
      data: themes,
    });
  } catch (error) {
    console.error('获取主题失败:', error);
    return NextResponse.json(
      { success: false, error: '获取主题失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dto: CreateThemeDTO = body;

    // 验证必填字段
    if (!dto.name || !dto.style || !dto.primaryColor || !dto.secondaryColor) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const newTheme: Theme = {
      id: generateId(),
      name: dto.name,
      style: dto.style,
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      backgroundColor: dto.backgroundColor,
      textColor: dto.textColor,
      isActive: false, // 默认不激活，需要手动激活
      createdAt: now(),
      updatedAt: now(),
    };

    storage.createTheme(newTheme);

    return NextResponse.json({
      success: true,
      data: newTheme,
    });
  } catch (error) {
    console.error('创建主题失败:', error);
    return NextResponse.json(
      { success: false, error: '创建主题失败' },
      { status: 500 }
    );
  }
}
