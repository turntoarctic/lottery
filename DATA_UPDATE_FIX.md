# 数据自动更新优化说明

## 问题描述

在年会抽奖系统中，当管理员在后台更新人员或奖品数据后，前台抽奖页面不会自动刷新显示最新数据，需要手动刷新页面。

## 解决方案

实现了多层机制确保数据实时同步：

### 1. 定时刷新机制
- **位置**: `components/draw/draw-screen.tsx`
- **功能**: 每 10 秒自动从服务器获取最新数据
- **优点**: 简单可靠，即使其他机制失败也能保证数据最终一致性

```typescript
const refreshInterval = setInterval(() => {
  loadData();
}, 10000);
```

### 2. 自定义事件监听
- **位置**: `components/draw/draw-screen.tsx` 和 `app/admin/*/page.tsx`
- **功能**: 监听 `data-updated` 自定义事件
- **适用场景**: 同一页面内的组件通信

**触发** (在后台管理页面):
```typescript
window.dispatchEvent(new Event('data-updated'));
```

**监听** (在抽奖页面):
```typescript
window.addEventListener('data-updated', handleDataUpdate);
```

### 3. localStorage 跨标签页通信
- **位置**: `components/draw/draw-screen.tsx` 和 `app/admin/*/page.tsx`
- **功能**: 利用 localStorage 的 storage 事件实现跨标签页通信
- **适用场景**: 后台和抽奖页面在不同标签页打开时

**触发**:
```typescript
localStorage.setItem('lottery-data-updated', Date.now().toString());
```

**监听**:
```typescript
window.addEventListener('storage', (e) => {
  if (e.key === 'lottery-data-updated') {
    handleDataUpdate();
  }
});
```

### 4. BroadcastChannel 广播频道
- **位置**: `components/draw/draw-screen.tsx` 和 `app/admin/*/page.tsx`
- **功能**: 使用 BroadcastChannel API 实现跨窗口、跨标签页实时通信
- **适用场景**: 多个窗口或标签页之间的数据同步
- **优点**: 现代浏览器支持，性能好，不依赖 localStorage

**触发**:
```typescript
const channel = new BroadcastChannel('lottery-data-sync');
channel.postMessage({ type: 'data-updated', timestamp: Date.now() });
channel.close();
```

**监听**:
```typescript
const broadcastChannel = new BroadcastChannel('lottery-data-sync');
broadcastChannel.onmessage = (event) => {
  if (event.data.type === 'data-updated') {
    handleDataUpdate();
  }
};
```

### 5. 页面可见性监听
- **位置**: `components/draw/draw-screen.tsx`
- **功能**: 当用户切换回抽奖页面时自动刷新数据
- **适用场景**: 用户在后台和抽奖页面之间切换时

```typescript
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadData();
  }
});
```

## 修改的文件

### 抽奖页面
- `components/draw/draw-screen.tsx`
  - 添加了 5 种数据监听机制
  - 实现了智能的数据刷新逻辑
  - 添加了用户提示（toast 通知）

### 后台管理页面
- `app/admin/prizes/page.tsx`
  - 添加了 `notifyDataUpdate()` 函数
  - 在添加、编辑、删除奖品后调用通知函数

- `app/admin/users/page.tsx`
  - 添加了 `notifyDataUpdate()` 函数
  - 在导入用户、清空用户后调用通知函数

## 使用效果

### 场景 1: 同一页面
1. 管理员在后台添加/编辑奖品
2. 数据更新后立即触发 `data-updated` 事件
3. 抽奖页面监听到事件，立即刷新数据
4. 显示 toast 提示："数据已更新"

### 场景 2: 不同标签页
1. 管理员在标签页 A 打开后台
2. 用户在标签页 B 打开抽奖页面
3. 管理员更新数据
4. 通过 BroadcastChannel 和 localStorage 跨标签页通知
5. 抽奖页面自动刷新

### 场景 3: 页面切换
1. 用户在抽奖页面
2. 切换到后台管理数据
3. 切换回抽奖页面
4. 检测到页面重新可见，自动刷新

### 场景 4: 后台保障
- 即使以上机制都失败
- 每 10 秒会自动刷新一次
- 确保数据最多延迟 10 秒

## 技术亮点

1. **多层冗余**: 5 种机制确保在各种场景下都能工作
2. **性能优化**: 只在数据真正变化时才刷新
3. **用户体验**: 添加 toast 提示，让用户知道数据已更新
4. **兼容性好**: 使用多种通信方式，兼容不同浏览器和使用场景
5. **资源清理**: 正确清理事件监听器和定时器，避免内存泄漏

## 测试方法

### 测试步骤

1. **测试奖品更新**
   ```bash
   # 终端 1: 启动开发服务器
   npm run dev

   # 浏览器标签页 1: 打开抽奖页面
   http://localhost:3000

   # 浏览器标签页 2: 打开奖品管理
   http://localhost:3000/admin/prizes

   # 操作:
   1. 在标签页 2 添加/编辑/删除奖品
   2. 观察标签页 1 是否在 10 秒内自动更新
   3. 或观察是否立即显示 "数据已更新" 提示
   ```

2. **测试用户更新**
   ```bash
   # 浏览器标签页 2: 打开用户管理
   http://localhost:3000/admin/users

   # 操作:
   1. 在标签页 2 导入新的 Excel 文件
   2. 或清空用户列表
   3. 观察标签页 1 的 3D 球体是否立即更新
   ```

3. **测试页面切换**
   ```bash
   # 操作:
   1. 在抽奖页面
   2. 切换到其他标签页或应用
   3. 在后台更新数据
   4. 切换回抽奖页面
   5. 观察是否自动刷新
   ```

4. **测试多窗口**
   ```bash
   # 操作:
   1. 打开多个抽奖页面窗口
   2. 在任意窗口中观察数据是否同步
   ```

## 验证要点

- ✅ 添加奖品后，抽奖页面立即显示新奖品
- ✅ 编辑奖品后，奖品信息实时更新
- ✅ 删除奖品后，奖品从列表中移除
- ✅ 导入用户后，3D 球体显示新用户名字
- ✅ 清空用户后，3D 球体为空或显示示例数据
- ✅ 显示 "数据已更新" toast 提示
- ✅ 定时刷新正常工作（10秒间隔）
- ✅ 页面切换时自动刷新
- ✅ 无内存泄漏（控制台无警告）

## 性能影响

- **网络请求**: 每 10 秒一次数据请求（可配置）
- **内存占用**: 轻微增加（事件监听器）
- **CPU 占用**: 几乎无影响（事件驱动）
- **用户体验**: 显著提升（实时数据同步）

## 未来优化建议

1. **WebSocket**: 对于超大规模部署，可以考虑使用 WebSocket 实现真正的实时推送
2. **Service Worker**: 可以添加 Service Worker 实现离线缓存和后台同步
3. **智能刷新**: 可以根据用户活动动态调整刷新频率
4. **增量更新**: 只传输变化的数据，减少网络流量

## 兼容性

- ✅ Chrome 54+
- ✅ Firefox 38+
- ✅ Safari 10.1+
- ✅ Edge 15+
- ✅ Opera 41+
- ⚠️ IE: 不支持（BroadcastChannel API）

---

**更新日期**: 2025-01-21
**版本**: V1.0
**状态**: ✅ 生产就绪
