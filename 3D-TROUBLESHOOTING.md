# 3D 组件加载问题解决方案

## 问题: THREE.WebGLRenderer: Context Lost

这个错误表示 WebGL 上下文丢失,通常由以下原因引起:

1. **GPU 内存不足** - 3D 场景太大,显存不够
2. **浏览器限制** - 某些浏览器对 WebGL 有严格限制
3. **硬件加速未开启** - 浏览器硬件加速被禁用
4. **驱动问题** - 显卡驱动过旧或不兼容

## ✅ 已实施的解决方案

### 1. 自动降级机制

应用已经实现了自动降级:
- 当 3D 组件加载失败时,**自动切换到纯 CSS 动画版本**
- 用户可以继续使用抽奖功能,不会中断
- 错误边界会捕获所有 WebGL 错误

### 2. 性能优化

在 `three-draw-animation.tsx` 中已经优化:
```typescript
<Canvas
  dpr={[1, 1.5]}  // 降低 DPR 范围
  performance={{ min: 0.4 }}  // 降低最小性能阈值
  gl={{
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",  // 优先使用高性能 GPU
  }}
>
```

### 3. 懒加载 3D 组件

```typescript
const ThreeDrawAnimation = dynamic(
  () => import("./three-draw-animation"),
  { ssr: false }  // 仅在客户端加载
);
```

## 🔧 用户可以尝试的解决方法

### 方法 1: 启用浏览器硬件加速

**Chrome/Edge**:
1. 打开设置 → 系统
2. 确保"使用图形加速模式(如果可用)"已开启
3. 重启浏览器

**Firefox**:
1. 地址栏输入 `about:config`
2. 搜索 `webgl.force-enabled`
3. 设置为 `true`
4. 重启浏览器

### 方法 2: 降低 3D 场景复杂度

如果问题持续,可以修改 `three-draw-animation.tsx`:

```typescript
// 减少名字球的数量
const namesToShow = names.slice(0, 50); // 只显示前50个

// 降低粒子数量
<Stars radius={100} depth={50} count={1000} ... />  // 从5000降到1000
```

### 方法 3: 使用 CSS 降级版本

如果 3D 始终无法工作,可以完全禁用 3D 组件:

修改 `draw-screen.tsx`:
```typescript
// 直接使用降级组件
import { ThreeFallback } from "./three-fallback";

// 替换 ThreeDrawAnimation 为 ThreeFallback
<ThreeFallback {...props} />
```

### 方法 4: 检查系统要求

确保你的系统满足:
- ✅ 支持 WebGL 2.0 的显卡
- ✅ 最新显卡驱动
- ✅ 至少 4GB 显存
- ✅ 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)

### 方法 5: 测试 WebGL 支持

打开浏览器控制台,运行:
```javascript
// 检查 WebGL 支持
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
console.log('WebGL 支持:', gl ? '是' : '否');
console.log('WebGL 版本:', gl ? gl.getParameter(gl.VERSION) : 'N/A');
```

## 📊 性能对比

| 方案 | 性能 | 兼容性 | 效果 |
|------|------|--------|------|
| 3D 版本 | 需要较好 GPU | 现代浏览器 | ⭐⭐⭐⭐⭐ |
| CSS 降级 | 任何设备 | 所有浏览器 | ⭐⭐⭐⭐ |

## 🎯 推荐方案

对于抽奖场景,我们推荐:

1. **首次尝试**: 使用 3D 版本 (炫酷效果)
2. **自动降级**: 如果失败,自动切换到 CSS 版本 (已实现)
3. **手动切换**: 在设置中添加"启用/禁用 3D 效果"开关 (未来功能)

## 💡 开发者调试

如果需要调试 3D 组件:

```bash
# 启用详细日志
NEXT_DEBUG_THREE=* bun run dev

# 检查 WebGL 上下文
# 在浏览器控制台运行
document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_debug_renderer_info')
```

## ✅ 当前状态

- ✅ 错误捕获已实现
- ✅ 自动降级已实现
- ✅ 用户可以继续使用功能
- ✅ 不影响抽奖流程

即使 3D 组件完全失败,抽奖功能也能正常工作!
