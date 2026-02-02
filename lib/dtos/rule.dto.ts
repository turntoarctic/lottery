import { z } from 'zod';

/**
 * 抽奖规则 DTO
 */

// 创建规则 DTO
export const CreateRuleSchema = z.object({
  removeAfterWin: z.boolean().default(true),
  allowMultipleWins: z.boolean().default(false),
  maxWinnersPerDraw: z.number().int().min(1, '单次抽奖人数必须大于0').default(1),
});

// 更新规则 DTO
export const UpdateRuleSchema = CreateRuleSchema.partial();

// 导出类型
export type CreateRuleDTO = z.infer<typeof CreateRuleSchema>;
export type UpdateRuleDTO = z.infer<typeof UpdateRuleSchema>;
