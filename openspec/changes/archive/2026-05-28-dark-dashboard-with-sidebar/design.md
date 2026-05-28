## Context

当前项目使用 React 18 + Tailwind CSS v4 + React Router v7，前端为 SPA 架构。现有布局为各页面独立 Header + 页面内容，无全局导航组件。主题为 Tailwind 默认浅色（`bg-gray-50` 系）。本次改造仅涉及前端 UI 层，不影响后端 API。

约束：
- Tailwind CSS v4 使用 CSS-first 配置（`@theme` 块），无 `tailwind.config.js`
- 热力图使用纯 React 实现，不引入 D3 依赖
- 所有现有路由和页面功能保持不变

## Goals / Non-Goals

**Goals:**
- 新增全局固定侧边栏，包含 Dashboard、笔记学习（→/select）、知识图谱（→/graph）、学习资料（→/resources）、设置（→/settings）5 个导航入口
- 在 `index.css` 中通过 Tailwind v4 `@theme` 定义完整的深色色彩 tokens
- 所有页面适配深色背景和文字颜色
- Dashboard 重新设计：保留今日推荐复习卡片，新增纯 React 学习日历热力图
- 卡片组件采用深色科技金融风样式（透明细边框、微弱悬浮光效、分层背景）

**Non-Goals:**
- 不改动后端 API
- 不改动路由结构和页面核心功能
- 不新增第三方依赖
- SummaryPage 不加入侧边栏导航
- 热力图不使用 D3

## Decisions

### 1. 布局结构：Shell 组件模式

在 `App.tsx` 中抽出一个 `AppShell` 布局组件：左侧固定 `Sidebar`（w-56），右侧为 `<main>` 内容区。所有路由通过 `<Outlet>` 渲染在 main 区域内。

**替代方案**：每页各自引入 Sidebar → 代码重复，切换页面时 Sidebar 会重新挂载。

### 2. 主题实现：Tailwind v4 `@theme` + CSS 变量

在 `index.css` 中定义 `@theme` 块声明设计 tokens，配合 `@layer base` 设置 `body` 深色背景。使用语义化命名（`bg-base`、`bg-card`、`accent` 等）。

颜色值：
```
--color-bg-base:     #080B12
--color-bg-card:     #131820
--color-bg-hover:    #1A2030
--color-accent:      #5B6EF5
--color-green:       #34D399
--color-red:         #F87171
--color-text-primary:  #E8ECF1
--color-text-secondary:#8B949E
--color-border-card: rgba(255,255,255,0.06)
```

**替代方案**：Tailwind `dark:` 前缀 + class 切换 → 本项目不需要浅/深切换，全局固定深色更简单。

### 3. 热力图实现：纯 React CSS Grid

日历热力图使用 CSS Grid 布局：12 列（每月） × N 行（总天数），每个单元格为一个 `<div>`，根据当日学习量设置背景色深浅。Hover 时显示 tooltip（日期 + 统计）。

**替代方案**：D3 → D3 已在依赖中，但热力图数据结构简单（二维数组 + 颜色映射），D3 的 enter/update/exit 模式在此场景下是过度抽象。

### 4. Sidebar 导航高亮：React Router `useLocation`

从 `useLocation().pathname` 判断当前路由，为激活项应用 `accent` 背景色 + 左侧强调线（2px 细线）。

### 5. 卡片组件：统一 Card 样式模式

不创建 `<Card>` 抽象组件，而是通过 Tailwind 类组合统一卡片样式：
- 背景 `bg-card`，圆角 `rounded-xl`，边框 `border border-border-card`
- Hover: `hover:bg-hover hover:border-accent/25 transition-colors duration-200`

3 个页面使用同样的卡片类组合不算重复，不值得为此抽象一个组件。

## Risks / Trade-offs

- **现有 QuizPage 答题区与深色主题的适配**：选择题选项按钮、填空输入框需要在深色背景下确保可用性和对比度 → 逐页测试，重点检查表单元素
- **Dashboard 数据依赖**：热力图需要学习记录数据，当前 API 需确认是否有按日期聚合的端点 → 若无，前端从现有记录中按 `started_at` 字段聚合计算
