## Context

Phase 1 MVP 的 `records.json` 已有完整答题历史（得分、盲区诊断、来源笔记），但系统不知道用户的整体知识状态。Phase 2 新增 `mastery.json` 存储每篇笔记的掌握度、遗忘曲线信息和薄弱概念列表，构建混合模式掌握度模型（公式 + AI 校准）。

## Goals / Non-Goals

**Goals:**
- 每次答题后自动更新笔记掌握度（加权公式 + 时间衰减）
- 基于遗忘曲线计算 `next_review_due`，支持 overdue 检测
- 累计答题 5+ 次后触发 Deepseek AI 深度评估校准
- 新首页仪表盘展示今日推荐复习 + 掌握度概览
- 独立数据层 `.learning/mastery.json`，不修改笔记文件

**Non-Goals:**
- 不做段落级掌握度追踪（整篇笔记为最小单位）
- 不做知识图谱自动提取（Phase 3）
- 不自动在 Obsidian 笔记中写入任何内容
- 不新增外部依赖（复用已有 json/pathlib 等标准库）

## Decisions

### 1. 掌握度公式

```
weighted_historical = Σ(score_i × 0.9^days) / Σ(0.9^days)
mastery = 0.7 × weighted_historical + 0.3 × latest_score
```

选 0.9 衰减因子：约 7 天后权重降至一半，符合典型遗忘曲线节奏。

### 2. 复习间隔映射

| mastery | interval |
|---------|----------|
| < 0.3 | 1 day |
| 0.3-0.6 | 3 days |
| 0.6-0.8 | 7 days |
| > 0.8 | 14 days |

简单阶梯映射，不做 SM-2 算法——个人学习场景不需要那么精确的调度。

### 3. AI 深度评估触发

条件：`total_attempts >= 5` 且 `now - ai_assessed_at > 7 days`。评估异步进行，不阻塞答题流程。AI 返回 `{ mastery_adjustment, weak_concepts, summary }`。

### 4. 推荐排序

从 `mastery.json` 筛选 `next_review_due <= now` 的笔记，按 `(1 - mastery) × (1 + overdue_days / 7)` 降序排列。越薄弱 + 越 overdue = 排越前面。

### 5. 首页路由

`/` → Dashboard（新），`/select` → NoteSelectPage（原首页逻辑）。这不破坏已有路由结构，QuizPage 和 SummaryPage 保持不变。

### 6. 独立数据层

`mastery.json` 与 `records.json` 分离：记录层是 immutable 日志，掌握度层是可更新的状态快照。职责清晰，后续迁移或重置掌握度不影响原始数据。

## Risks / Trade-offs

- [冷启动问题] 新笔记无答题记录，掌握度为 0，不显示在仪表盘上 → 在 Dashboard 底部保留「学习新内容」入口跳转到 `/select`
- [AI 评估延迟] 异步触发可能导致用户看到的掌握度不是最新校准值 → 前端在 mastery `confidence < 0.5` 时显示「评估中」标记
- [公式准确性] 纯加权公式可能不反映真实掌握情况 → AI 深度评估作为校准机制，长期数据积累后公式权重可调
