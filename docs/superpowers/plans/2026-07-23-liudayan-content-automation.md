# liudayan.com Content Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 liudayan.com 更新为暖纸编辑部双主题内容站，并让公众号文章与 B站数据每天自动核验和发布。

**Architecture:** 页面使用 CSS 设计变量提供默认暖纸主题和可切换的原蓝紫深色主题，静态 JSON 继续作为内容唯一数据源。Node 同步脚本读取微信公众平台与 B站公开接口，成功后写回 JSON；GitHub Actions 每天运行脚本、提交数据变化，Vercel 通过 GitHub 集成发布。

**Tech Stack:** HTML、React UMD、Node.js ESM、Node test runner、GitHub Actions、Vercel

---

## 文件结构

- `index.html`：首次绘制前恢复主题。
- `app.jsx`：主题切换、动态季度和“此刻”卡片。
- `styles.css`：暖纸默认设计变量、原蓝紫深色变量和全局组件。
- `sections.jsx`：最新文章主卡、近期文章列表和公众号订阅入口。
- `sections.css`：内容型 Blog 首页布局。
- `stats.json`：平台粉丝数、来源、核验日期。
- `data/site-content.json`：公众号文章与作品数据。
- `scripts/sync-wechat-posts.mjs`：公众号文章同步。
- `scripts/sync-site-data.mjs`：平台数据核验、时间字段维护。
- `scripts/sync-utils.mjs`：日期、文章合并、业务变化判断。
- `tests/sync-utils.test.mjs`：同步纯函数测试。
- `.github/workflows/sync-site.yml`：每日自动任务。
- `README.md`：Secrets、运行和故障保留规则。

### Task 1: 同步工具函数与测试

**Files:**
- Create: `scripts/sync-utils.mjs`
- Create: `tests/sync-utils.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: 写文章合并和变化判断的失败测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mergePosts, sameBusinessData, shanghaiDate } from "../scripts/sync-utils.mjs";

test("mergePosts deduplicates by link and sorts newest first", () => {
  const oldPosts = [{ date: "2026.01.01", title: "旧", link: "https://example.com/old" }];
  const newPosts = [
    { date: "2026.07.23", title: "新", link: "https://example.com/new" },
    { date: "2026.01.01", title: "重复", link: "https://example.com/old" },
  ];
  assert.deepEqual(mergePosts(oldPosts, newPosts).map((post) => post.title), ["新", "重复"]);
});

test("sameBusinessData ignores checkedAt and compares content", () => {
  assert.equal(
    sameBusinessData({ value: "689", checkedAt: "2026.07.22" }, { value: "689", checkedAt: "2026.07.23" }),
    true,
  );
  assert.equal(
    sameBusinessData({ value: "689" }, { value: "690" }),
    false,
  );
});

test("shanghaiDate uses dotted date format", () => {
  assert.equal(shanghaiDate(new Date("2026-07-22T16:30:00Z")), "2026.07.23");
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/sync-utils.test.mjs`

Expected: FAIL，提示 `scripts/sync-utils.mjs` 不存在。

- [ ] **Step 3: 实现工具函数**

```js
export function shanghaiDate(date = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date).replaceAll("/", ".");
}

export function mergePosts(existingPosts, incomingPosts) {
  const seen = new Set();
  return [...incomingPosts, ...existingPosts]
    .filter((post) => {
      const key = post.link || `${post.date}:${post.title}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function sameBusinessData(left, right) {
  const clean = (value) => {
    const copy = structuredClone(value);
    delete copy.checkedAt;
    return copy;
  };
  return JSON.stringify(clean(left)) === JSON.stringify(clean(right));
}
```

- [ ] **Step 4: 增加测试命令并验证**

```json
"test": "node --test tests/*.test.mjs"
```

Run: `npm test`

Expected: 3 tests pass。

- [ ] **Step 5: 提交**

```bash
git add package.json scripts/sync-utils.mjs tests/sync-utils.test.mjs
git commit -m "test: cover site sync data rules"
```

### Task 2: 暖纸编辑部双主题

**Files:**
- Modify: `index.html`
- Modify: `app.jsx`
- Modify: `styles.css`
- Modify: `sections.css`
- Modify: `tests/sync-utils.test.mjs`

- [ ] **Step 1: 增加主题静态约束测试**

```js
test("site defaults to paper theme and keeps dark theme", () => {
  const index = readFileSync("index.html", "utf8");
  const app = readFileSync("app.jsx", "utf8");
  const styles = readFileSync("styles.css", "utf8");
  assert.match(index, /dayan-theme/);
  assert.match(app, /ThemeToggle/);
  assert.match(styles, /#F4EFE5/i);
  assert.match(styles, /data-theme="dark"/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test`

Expected: FAIL，缺少 `dayan-theme`、`ThemeToggle` 或暖纸变量。

- [ ] **Step 3: 首次绘制前恢复主题**

在 `index.html` 的 CSS 引用前增加：

```html
<script>
  (() => {
    const savedTheme = localStorage.getItem("dayan-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "paper";
  })();
</script>
```

- [ ] **Step 4: 增加主题切换组件**

```js
function ThemeToggle() {
  const [theme, setTheme] = React.useState(
    () => document.documentElement.dataset.theme || "paper",
  );

  function toggleTheme() {
    const nextTheme = theme === "paper" ? "dark" : "paper";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("dayan-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="切换明暗主题">
      <span aria-hidden="true">{theme === "paper" ? "夜" : "昼"}</span>
    </button>
  );
}
```

将 `<ThemeToggle />` 放到导航链接和在线状态之间。

- [ ] **Step 5: 将暖纸主题设为默认设计变量**

```css
:root,
:root[data-theme="paper"] {
  color-scheme: light;
  --bg: #f4efe5;
  --bg-grain: #eee6d8;
  --surface: #fffaf0;
  --surface-2: #f8f1e5;
  --surface-3: #eee4d3;
  --hairline: rgba(74, 63, 48, 0.12);
  --hairline-strong: rgba(74, 63, 48, 0.20);
  --hairline-bright: rgba(74, 63, 48, 0.30);
  --fg: #25251f;
  --fg-dim: #514d45;
  --fg-muted: #716b60;
  --fg-faint: #9b9285;
  --primary: #d55334;
  --primary-glow: rgba(213, 83, 52, 0.24);
  --primary-soft: rgba(213, 83, 52, 0.10);
  --accent: #5f58c9;
  --good: #2f7a5c;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #08090c;
  --surface: #0f1116;
  --surface-2: #15171f;
  --surface-3: #1c1f29;
  --fg: #ededee;
  --fg-dim: #b8babf;
  --fg-muted: #9ea2b0;
  --fg-faint: #6b6e7e;
  --primary: #8b7cff;
  --primary-glow: rgba(139, 124, 255, 0.55);
  --primary-soft: rgba(139, 124, 255, 0.10);
  --accent: #4dd4e0;
  --good: #5dd49a;
}
```

将导航背景、网格、阴影和卡片颜色中硬编码的深色值替换为主题变量。飞鸟图片不加色相滤镜。

- [ ] **Step 6: 增加暖纸组件质感**

```css
body {
  background:
    radial-gradient(ellipse 900px 520px at 82% -10%, var(--primary-soft), transparent 64%),
    var(--bg);
}

.theme-toggle {
  width: 34px;
  height: 34px;
  border: 1px solid var(--hairline-strong);
  border-radius: 50%;
  color: var(--fg);
  background: var(--surface);
  cursor: pointer;
}

.blog-card,
.proj-card,
.now-card {
  border-color: var(--hairline-strong);
  background: var(--surface);
  box-shadow: 0 14px 34px rgba(74, 63, 48, 0.08);
}

.blog-card:hover,
.proj-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
}

@media (max-width: 720px) {
  .blog-feature-layout,
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: 运行测试**

Run: `npm test`

Expected: 全部测试通过。

- [ ] **Step 8: 提交**

```bash
git add index.html app.jsx styles.css sections.css tests/sync-utils.test.mjs
git commit -m "feat: add warm editorial dual theme"
```

### Task 3: 更新首页与真实数据

**Files:**
- Modify: `app.jsx`
- Modify: `stats.json`
- Modify: `data/site-content.json`
- Modify: `sections.jsx`
- Modify: `sections.css`

- [ ] **Step 1: 在测试中增加页面静态约束**

```js
test("homepage removes stale realtime copy", () => {
  const app = readFileSync("app.jsx", "utf8");
  assert.doesNotMatch(app, /2026 \/ Q2|本周产出|最近在读|>实时</);
  assert.match(app, /最近核验/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test`

Expected: FAIL，命中 Q2、本周产出、最近在读或实时。

- [ ] **Step 3: 实现动态季度和最新公众号文章**

```js
function currentQuarter() {
  const now = new Date();
  return `${now.getFullYear()} / Q${Math.floor(now.getMonth() / 3) + 1}`;
}

function NowCard() {
  const [stats, setStats] = React.useState(null);
  const [latestPost, setLatestPost] = React.useState(null);

  React.useEffect(() => {
    Promise.all([
      fetch("/stats.json", { cache: "no-store" }).then((response) => response.json()),
      fetch("/data/site-content.json", { cache: "no-store" }).then((response) => response.json()),
    ]).then(([nextStats, content]) => {
      setStats(nextStats);
      setLatestPost((content.posts || []).find((post) => post.source === "wechat") || null);
    }).catch(() => {});
  }, []);
}
```

Hero badge 使用 `{currentQuarter()}`。卡片行改为“最新公众号”，标题链接到 `latestPost.link`；保留“公开入口”和“自媒体数据”；状态文案使用“最近核验”。

- [ ] **Step 4: 将 Blog 改为内容型首页结构**

```js
const [featuredPost, ...recentPosts] = posts;

<div className="blog-feature-layout">
  <a className="blog-featured" href={featuredPost.link} target="_blank" rel="noopener noreferrer">
    <div className="blog-card-meta">
      <span className="chip">{categoryLabel(featuredPost.cat)}</span>
      <span className="blog-card-date">{featuredPost.date}</span>
    </div>
    <h3>{featuredPost.title}</h3>
    <p>{featuredPost.excerpt}</p>
    <span>读最新文章 ↗</span>
  </a>
  <div className="blog-recent-list">
    {recentPosts.slice(0, 3).map((post) => (
      <a href={post.link} target="_blank" rel="noopener noreferrer" key={post.link}>
        <span>{post.date}</span>
        <strong>{post.title}</strong>
      </a>
    ))}
  </div>
</div>
```

在文章区底部增加公众号入口：

```jsx
<a
  className="blog-subscribe"
  href="http://weixin.qq.com/r/mp/WyNBWXfEwSq_rTM693ZJ"
  target="_blank"
  rel="noopener noreferrer"
>
  关注公众号，接收最新文章 →
</a>
```

`sections.css` 使用桌面双栏、移动端单栏布局。主文章占更强视觉权重，近期列表保持紧凑。

- [ ] **Step 5: 写入核验数据并删除失效文章**

`stats.json` 使用以下业务值：

```json
{
  "douyin": { "label": "抖音粉丝", "value": "53,000", "source": "manual", "verifiedAt": "2026.07.23" },
  "xiaohongshu": { "label": "小红书粉丝", "value": "2,981", "source": "manual", "verifiedAt": "2026.07.23" },
  "shipin": { "label": "视频号粉丝", "value": "6,218", "source": "manual", "verifiedAt": "2026.07.23" },
  "bilibili": { "label": "B站粉丝", "value": "689", "source": "bilibili-api", "verifiedAt": "2026.07.23" },
  "checkedAt": "2026.07.23",
  "updatedAt": "2026.07.23"
}
```

从 `data/site-content.json` 和 `sections.jsx` 的回退数据中删除三个 `xiaohongshu.com/discovery/item/` 条目。增加三条近期标题，链接统一使用：

```text
https://www.xiaohongshu.com/user/profile/5b810cb3db2e605e7777b2d5
```

- [ ] **Step 6: 更新邮箱并验证**

`app.jsx` 的 `SITE.email` 改为：

```js
email: "hello@yanhui.group",
```

Run: `npm test`

Expected: 全部测试通过。

- [ ] **Step 7: 提交**

```bash
git add app.jsx sections.jsx sections.css stats.json data/site-content.json tests/sync-utils.test.mjs
git commit -m "feat: refresh homepage data"
```

### Task 4: 公众号与 B站同步

**Files:**
- Modify: `scripts/sync-wechat-posts.mjs`
- Modify: `scripts/sync-site-data.mjs`
- Modify: `tests/sync-utils.test.mjs`

- [ ] **Step 1: 增加无变化时间语义测试**

```js
test("business changes exclude check timestamps", () => {
  const before = { posts: [{ title: "A" }], checkedAt: "2026.07.22", updatedAt: "2026.07.20" };
  const after = { posts: [{ title: "A" }], checkedAt: "2026.07.23", updatedAt: "2026.07.20" };
  assert.equal(sameBusinessData(before, after), true);
});
```

- [ ] **Step 2: 运行测试并确认通过工具函数约束**

Run: `npm test`

Expected: 全部测试通过。

- [ ] **Step 3: 公众号同步只在成功时写核验日期**

在 `sync-wechat-posts.mjs` 中导入 `mergePosts` 和 `shanghaiDate`。微信 API 或人工来源返回文章后：

```js
const nextPosts = mergePosts(content.posts || [], wechatPosts);
const changed = JSON.stringify(nextPosts) !== JSON.stringify(content.posts || []);
content.posts = nextPosts;
content.checkedAt = shanghaiDate();
if (changed) content.updatedAt = shanghaiDate();
writeJson(CONTENT_PATH, content);
```

零篇文章时直接退出并保持原文件。

- [ ] **Step 4: B站公开 API 同步**

在 `sync-site-data.mjs` 中增加：

```js
async function fetchBilibiliFollowers(mid) {
  const response = await fetch(`https://api.bilibili.com/x/relation/stat?vmid=${mid}`);
  if (!response.ok) throw new Error(`Bilibili returned ${response.status}`);
  const payload = await response.json();
  if (payload.code !== 0 || !Number.isFinite(payload.data?.follower)) {
    throw new Error(`Bilibili API ${payload.code}`);
  }
  return payload.data.follower.toLocaleString("en-US");
}
```

成功后更新 `bilibili.value`、`bilibili.verifiedAt` 和顶层 `checkedAt`。粉丝数变化时更新顶层 `updatedAt`。请求失败时保留原值并输出 warning。

- [ ] **Step 5: 运行测试和本地同步**

Run: `npm test`

Expected: 全部测试通过。

Run: `npm run sync:site`

Expected: 输出公众号同步数量和 B站核验结果；JSON 可解析。

- [ ] **Step 6: 提交**

```bash
git add scripts/sync-wechat-posts.mjs scripts/sync-site-data.mjs tests/sync-utils.test.mjs data/site-content.json stats.json
git commit -m "feat: sync wechat posts and bilibili stats"
```

### Task 5: 每日自动任务

**Files:**
- Create: `.github/workflows/sync-site.yml`
- Modify: `README.md`

- [ ] **Step 1: 创建 GitHub Actions 工作流**

```yaml
name: Sync site content

on:
  schedule:
    - cron: "15 0 * * *"
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: sync-site-content
  cancel-in-progress: false

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run sync:site
        env:
          WECHAT_MP_APPID: ${{ secrets.WECHAT_MP_APPID }}
          WECHAT_MP_APPSECRET: ${{ secrets.WECHAT_MP_APPSECRET }}
          WECHAT_MP_POST_LIMIT: "20"
      - name: Commit verified data
        run: |
          git config user.name "dayan-site-bot"
          git config user.email "actions@users.noreply.github.com"
          git add data/site-content.json stats.json
          git diff --cached --quiet && exit 0
          git commit -m "chore: sync site content"
          git push
```

- [ ] **Step 2: 补充 README 运维说明**

写明两个 Repository Secrets、每日北京时间 08:15、手动运行入口、失败时保留上一版数据、微信公众平台 IP 白名单要求。

- [ ] **Step 3: 校验工作流**

Run: `npm test`

Expected: 全部测试通过。

Run: `git diff --check`

Expected: 无输出，退出码 0。

- [ ] **Step 4: 提交**

```bash
git add .github/workflows/sync-site.yml README.md
git commit -m "ci: automate daily site content sync"
```

### Task 6: 本地与生产验收

**Files:**
- Modify: `scripts/verify-live-site.mjs`

- [ ] **Step 1: 增加线上数据约束**

校验四个平台值存在、最新公众号文章存在、三个失效小红书 ID 不存在，并输出 `checkedAt` 与 `updatedAt`。

- [ ] **Step 2: 本地静态服务冒烟验证**

Run: `npm run dev`

Expected: 本地服务启动在 `http://localhost:3000`。

检查 Hero 和“此刻”卡：季度、邮箱、最新公众号、四个平台数字和最近核验日期均正确。

- [ ] **Step 3: 完整验证**

Run: `npm test`

Expected: 全部测试通过。

Run: `git diff --check`

Expected: 无输出，退出码 0。

- [ ] **Step 4: 部署并验证生产站**

Run: `npm run deploy`

Expected: Vercel 返回生产部署 URL。

Run: `npm run verify:live`

Expected: 首页、JSON、公众号文章与留言接口验证通过。

- [ ] **Step 5: 提交验证脚本**

```bash
git add scripts/verify-live-site.mjs
git commit -m "test: verify refreshed live content"
```
