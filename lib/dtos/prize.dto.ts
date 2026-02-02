import { z } from 'zod';

/**
 * 奖品 DTO (Data Transfer Object)
 * 使用 Zod 进行运行时验证
 */

// 奖品级别枚举
export const PrizeLevelSchema = z.enum(['special', 'first', 'second', 'third']);

// 创建奖品 DTO
export const CreatePrizeSchema = z.object({
  name: z.string().min(1, '奖品名称不能为空').max(100, '奖品名称最多100个字符'),
  level: PrizeLevelSchema,
  totalCount: z.number().int().min(1, '总数必须大于0'),
  sortOrder: z.number().int().optional().default(0),
  description: z.string().max(500, '描述最多500个字符').optional(),
  imageUrl: z.string().url('图片URL格式不正确').optional(),
});

// 更新奖品 DTO
export const UpdatePrizeSchema = CreatePrizeSchema.partial().extend({
  id: z.string().min(1, 'ID不能为空'),
});

// 批量创建奖品 DTO
export const BulkCreatePrizeSchema = z.array(CreatePrizeSchema).min(1, '至少需要一个奖品');

// 导出类型
export type CreatePrizeDTO = z.infer<typeof CreatePrizeSchema>;
export type UpdatePrizeDTO = z.infer<typeof UpdatePrizeSchema>;
export type BulkCreatePrizeDTO = z.infer<typeof BulkCreatePrizeSchema>;
