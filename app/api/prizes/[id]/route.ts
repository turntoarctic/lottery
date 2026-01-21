/**
 * 单个奖品详情 API
 * GET /api/prizes/[id] - 获取奖品详情及其中奖记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../lib/repositories/memory-storage';
import type { ApiResponse } from '../../../types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const prize = storage.getPrizeById(id);
    if (!prize) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: '奖品不存在',
        },
        { status: 404 }
      );
    }

    // 获取该奖品的所有中奖记录
    const allRecords = storage.getDrawRecords();
    const prizeRecords = allRecords.filter(record => record.prizeId === id);

    // 获取中奖用户信息
    const winners = prizeRecords.map(record => {
      const user = storage.getUserById(record.userId);
      return {
        ...record,
        userDepartment: user?.department,
        userEmployeeId: user?.employeeId,
      };
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        prize,
        winners,
      },
    });
  } catch (error) {
    console.error('获取奖品详情失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
