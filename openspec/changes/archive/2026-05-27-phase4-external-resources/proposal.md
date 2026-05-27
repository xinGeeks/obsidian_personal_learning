## Why

Phase 1-3 构建了完整的学习闭环，但学习资料仅限于用户已有的 Obsidian vault。当 AI 诊断出知识盲区（如「特征值分解」掌握度 0.2）时，只能建议「回看已有笔记」——如果 vault 中没有覆盖该前置知识，建议无效。Phase 4 引入外部资源搜索和 AI 加工能力，让系统自动发现高质量外部学习资料并融入学习计划。

## What Changes

- 新增外部资源搜索：基于知识盲区自动搜索（DuckDuckGo），域名权重排序，Dashboard 主动推荐
- 新增 AI 三重加工：抓取全文 → Deepseek 生成摘要 + 出题 + Markdown 笔记
- 新增资源数据层 `.learning/resources.json`：存储资源元数据、摘要、题目、笔记
- 新增资源库页面 `/resources`：已保存资料列表、原文链接、答题入口、保存笔记
- 修改 GraphPage 详情面板：新增「查找学习资料」按钮（手动搜索入口）
- 修改 Dashboard：新增「推荐学习资料」区块
- **BREAKING**: 修改 `POST /api/quiz/generate` 支持 `source_type: "resource"` 从外部资料出题

## Capabilities

### New Capabilities

- `external-search`: 外部资料搜索——基于概念名称构造搜索词、调用搜索引擎 API、域名权重排序、去重过滤
- `resource-processing`: 外部资料加工——WebFetch 抓取全文、Deepseek 三重加工（摘要+出题+笔记）、结果存储到 resources.json
- `resource-library`: 资源库页面——已保存资料列表、搜索过滤、原文链接、答题入口、保存笔记到 vault

### Modified Capabilities

- `quiz-generation`: 支持 `source_type: "resource"` 参数，从外部资料 URL 出题而非 vault 笔记出题
- `mastery-dashboard`: 新增「推荐学习资料」区块，展示基于知识盲区推荐的未读外部资源

## Impact

- 后端新增 `app/resources.py`（搜索+加工引擎）、`app/routes/resources.py`（API）
- 后端新增依赖：`duckduckgo_search`、`httpx`、`beautifulsoup4`
- 前端新增 `pages/ResourcePage.tsx`、`lib/resourcesApi.ts`
- 前端修改 `Dashboard.tsx`（推荐区块）、`GraphPage.tsx`（查找按钮）
- `.learning/resources.json` 新文件
