# Phase 2: 知识状态追踪 — 设计文档

## 背景

Phase 1 MVP 已实现完整学习闭环：选择笔记 → AI 出题 → 逐题评测 → 学习记录。所有答题数据（得分、盲区诊断、来源笔记）持久化在 `.learning/records.json`。

Phase 2 在此数据基础上构建掌握度追踪系统，实现 AI 驱动的复习推荐和知识状态可视化。

## 核心决策

| 决策 | 选择 |
|------|------|
| 首页形态 | 上方「今日推荐复习」+ 下方「全部笔记掌握度」仪表盘 |
| 掌握度模型 | 混合模式：公式实时更新 + AI 定期深度评估校准 |
| 掌握度存储 | 独立数据层 `.learning/mastery.json`，不修改笔记文件 |

## 数据模型

### mastery.json

```json
{
  "notes": {
    "<note_path>": {
      "mastery": 0.72,
      "confidence": 0.85,
      "total_attempts": 8,
      "correct_attempts": 6,
      "avg_score": 0.78,
      "last_reviewed": "2026-05-27T10:30:00",
      "next_review_due": "2026-05-29T10:30:00",
      "weak_concepts": ["特征值分解"],
      "ai_assessed_at": "2026-05-25T10:30:00"
    }
  },
  "updated_at": "2026-05-27T10:30:00"
}
```

## 掌握度计算公式

每次答题后触发公式更新：

```
weighted_historical = Σ(score_i × 0.9^(days_since_i)) / Σ(0.9^(days_since_i))
mastery = 0.7 × weighted_historical + 0.3 × latest_score

interval 映射:
  mastery < 0.3  → 1天
  mastery 0.3-0.6 → 3天
  mastery 0.6-0.8 → 7天
  mastery > 0.8   → 14天
```

## AI 深度评估

触发条件：attempts >= 5 且距上次 AI 评估 > 7 天。

将笔记的所有历史答题记录 + 盲区诊断发送给 Deepseek，返回 mastery 校准值、weak_concepts 列表、总结。结果用于修正公式计算的 mastery 值。

## API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/mastery/overview` | 全量笔记掌握度摘要 |
| GET | `/api/mastery/recommendations` | 今日推荐复习列表（含 AI 推荐理由） |
| POST | `/api/mastery/update` | 答题后自动更新掌握度（内部触发 AI 深度评估） |

## 前端变更

### 路由调整

| 路由 | 组件 | 说明 |
|------|------|------|
| `/` | Dashboard | **新增**：今日推荐 + 掌握度概览 |
| `/select` | NoteSelectPage | 原首页，全量笔记选择（学习新内容） |
| `/quiz` | QuizPage | 不变 |
| `/summary` | SummaryPage | 不变 |

### 仪表盘布局

- 顶部「今日推荐复习」卡片列表，按 urgency 排序，每张卡片显示笔记标题、掌握度、推荐理由、「开始复习」按钮
- 中部「全部笔记掌握度」进度条列表，仅显示有学习记录的笔记
- 底部「选择其他笔记学习」链接跳转到 `/select`
- 无数据时展示引导提示

## 实现要点

- 公式更新：在 `save_session` 后同步触发 `update_mastery()`
- AI 评估：异步执行，不阻塞公式更新
- 推荐排序：`(1 - mastery) × urgency` 降序，urgency 基于 overdue 天数
- 首屏加载：`/api/mastery/overview` 和 `/api/mastery/recommendations` 并行请求
