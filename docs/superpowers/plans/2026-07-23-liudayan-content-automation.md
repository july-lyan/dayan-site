# liudayan.com Content Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 更新 liudayan.com 首页的过期内容，并让公众号文章与 B站数据每天自动核验和发布。

**Architecture:** 页面继续使用静态 JSON 作为唯一数据源。Node 同步脚本读取微信公众平台与 B站公开接口，成功后写回 JSON；GitHub Actions 每天运行脚本、提交数据变化，Vercel 通过 GitHub 集成发布。

**Tech Stack:** HTML、React UMD、Node.js ESM、Node test runner、GitHub Actions、Vercel

---

## 文件结构

- `app.jsx`：动态季度和“此刻”卡片。
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

### Task 2: 更新首页与真实数据

**Files:**
- Modify: `app.jsx`
- Modify: `stats.json`
- Modify: `data/site-content.json`
- Modify: `sections.jsx`

- [ ] **Step 1: 在测试中增加页面静态约束**

```js
import { readFileSync } from "node:fs";

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

- [ ] **Step 4: 写入核验数据并删除失效文章**

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

- [ ] **Step 5: 更新邮箱并验证**

`app.jsx` 的 `SITE.email` 改为：

```js
email: "hello@yanhui.group",
```

Run: `npm test`

Expected: 全部测试通过。

- [ ] **Step 6: 提交**

```bash
git add app.jsx sections.jsx stats.json data/site-content.json tests/sync-utils.test.mjs
git commit -m "feat: refresh homepage data"
```

### Task 3: 公众号与 B站同步

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

### Task 4: 每日自动任务

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

### Task 5: 本地与生产验收

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

