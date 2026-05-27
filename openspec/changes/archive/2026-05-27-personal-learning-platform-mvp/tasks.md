## 1. 项目初始化

- [x] 1.1 创建前端 React 18 + TypeScript + Vite 项目骨架，配置 Tailwind CSS
- [x] 1.2 创建后端 Python/FastAPI 项目骨架，配置 poetry/pip 依赖管理
- [x] 1.3 配置前端开发代理（Vite proxy → FastAPI :8000）
- [x] 1.4 添加 Deepseek API key 配置（后端 .env 文件 + 环境变量读取）

## 2. Vault 集成（后端）

- [x] 2.1 实现 vault 目录配置与校验（config 中指定 vault 路径，启动时验证目录存在）
- [x] 2.2 实现笔记列表 API `GET /api/vault/notes`（扫描 .md 文件，返回标题+路径）
- [x] 2.3 实现笔记内容读取 API `GET /api/vault/notes/{path}`（读取 Markdown，返回原始内容+纯文本）
- [x] 2.4 实现 Markdown 纯文本提取（去除 frontmatter、代码块、图片链接，用于 AI 上下文）
- [x] 2.5 实现 Obsidian 方言解析（`[[]]` 链接提取、frontmatter YAML 解析、`#tag` 提取）

## 3. AI 出题（后端 + Deepseek）

- [x] 3.1 封装 Deepseek API 客户端（chat completion 调用，错误处理，超时重试）
- [x] 3.2 设计出题 prompt 模板（系统提示词 + 用户提示词模板，覆盖选择/填空/简答三种题型）
- [x] 3.3 实现出题 API `POST /api/quiz/generate`（接收笔记路径列表，拼接内容，调用 Deepseek，解析 JSON 响应）
- [x] 3.4 实现 token 预算检查（笔记总字符数超过阈值时拒绝并返回 413）
- [x] 3.5 添加 API 错误处理（key 未配置 503、超时 503、LLM 返回非 JSON 格式的容错解析）

## 4. AI 评测（后端 + Deepseek）

- [x] 4.1 设计评测 prompt 模板（包含题目、参考答案、用户答案，要求输出正确性+分数+盲区诊断+建议回看笔记）
- [x] 4.2 实现评测 API `POST /api/quiz/evaluate`（接收 quiz_id + 题目索引 + 用户答案，调用 Deepseek，返回结构化评测结果）
- [x] 4.3 实现盲区诊断输出解析（确保 `blind_spots` 和 `suggested_review_notes` 字段格式正确）

## 5. 学习记录（后端）

- [x] 5.1 实现 `.learning/` 目录自动创建
- [x] 5.2 实现会话记录保存（完整学习会话写入 `records.json`）
- [x] 5.3 实现学习历史查询 API `GET /api/learning/history`（支持日期范围、来源笔记过滤）
- [x] 5.4 实现学习摘要统计 API `GET /api/learning/summary`（总会话数、平均分、高频盲区）

## 6. 前端页面

- [x] 6.1 实现笔记选择页（vault 笔记列表展示、多选勾选框、「开始学习」按钮）
- [x] 6.2 实现答题页布局（单题全屏显示、逐题推进、进度指示器）
- [x] 6.3 实现选择题组件（选项按钮、选中高亮、提交后禁用 + 显示对/错着色）
- [x] 6.4 实现填空题组件（输入框、提交按钮）
- [x] 6.5 实现简答题组件（多行文本输入、提交按钮）
- [x] 6.6 实现评测结果展示（正确/错误标记、分数、诊断反馈、建议回看笔记列表）
- [x] 6.7 实现学习完成页（本次学习总结：正确率、盲区分布、下一步建议）
- [x] 6.8 添加全流程 loading/error/empty 状态处理

## 7. 联调与验证

- [x] 7.1 端到端流程测试（选择笔记 → 生成试卷 → 逐题作答 → 完成总结）
- [x] 7.2 错误场景测试（API 不可用、vault 为空、笔记过大、Deepseek 返回异常格式）
- [x] 7.3 前端构建验证（`vite build` 成功，产物可独立部署）
- [x] 7.4 后端启动文档（README 中写清如何配置 vault 路径、API key、启动服务）
