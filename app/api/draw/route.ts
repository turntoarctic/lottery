/**
 * 抽奖 API Route
 * POST /api/draw - 执行抽奖
 *
 * 使用标准化的 DTO 验证和响应格式
 */

import { NextRequest } from 'next/server';
import { drawService } from '../../lib/services/draw-service';
import { ResponseHelper, withErrorHandler } from '@/lib/api/response';
import { ExecuteDrawSchema } from '@/lib/dtos';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 解析并验证请求体
  const body = await request.json();
  const dto = ExecuteDrawSchema.parse(body); // 自动验证,不符合则抛出错误

  // 执行抽奖
  const result = await drawService.draw({
    prizeId: dto.prizeId,
    count: dto.count || 1,
  });

  if (!result.success) {
    return ResponseHelper.error(result.message || '抽奖失败', 400);
  }

  return ResponseHelper.success(result, `成功抽取 ${result.winners.length} 位中奖者`);
});
