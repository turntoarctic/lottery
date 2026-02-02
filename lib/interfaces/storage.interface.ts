import type { Prize, User, DrawRecord, Rule, Theme } from '@/app/types';

/**
 * 存储接口
 * 定义所有数据访问方法的抽象
 */
export interface IStorage {
  // ============ 奖品管理 ============
  getPrizes(): Promise<Prize[]>;
  getPrizeById(id: string): Promise<Prize | null>;
  createPrize(data: Omit<Prize, 'id'>): Promise<Prize>;
  updatePrize(id: string, data: Partial<Prize>): Promise<Prize | null>;
  deletePrize(id: string): Promise<boolean>;

  // ============ 用户管理 ============
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUsers(users: Omit<User, 'id'>[]): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  clearUsers(): Promise<void>;

  // ============ 抽奖记录 ============
  getRecords(): Promise<DrawRecord[]>;
  createRecord(record: Omit<DrawRecord, 'id' | 'drawTime'>): Promise<DrawRecord>;
  clearRecords(): Promise<void>;

  // ============ 规则管理 ============
  getRule(): Promise<Rule | null>;
  updateRule(data: Partial<Rule>): Promise<Rule>;

  // ============ 主题管理 ============
  getThemes(): Promise<Theme[]>;
  getThemeById(id: string): Promise<Theme | null>;
  createTheme(data: Omit<Theme, 'id'>): Promise<Theme>;
  updateTheme(id: string, data: Partial<Theme>): Promise<Theme | null>;
  deleteTheme(id: string): Promise<boolean>;
}
