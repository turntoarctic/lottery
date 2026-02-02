/**
 * 内存存储实现
 * 后期可替换为数据库实现（Prisma / Drizzle 等）
 * 接口保持不变，只需替换这个文件的实现
 */

import type { Prize, User, DrawRecord, Rule, Theme } from '@/app/types';

// ==================== 存储容器 ====================

export class InMemoryStorage {
  private prizes: Map<string, Prize> = new Map();
  private users: Map<string, User> = new Map();
  private drawRecords: Map<string, DrawRecord> = new Map();
  private rule: Rule | null = null;
  private themes: Map<string, Theme> = new Map();

  constructor() {
    this.initializeRule();
    this.initializeDefaultTheme();
    this.initializeSampleData();
  }

  private initializeRule() {
    // 默认抽奖规则
    this.rule = {
      id: 'default',
      allowRepeatWin: false,
      drawCountPerRound: 1,
      currentRound: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private initializeDefaultTheme() {
    // 默认主题（渐变紫粉）
    const defaultTheme: Theme = {
      id: 'default-gradient',
      name: '渐变紫粉',
      style: 'gradient',
      primaryColor: '#A855F7',
      secondaryColor: '#EC4899',
      backgroundColor: 'from-indigo-950 via-purple-950 to-pink-950',
      textColor: '#FFFFFF',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.themes.set(defaultTheme.id, defaultTheme);
  }

  private initializeSampleData() {
    // 只在没有数据时初始化
    if (this.prizes.size === 0) {
      // 示例奖品
      const samplePrizes: Prize[] = [
        {
          id: 'prize-1',
          name: 'iPhone 15 Pro',
          level: 'special',
          totalCount: 1,
          remainingCount: 1,
          description: '最新款苹果手机',
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'prize-2',
          name: 'iPad Air',
          level: 'first',
          totalCount: 3,
          remainingCount: 3,
          description: '苹果平板电脑',
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'prize-3',
          name: 'AirPods Pro',
          level: 'second',
          totalCount: 5,
          remainingCount: 5,
          description: '无线降噪耳机',
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'prize-4',
          name: '小米手环',
          level: 'third',
          totalCount: 10,
          remainingCount: 10,
          description: '智能运动手环',
          sortOrder: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      samplePrizes.forEach(prize => {
        this.prizes.set(prize.id, prize);
      });
    }

    if (this.users.size === 0) {
      // 示例用户
      const sampleUsers: User[] = [];
      const departments = ['技术部', '市场部', '人事部', '财务部', '运营部'];

      for (let i = 1; i <= 50; i++) {
        sampleUsers.push({
          id: `user-${i}`,
          name: `员工${i}`,
          department: departments[Math.floor(Math.random() * departments.length)],
          employeeId: `EMP${String(i).padStart(3, '0')}`,
          hasWon: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      sampleUsers.forEach(user => {
        this.users.set(user.id, user);
      });
    }
  }

  // ==================== Prize ====================

  getPrizes(): Prize[] {
    return Array.from(this.prizes.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getPrizeById(id: string): Prize | undefined {
    return this.prizes.get(id);
  }

  createPrize(prize: Prize): void {
    this.prizes.set(prize.id, prize);
  }

  updatePrize(prize: Prize): void {
    this.prizes.set(prize.id, prize);
  }

  deletePrize(id: string): void {
    this.prizes.delete(id);
  }

  // ==================== User ====================

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUsersByIds(ids: string[]): User[] {
    return ids.map(id => this.users.get(id)).filter(Boolean) as User[];
  }

  createUser(user: User): void {
    this.users.set(user.id, user);
  }

  updateUser(user: User): void {
    this.users.set(user.id, user);
  }

  deleteUser(id: string): void {
    this.users.delete(id);
  }

  clearUsers(): void {
    this.users.clear();
  }

  getEligibleUsers(): User[] {
    // 获取未中奖的用户
    return this.getUsers().filter(user => !user.hasWon);
  }

  getAllUsersForDraw(): User[] {
    // 获取所有用户（用于允许重复中奖的情况）
    return this.getUsers();
  }

  // ==================== DrawRecord ====================

  getDrawRecords(): DrawRecord[] {
    return Array.from(this.drawRecords.values()).sort((a, b) => {
      // 按轮次和时间倒序
      if (a.round !== b.round) return b.round - a.round;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  getDrawRecordsByRound(round: number): DrawRecord[] {
    return this.getDrawRecords().filter(record => record.round === round);
  }

  getDrawRecordsByUserId(userId: string): DrawRecord[] {
    return this.getDrawRecords().filter(record => record.userId === userId);
  }

  createDrawRecord(record: DrawRecord): void {
    this.drawRecords.set(record.id, record);
  }

  // ==================== Rule ====================

  getRule(): Rule {
    return this.rule!;
  }

  updateRule(rule: Partial<Rule>): void {
    this.rule = {
      ...this.rule!,
      ...rule,
      updatedAt: new Date(),
    };
  }

  incrementRound(): void {
    if (this.rule) {
      this.rule.currentRound += 1;
      this.rule.updatedAt = new Date();
    }
  }

  // ==================== Theme ====================

  getThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  getThemeById(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  getActiveTheme(): Theme | undefined {
    return Array.from(this.themes.values()).find(theme => theme.isActive);
  }

  createTheme(theme: Theme): void {
    // 如果新主题是激活的，将其他主题设为非激活
    if (theme.isActive) {
      this.themes.forEach(t => {
        t.isActive = false;
      });
    }
    this.themes.set(theme.id, theme);
  }

  updateTheme(theme: Theme): void {
    // 如果更新的主题是激活的，将其他主题设为非激活
    if (theme.isActive) {
      this.themes.forEach(t => {
        if (t.id !== theme.id) {
          t.isActive = false;
        }
      });
    }
    this.themes.set(theme.id, theme);
  }

  deleteTheme(id: string): void {
    this.themes.delete(id);
  }

  setActiveTheme(id: string): void {
    this.themes.forEach(theme => {
      theme.isActive = theme.id === id;
    });
  }
}

// ==================== 单例导出 ====================

export const storage = new InMemoryStorage();

// ==================== 工具函数 ====================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function now(): Date {
  return new Date();
}
