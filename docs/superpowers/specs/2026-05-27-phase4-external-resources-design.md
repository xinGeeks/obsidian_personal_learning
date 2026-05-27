# Phase 4: 外部生态 — 设计文档

## 背景

Phase 1-3 构建了完整的知识学习闭环，但学习资料仅限于用户已有的 Obsidian vault。当 AI 诊断出知识盲区时，系统只能建议「回看 XX 笔记」——如果 vault 中没有覆盖某个前置知识，建议无效。Phase 4 引入外部资源搜索和加工能力，让系统在检测到知识缺口时主动推荐高质量外部学习资料。

## 核心决策

| 决策 | 选择 |
|------|------|
| 触发方式 | 混合：AI 主动推荐（Dashboard）+ 用户手动搜索（概念节点） |
| 搜索来源 | 通用搜索 API + 优质域名优先排列 |
| 存储方式 | 混合：`resources.json` 索引 + 可选 vault 笔记 |
| 加工深度 | 三重加工：摘要 + 出题 + 笔记 |

## 数据模型

### resources.json

```json
{
  "resources": [
    {
      "id": "res_<uuid>",
      "url": "https://...",
      "title": "...",
      "source": "wikipedia",
      "domain_weight": 1.0,
      "related_concepts": ["cn_001"],
      "summary": "AI 生成的 300-500 字摘要",
      "key_points": ["要点1"],
      "quiz_questions": [{ type, stem, options?, answer, explanation }],
      "note_markdown": "完整的 Markdown 笔记内容",
      "saved_note_path": "学习笔记/外部资料/xxx.md",
      "saved_at": "2026-05-27T10:00:00",
      "reviewed": false
    }
  ]
}
```

## 搜索与加工 Pipeline

### 搜索

1. 接收 concept_ids 或自定义搜索词
2. 用知识点名称构造搜索词（中文优先，追加"学习"或"教程"）
3. 调用 Web Search API（含 bing/google），返回 Top 10
4. 按 domain_weight 排序输出 Top 5

域名权重表（硬编码配置）：

| 域名 | 权重 |
|------|------|
| wikipedia.org | 1.0 |
| arxiv.org | 0.95 |
| khanacademy.org | 0.9 |
| github.com (README/tutorial) | 0.85 |
| 知乎、简书、博客园 | 0.7 |
| 其他 | 0.5 |

### AI 三重加工

用户选择一篇文章后：

1. **WebFetch 抓取全文** → 提取纯文本
2. **摘要**：Deepseek 生成 300-500 字摘要 + 5 个关键要点
3. **出题**：复用 Phase 1 出题 prompt，3-5 题（基于文章内容）
4. **笔记**：Deepseek 生成 Markdown 笔记，含：
   - `## 摘要` — 文章核心内容
   - `## 关键知识点` — 要点列表
   - `## 与现有知识库关联` — 链接到 vault 中相关笔记和概念
   - `## 原文链接` — URL

### 融入学习闭环

- 生成的题目可直接进入 Phase 1 答题流程（source_type: "resource"）
- resource 的 `reviewed` 字段追踪用户是否已阅读/答题
- Dashboard 推荐区展示未读的高质量外部资料

## API 设计

### 新增

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/resources/search` | 搜索外部资料 |
| POST | `/api/resources/process` | 抓取并加工单篇文章 |
| POST | `/api/resources/save-note` | 将 AI 笔记写入 vault |
| GET | `/api/resources/list` | 已保存资源列表 |
| GET | `/api/resources/recommendations` | 基于盲区的主动推荐 |

### 修改

- `POST /api/quiz/generate`：支持 `source_type: "resource"` + `source_url` 参数，从资源出题而非从 vault 笔记出题

## 前端设计

### 路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | Dashboard | 扩展现有仪表盘，新增加「推荐学习资料」区块 |
| `/resources` | ResourcePage | **新增**：资料库列表页 |
| `/graph` | GraphPage | 详情面板新增加「查找学习资料」按钮 |
| 其他 | 不变 | |

### Dashboard 扩展

「今日推荐复习」下方新增「推荐学习资料」区块：
- 最多显示 3 个未读资源卡片
- 每张卡片：标题、来源域名、AI 摘要截断（前 100 字）、「查看」按钮
- 空状态：「暂无推荐资料，知识图谱中的薄弱概念会自动触发推荐」

### ResourcePage (`/resources`)

- 已保存资料列表（按时间倒序）
- 每项：来源域名标签、标题、AI 摘要前 200 字、关键要点标签
- 操作：「查看原文」（外链）、「开始答题」（进入 Phase 1 流程）、「保存笔记」（写入 vault）
- 搜索框：按标题/关键词搜索已保存资源
- 空状态 + loading + error 状态完整覆盖

### GraphPage 扩展

详情面板中，关联知识点区域旁增加「查找学习资料」按钮：
- 点击 → 以当前概念名称 + 关联概念名称构造搜索
- 搜索结果以弹出面板/抽屉形式展示
- 选择一篇文章 → 自动处理 → 展示摘要 → 可选出题/保存笔记

## 实现要点

- Web Search 使用 `ddg-search` 库（DuckDuckGo，免 API Key）或 Deepseek 内置搜索能力
- WebFetch 使用 Python `httpx` + `BeautifulSoup` 提取正文
- 域名权重配置放在 `backend/app/config.py` 中
- AI 三重加工为三次独立的 Deepseek 调用（可并行：摘要 + 出题 + 笔记同时请求）
- resources.json 与 graph.json 平级存储于 `.learning/`
