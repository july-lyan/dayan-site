# 大雁的个人站

`liudayan.com` — vibecoder 作品集 + Blog + 杭州线下营报名 + AI 助手「雁飞」。

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

## 文件结构

```
dayan-site/
├── index.html        # 入口
├── styles.css        # 设计系统：颜色、字体、布局壳
├── sections.css      # Hero / About / Projects / Blog / Dashboard / Course 的样式
├── app.jsx           # 顶层组合 + Hero + Nav + Footer + AnnounceBar
├── sections.jsx      # About / Projects / Demo / Blog / Dashboard / Course / Newsletter
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
| `sections.jsx` | `PROJECTS` 数组 | 项目 name / desc / stack / link / stat |
| `sections.jsx` | `POSTS` 数组 | Blog 文章列表（建议从 Obsidian 同步） |
| `sections.jsx` | `Dashboard` 里的 `cells` 和 `bars` | 公众号 / 小红书 / Newsletter 真实数字 |
| `sections.jsx` | `Course` 里的 `SEATS_LEFT` | 实时席位数 |
| `app.jsx` | `AnnounceBar` 里的"仅剩 4 席" | 同上 |
| `api/chat.js` | `SYSTEM_KB` | 雁飞的 RAG 知识库 |

每处都标了 `TODO:replace`，全局搜一下就能找全。

## 后续路线

阶段 2 把这套迁到 Next.js（已经为此选好栈：Tailwind 4 + shadcn/ui + Vercel AI SDK + Supabase），承接：

- 报名表单 → 微信支付 / Stripe
- Newsletter → Buttondown / Resend
- Blog → MDX + Obsidian 同步脚本
- 会员区（录播课 + 付费社群）
- 公众号 / 小红书数据看板对接真实 API
