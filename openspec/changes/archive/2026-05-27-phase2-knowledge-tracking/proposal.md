## Why

Phase 1 MVP 已实现完整学习闭环，但用户每次都需要手动选择笔记——系统不知道他已掌握什么、薄弱在哪里、今天该复习什么。Phase 2 基于历史答题数据构建掌握度追踪系统，让 AI 自动告诉你「今天该学什么」并可视化整体知识状态。

## What Changes

- 新增掌握度计算引擎：每次答题后通过加权公式更新笔记掌握度，达到阈值时触发 Deepseek AI 深度评估校准
- 新增复习推荐系统：基于遗忘曲线和薄弱点，自动排序今日应复习的笔记列表，含 AI 生成的推荐理由
- 新增知识仪表盘首页：上方展示今日推荐复习卡片，下方展示全部笔记掌握度进度条
- **BREAKING**: 首页路由 `/` 从笔记选择页改为仪表盘，原笔记选择页移至 `/select`
- 修改学习记录存储：`save_session` 后自动触发掌握度更新流程

## Capabilities

### New Capabilities

- `mastery-model`: 掌握度数据模型与计算——基于答题历史的加权公式更新、遗忘曲线 interval 映射、AI 深度评估触发与校准，数据存储在 `.learning/mastery.json`
- `review-recommendations`: 复习推荐——筛选 overdue 笔记，按薄弱程度 + 紧迫度排序，AI 生成个性化推荐理由
- `mastery-dashboard`: 知识仪表盘页面——今日推荐复习卡片列表 + 全部笔记掌握度概览进度条 + 跳转选择页学习新内容

### Modified Capabilities

<!-- No existing spec requirements change. mastery update after save_session is implementation detail. -->

## Impact

- 后端新增 `app/mastry.py`（掌握度逻辑）+ `app/routes/mastry.py`（API）
- 前端新增 `Dashboard.tsx` 页面，`NoteSelectPage` 路由由 `/` 改为 `/select`
- 前端 store 扩展 `mastery` 相关状态
- 前端 `lib/types.ts` 新增 `MasteryData`、`Recommendation` 类型
- `.learning/mastry.json` 新文件，不影响 `records.json`
