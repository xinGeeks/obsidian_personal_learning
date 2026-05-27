# Personal Learning Hub - Backend

## 环境配置

```bash
# 安装依赖
pip install -r requirements.txt

# 复制并编辑环境变量
cp .env.example .env
```

编辑 `.env` 文件：

```
DEEPSEEK_API_KEY=你的Deepseek-API-Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
VAULT_PATH=/path/to/your/obsidian/vault
```

## 启动开发服务器

```bash
uvicorn app.main:app --reload --port 8000
```

API 文档访问：http://localhost:8000/docs

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/vault/notes` | 获取 vault 中所有笔记列表 |
| GET | `/api/vault/notes/{path}` | 获取单篇笔记内容和元数据 |
| POST | `/api/quiz/generate` | 基于选中笔记生成试卷 |
| POST | `/api/quiz/evaluate` | 评测单题作答 |
| POST | `/api/learning/sessions` | 保存学习会话 |
| GET | `/api/learning/history` | 查询学习历史 |
| GET | `/api/learning/summary` | 获取学习摘要统计 |
