import { IStorage } from './interfaces/storage.interface';
import { MemoryStorage } from './repositories/memory-storage';
import { DrawService } from './services/draw-service';

/**
 * 简单的依赖注入容器
 * 用于管理服务实例和依赖关系
 */
class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * 注册服务工厂
   */
  register<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  /**
   * 获取服务实例（单例）
   */
  get<T>(key: string): T {
    // 如果已创建实例，直接返回
    if (this.services.has(key)) {
      return this.services.get(key);
    }

    // 如果有工厂函数，创建新实例
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();
      this.services.set(key, instance);
      return instance;
    }

    throw new Error(`Service not found: ${key}`);
  }

  /**
   * 清除所有实例（主要用于测试）
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * 注册并立即获取实例
   */
  registerAndGet<T>(key: string, factory: () => T): T {
    this.register(key, factory);
    return this.get<T>(key);
  }
}

// 初始化容器
const container = Container.getInstance();

// 注册存储实现
container.register<IStorage>('storage', () => new MemoryStorage());

// 注册服务（依赖存储）
container.register('drawService', () => {
  const storage = container.get<IStorage>('storage');
  return new DrawService(storage);
});

export default container;
