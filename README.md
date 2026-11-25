# liudayan.com（v2 · 个人 Agent 版）

刘大雁个人主页：极简三拍开屏 + 个人 Agent（预设秒回 + 知识库 RAG）+ 独立 URL 详情页 + 站内原生预约表单（直写飞书多维表格）。

## 目录结构

- `index.html` — 首页（开屏渐进式个人 Agent）
- `content/pages.json` — 全站 6 个核心板块单一事实源（服务、FDE 案例、AI 工具赋能、1 对 1 陪跑、亲子探索、联系）
- `content/kb/*.md` — 补充知识库（关于与 FAQ）
- `scripts/build.mjs` — 构建脚本：自动生成 6 个独立静态页 + `data/kb-chunks.json` RAG 索引
- `api/chat.js` — Vercel Serverless：片段检索 RAG + DeepSeek 忠实回答 + 来源引用
- `api/lead.js` — Vercel Serverless：站内预约表单 → 飞书多维表格 Bitable
- `assets/photos/` — 替换照片位置：
  - `avatar.jpg`：个人头像
  - `workshop.jpg`：上课现场照
  - `wechat-qr.jpg`：微信二维码（放入即自动显示）

## 本地开发与构建

```bash
npm run build
npm run dev
```

## Vercel 环境变量配置

1. **知识库 RAG 对话（`/api/chat`）**：沿用旧站已配的 `DEEPSEEK_API_KEY`（可选 `DEEPSEEK_MODEL`，默认 `deepseek-v4-flash`）。
2. **预约表单落飞书多维表格（`/api/lead`）**：
   - 在飞书多维表格建表，列名保持为：`称呼`、`公司或机构`、`咨询方向`、`联系方式`、`需求背景`、`来源页面`、`提交时间`（均为文本列）。
   - 在 Vercel 配置：`FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_BITABLE_APP_TOKEN`、`FEISHU_BITABLE_TABLE_ID`。

## 旧版本回滚

重构前已完整备份在 Git 标签 `v1-legacy-backup` 与 `v1-main-backup`。
