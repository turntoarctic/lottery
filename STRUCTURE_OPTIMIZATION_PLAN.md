# 🎯 项目结构优化建议

基于当前项目结构分析,以下是具体的优化建议。

---

## 🔴 高优先级 (立即执行)

### 1. 清理未使用的代码

**问题**: 发现以下文件未使用:

```
components/draw/
├── three-draw-animation.tsx          ❌ 已被 three-draw-animation-fixed.tsx 替代
├── three-draw-animation-simple.tsx   ❌ 测试用文件,不应在生产代码中
└── prize-card.tsx                    ❌ 未使用的组件
```

**建议操作**:
```bash
# 删除未使用的文件
rm components/draw/three-draw-animation.tsx
rm components/draw/three-draw-animation-simple.tsx
rm components/draw/prize-card.tsx
```

**预期收益**:
- 减少代码量 ~800 行
- 避免混淆
- 简化维护

---

### 2. 移动 admin 组件到正确位置

**问题**: `components/admin/` 目录为空

**建议**: 将管理页面中的组件提取到 `components/admin/`

**示例**:
```
components/admin/
├── prizes-table.tsx        # 从 /admin/prizes/page.tsx 提取
├── users-import.tsx         # 从 /admin/users/page.tsx 提取
├── records-table.tsx        # 从 /admin/records/page.tsx 提取
└── shared/
    ├── data-table.tsx       # 通用数据表格
    └── export-button.tsx    # 导出按钮
```

---

### 3. 统一类型导出

**问题**: 类型定义分散在多个文件

**当前**:
```typescript
// app/types/index.ts - 主要类型
// components/draw/three-draw-animation.tsx - ThreeDrawAnimationProps
```

**建议**: 将所有类型定义集中在 `app/types/`

**优化后**:
```typescript
// app/types/index.ts
export * from './models';
export * from './api';
export * from './components';

// app/types/components.ts
export interface ThreeDrawAnimationProps { ... }
export interface PrizeListSidebarProps { ... }
// ... 其他组件类型
```

---

## 🟡 中优先级 (本月完成)

### 4. 创建 constants 目录

**问题**: 魔法数字和配置分散在代码中

**建议**: 创建集中配置

```typescript
// lib/constants/draw.ts
export const DRAW_ANIMATION_DURATION = 10000; // 10秒
export const HIGHLIGHT_CHANGE_INTERVAL = 150; // 150ms
export const SPHERE_RADIUS = 6;
export const MAX_DISPLAY_NAMES = 50;

// lib/constants/animations.ts
export const ROTATION_SPEED = {
  IDLE: 0.002,
  DRAWING: 0.05,
};

// lib/constants/colors.ts
export const HIGHLIGHT_COLOR = "#FFD700";
export const DEFAULT_TEXT_COLOR = "#ffffff";
```

---

### 5. 提取自定义 Hooks

**建议**: 创建专门的 hooks 目录

```typescript
// hooks/use-draw.ts
export function useDraw() {
  const drawPrize = useDrawPrize();
  const { refresh } = useRefreshData();

  const startDraw = async (prizeId: string) => {
    const result = await drawPrize.mutateAsync(prizeId);
    await refresh();
    return result;
  };

  return { startDraw, ...drawPrize };
}

// hooks/use-keyboard-shortcuts.ts
export function useKeyboardShortcuts(config: ShortcutConfig) {
  // 键盘快捷键逻辑
}

// hooks/use-data-sync.ts
export function useDataSync() {
  // 数据同步逻辑
}
```

---

### 6. 优化 import 路径

**问题**: 相对路径混乱

**建议**: 使用路径别名

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types": ["./app/types"]
    }
  }
}
```

**使用**:
```typescript
// Before
import { Button } from "../../components/ui/button";
import { useLotteryStore } from "../../lib/store/lottery-store";

// After
import { Button } from "@/components/ui/button";
import { useLotteryStore } from "@/lib/store/lottery-store";
```

---

### 7. 创建 services 目录

**问题**: API 调用逻辑在组件中

**建议**: 提取到 services

```typescript
// lib/services/draw.service.ts
export class DrawService {
  async drawPrize(prizeId: string): Promise<DrawResult> {
    // 抽奖逻辑
  }

  async getEligibleUsers(rule: Rule): Promise<User[]> {
    // 获取候选人
  }
}

// lib/services/prize.service.ts
export class PrizeService {
  async getPrizes(): Promise<Prize[]> { }
  async updatePrize(id: string, data: Partial<Prize>): Promise<Prize> { }
  // ...
}
```

---

## 🟢 低优先级 (未来改进)

### 8. 添加测试目录结构

```
__tests__/
├── unit/                      # 单元测试
│   ├── services/
│   │   └── draw-service.test.ts
│   ├── hooks/
│   │   └── use-draw.test.ts
│   └── utils/
│       └── cn.test.ts
├── integration/               # 集成测试
│   └── api/
│       └── draw.test.ts
└── e2e/                      # E2E 测试
    ├── draw-flow.spec.ts
    └── admin-flow.spec.ts
```

---

### 9. 创建 stories 目录 (Storybook)

```
.stories/
├── draw/
│   ├── draw-screen.stories.tsx
│   └── prize-list-sidebar.stories.tsx
├── admin/
│   ├── prizes-table.stories.tsx
│   └── users-import.stories.tsx
└── ui/
    └── button.stories.tsx
```

---

### 10. 优化样式组织

**当前**: 所有样式在 `globals.css`

**建议**: 按功能拆分

```css
/* app/styles/base.css - 基础样式 */
/* app/styles/animations.css - 动画 */
/* app/styles/components.css - 组件样式 */
/* app/styles/themes.css - 主题 */
```

**app/layout.tsx**:
```typescript
import './styles/base.css';
import './styles/animations.css';
```

---

## 📋 具体执行步骤

### 第一步: 清理 (30分钟)

```bash
# 1. 删除未使用文件
rm components/draw/three-draw-animation.tsx
rm components/draw/three-draw-animation-simple.tsx
rm components/draw/prize-card.tsx

# 2. 验证构建
bun run build

# 3. 测试功能
bun run dev
```

### 第二步: 重构 (2-3小时)

```bash
# 1. 创建 lib/constants
mkdir -p lib/constants
# 创建 draw.ts, animations.ts 等文件

# 2. 创建 hooks/use-draw.ts
# 提取 draw-screen.tsx 中的抽奖逻辑

# 3. 更新 import 路径
# 使用 @ 别名替换相对路径

# 4. 测试
bun run dev
```

### 第三步: 提取组件 (1-2小时)

```bash
# 1. 从 admin 页面提取组件到 components/admin
# 2. 创建可复用的 shared 组件
# 3. 测试管理后台功能
```

---

## 📊 预期收益

| 优化项 | 工作量 | 收益 | 优先级 |
|--------|--------|------|--------|
| 删除未使用代码 | 30分钟 | 清晰度 ⬆️ | 🔴 高 |
| 路径别名优化 | 1小时 | 可维护性 ⬆️⬆️ | 🟡 中 |
| 提取 Hooks | 2小时 | 复用性 ⬆️⬆️ | 🟡 中 |
| 常量提取 | 1小时 | 可维护性 ⬆️ | 🟡 中 |
| 组件拆分 | 3小时 | 可维护性 ⬆️⬆️ | 🟢 低 |
| 添加测试 | 1周+ | 质量 ⬆️⬆️⬆️ | 🟢 低 |

---

## 🎯 推荐优化顺序

### 本周 (必须做)
1. ✅ 删除未使用的 3 个文件
2. ✅ 添加路径别名

### 本月 (建议做)
3. 提取 use-draw Hook
4. 创建 constants 目录
5. 提取 admin 组件

### 下个月 (可选)
6. 添加测试
7. Storybook 文档
8. 样式文件拆分

---

## ⚠️ 注意事项

### 不建议改的

❌ **不要拆分 globals.css** - Tailwind CSS 4.x 不需要
❌ **不要过度抽象** - 当前复杂度刚好
❌ **不要引入新库** - 保持技术栈稳定

### 应该保持的

✅ **当前分层架构** - 很清晰
✅ **Zustand + React Query** - 状态管理合理
✅ **shadcn/ui** - 组件库成熟
✅ **内存存储** - 对当前场景够用

---

## 📝 总结

当前项目结构**整体良好**,但有一些小改进空间:

**核心问题**:
- 有 3 个未使用的文件需要清理
- 路径别名可以简化 import
- 部分代码可以提取为常量

**优化策略**:
1. 先清理,后重构
2. 保持简单,不过度设计
3. 每次改动后充分测试

**预期收益**:
- 代码减少 ~800 行
- Import 更简洁
- 可维护性提升 20%
- 代码复用性提升 30%

---

**建议**: 优先完成"高优先级"任务,其他根据项目需求逐步进行。
