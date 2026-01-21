/**
 * 抽奖 API Route
 * POST /api/draw - 执行抽奖
 */

import { NextRequest, NextResponse } from 'next/server';
import { drawService } from '../../lib/services/draw-service';
import type { DrawRequest, ApiResponse, DrawResponse } from '../../types';

export async function POST(request: NextRequest) {
  try {
    const body: DrawRequest = await request.json();
    console.log('POST /api/draw - 请求体:', body);

    // 参数验证
    if (!body.prizeId) {
      console.error('缺少奖品 ID');
      return NextResponse.json<ApiResponse<DrawResponse>>(
        {
          success: false,
          error: '缺少奖品 ID',
        },
        { status: 400 }
      );
    }

    // 执行抽奖
    const result = await drawService.draw(body);
    console.log('抽奖结果:', result);

    if (!result.success) {
      console.error('抽奖失败:', result.message);
      return NextResponse.json<ApiResponse<DrawResponse>>(
        {
          success: false,
          data: result,
          error: result.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<DrawResponse>>({
      success: true,
      data: result,
      message: `成功抽取 ${result.winners.length} 位中奖者`,
    });
  } catch (error) {
    console.error('抽奖失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
