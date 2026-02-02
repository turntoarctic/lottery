/**
 * API 类型定义
 */

// 通用 API 响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 错误类型
export class APIError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super('VALIDATION_ERROR', 400, message);
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super('NOT_FOUND', 404, `${resource} 不存在`);
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super('CONFLICT', 409, message);
  }
}
