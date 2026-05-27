## Why

Phase 2 实现了笔记级掌握度追踪，但核心局限在于：一篇笔记可能包含多个知识点，用户对同一篇笔记的不同概念掌握程度不同。Phase 3 引入知识图谱，将粒度从笔记下钻到知识点，并构建概念间的依赖关系网络，使 AI 能够跨知识点综合出题、自动编排自适应学习路径。

## What Changes

- 新增知识图谱数据层 `.learning/graph.json`：存储概念节点、关系边、提取状态
- 新增加知识提取 Pipeline：后台全量预热 + 笔记变更时增量更新，Deepseek 逐篇提取知识点并去重合并
- 新增概念级掌握度追踪：复用 Phase 2 公式，粒度从 note_path 变为 concept_id
- **BREAKING**: 修改出题 API，prompt 中注入知识点前置依赖关系，实现跨概念综合出题
- **BREAKING**: 修改评测 API，diagnostic 中的 blind_spots 从概念名称改为 concept_id，精确定位到知识点
- 新增知识图谱可视化：独立 `/graph` 页面（D3.js 力导向图）+ Dashboard 底部小图谱概览
- 修改 `GET /api/mastery/overview`：返回数据优先展示概念级掌握度
- 新增知识图谱相关 API：提取状态查询、手动触发提取、单概念详情

## Capabilities

### New Capabilities

- `knowledge-graph`: 知识图谱数据模型（graph.json 读写、节点/边 CRUD、概念级掌握度计算）、知识提取 Pipeline（全量预热 + 增量更新）、概念去重合并策略
- `graph-extraction`: 提取任务管理——异步后台执行、进度状态追踪（`extraction_status`）、手动触发、错误恢复
- `graph-visualization`: 前端力导向图页面 `/graph`（D3.js 渲染、节点交互、搜索定位、详情面板）+ Dashboard 底部小图谱概览

### Modified Capabilities

- `mastery-model`: 掌握度模型扩展为支持 concept_id 粒度（原 note_path 粒度保留兼容），`mastery.json` 和 `graph.json` 双数据源
- `quiz-generation`: 出题 prompt 注入知识点前置依赖关系，支持跨概念综合出题
- `quiz-evaluation`: 评测结果 `blind_spots` 中新增 `concept_id` 字段，诊断定位到具体知识点
- `mastery-dashboard`: 仪表盘底部新增加知识图谱概览小图（< 15 节点），点击节点跳转到 `/graph`

## Impact

- 后端新增 `app/graph.py`（数据模型 + 提取引擎）、`app/routes/graph.py`（API）
- 前端新增 `pages/GraphPage.tsx`、`components/GraphMini.tsx`
- 前端新增 `lib/graphApi.ts`（图谱相关 API 调用）
- 前端安装 D3.js 依赖
- 后端现有 `quiz.py` routes（prompt 注入逻辑）、`mastery.py`（概念级更新）、`routes/mastry_routes.py`（扩展 overview）需修改
- `.learning/graph.json` 新文件，不影响 `records.json` 和 `mastery.json`
