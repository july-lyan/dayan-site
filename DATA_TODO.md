# 上线前要填的真实数据

设计稿里所有数字 / 名字 / 链接都是 Claude Design 在你"问题超时"那次自动填的占位。
按这份清单逐项过一遍，填完发给我（或自己改），我帮你 / 你自己同步进代码。

---

## 1. SITE 三件套（`app.jsx` 顶部 SITE 对象）

| 字段 | 当前值（占位） | 真实值 | 说明 |
|---|---|---|---|
| `domain` | `liudayan.com` | ✅ 已确认 | — |
| `email` | `hi@liudayan.com` | 待 Cloudflare 配 | 域名邮箱配好前可先用 gmail |
| `wechat` | `DaYan__Liu` | ✅ 已确认 | 注意中间是双下划线 |
| `name` | `大雁` | ✅ 已确认 | 对外只用这个昵称 |

---

## 2. 履历 TIMELINE（`sections.jsx` 顶部 TIMELINE 数组）

每段需要 5 个字段：`period` `duration` `role` `org` `body` + `tags[]`

### 段 1 — 现在（2025 ~ now）

- period：`2025 — now`
- duration：`freelance`
- role：?（占位"独立产品人 / vibecoder"，要不要换）
- org：`自由职业 · 杭州`
- body（一段 2-3 句的真实陈述）：?
- tags（3-4 个）：?

### 段 2 — 小电（5 年）

- period：`2019 — 2024`
- duration：`5 年`
- role：?（占位"高级产品经理"）
- org：`小电科技`
- body（重点：你具体做了什么 → 带来了什么结果，1-2 个量化数字）：?
- tags：?

### 段 3 — 阿里（10 年）

- period：?（占位"2014 — 2024"，但你 2019 已去小电，应该是 2009-2019？）
- duration：`10 年`
- role：?（占位"运营 / 商品 / 增长"）
- org：`阿里巴巴`
- body：?（聚划算 / 跨境 / 大促操盘？哪段最有代表性）
- tags：?

---

## 3. 项目 PROJECTS（`sections.jsx` PROJECTS 数组）

每个项目要 7 个字段：`id`（短 slug）/ `glyph`（2 字符首字母）/ `name` / `desc`（30-50 字一句话）/ `stack[]` / `status`（live/wip/archived）/ `link` / `stat`（一个亮点数字）

### 已上线（status: "live"）建议挂

- [ ] **ContentFlow** — 占位 desc 是"小红书自动化矩阵..."。真实情况？真实链接（liudayan.com/contentflow 还是 contentflow.app 或 railway 链接）？真实数据（MRR? DAU? 订阅数?）
- [ ] **简历工具** — 已部署到 Vercel `https://resume-6yuk1wz7p-lyans-projects-a71c3e7d.vercel.app/`。要不要绑到 `liudayan.com/resume`？
- [ ] **image-workflow** — 文生图工作台（M0 完成中）→ 现在要不要展示？status = wip 还是 live？
- [ ] **xhs自动化** — M0-M2 已完成。挂出来吗？

### 开发中（status: "wip"）

- [ ] **drama-clip-web** — 短剧二创自动化 pipeline → 要展示吗？
- [ ] **剧推推** — 接手黄总的产品 → 暂不公开还是低调挂出来？
- [ ] **亲子 AI** — 探索阶段，要展示吗？

### 已归档（status: "archived"）

- [ ] **记忆翻牌小游戏** — my-first-page 里挂着，要保留吗？
- [ ] **充电桩选址决策板** — 占位是小电时期内部工具，真有这个项目吗？

> 默认建议：先放 4-6 个 live + 2-3 个 wip。少而精，每个都有清晰故事。

---

## 4. Blog POSTS（`sections.jsx` POSTS 数组）

设计稿里 7 篇全是占位标题。三个选项：

- **A. 暂时清空**，只显示一句"博客内容整理中"
- **B. 从 Obsidian 挑 5-10 篇真实文章过来**（推荐）
- **C. 先写 1-2 篇定调的（vibecoding 是什么 / 5/10 营预热），其他陆续补**

如果选 B / C：每篇要 `date`（YYYY.MM.DD）/ `cat`（vibe/post/media/kid）/ `title` / `excerpt`（30-40 字钩子）。

挑文章建议：
- vibecoding 教程类 ×2
- 产品复盘类 ×2（亏的钱 / 学到的东西）
- 自媒体运营类 ×1
- 亲子 AI ×1

---

## 5. Dashboard 数据（`sections.jsx` Dashboard 函数 cells / bars）

4 个 KPI + 7 天柱状图。**先填真实数据，没有的就先隐藏整个 Dashboard 区块**（删 app.jsx 里 `<Dashboard />` 一行）。

- 公众号粉丝：当前 ? / 7 天增 ?
- 小红书粉丝：当前 ? / 7 天增 ?
- Newsletter 订阅：当前 ? / 7 天增 ? （如果还没建 newsletter，整个数据看板可以先砍掉）
- 自动化任务跑次：当前 ? / 24h 增 ?

> 强建议：**先砍掉 Dashboard 区块**，等 Newsletter 真起来 + 数据从 xhs 自动化系统抓出来再加。瞎填数字会被截图打脸。

---

## 6. 课程 5/10 杭州营（`sections.jsx` Course 函数）

5/10 杭州营 2 天后开课，必须真。

| 字段 | 当前占位 | 真实值 |
|---|---|---|
| 第几期 | 第 03 期 | ? |
| 日期 | 5 月 10 日 周日 | ✅ |
| 地点 | 杭州 西溪 | ?（具体到园区/大概区域） |
| 总席位 | 12 | ? |
| 剩余 | 4 | ? |
| 现价 | ¥2999 | ? |
| 原价 | ¥3999 | ? |
| 早晨课表 | 想法 → 最小可付费产品 | 用真实模块名 |
| 下午课表 | 现场用 AI 编排上线 | 用真实模块名 |
| 晚间课表 | 冷启动 + 收第一笔钱 | 用真实模块名 |

---

## 7. 公告条（`app.jsx` AnnounceBar）

当前写"杭州 vibecoding 线下营 · 5 月 10 日 (倒计时) · 仅剩 4 席"。

- 5/10 后这条要换成什么？建议：保留 "下一期 6/X 报名中" 或者改成 "本月 newsletter 已发"。提前想好替换文案，不然 5/11 公告条上还在喊"线下营还剩 0 天"会很尴尬。

---

## 8. AI 助手 RAG 知识库（`api/chat.js` SYSTEM_KB）

填完 1-7 之后，把对应内容复制一份到 SYSTEM_KB 里——这样雁飞回答访客问题时用真实数据。

---

## 优先级建议

5/10 之前必须真：
- [x] 域名 (✅ liudayan.com)
- [ ] **课程 5/10 杭州营信息**（席位 / 地点 / 价格 / 课表）
- [ ] **AnnounceBar 文案**（5/10 之前 + 之后两套）
- [ ] **微信号**（hero 上展示，访客直接加）

5/10 之后再做：
- [ ] 履历 + 项目集 + Blog
- [ ] Dashboard（暂砍）
- [ ] 邮箱配置
- [ ] 部署 Vercel

---

填完哪部分都可以告诉我，我帮你同步进代码。
