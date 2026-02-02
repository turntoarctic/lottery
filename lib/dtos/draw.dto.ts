import { z } from 'zod';

/**
 * 抽奖请求 DTO
 */

// 执行抽奖 DTO
export const ExecuteDrawSchema = z.object({
  prizeId: z.string().min(1, '奖品ID不能为空'),
  count: z.number().int().min(1, '抽奖人数必须大于0').optional().default(1),
});

// 导出类型
export type ExecuteDrawDTO = z.infer<typeof ExecuteDrawSchema>;
