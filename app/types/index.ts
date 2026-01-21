/**
 * 数据模型定义
 * 这些类型设计为数据库友好的结构
 * 后期可直接迁移到数据库（如 Prisma Schema）
 */

// ==================== 基础类型 ====================

export type PrizeLevel = "special" | "first" | "second" | "third" | "lucky";

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 奖品（Prize）====================

export interface Prize extends BaseEntity {
  name: string; // 奖品名称
  level: PrizeLevel; // 奖项等级
  totalCount: number; // 总数量
  remainingCount: number; // 剩余数量
  description?: string; // 奖品描述
  imageUrl?: string; // 奖品图片
  sortOrder: number; // 排序顺序（数字越小越优先）
}

export interface CreatePrizeDTO {
  name: string;
  level: PrizeLevel;
  totalCount: number;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface UpdatePrizeDTO extends Partial<CreatePrizeDTO> {
  id: string;
}

// ==================== 用户（User）====================

export interface User extends BaseEntity {
  name: string; // 姓名
  department?: string; // 部门
  employeeId?: string; // 工号
  phone?: string; // 手机号
  hasWon: boolean; // 是否已中奖
}

export interface CreateUserDTO {
  name: string;
  department?: string;
  employeeId?: string;
  phone?: string;
}

export interface ImportUsersDTO {
  users: CreateUserDTO[];
}

// ==================== 抽奖记录（DrawRecord）====================

export interface DrawRecord extends BaseEntity {
  prizeId: string; // 奖品 ID
  prizeName: string; // 奖品名称（冗余，避免关联查询）
  prizeLevel: PrizeLevel; // 奖项等级（冗余）
  userId: string; // 中奖用户 ID
  userName: string; // 中奖用户姓名（冗余）
  round: number; // 第几轮抽奖
}

export interface CreateDrawRecordDTO {
  prizeId: string;
  userId: string;
  round: number;
}

// ==================== 抽奖规则（Rule）====================

export interface Rule extends BaseEntity {
  allowRepeatWin: boolean; // 是否允许重复中奖
  drawCountPerRound: number; // 每轮抽奖数量
  currentRound: number; // 当前抽奖轮数
}

export interface UpdateRuleDTO {
  allowRepeatWin?: boolean;
  drawCountPerRound?: number;
}

// ==================== 样式风格配置（Theme）====================

export type ThemeStyle = "gradient" | "neon" | "elegant" | "festive";

export interface Theme extends BaseEntity {
  name: string; // 主题名称
  style: ThemeStyle; // 风格类型
  primaryColor: string; // 主色调
  secondaryColor: string; // 辅助色
  backgroundColor: string; // 背景色
  textColor: string; // 文字颜色
  isActive: boolean; // 是否激活使用
}

export interface CreateThemeDTO {
  name: string;
  style: ThemeStyle;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface UpdateThemeDTO extends Partial<CreateThemeDTO> {
  id: string;
  isActive?: boolean;
}

// ==================== 抽奖请求/响应 ====================

export interface DrawRequest {
  prizeId: string; // 要抽取的奖品 ID
  count?: number; // 抽取数量（默认使用规则配置）
}

export interface DrawResponse {
  success: boolean;
  winners: DrawRecord[];
  remainingCount: number;
  message?: string;
}

// ==================== API 响应包装 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== 奖项等级显示配置 ====================

export const PRIZE_LEVEL_CONFIG: Record<
  PrizeLevel,
  { label: string; color: string }
> = {
  special: { label: "特等奖", color: "#FFD700" },
  first: { label: "一等奖", color: "#FF6B6B" },
  second: { label: "二等奖", color: "#4ECDC4" },
  third: { label: "三等奖", color: "#45B7D1" },
  lucky: { label: "幸运奖", color: "#96CEB4" },
};

// ==================== 预设主题配置 ====================

export const THEME_PRESETS: Record<
  ThemeStyle,
  {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    gradient: string;
    description: string;
  }
> = {
  gradient: {
    name: "渐变紫粉",
    primaryColor: "#A855F7",
    secondaryColor: "#EC4899",
    backgroundColor: "from-indigo-950 via-purple-950 to-pink-950",
    textColor: "#FFFFFF",
    gradient: "from-purple-600 to-pink-600",
    description: "经典的紫色到粉色渐变，梦幻浪漫",
  },
  neon: {
    name: "霓虹赛博",
    primaryColor: "#00FFFF",
    secondaryColor: "#FF00FF",
    backgroundColor: "from-gray-950 via-slate-950 to-zinc-950",
    textColor: "#00FFFF",
    gradient: "from-cyan-500 to-fuchsia-500",
    description: "赛博朋克风格，霓虹灯效果",
  },
  elegant: {
    name: "优雅金蓝",
    primaryColor: "#D4AF37",
    secondaryColor: "#1E40AF",
    backgroundColor: "from-slate-950 via-blue-950 to-indigo-950",
    textColor: "#FCD34D",
    gradient: "from-amber-500 to-blue-700",
    description: "金色与蓝色搭配，高贵典雅",
  },
  festive: {
    name: "喜庆红金",
    primaryColor: "#DC2626",
    secondaryColor: "#F59E0B",
    backgroundColor: "from-red-950 via-orange-950 to-yellow-950",
    textColor: "#FEF3C7",
    gradient: "from-red-600 to-amber-500",
    description: "红色与金色，喜庆热烈",
  },
};
