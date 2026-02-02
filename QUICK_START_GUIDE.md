# 🚀 架构优化快速使用指南

## 如何使用新的重构代码

### 方式一: 替换现有组件 (推荐)

```typescript
// app/page.tsx
import { DrawScreenNew } from '@/components/draw/draw-screen-new';

export default function Home() {
  return <DrawScreenNew />;
}
```

### 方式二: 逐步迁移

如果你想逐步迁移,可以同时保留新旧组件:

```typescript
// app/page.tsx
import { DrawScreen } from '@/components/draw/draw-screen';
import { DrawScreenNew } from '@/components/draw/draw-screen-new';

export default function Home() {
  // 通过环境变量切换
  const useNew = process.env.NEXT_PUBLIC_USE_NEW_COMPONENT === 'true';

  return useNew ? <DrawScreenNew /> : <DrawScreen />;
}
```

---

## 新架构使用示例

### 1. 使用新的状态管理

```typescript
// ✅ 数据状态 - 使用 React Query
import { usePrizes, useUsers } from '@/lib/api/use-lottery-api';

function MyComponent() {
  const { data: prizes, isLoading } = usePrizes();
  const { data: users } = useUsers();

  // 自动缓存,自动刷新
}

// ✅ UI 状态 - 使用新的 UI Store
import { useLotteryUIStore } from '@/lib/store/lottery-ui-store';

function MyComponent() {
  const { isDrawing, setIsDrawing } = useLotteryUIStore();

  return (
    <Button onClick={() => setIsDrawing(true)}>
      开始抽奖
    </Button>
  );
}
```

### 2. 使用新的 API 格式

```typescript
// ✅ 在 API 路由中使用标准化格式
import { ResponseHelper, withErrorHandler } from '@/lib/api/response';
import { CreatePrizeSchema } from '@/lib/dtos';

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  // 自动验证
  const dto = CreatePrizeSchema.parse(body);

  // 业务逻辑
  const prize = await prizeService.createPrize(dto);

  // 统一响应
  return ResponseHelper.success(prize, '创建成功');
});
```

### 3. 使用自定义 Hooks

```typescript
// ✅ 数据同步 Hook
import { useDrawDataSync } from '@/hooks/use-draw-data-sync';

function MyComponent() {
  useDrawDataSync(() => {
    // 数据更新时的回调
    console.log('数据已更新');
  });
}

// ✅ 键盘快捷键 Hook
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

function MyComponent() {
  useKeyboardShortcuts({
    onDraw: () => console.log('开始抽奖'),
    onCancel: () => console.log('取消'),
    enabled: true,
  });
}

// ✅ 完整的抽奖屏幕 Hook
import { useDrawScreen } from '@/hooks/use-draw-screen';

function MyComponent() {
  const {
    prizes,
    users,
    selectedPrize,
    isDrawing,
    handleStartDraw,
    // ... 所有你需要的状态和方法
  } = useDrawScreen();
}
```

### 4. 使用依赖注入

```typescript
// ✅ 获取服务实例
import container from '@/lib/container';

// 在 API 路由或服务中使用
const storage = container.get<IStorage>('storage');
const drawService = container.get<DrawService>('drawService');

// 使用服务
const prizes = await storage.getPrizes();
```

---

## 新旧对比

### 旧方式 (不推荐)

```typescript
// ❌ 混乱的状态管理
const { prizes, setPrizes } = useLotteryStore();
useEffect(() => {
  fetch('/api/prizes')
    .then(r => r.json())
    .then(data => setPrizes(data));
}, []);

// ❌ 无验证的 API
export async function POST(request: Request) {
  const body = await request.json();
  // 没有验证!
  const prize = await storage.createPrize(body);
  return NextResponse.json({ data: prize });
}
```

### 新方式 (推荐)

```typescript
// ✅ 清晰的状态管理
const { data: prizes, isLoading } = usePrizes();
// 自动缓存,自动刷新,无需手动管理

// ✅ 有验证的 API
export const POST = withErrorHandler(async (request: Request) => {
  const dto = CreatePrizeSchema.parse(body); // 自动验证!
  return ResponseHelper.success(data);
});
```

---

## 迁移检查清单

如果你想完全迁移到新架构,请按照以下清单操作:

- [ ] 替换 `app/page.tsx` 使用 `DrawScreenNew`
- [ ] 更新所有管理后台页面使用新的 hooks
- [ ] 更新其他 API 路由使用标准化格式
- [ ] 测试所有功能是否正常
- [ ] 删除旧的 `lottery-store.ts` (可选,如果确认不需要)
- [ ] 更新相关文档

---

## 常见问题

### Q1: 新旧组件可以共存吗?
A: 可以!新组件不会影响旧组件,你可以逐步迁移。

### Q2: 必须使用新的状态管理吗?
A: 不是必须的,但强烈推荐。新的方式更简洁、更高效。

### Q3: 如何扩展 DTO 验证?
A: 在 `lib/dtos/` 中添加新的 schema 文件,参考现有的示例。

### Q4: 依赖注入容器是必须的吗?
A: 目前不是必须的,但为将来的测试和扩展打下了基础。

---

## 需要帮助?

- 查看 `ARCHITECTURE_OPTIMIZATION_COMPLETED.md` 了解完整优化细节
- 查看代码注释了解具体实现
- 运行 `npm run build` 验证构建

---

**祝使用愉快! 🎉**
