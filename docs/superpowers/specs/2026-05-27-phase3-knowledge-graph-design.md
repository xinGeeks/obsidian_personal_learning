# Phase 3: 知识图谱 — 设计文档

## 背景

Phase 1 实现笔记级学习闭环，Phase 2 实现笔记级掌握度追踪。当前系统的核心限制是掌握度以「整篇笔记」为最小单位——一篇笔记可能同时包含用户已熟练和完全不懂的知识点。Phase 3 引入知识图谱，将粒度从笔记下钻到知识点，同时实现跨知识点综合出题和自适应学习路径。

## 核心决策

| 决策 | 选择 |
|------|------|
| 出题行为 | B + C：跨知识点综合出题 + AI 自适应学习路径编排 |
| 知识图谱构建 | 混合：后台全量预热一次 + 按需增量更新 |
| 前端呈现 | 仪表盘小图谱概览 + 独立 `/graph` 全屏交互式图谱页 |

## 数据模型

### graph.json

新增 `.learning/graph.json`，存储概念节点和关系边：

```json
{
  "concepts": {
    "cn_<uuid>": {
      "id": "cn_<uuid>",
      "name": "特征值分解",
      "aliases": ["Eigenvalue Decomposition"],
      "description": "将方阵分解为特征值和特征向量的过程",
      "source_notes": ["线性代数/第三章.md#特征值分解"],
      "mastery": 0.45,
      "confidence": 0.7,
      "total_attempts": 5,
      "last_reviewed": "2026-05-27T10:00:00",
      "next_review_due": "2026-05-29T10:00:00",
      "weak_points": []
    }
  },
  "edges": {
    "e_<uuid>": {
      "from": "cn_001",
      "to": "cn_002",
      "type": "prerequisite_of",
      "weight": 0.9,
      "label": "特征值分解是 PCA 的数学基础"
    }
  },
  "extraction_status": {
    "phase": "idle|running|completed",
    "total_notes_processed": 0,
    "total_notes": 150,
    "last_extraction": "2026-05-27T08:00:00"
  }
}
```

边类型：
- `prerequisite_of`：A 是 B 的前置知识
- `related_to`：A 和 B 是相关概念

### 与 mastery.json 的关系

- `mastery.json` 保留（笔记级），Dashboard 优先展示概念级数据，笔记级兜底
- 概念级掌握度计算复用 Phase 2 的公式（加权 + 衰减 + AI 校准），但粒度从 note_path 变为 concept_id

## 知识提取 Pipeline

### 阶段 1：全量预热

首次配置 vault 后通过 `POST /api/graph/trigger-extraction` 触发，后台异步运行：

1. 遍历 vault 所有 `.md` 文件
2. 逐篇调用 Deepseek 提取知识点：`[{name, description, section, prerequisites, related}]`
3. 全局去重：名称编辑距离 < 3 或 embedding 余弦相似度 > 0.85 → 合并为同一节点
4. 关系合并：prerequisites/related 中的概念名匹配到已存在的节点 ID
5. 写入 `graph.json`

提取期间 Phase 1/2 功能正常使用。

### 阶段 2：增量更新

笔记新增/修改时，仅重新提取该笔记的知识点，增量更新 `graph.json`：
- 新概念 → 新建节点，与已有概念做去重合并
- 已删除的概念 → 如果 `source_notes` 只剩下该笔记，移除节点
- 关系重建 → 仅更新涉及该笔记的边

### 去重策略

双重判断合并：
1. 名称近似匹配（Levenshtein 距离 < 3 且较短的名称是较长的子串）
2. 否则调用 Deepseek embedding，余弦相似度 > 0.85 → 合并

合并后节点 `source_notes` 包含所有引用它的笔记路径。

## API 设计

### 新增

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/graph/overview` | 全量图谱数据（节点 + 边） |
| GET | `/api/graph/extraction-status` | 提取进度查询 |
| POST | `/api/graph/trigger-extraction` | 手动触发全量提取 |
| GET | `/api/graph/concept/{id}` | 单个知识点详情 |

### 修改

- `GET /api/mastery/overview`：扩展返回概念级聚合数据
- `POST /api/quiz/generate`：prompt 中注入前置概念关系，实现跨概念综合出题
- `POST /api/quiz/evaluate`：评测时关联 concept_id，诊断指向具体知识点

## 前端设计

### 路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | Dashboard | 扩展现有仪表盘，底部新增加图谱小图 |
| `/graph` | GraphPage | **新增**：全屏交互式力导向图 |
| `/select` | NoteSelectPage | 不变 |
| `/quiz` | QuizPage | 不变 |
| `/summary` | SummaryPage | 不变 |

### Dashboard 扩展

在现有「今日推荐复习」+「全部笔记掌握度」下方，新增知识图谱小图：
- 200px 高，聚焦最相关的前 15 个知识点节点
- 节点颜色 = 掌握度（红/黄/绿），大小 = 关联笔记数量
- 点击节点跳转到 `/graph?focus=<concept_id>`

### GraphPage

- D3.js 力导向图，节点 = 知识点，连线 = 关系
- `prerequisite_of` = 实线箭头，`related_to` = 虚线
- 交互：缩放、拖拽、点击节点展开详情面板
- 详情面板：概念定义、掌握度进度条、来源笔记列表（可点击跳转）、建议学习路径（基于前置依赖拓扑排序）
- 搜索框：按名称搜索定位节点
- 空状态：提取未完成时展示进度条

## 实现要点

- 去重用 `difflib.SequenceMatcher`（标准库，零依赖）
- D3.js 力导向图与 React 集成：D3 负责力模拟计算，React 负责 DOM 渲染（与项目现有设计决策一致）
- 全量提取运行在 FastAPI `BackgroundTasks` 中，状态通过 `graph.json` 的 `extraction_status` 字段暴露
- 概念级掌握度每次答题后更新（复用 Phase 2 公式，更新目标从 note_path 变为 concept_id）
- embedding 相似度计算复用 Deepseek API（与生成出题用同一 provider）
