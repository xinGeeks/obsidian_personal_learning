## 1. 掌握度数据模型（后端）

- [x] 1.1 实现 `mastery.json` 读写模块（`app/mastry.py`），包含初始化、加载、保存
- [x] 1.2 实现加权掌握度公式计算（`compute_mastery(history_scores, latest_score)`）
- [x] 1.3 实现复习间隔映射（mastery → interval days）
- [x] 1.4 实现掌握度更新函数（`update_mastery(note_path, session)` → 更新或创建 mastery entry）
- [x] 1.5 实现 AI 深度评估触发判断（attempts >= 5, ai_assessed_at > 7 days）
- [x] 1.6 实现 AI 深度评估调用（发送历史答题记录给 Deepseek，解析 weak_concepts + mastery_adjustment）

## 2. 复习推荐系统（后端）

- [x] 2.1 实现 overdue 检测（筛选 `next_review_due <= now` 的笔记）
- [x] 2.2 实现优先级排序算法 `(1 - mastery) × (1 + overdue_days / 7)`
- [x] 2.3 实现 AI 推荐理由生成（调用 Deepseek 为每篇 overdue 笔记生成一句推荐理由）
- [x] 2.4 实现推荐 API fallback（AI 不可用时使用基于 mastery 级别的默认文案）

## 3. API 路由（后端）

- [x] 3.1 实现 `GET /api/mastery/overview`（返回全量笔记掌握度 + overall_mastery）
- [x] 3.2 实现 `GET /api/mastery/recommendations`（返回 overdue 笔记推荐列表）
- [x] 3.3 在 `save_session` 中集成掌握度更新调用（答题完成后自动触发）
- [x] 3.4 在 `app/main.py` 注册 mastery router

## 4. 前端类型与 API 客户端

- [x] 4.1 在 `lib/types.ts` 新增 `MasteryEntry`、`MasteryOverview`、`RecommendationItem` 类型
- [x] 4.2 在 `lib/api.ts` 新增 `fetchOverview()`、`fetchRecommendations()` 函数

## 5. 仪表盘页面（前端）

- [x] 5.1 创建 `Dashboard.tsx` 页面骨架（双 section 布局：推荐 + 概览）
- [x] 5.2 实现推荐卡片列表（mastery 颜色指示器、AI 推荐理由、"开始复习"按钮）
- [x] 5.3 实现掌握度概览列表（进度条、笔记标题、掌握度百分比、薄弱概念标签）
- [x] 5.4 实现空状态展示（无推荐时引导文案、无掌握度数据时引导首次学习）
- [x] 5.5 实现 loading/error 状态处理

## 6. 路由调整（前端）

- [x] 6.1 在 `App.tsx` 新增 `/` → Dashboard 路由，原 NoteSelectPage 移至 `/select`
- [x] 6.2 更新 SummaryPage "返回"按钮跳转到 `/`（仪表盘）而非 `/select`

## 7. 联调与验证

- [x] 7.1 端到端流程测试（首次答题 → mastery 初始化 → 多次答题 → AI 评估触发 → 仪表盘推荐）
- [x] 7.2 边界测试（无 mastery 数据、无 overdue 笔记、AI 服务不可用）
- [x] 7.3 TypeScript 编译检查 + 前端构建验证
