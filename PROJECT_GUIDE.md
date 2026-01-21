# 年会抽奖系统 - 项目说明文档

## 项目概述

这是一个完全基于 Next.js 的全栈年会抽奖系统，使用单体架构，不前后端分离。

**技术栈**：
- Next.js 16 (App Router)
- React 19
- TypeScript
- shadcn/ui + Tailwind CSS
- xlsx (Excel 导入)

## 项目结构

```
my-app/
├── app/                          # App Router 应用目录
│   ├── api/                      # Route Handlers (后端 API)
│   │   ├── draw/route.ts         # 抽奖 API
│   │   ├── prizes/route.ts       # 奖品管理 API
│   │   ├── users/route.ts        # 人员管理 API
│   │   ├── records/route.ts      # 抽奖记录 API
│   │   └── rules/route.ts        # 抽奖规则 API
│   ├── admin/                    # 管理后台页面
│   │   ├── layout.tsx            # 后台布局（导航）
│   │   ├── page.tsx              # 数据概览
│   │   ├── prizes/page.tsx       # 奖品管理
│   │   ├── users/page.tsx        # 人员管理（含 Excel 导入）
│   │   └── records/page.tsx      # 抽奖记录
│   ├── lib/                      # 业务逻辑层
│   │   ├── repositories/         # 数据存储层
│   │   │   └── memory-storage.ts # 内存存储实现（可替换为数据库）
│   │   └── services/             # 服务层
│   │       └── draw-service.ts   # 抽奖核心逻辑
│   ├── types/                    # 类型定义
│   │   └── index.ts              # 数据模型类型
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 抽奖大屏（首页）
├── components/                   # 组件目录
│   ├── draw/                     # 抽奖相关组件
│   │   └── draw-screen.tsx       # 抽奖大屏组件
│   └── ui/                       # shadcn/ui 组件
├── lib/                          # 工具函数
│   └── utils.ts                  # 通用工具（cn 函数等）
└── package.json
```

## 核心功能

### 1. 抽奖大屏（首页 `/`）
- 全屏展示，沉浸式体验
- 实时显示当前奖品信息
- 滚动抽奖动画效果
- 中奖结果高亮展示
- 右上角管理入口

### 2. 奖品管理（`/admin/prizes`）
- 添加/编辑/删除奖品
- 奖项等级配置（特等奖/一等奖/二等奖/三等奖/幸运奖）
- 数量管理（总数/剩余数）
- 排序配置

### 3. 人员管理（`/admin/users`）
- Excel 批量导入
- 人员列表展示
- 已中奖标记
- 统计信息（总数/待抽奖/已中奖）
- 清空所有用户

### 4. 抽奖记录（`/admin/records`）
- 所有中奖记录
- 按轮次分组展示
- 筛选功能
- 时间戳记录

## 使用指南

### 启动项目

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

### 使用流程

1. **进入管理后台**
   - 访问 `http://localhost:3000/admin`
   - 或在抽奖大屏点击右上角"管理后台"按钮

2. **添加奖品**
   - 进入"奖品管理"页面
   - 填写奖品信息并提交
   - 建议按优先级排序（特等奖 → 一等奖 → ... → 幸运奖）

3. **导入人员**
   - 进入"人员管理"页面
   - 下载 Excel 模板
   - 按模板格式填写人员信息
   - 上传 Excel 文件并导入

4. **开始抽奖**
   - 返回抽奖大屏首页
   - 选择要抽取的奖品
   - 点击"开始抽奖"按钮
   - 等待滚动动画结束
   - 查看中奖结果

5. **查看记录**
   - 进入"抽奖记录"页面
   - 查看所有中奖记录
   - 支持按轮次筛选

## 数据模型

### Prize（奖品）
```typescript
{
  id: string;              // 奖品 ID
  name: string;            // 奖品名称
  level: PrizeLevel;       // 奖项等级
  totalCount: number;      // 总数量
  remainingCount: number;  // 剩余数量
  description?: string;    // 奖品描述
  imageUrl?: string;       // 奖品图片
  sortOrder: number;       // 排序顺序
  createdAt: Date;
  updatedAt: Date;
}
```

### User（用户）
```typescript
{
  id: string;           // 用户 ID
  name: string;         // 姓名
  department?: string;  // 部门
  employeeId?: string;  // 工号
  phone?: string;       // 手机号
  hasWon: boolean;      // 是否已中奖
  createdAt: Date;
  updatedAt: Date;
}
```

### DrawRecord（抽奖记录）
```typescript
{
  id: string;           // 记录 ID
  prizeId: string;      // 奖品 ID
  prizeName: string;    // 奖品名称（冗余）
  prizeLevel: PrizeLevel; // 奖项等级（冗余）
  userId: string;       // 中奖用户 ID
  userName: string;     // 中奖用户姓名（冗余）
  round: number;        // 第几轮抽奖
  createdAt: Date;
  updatedAt: Date;
}
```

### Rule（抽奖规则）
```typescript
{
  id: string;                // 规则 ID
  allowRepeatWin: boolean;   // 是否允许重复中奖
  drawCountPerRound: number; // 每轮抽奖数量
  currentRound: number;      // 当前抽奖轮数
  createdAt: Date;
  updatedAt: Date;
}
```

## API 接口文档

### POST /api/draw
执行抽奖

**请求体**：
```json
{
  "prizeId": "string",   // 必填，奖品 ID
  "count": 1             // 可选，抽取数量
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "winners": [...],      // 中奖记录数组
    "remainingCount": 5,   // 剩余数量
    "message": "成功抽取 1 位中奖者"
  }
}
```

### GET /api/prizes
获取所有奖品

### POST /api/prizes
创建奖品

### PUT /api/prizes
更新奖品

### DELETE /api/prizes?id={id}
删除奖品

### GET /api/users
获取所有用户

### POST /api/users
批量创建用户

### DELETE /api/users
清空所有用户

### GET /api/records
获取所有抽奖记录

### GET /api/rules
获取抽奖规则

### PUT /api/rules
更新抽奖规则

## 后期扩展方案

### 当前存储方案
- 使用内存存储（`app/lib/repositories/memory-storage.ts`）
- 数据保存在运行时内存中
- 服务器重启后数据丢失

### 扩展为数据库存储

#### 步骤 1：选择数据库
推荐使用 Prisma ORM + SQLite/PostgreSQL

```bash
pnpm add prisma @prisma/client
npx prisma init
```

#### 步骤 2：定义 Schema
创建 `prisma/schema.prisma`：
```prisma
model Prize {
  id            String   @id @default(uuid())
  name          String
  level         String
  totalCount    Int
  remainingCount Int
  description   String?
  imageUrl      String?
  sortOrder     Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  drawRecords   DrawRecord[]
}

model User {
  id          String   @id @default(uuid())
  name        String
  department  String?
  employeeId  String?  @unique
  phone       String?
  hasWon      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  drawRecords DrawRecord[]
}

model DrawRecord {
  id         String   @id @default(uuid())
  prizeId    String
  prizeName  String
  prizeLevel String
  userId     String
  userName   String
  round      Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  prize Prize @relation(fields: [prizeId], references: [id])
  user  User  @relation(fields: [userId], references: [id])
}

model Rule {
  id               String   @id @default(uuid())
  allowRepeatWin   Boolean  @default(false)
  drawCountPerRound Int     @default(1)
  currentRound     Int      @default(1)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

#### 步骤 3：替换存储层
创建 `app/lib/repositories/database-storage.ts`：
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DatabaseStorage {
  // 实现与 memory-storage.ts 相同的接口
  // 方法签名保持一致，只替换实现
}

export const storage = new DatabaseStorage();
```

**重要**：只需修改 `app/lib/repositories/memory-storage.ts` 中的实现，业务逻辑层（`draw-service.ts`）和 API 层（`route.ts`）完全不需要修改！

#### 步骤 4：迁移数据
```bash
npx prisma migrate dev --name init
npx prisma db push
```

### 并发控制方案

当前版本不支持高并发，如需要：

1. **使用数据库事务**：
   ```typescript
   await prisma.$transaction(async (tx) => {
     // 抽奖逻辑
   });
   ```

2. **添加乐观锁**：
   ```prisma
   model Prize {
     version Int @default(0)  // 版本号
   }
   ```

3. **使用 Redis 分布式锁**（适合多服务器部署）

### 鉴权方案

如需添加登录功能：

1. 使用 NextAuth.js
2. 添加中间件保护管理后台
3. 在 API 中验证用户身份

```bash
pnpm add next-auth
```

## 设计原则

### 已遵循的原则

1. **架构清晰**：分层设计（API → Service → Repository）
2. **接口抽象**：存储层接口统一，方便替换
3. **类型安全**：全面使用 TypeScript
4. **易于维护**：代码结构清晰，命名规范
5. **用户体验**：管理功能完善，操作简单

### 注意事项

1. **当前限制**：
   - 数据存储在内存中，重启丢失
   - 单机部署，不支持横向扩展
   - 无并发控制

2. **适用场景**：
   - 小型年会抽奖（< 1000 人）
   - 单次活动使用
   - 内网环境部署

3. **性能建议**：
   - 人员数量 > 500 时建议使用数据库
   - 多场次抽奖建议使用数据库
   - 需要数据备份建议使用数据库

## 故障排查

### 常见问题

1. **导入 Excel 失败**
   - 检查 Excel 格式是否正确
   - 确保包含"姓名"列
   - 列名可以是中文或英文

2. **抽奖无响应**
   - 检查浏览器控制台错误
   - 确保有剩余奖品
   - 确有待抽奖候选人

3. **页面空白**
   - 运行 `pnpm build` 检查编译错误
   - 重启开发服务器

## 贡献指南

扩展功能时：

1. **添加新页面**：在 `app/admin/` 下创建新目录
2. **添加新 API**：在 `app/api/` 下创建新目录
3. **添加新组件**：在 `components/` 下创建对应目录
4. **遵循现有架构**：保持分层设计

## 许可证

MIT
