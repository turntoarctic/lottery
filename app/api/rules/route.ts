/**
 * 抽奖规则 API Routes
 * GET    /api/rules - 获取抽奖规则
 * PUT    /api/rules - 更新抽奖规则
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../lib/repositories/memory-storage';
import type { Rule, UpdateRuleDTO, ApiResponse } from '../../types';

// GET - 获取抽奖规则
export async function GET() {
  try {
    const rule = storage.getRule();
    return NextResponse.json<ApiResponse<Rule>>({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('获取抽奖规则失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

// PUT - 更新抽奖规则
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateRuleDTO = await request.json();

    // 更新规则
    storage.updateRule(body);

    const updatedRule = storage.getRule();

    return NextResponse.json<ApiResponse<Rule>>({
      success: true,
      data: updatedRule,
      message: '规则更新成功',
    });
  } catch (error) {
    console.error('更新抽奖规则失败:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
