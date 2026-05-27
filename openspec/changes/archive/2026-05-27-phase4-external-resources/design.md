## Context

Phase 1-3 构建了 vault 内的完整学习闭环。Phase 4 突破 vault 边界，引入外部资源发现和加工能力。

## Goals / Non-Goals

**Goals:**
- 基于知识盲区自动搜索外部学习资料
- AI 三重加工：摘要 + 出题 + 笔记
- 外部资料融入现有出题和学习流程
- 资源库页面管理已保存资料
- 手动搜索入口（知识图谱概念节点）

**Non-Goals:**
- 不做付费搜索 API（使用免费 DuckDuckGo）
- 不做视频/音频内容抓取（仅文本）
- 不做自动定期搜索（每次基于当前盲区手动/自动触发）
- 不做资源推荐评分系统

## Decisions

### 1. 搜索：DuckDuckGo

使用 `duckduckgo_search` 库（免费、免 API Key、可指定中文区域）。对比 Google/Bing API 需要付费且需配置 Key，DuckDuckGo 对个人项目更友好。

### 2. 网页抓取：httpx + BeautifulSoup

异步抓取原文，BeautifulSoup 提取正文（优先 `<article>` → `<main>` → `<body>`，去除 script/style/nav）。为什么不用更重的方案（Playwright/Selenium）：目标站点主要是 Wikipedia/arXiv/博客等静态页面，不需要 JS 渲染。

### 3. 域名权重

硬编码权重表在 `config.py`，用户可编辑：

```python
DOMAIN_WEIGHTS = {
    "wikipedia.org": 1.0, "arxiv.org": 0.95,
    "khanacademy.org": 0.9, "github.com": 0.85,
    "zhihu.com": 0.7, "jianshu.com": 0.7, "cnblogs.com": 0.7,
}
# 默认 0.5
```

搜索结果按 `domain_weight × 相关性` 排序。

### 4. AI 加工：三次并行调用

摘要、出题、笔记三份 prompt 独立，三个 Deepseek 调用并行发起（`asyncio.gather`），减少等待时间。每份 prompt 复用 Phase 1/2 的模板结构。

### 5. 资源出题复用 Phase 1

`POST /api/quiz/generate` 已有对 vault 笔记出题的能力，扩展支持 `source_type: "resource"` + `source_url`。后台逻辑：抓取原文 → 传入 quiz generate prompt 作为上下文。其他评测流程（evaluate、save session）不变。

### 6. 主动推荐触发逻辑

Dashboard 加载时：遍历 `graph.json` 中 mastery < 0.3 的概念 → 检查 resources.json 是否已有对应资源 → 没有则触发搜索 → 缓存结果到 resources.json（不自动加工，用户点击后才抓取全文）。避免过度消耗 API。

## Risks / Trade-offs

- [DuckDuckGo 限速] 可能触发 rate limit → 搜索间隔 ≥ 3 秒，批量搜索串行
- [抓取失败] 部分网站屏蔽爬虫或需要 JS → 失败时展示原链接，允许用户手动阅读
- [加工质量] AI 摘要可能不准确 → 始终保留原文链接，用户可与原文对照
