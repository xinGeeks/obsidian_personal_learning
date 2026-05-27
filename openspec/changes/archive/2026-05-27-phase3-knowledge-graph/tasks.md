## 1. 知识图谱数据模型（后端）

- [x] 1.1 创建 `app/graph.py` 模块，实现 graph.json 读写（load/save/initialize）
- [x] 1.2 实现概念节点 CRUD（upsert_concept, get_concept, list_concepts, delete_orphaned）
- [x] 1.3 实现关系边 CRUD（upsert_edge, get_edges_for_concept）
- [x] 1.4 实现概念去重逻辑（编辑距离 + embedding 余弦相似度两步判断）
- [x] 1.5 实现概念级掌握度更新函数（复用 Phase 2 公式，target 从 note_path 变为 concept_id）
- [x] 1.6 实现 graph.json 提取状态管理（phase、进度计数、时间戳更新）

## 2. 知识提取 Pipeline（后端）

- [x] 2.1 实现单篇笔记知识点提取（调用 Deepseek，输出 [{name, description, section, prerequisites, related}]）
- [x] 2.2 实现全量提取引擎（遍历 vault .md 文件，逐篇提取，去重合并写入 graph.json）
- [x] 2.3 实现增量提取引擎（单篇笔记变更时触发，仅更新涉及该笔记的节点和边）
- [x] 2.4 实现提取错误处理（单篇失败时记录日志、跳过、继续下一篇）
- [x] 2.5 实现异步后台任务（FastAPI BackgroundTasks + asyncio.create_task）

## 3. Graph API 路由（后端）

- [x] 3.1 实现 `GET /api/graph/overview`（全量图谱数据：节点 + 边）
- [x] 3.2 实现 `GET /api/graph/extraction-status`（提取进度状态）
- [x] 3.3 实现 `POST /api/graph/trigger-extraction`（手动触发 + 409 防重复）
- [x] 3.4 实现 `GET /api/graph/concept/{id}`（单概念详情 + 关联概念）
- [x] 3.5 在 `app/main.py` 注册 graph router

## 4. 现有 API 修改（后端）

- [x] 4.1 修改 `GET /api/mastery/overview` 扩展返回 concepts_summary 字段
- [x] 4.2 修改 `POST /api/quiz/generate` prompt 注入知识图谱依赖关系
- [x] 4.3 修改 `POST /api/quiz/evaluate` prompt 要求返回 concept_id
- [x] 4.4 修改 `learning_routes.py` 的 save_session 流程，触发概念级掌握度更新

## 5. 前端 D3.js 依赖与类型

- [x] 5.1 安装 d3.js 依赖：`npm install d3 @types/d3`
- [x] 5.2 新增前端类型：`ConceptNode`, `ConceptEdge`, `GraphData`, `ExtractionStatus`
- [x] 5.3 新增 `lib/graphApi.ts`：`fetchGraphOverview()`, `fetchExtractionStatus()`, `triggerExtraction()`, `fetchConcept()`

## 6. GraphPage 前端

- [x] 6.1 创建 `pages/GraphPage.tsx` 页面骨架（加载数据 → 渲染 SVG 画布）
- [x] 6.2 实现 D3 力导向图（D3 simulation + React SVG 渲染，solid/dashed 边）
- [x] 6.3 实现节点交互（拖拽、点击展开详情面板、缩放平移）
- [x] 6.4 实现搜索定位功能（搜索框输入 → 匹配节点高亮 → 画布平移到节点）
- [x] 6.5 实现详情面板（概念定义、掌握度进度条、来源笔记链接、关联概念列表）
- [x] 6.6 实现 loading/error/empty 状态 + 提取进度条展示

## 7. Dashboard 扩展与路由（前端）

- [x] 7.1 创建 `components/GraphMini.tsx`（200px 小图谱，最多 15 节点，点击跳转 /graph）
- [x] 7.2 修改 Dashboard 页面底部嵌入 GraphMini 组件
- [x] 7.3 在 `App.tsx` 新增 `/graph` → GraphPage 路由
- [x] 7.4 处理 `/graph?focus=<concept_id>` URL 参数，自动定位节点

## 8. 联调与验证

- [x] 8.1 端到端流程测试（触发提取 → 等待完成 → 图谱渲染 → 出题带 concept_id → 评测带 concept_id → 概念级掌握度更新）
- [x] 8.2 边界测试（空 vault、提取中途失败、去重误判、200+ 节点图谱性能）
- [x] 8.3 TypeScript 编译 + 前端构建验证
