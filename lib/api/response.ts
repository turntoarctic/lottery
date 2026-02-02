import { NextResponse } from 'next/server';
import type { ApiResponse } from './types';

/**
 * 统一 API 响应工具
 */
export class ResponseHelper {
  /**
   * 成功响应
   */
  static success<T>(data: T, message?: string, status = 200) {
    const body: ApiResponse<T> = {
      success: true,
      data,
      message,
    };

    return NextResponse.json(body, { status });
  }

  /**
   * 错误响应
   */
  static error(message: string, status = 500, code?: string) {
    const body: ApiResponse = {
      success: false,
      error: message,
    };

    return NextResponse.json(body, { status });
  }

  /**
   * 验证错误
   */
  static validationError(message: string) {
    return this.error(message, 400, 'VALIDATION_ERROR');
  }

  /**
   * 未找到错误
   */
  static notFound(resource = '资源') {
    return this.error(`${resource} 不存在`, 404, 'NOT_FOUND');
  }

  /**
   * 冲突错误
   */
  static conflict(message: string) {
    return this.error(message, 409, 'CONFLICT');
  }

  /**
   * 服务器错误
   */
  static serverError(message = '服务器内部错误') {
    return this.error(message, 500, 'SERVER_ERROR');
  }
}

/**
 * 错误处理中间件
 */
export function withErrorHandler(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof Error) {
        // 根据错误类型返回不同的响应
        if (error.message.includes('验证') || error.message.includes('格式')) {
          return ResponseHelper.validationError(error.message);
        }
        if (error.message.includes('不存在')) {
          return ResponseHelper.notFound();
        }
        if (error.message.includes('冲突') || error.message.includes('已存在')) {
          return ResponseHelper.conflict(error.message);
        }
      }

      return ResponseHelper.serverError();
    }
  };
}
