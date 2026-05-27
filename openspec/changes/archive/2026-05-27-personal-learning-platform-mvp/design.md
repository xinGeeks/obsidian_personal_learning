## Context

当前 Obsidian vault 中有大量学习笔记，但缺乏 AI 驱动的学习闭环能力。现有根目录 `design.md` 已定义了「第二大脑」的完整愿景，本项目聚焦其 MVP 阶段——验证 AI 出题与诊断的核心价值。

**约束**：
- 必须是独立 Web 应用，不修改 Obsidian 本体
- 直接读写 Obsidian vault 目录，不引入新的数据孤岛
- 优先使用 Deepseek API，暂不引入本地模型
- MVP 不引入外部数据库依赖（SQLite 除外）

## Goals / Non-Goals

**Goals:**
- 用户可选择 vault 中的笔记进入学习模式
- Deepseek AI 跨笔记生成混合题型试卷（选择、填空、简答）
- 逐题诊断作答结果，定位知识盲区，给出带笔记链接的回看建议
- 学习记录持久化到本地 JSON
- 前端为独立 React SPA，后端为 Python/FastAPI 服务

**Non-Goals:**
- 不做 AI 自动推荐今日学习计划
- 不做自动知识点提取与知识图谱构建
- 不做掌握度建模与遗忘曲线追踪
- 不做向量数据库（LanceDB/ChromaDB）
- 不做外部资料自动搜索推荐
- 不做用户认证系统（本地单用户）

## Decisions

### 1. 后端语言：Python/FastAPI

**选型理由**：Deepseek 的 Python SDK 成熟度最高；RAG、embedding 等后续迭代所需的 Python 生态（sentence-transformers、langchain 等）无需切换语言。对比 Node.js/Express：JS 在 ML pipeline 生态上明显弱于 Python，而本项目 AI 能力是核心路径。

### 2. 题库生成策略：单次 LLM 调用生成完整试卷

将选中的笔记内容 + 题型要求一次性发送给 Deepseek，由 LLM 直接输出结构化 JSON 试卷。不做分步生成（先提取知识点 → 再逐知识点出题），因为 MVP 阶段分步会增加延迟和失败概率，且单次调用足以验证出题质量。

### 3. 评测策略：逐题独立调用 LLM

每道题单独调用 Deepseek 评测——原因：(a) 试卷是一次性返回的，用户逐题作答；(b) 独立调用让每道题的诊断反馈更聚焦；(c) 避免上下文过长导致 LLM 注意力分散。

### 4. Vault 读取：直接文件系统访问

后端直接 `readdir` + `readFile` 读取 Obsidian vault 目录。不引入 git、不复制文件、不建立索引。MVP 笔记数量假设 <1000 篇，文件系统遍历性能完全够用。

### 5. 存储：JSON 文件，非数据库

学习记录存储到 `vault/.learning/records.json`。为什么不是 SQLite：(a) MVP 数据量极小（每日几条记录）；(b) JSON 可直接用文本编辑器查看，符合 Obsidian 用户心智模型；(c) 零依赖。

### 6. 前端架构：两个核心页面

- **笔记选择页**：列出 vault 中所有 Markdown 笔记（标题 + 路径），支持多选，点击「开始学习」跳转
- **答题页**：单题全屏展示，逐题推进。选择题为选项按钮，填空题为输入框，简答题用 textarea。提交后立即展示诊断结果，确认后进入下一题

不做编辑器（答题不需要 TipTap）、不做知识图谱（Phase 3）。

### 7. Markdown 解析：unified/remark

选择题需要读取笔记全文，但需要提取纯文本内容传给 LLM（去掉 frontmatter、代码块、图片链接以减少 token 消耗）。unified + remark 插件化处理，最小化实现。

### 8. API 设计：两个核心端点

```
POST /api/quiz/generate
  入参: { note_paths: string[], question_count?: number }
  出参: { quiz_id, questions: [{ type, stem, options?, answer, explanation? }] }

POST /api/quiz/evaluate
  入参: { quiz_id, question_index, user_answer }
  出参: { correct, score, diagnostic: { blind_spots, suggested_review_notes } }
```

## Risks / Trade-offs

- **[出题质量不稳定]** LLM 生成的题目可能太简单/太偏/歧义 → 在 prompt 中明确出题标准（覆盖核心概念、考察理解而非记忆），并支持用户对单题质量打分反馈
- **[简答题评测主观性强]** 开放式答案难以完全自动判分 → prompt 中要求 LLM 给出「接受/部分接受/不接受」三级判定并附理由，而非简单的对/错
- **[Deepseek API 不可用]** 服务中断导致核心功能瘫痪 → 前端展示明确的错误状态，不静默失败；后续可扩展多 LLM provider 切换
- **[大 vault 性能]** >1000 篇笔记时文件遍历变慢 → MVP 阶段添加简单的文件缓存（mtime + 文件名列表缓存），不提前优化
- **[跨笔记出题的知识关联质量]** LLM 可能找不到真正的知识交叉点，制造伪关联 → prompt 中明确要求「只在确有知识关联时交叉出题，不强行关联」
