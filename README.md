✅ 年会抽奖系统 Prompt（Next.js 全栈版）
角色设定

你是一名资深 Next.js 全栈工程师，对 Next.js App Router、Route Handlers、Server Components、Client Components、shadcn/ui、工程分层设计 非常熟悉。

你的目标是使用 Next.js 本身作为长期后端能力，设计并实现一个稳定、可扩展、不前后端分离的年会抽奖系统。

一、项目背景

基于现在的项目框架，我已初始化了nextjs项目（approuter）我要开发一个 年会抽奖系统（Web），以 抽奖大屏展示 为核心使用场景。

当前阶段：

不接数据库

使用 Next.js 的 API Routes（route.ts）完成所有数据读写

后期阶段：

仍然使用 Next.js 作为后端

逐步接入数据库、鉴权、并发控制

不迁移到 Express / Nest 等独立后端

二、技术选型（必须遵守）

Next.js（App Router）

React + TypeScript

shadcn/ui

Tailwind CSS

使用 Route Handlers (app/api/**/route.ts) 作为后端接口

使用 Server Components / lib 层承载业务逻辑

三、整体架构目标（非常重要）

单体 Next.js 应用

不前后端分离

Route Handlers = Controller

lib / server 层 = Service / Domain

UI 层通过 fetch 调用内部 API

当前数据可存：

内存 / 文件 / localStorage（通过 API 封装）

页面不得直接访问存储层

四、页面设计（以抽奖大屏为主）
1️⃣ 抽奖大屏（核心）

默认首页

全屏展示

显示当前奖项

中央区域滚动展示候选人

抽奖结束后高亮展示中奖人

支持多轮抽奖

2️⃣ 右上角：抽奖设置入口

入口明显但不干扰大屏

点击进入后台管理页面

3️⃣ 后台管理页面（Admin）

奖品管理

新增 / 编辑 / 删除

数量 / 剩余数量

人员管理

Excel 上传

人员列表

已中奖标记

抽奖规则

每轮抽奖数量

是否允许重复中奖（可扩展）

五、数据模型要求

请至少设计以下数据模型：

Prize

User

DrawRecord

Rule（可选）

数据结构需满足：

当前可用

后期可直接迁移到数据库

六、工程结构要求（App Router 风格）

请给出一个合理的目录结构，例如：

app/

page.tsx（抽奖大屏）

admin/

api/

components/

lib/

services/

repositories/

draw/

types/

并说明：

哪些是 Server Component

哪些是 Client Component

Route Handler 的职责边界

七、功能实现要求

请提供示例代码或伪代码，覆盖：

抽奖 Route Handler（POST /api/draw）

奖品管理 API

人员 Excel 导入 API

抽奖核心算法

抽奖大屏的数据流

后台管理页面如何调用 API

八、后期扩展说明（重点）

请说明：

当前使用内存 / 文件存储的部分

将来接数据库时：

哪些代码保持不变

哪些只需替换实现

如何保证抽奖并发安全

九、设计原则（必须遵守）

年会现场稳定优先

架构清晰、不过度抽象

使用主流、成熟技术

前端工程师易读、易维护

🎯 最终目标

一个 完全基于 Next.js 的全栈抽奖系统，能够：

现在跑得通

将来扩得起

不需要推倒重来