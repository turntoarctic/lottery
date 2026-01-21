/**
 * 奖品管理 API Routes
 * GET    /api/prizes - 获取所有奖品
 * POST   /api/prizes - 创建奖品
 * PUT    /api/prizes - 更新奖品
 * DELETE /api/prizes - 删除奖品
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage, generateId, now } from '../../lib/repositories/memory-storage';
import type { Prize, CreatePrizeDTO, UpdatePrizeDTO, ApiResponse } from '../../types';

// GET - 获取所有奖品
export async function GET() {
  try {
    const prizes = storage.getPrizes();
    return NextResponse.json<ApiResponse<Prize[]>>({
      success: true,
      data: prizes,
    });
  } catch (error) {
    console.error('获取奖品列表失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

// POST - 创建奖品
export async function POST(request: NextRequest) {
  try {
    const body: CreatePrizeDTO = await request.json();

    // 参数验证
    if (!body.name || !body.level || !body.totalCount) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: '缺少必填字段',
        },
        { status: 400 }
      );
    }

    // 创建奖品
    const newPrize: Prize = {
      id: generateId(),
      name: body.name,
      level: body.level,
      totalCount: body.totalCount,
      remainingCount: body.totalCount, // 初始剩余数量等于总数量
      description: body.description,
      imageUrl: body.imageUrl,
      sortOrder: body.sortOrder ?? 0,
      createdAt: now(),
      updatedAt: now(),
    };

    storage.createPrize(newPrize);

    return NextResponse.json<ApiResponse<Prize>>(
      {
        success: true,
        data: newPrize,
        message: '奖品创建成功',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建奖品失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

// PUT - 更新奖品
export async function PUT(request: NextRequest) {
  try {
    const body: UpdatePrizeDTO = await request.json();

    if (!body.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: '缺少奖品 ID',
        },
        { status: 400 }
      );
    }

    const existingPrize = storage.getPrizeById(body.id);
    if (!existingPrize) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: '奖品不存在',
        },
        { status: 404 }
      );
    }

    // 更新奖品
    const updatedPrize: Prize = {
      ...existingPrize,
      name: body.name ?? existingPrize.name,
      level: body.level ?? existingPrize.level,
      totalCount: body.totalCount ?? existingPrize.totalCount,
      remainingCount: body.totalCount
        ? existingPrize.remainingCount + (body.totalCount - existingPrize.totalCount)
        : existingPrize.remainingCount,
      description: body.description ?? existingPrize.description,
      imageUrl: body.imageUrl ?? existingPrize.imageUrl,
      sortOrder: body.sortOrder ?? existingPrize.sortOrder,
      updatedAt: now(),
    };

    storage.updatePrize(updatedPrize);

    return NextResponse.json<ApiResponse<Prize>>({
      success: true,
      data: updatedPrize,
      message: '奖品更新成功',
    });
  } catch (error) {
    console.error('更新奖品失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除奖品
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: '缺少奖品 ID',
        },
        { status: 400 }
      );
    }

    const existingPrize = storage.getPrizeById(id);
    if (!existingPrize) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: '奖品不存在',
        },
        { status: 404 }
      );
    }

    storage.deletePrize(id);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '奖品删除成功',
    });
  } catch (error) {
    console.error('删除奖品失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
