import { z } from 'zod';

/**
 * 用户 DTO
 */

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

// 创建用户 DTO
export const CreateUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最多50个字符'),
  department: z.string().min(1, '部门不能为空').max(50, '部门最多50个字符'),
  phone: z.string().regex(phoneRegex, '手机号格式不正确').optional(),
  employeeId: z.string().max(50, '工号最多50个字符').optional(),
  email: z.string().email('邮箱格式不正确').optional(),
});

// 批量创建用户 DTO
export const BulkCreateUserSchema = z.array(CreateUserSchema).min(1, '至少需要一个用户');

// 更新用户 DTO
export const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: z.string().min(1, 'ID不能为空'),
  hasWon: z.boolean().optional(),
});

// 导出类型
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
export type BulkCreateUserDTO = z.infer<typeof BulkCreateUserSchema>;
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
