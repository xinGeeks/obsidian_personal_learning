## Context

Phase 1/2 构建了笔记级学习闭环和掌握度追踪。Phase 3 在笔记与题目之间插入「知识点」抽象层，构建概念关系图并实现概念级掌握度追踪和跨概念智能出题。

## Goals / Non-Goals

**Goals:**
- 知识提取 Pipeline：全量预热 + 增量更新，Deepseek 提取知识点和关系
- 概念去重合并：编辑距离 + embedding 相似度双重判断
- 概念级掌握度追踪：复用 Phase 2 公式，粒度从 note_path 变为 concept_id
- 修改出题/评测 prompt 注入知识图谱信息
- D3.js 力导向图可视化（独立页 + Dashboard 小图）

**Non-Goals:**
- 不做 Neo4j 等外部图数据库（MVP 用 graph.json 文件存储，个人规模足够）
- 不做段落级概念标注（概念定位到笔记级别，section 字段可选）
- 不做自动学习路径规划（Phase 4）
- 不做移动端图谱交互优化

## Decisions

### 1. 图存储：JSON 文件

节点和边存储于 `.learning/graph.json`。个人 vault 的知识点规模（百到千级）完全不需要图数据库。JSON 可读、可手动编辑、零依赖，与 obsidian 用户心智一致。

### 2. 去重策略

两步合并：
1. 快速路径：Levenshtein 距离 < 3 且短名是长名的子串 → 直接合并
2. 深度路径：调用 Deepseek embedding，余弦相似度 > 0.85 → 合并
3. 都不满足 → 视为新概念节点

使用 `difflib.SequenceMatcher`（标准库）做编辑距离。

### 3. D3.js 与 React 集成

D3 只负责力模拟计算（`d3.forceSimulation`），React 负责 DOM 渲染（SVG `<circle>` / `<line>` 元素）。与项目 Phase 1 设计文档中的 D3-React 桥接模式一致。组件内部 useRef 持有 D3 simulation 实例，useEffect 中更新。

### 4. 提取任务异步化

全量提取通过 FastAPI `BackgroundTasks` + `asyncio.create_task` 异步运行。状态通过 `graph.json` 的 `extraction_status` 字段暴露（phase: idle/running/completed, total_notes_processed, total_notes）。前端轮询 `/api/graph/extraction-status`（每 3 秒）展示进度。

### 5. 概念级掌握度

复用 Phase 2 的 `compute_mastery()` 和 `interval_for_mastery()` 函数，输入从 note_path 维度的 session scores 变为 concept_id 维度的 quiz scores。graph.json 中的每个 concept 节点记录独立的 mastery/confidence/last_reviewed/next_review_due。

出题/评测时，AI 返回的 `reference_notes` 扩展为 `reference_concepts: [concept_id]`，用于后续更新概念级掌握度。

### 6. 向后兼容

- `mastery.json` 保留不删除，Dashboard 优先展示概念级数据，无概念数据时 fallback 到笔记级
- 旧版 quiz（无 concept_id）的评测结果仍然有效，只是不更新概念级掌握度
- `GET /api/mastery/overview` 返回值扩展 `concepts` 字段，旧前端忽略未知字段

## Risks / Trade-offs

- [全量提取耗时] 100+ 篇笔记逐篇调用 Deepseek 可能需要数分钟 → 后台异步运行，用户继续使用 Phase 1/2 功能，状态栏展示进度
- [去重误判] 编辑距离可能误合并不同概念（如 "PCA" vs "PCoA"） → embedding 二次判断作为校验，阈值 0.85 较保守
- [图谱可视化性能] 200+ 节点力导向图可能卡顿 → 默认只渲染前 100 个节点，搜索/过滤后才展示更多
