## 1. 后端依赖与配置

- [x] 1.1 安装新增依赖：`duckduckgo_search`, `httpx`, `beautifulsoup4`
- [x] 1.2 在 `config.py` 添加域名权重表 `DOMAIN_WEIGHTS` 和搜索间隔 `SEARCH_INTERVAL`

## 2. 资源搜索与加工引擎（后端）

- [x] 2.1 创建 `app/resources.py`，实现 `search_external(concept_ids, query)` 搜索函数
- [x] 2.2 实现域名权重排序（domain_weight × position_score）
- [x] 2.3 实现搜索速率限制（min 3s interval）
- [x] 2.4 实现 `fetch_article(url)` 网页抓取 + BeautifulSoup 正文提取
- [x] 2.5 实现 `process_resource(url, concept_ids)` AI 三重加工（摘要 + 出题 + 笔记并行）
- [x] 2.6 实现 resources.json 读写（load/save/list/query）
- [x] 2.7 实现 `save_note_to_vault(resource_id)` 写入 Markdown 笔记

## 3. Resources API 路由（后端）

- [x] 3.1 实现 `POST /api/resources/search`
- [x] 3.2 实现 `POST /api/resources/process`
- [x] 3.3 实现 `POST /api/resources/save-note`
- [x] 3.4 实现 `GET /api/resources/list`
- [x] 3.5 实现 `GET /api/resources/recommendations`
- [x] 3.6 在 `app/main.py` 注册 resources router
- [x] 3.7 修改 `POST /api/quiz/generate` 支持 `source_type: "resource"` + `source_url`

## 4. 前端 ResourcePage（前端）

- [x] 4.1 新增 `lib/resourcesApi.ts`：API 调用函数
- [x] 4.2 新增类型：`ResourceItem`, `SearchResult`, `ResourceList`
- [x] 4.3 创建 `pages/ResourcePage.tsx` 页面骨架
- [x] 4.4 实现资源卡片列表（域名标签、标题、摘要截断、关键要点标签、操作按钮）
- [x] 4.5 实现操作按钮（查看原文、开始答题、保存笔记）
- [x] 4.6 实现搜索过滤功能
- [x] 4.7 实现 loading/empty/error 状态

## 5. Dashboard 与 GraphPage 扩展（前端）

- [x] 5.1 修改 Dashboard 新增「推荐学习资料」区块（3 卡片 + 空状态）
- [x] 5.2 修改 GraphPage 详情面板新增「查找学习资料」按钮 + 搜索结果弹出面板
- [x] 5.3 在 `App.tsx` 新增 `/resources` 路由

## 6. 联调与验证

- [x] 6.1 端到端流程测试（搜索 → 抓取 → 加工 → 保存 → 出题 → 答题 → 掌握度更新）
- [x] 6.2 边界测试（搜索无结果、抓取失败、部分加工失败、速率限制触发）
- [x] 6.3 TypeScript 编译 + 前端构建验证
