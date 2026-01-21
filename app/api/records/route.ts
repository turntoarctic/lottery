/**
 * 抽奖记录 API Routes
 * GET /api/records - 获取所有抽奖记录
 */

import { NextResponse } from 'next/server';
import { storage } from '../../lib/repositories/memory-storage';
import type { DrawRecord, ApiResponse } from '../../types';

// GET - 获取所有抽奖记录
export async function GET() {
  try {
    const records = storage.getDrawRecords();
    return NextResponse.json<ApiResponse<DrawRecord[]>>({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('获取抽奖记录失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
