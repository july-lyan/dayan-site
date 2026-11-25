# 大雁的个人站

`liudayan.com` — vibecoder 作品集 + Blog + 自媒体数据 + AI 助手「雁飞」。

基于 Claude Design 出的设计稿落地，纯静态 HTML/CSS + React (UMD via CDN) + 一个 Vercel serverless 函数跑 AI 对话。

## 本地跑

```bash
cd /Users/july/dayan-site
npx serve . -p 3000
# 打开 http://localhost:3000
```

AI 助手会因为本地没有 `/api/chat` 端点失败，自动 fall back 到 canned 答案，UI 不会崩。

## 配置域名邮箱 hi@liudayan.com

最快路径（Cloudflare Email Routing，免费 + 10 分钟搞定）：

1. 在 Cloudflare 添加 `liudayan.com` 域名（如果在别处买的，改 nameserver 到 Cloudflare）
2. Dashboard → Email → Email Routing → Enable
3. Routes → Custom address → 添加 `hi@liudayan.com` → Forward to → 你的 gmail
4. Cloudflare 会自动加 MX/TXT 记录，等几分钟生效
5. 测试：从别的邮箱发到 `hi@liudayan.com`，应该转到 gmail

后续要发件（不只收件）：用 Resend / Mailgun / 腾讯企业邮，配置 SPF + DKIM。

## 部署到 Vercel

```bash
cd /Users/july/dayan-site
npm install                 # 装 @anthropic-ai/sdk
npx vercel                  # 第一次部署，绑定项目
npx vercel --prod
```

在 Vercel Dashboard → Settings → Environment Variables 里设置：

- `ANTHROPIC_API_KEY` = 你的 Claude API key

设置完重新部署一次，AI 助手就会走真实模型（haiku-4.5 + system prompt caching）。

## 自动更新

站点内容由 `.github/workflows/sync-site.yml` 每天北京时间 08:15 核验一次，也可以在 GitHub Actions 中手动运行 `Sync site content`。

自动任务会：

- 重新读取已登记的公众号文章并刷新标题、摘要和日期
- 尝试通过微信公众平台接口发现新文章
- 调用 B站公开接口核验粉丝数
- 数据变化或核验日期变化后提交 JSON，由 Vercel 自动发布
- 单个来源失败时保留上一版有效数据

GitHub 仓库需要配置两个 Repository Secrets：

- `WECHAT_MP_APPID`
- `WECHAT_MP_APPSECRET`

当前公众号账号调用“已发布文章列表”返回 `48001 api unauthorized`，脚本会继续使用 `data/wechat-article-sources.json` 中的有效文章源。微信公众平台开放该接口权限后，新文章会自动进入站点；在此之前，把新文章分享链接加入该 JSON 即可进入每日自动核验。

本地执行：

```bash
npm test
npm run sync:site
```

## 文件结构

```
dayan-site/
├── index.html        # 入口
├── styles.css        # 设计系统：颜色、字体、布局壳
├── sections.css      # Hero / About / Projects / Blog / Dashboard 的样式
├── app.jsx           # 顶层组合 + Hero + Nav + Footer
├── sections.jsx      # About / Projects / Demo / Blog / Dashboard / Guestbook
├── chat.jsx          # AI 助手「雁飞」+ canned fallback
├── api/
│   └── chat.js       # Vercel serverless: POST /api/chat → Anthropic Haiku 4.5
├── vercel.json
├── package.json
└── README.md
```

## 🔧 上线前必须替换的占位数据

设计稿里所有具体数字 / 名字 / 链接都是 Claude Design 在你"问题超时"那次自动填的占位，**不能直接当事实发布**。

| 文件 | 字段 | 说明 |
|---|---|---|
| `app.jsx` | `SITE.name` / `domain` / `wechat` / `email` | 顶部标识 |
| `sections.jsx` | `TIMELINE` 数组 | 履历每段的 period / role / org / body / tags |
| `data/site-content.json` | `projects` 数组 | 项目 name / desc / stack / link / stat |
| `data/site-content.json` | `posts` 数组 | Blog 文章列表 |
| `stats.json` | 社媒平台数据 | 抖音 / 小红书 / 视频号 / B站真实数字 |
| `api/chat.js` | `SYSTEM_KB` | 雁飞的 RAG 知识库 |

每处都标了 `TODO:replace`，全局搜一下就能找全。

## 后续路线

阶段 2 把这套迁到 Next.js（已经为此选好栈：Tailwind 4 + shadcn/ui + Vercel AI SDK + Supabase），承接：

- 数据同步 → `npm run sync:site`
- Newsletter → Buttondown / Resend
- Blog → MDX + Obsidian 同步脚本
- 会员区（录播课 + 付费社群）
- 公众号 / 小红书数据看板对接真实 API
