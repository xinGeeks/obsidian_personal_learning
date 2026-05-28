## Why

当前 UI 采用浅色主题（`bg-gray-50`），页面间无统一导航结构，用户切换页面需要依赖浏览器回退或各页内嵌的按钮。Dashboard 内容堆砌了 4 个模块（推荐复习、掌握度、学习资料、知识图谱），缺少主次和信息架构设计。需要对全局 UI 做一次结构性升级——引入侧边栏导航、统一的深色科技金融风主题、以及更聚焦的 Dashboard 内容布局。

## What Changes

- 新增全局固定侧边栏导航，替换现有各页面独立的 Header 导航
- 新增统一的深色主题色彩体系，基于 Tailwind CSS v4 `@theme` 定义设计 tokens
- 重设计 Dashboard 页面：保留「今日推荐复习」模块，新增「学习日历热力图」模块，移除掌握度概览、资料推荐、知识图谱缩略（这些内容在独立页面已有完整版本）
- 所有现有页面适配深色背景和文字颜色
- 新增 `Sidebar` 组件和 `CalendarHeatmap` 组件

## Capabilities

### New Capabilities

- `sidebar-navigation`: 全局固定侧边栏，提供 Dashboard、笔记学习、知识图谱、学习资料、设置 5 个导航入口
- `dark-theme`: 统一深色色彩体系——多层级深色背景、靛蓝主强调色、绿/红功能色、浅白/浅灰文本层级
- `dashboard`: 重设计的 Dashboard 页面——今日推荐复习卡片 + 学习日历热力图卡片

### Modified Capabilities

<!-- 纯 UI 层改动，不影响任何现有 spec 的行为定义 -->

## Impact

- 前端：`index.css`（重写）、`App.tsx`（重写布局）、`Dashboard.tsx`（重写）
- 所有现有页面文件（`*Page.tsx`）适配深色背景，改动量小
- 新增 `src/components/Sidebar.tsx`、`src/components/CalendarHeatmap.tsx`
- 后端：无改动
- 依赖：无新增，纯 React 实现热力图（不使用 D3）
