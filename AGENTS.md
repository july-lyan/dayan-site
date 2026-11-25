# dayan-site — AGENTS.md

大雁的个人站：vibecoder portfolio + blog + 课程报名。

**线上地址**：https://www.liudayan.com  
**部署平台**：Vercel（`npx vercel --prod`，无需构建步骤，直接上传静态文件）

---

## 技术栈

- 纯静态：HTML + React（CDN，无 bundler）+ Babel standalone（浏览器端转译 JSX）
- CSS：`styles.css`（全局）+ `sections.css`（各 section 组件样式）
- 无框架路由，单页多 section，锚点导航

---

## 文件职责

| 文件 | 作用 |
|---|---|
| `index.html` | 入口，加载所有 CSS / CDN / JSX |
| `app.jsx` | 根组件：Announce bar、Nav、Hero、Footer；全局数据（SITE、wechat、email、socials） |
| `sections.jsx` | 所有业务 section：About、Projects、Demo、Blog、Course、Newsletter；数据常量在顶部 |
| `sections.css` | section 级样式（portrait、timeline、projects、course 等） |
| `styles.css` | 设计 token（CSS 变量）、通用组件、响应式 |
| `chat.jsx` | 浮层 AI 对话组件（可选显示位置：hero 内嵌 or 浮层） |
| `tweaks-panel.jsx` | 开发用调试面板，不影响生产 |
| `DATA_TODO.md` | 待填真实数据的清单（内容占位项） |
| `assets/` | 所有图片（项目截图、照片、二维码） |
| `api/` | Vercel Edge Functions（chat 接口等） |

---

## 内容数据位置

所有内容数据都是 JS 常量，在对应文件顶部：

| 数据 | 常量名 | 文件 |
|---|---|---|
| 个人信息（微信/邮箱/域名） | `SITE` / `wechat` / `email` | `app.jsx` 顶部 |
| 社交平台粉丝数 | `socials` 数组 | `app.jsx` NowCard 函数附近 |
| 履历时间线 | `TIMELINE` | `sections.jsx` 顶部 |
| 项目卡片 | `PROJECTS` | `sections.jsx` 顶部 |
| About 主图轮播 | `PORTRAIT_SLIDES` | `sections.jsx` About 函数上方 |
| About 胶片条照片 | `STRIP_SLIDES` | `sections.jsx` About 函数上方 |

---

## 照片处理规范

- 主肖像（3:4 竖版）：目标尺寸 600×800，命名 `photo-portrait-N.jpg`
- 胶片条缩略图（4:3 横版）：目标尺寸 500px 高，命名 `photo-thumb-xxx.jpg`
- 处理命令：
  ```bash
  # 竖图 -> 600x800
  sips -z 800 600 原图.JPG --out assets/photo-portrait-N.jpg
  # 横图 -> 约 667x500
  sips -z 500 667 原图.JPG --out assets/photo-thumb-xxx.jpg
  # 竖图裁方（先缩再裁）
  sips -z 500 375 原图.JPG --out /tmp/t.jpg && sips -c 500 375 /tmp/t.jpg --out assets/photo-thumb-xxx.jpg
  ```
- 胶片条照片保持**偶数张**，否则最后一格空白

---

## 轮播参数

- 主肖像：15 秒切换，fade 过渡 0.4s
- 胶片条：5 秒切换，translateX slide 过渡 0.55s cubic-bezier

---

## 待完成事项（DATA_TODO.md）

- `TIMELINE` 各段 body / tags 填真实内容（现为占位文字）
- `PROJECTS` 各项 shot 截图补全
- 域名邮箱 `hi@liudayan.com`（Cloudflare 转发，待配）
- 详细参考：`DATA_TODO.md`

---

## 本地开发

```bash
cd /Users/july/Documents/dayan-site
npx serve . -p 3000
# 浏览器：http://localhost:3000
# 杀旧进程：lsof -ti:3000 | xargs kill -9
```

## 部署

```bash
npx vercel --prod
```
