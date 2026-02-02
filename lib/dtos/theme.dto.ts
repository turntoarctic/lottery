import { z } from 'zod';

/**
 * 主题 DTO
 */

// 预设主题枚举
export const ThemePresetSchema = z.enum([
  'gradient',
  'neon',
  'elegant',
  'festive',
]);

// 创建主题 DTO
export const CreateThemeSchema = z.object({
  name: z.string().min(1, '主题名称不能为空').max(50, '主题名称最多50个字符'),
  preset: ThemePresetSchema,
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, '主色格式不正确').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, '辅助色格式不正确').optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, '背景色格式不正确').optional(),
  isDefault: z.boolean().default(false),
});

// 更新主题 DTO
export const UpdateThemeSchema = CreateThemeSchema.partial().extend({
  id: z.string().min(1, 'ID不能为空'),
});

// 导出类型
export type CreateThemeDTO = z.infer<typeof CreateThemeSchema>;
export type UpdateThemeDTO = z.infer<typeof UpdateThemeSchema>;
