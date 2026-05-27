## Why

Obsidian 已成为个人知识管理的核心工具，但缺乏原生的 AI 驱动的学习闭环。现有 AI 笔记工具停留在「摘要+聊天」的浅层辅助——用户真正需要的是一个能理解他的知识状态、能跨笔记综合出题、能诊断知识盲区并给出精准回看建议的 AI 教学系统。本项目构建独立的 Web 应用，融合 Obsidian vault 的生态兼容性与 Deepseek AI 的教学能力，打造个人学习闭环 MVP。

## What Changes

- 新增独立的 Web 应用，直接读取本地 Obsidian vault 中的 Markdown 笔记
- 新增 AI 出题能力：基于 1-N 篇笔记内容，由 Deepseek 生成混合题型试卷（选择、填空、简答），支持跨笔记综合出题
- 新增 AI 评测能力：逐题诊断作答结果，定位知识盲区，输出「建议回看 XX 笔记」的诊断性反馈
- 新增学习记录存储：题目、作答、诊断结果持久化为本地 JSON，为后续掌握度模型积累数据
- 新增 Python/FastAPI 后端服务，封装 Deepseek API 调用、vault 文件读写
- 新增 React 18 + TypeScript 前端，提供笔记选择页 + 答题页两大核心页面

## Capabilities

### New Capabilities

- `vault-integration`: Obsidian vault 的 Markdown 文件读取与解析，包括双向链接 `[[]]`、frontmatter、标签等方言的兼容处理
- `quiz-generation`: AI 驱动的混合题型试卷生成——接收用户选中的笔记内容，调用 Deepseek API 生成选择题、填空题、简答题，支持跨笔记知识点交叉出题
- `quiz-evaluation`: AI 驱动的逐题诊断评测——对单题作答结果进行判分，定位知识盲区，输出包含「建议回看 XX 笔记」的结构化诊断反馈
- `learning-records`: 学习记录的持久化存储——题目生成记录、用户作答、AI 诊断结果以 JSON 格式存储到 vault 旁的 `.learning/` 目录

### Modified Capabilities

<!-- No existing capabilities to modify -->

## Impact

- 全新项目，不影响现有代码
- 依赖：Deepseek API（LLM），Obsidian vault 本地文件系统
- 前端：React 18 + TypeScript + Vite + Tailwind CSS
- 后端：Python + FastAPI
- 存储：本地 Markdown（读）+ 本地 JSON（写学习记录）
