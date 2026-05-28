## 1. 深色主题基础

- [x] 1.1 在 `index.css` 中用 Tailwind v4 `@theme` 定义所有深色色彩 tokens（bg-base, bg-card, bg-hover, accent, green, red, text-primary, text-secondary, border-card）
- [x] 1.2 在 `index.css` 中设置 `body` 全局深色背景、主文本色、字体

## 2. 全局侧边栏导航

- [x] 2.1 新建 `src/components/Sidebar.tsx` 组件——固定左侧面板（w-56），5 个导航项（Dashboard、笔记学习、知识图谱、学习资料、设置）+ 设置分割线
- [x] 2.2 实现路由高亮：基于 `useLocation().pathname` 判断激活项，应用 accent 背景 + 左侧 2px accent 强调线
- [x] 2.3 实现移动端响应式：<768px 时侧边栏默认隐藏，汉堡菜单按钮切换

## 3. App 布局重构

- [x] 3.1 重构 `App.tsx`：引入 Sidebar + `<main>` 内容区布局，所有路由通过 `<Routes>` 渲染在 main 区域内

## 4. Dashboard 页面重设计

- [x] 4.1 重写 `Dashboard.tsx` 布局：双列网格（桌面端），移除掌握度概览、资料推荐、知识图谱缩略
- [x] 4.2 实现「今日推荐复习」卡片——深色卡片样式，复习条目列表，逾期天数红色标记，hover 微光效果
- [x] 4.3 新建 `src/components/CalendarHeatmap.tsx` 组件——纯 React CSS Grid 实现，12 个月 × 7 天/周，绿色渐变表示学习强度，hover tooltip 显示日期+统计
- [x] 4.4 将热力图卡片集成到 Dashboard 页面

## 5. 现有页面深色主题适配

- [x] 5.1 适配 `NoteSelectPage.tsx`——深色背景、卡片列表、选中状态
- [x] 5.2 适配 `QuizPage.tsx`——问题题干、选项按钮、填空输入框、评测结果显示
- [x] 5.3 适配 `SummaryPage.tsx`——结果展示卡片
- [x] 5.4 适配 `GraphPage.tsx`——图谱节点/边在深色背景下的对比度
- [x] 5.5 适配 `ResourcePage.tsx`——资料卡片列表
- [x] 5.6 适配 `SettingsPage.tsx`——表单控件、输入框

## 6. 验证

- [x] 6.1 启动前端 dev server，验证所有页面在深色主题下显示正常、对比度足够
- [x] 6.2 验证侧边栏导航切换功能正常、高亮正确
- [x] 6.3 验证移动端响应式（侧边栏折叠、卡片堆叠）
