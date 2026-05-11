**Format:** 1920x1080
**Audio:** 中文女声旁白 + 低频电子氛围底乐 + 轻按钮与界面提示音
**VO direction:** 成熟女性，语气直接，像在介绍自己正在运行的工作系统；停顿清楚，避免广告腔
**Style basis:** `DESIGN.md`，沿用站点深色网格、紫色辉光、Mono 标签、真实界面截图

## Global Direction

- 保持桌面横版，优先复用站点最强识别元素：Hero 大字、项目卡片、Blog 卡片、工作坊报名表。
- 每个 beat 都要看到背景网格或细线结构，维持同一世界观。
- 截图不做死板全屏贴图，使用推进、裁切、局部放大、发光描边和悬浮卡片组合。
- 镜头语言以“推进工作台”“扫过产品面板”“落到报名动作”三种为主。
- 过渡以速度匹配的滑移和轻度模糊为主，开头和结尾各给一次更强的辉光推进。

## Asset Audit

| Asset | Type | Assign to Beat | Role |
| --- | --- | --- | --- |
| `capture/screenshots/scroll-000.png` | Hero screenshot | Beat 1, Beat 2 | 开场品牌识别、Hero 实景工作台 |
| `capture/screenshots/scroll-026.png` | Projects screenshot | Beat 3 | 已上线产品展示 |
| `capture/screenshots/scroll-066.png` | Blog screenshot | Beat 4 | 复盘内容与持续输出证明 |
| `capture/screenshots/scroll-092.png` | Workshop screenshot | Beat 5 | 报名转化与结尾 CTA |
| `capture/screenshots/scroll-013.png` | About screenshot | Beat 2 | 履历与路径补充 |

## BEAT 1 — Hook

**VO:** “这不是一张静态名片。”

**Concept:** 视频一开始就贴着网站首屏推进，像从浏览器外壳直接冲进站点。观众立刻看到大字标题、紫色按钮和右侧状态面板，知道这不是传统简历页，而是一张正在运行的个人工作台。

**Visual description:** 深黑网格先出现，随后 `scroll-000` 以大幅裁切进入画面。左侧 Hero 标题被放大到几乎占满屏幕，紫色 `vibecoding` 高亮先亮起来，右侧状态卡随后滑入。前景有细小数据点、微弱紫色粒子、在线指示灯和窄边框线框一起建立“系统开机”的感觉。

**Mood direction:** 冷静、技术化、带一点个人品牌野心。像独立开发者自己的控制台，而不是机构宣传片。

**Assets:** `capture/screenshots/scroll-000.png`

**Animation choreography:** 背景网格缓慢漂移；Hero 截图 Z 轴推进；标题区域轻微放大；右侧卡片 CASCADE 进场；主句文字 SLIDES IN 并定格。

**Transition:** Cinematic Zoom 风格的自定义推进感，0.55s。

**Depth layers:** BG 网格与暗角；MG Hero 截图；FG 标题遮罩、粒子、状态点。

**SFX cues:** 低频启动嗡声，标题出现时一记柔和脉冲。

## BEAT 2 — Identity

**VO:** “这是大雁把十五年产品和运营经验，接到 AI 时代之后的一张工作台。”

**Concept:** 镜头从 Hero 向下扫到 About 区，像浏览者继续滚动，但速度更利落。履历路径和当前身份同时出现，强调这张网站背后是完整职业迁移，不是空洞人设。

**Visual description:** `scroll-013` 与 `scroll-000` 局部交错切换，屏幕中央出现 “15 年” 这一数字大字，旁边并列 “阿里运营 / 小电 PM / freelance vibecoding” 三段身份流。底层依旧是页面真实截图，表面再叠一层半透明数据框和路径连线。

**Mood direction:** 稳定、可信、进化感强。像职业路径被重新编译。

**Assets:** `capture/screenshots/scroll-000.png`, `capture/screenshots/scroll-013.png`

**Animation choreography:** 数字 COUNTS IN；身份标签从左到右 CASCADE；路径连线 DRAWS ON；背景截图缓慢上移；关键字 “AI” 与 “工作台” 逐字高亮。

**Transition:** Velocity-matched upward，0.4s。

**Depth layers:** BG 截图与网格；MG 路径卡片；FG 大数字与高亮标签。

**SFX cues:** 轻微电子 click，路径连线出现时一条短促扫描音。

## BEAT 3 — Products

**VO:** “你能在这里看到已经上线的产品，”

**Concept:** 站点进入作品区，三张项目卡并排浮起。这里要给观众明确的“她真做出了东西”，画面把项目卡当成可操作产品展示墙来拍。

**Visual description:** `scroll-026` 作为主体截图，但三张核心项目卡被切成独立悬浮面板，前后错层摆放。中央卡略向前推进，边角状态点和标签不断轻微呼吸。背景保留原页面标题“一些在跑的东西”，让项目展示更有出处。

**Mood direction:** 真实、可展示、完成度高。不是概念图，是上线产品列表。

**Assets:** `capture/screenshots/scroll-026.png`

**Animation choreography:** 三张卡片从远到近 POP IN；中间卡轻微 TILT；已上线角标 PULSES；底部 stack 标签逐个 TYPE ON；镜头最后向中间卡轻推。

**Transition:** Whip pan，0.32s。

**Depth layers:** BG 整段作品截图；MG 三张大卡；FG 状态角标、标签流光、细线装饰。

**SFX cues:** 三次短促界面 click，对应三张卡到位。

## BEAT 4 — Writing and Proof

**VO:** “正在写的复盘，和持续公开的真实数据。”

**Concept:** 产品之后接内容和数据，说明她不只做，还持续公开过程和结果。Blog 卡片像日志账本一样铺开，底部再抬出数据区的一角，形成“复盘 + 证明”双重信息。

**Visual description:** `scroll-066` 先以整屏出现，然后分出两层：上层是两列 Blog 卡片，下层从底边抬起数据条与粉丝数字。画面中心强调 “真的想清楚” 和 “真实数据” 两组词，保持内容创作者与产品人的双身份。

**Mood direction:** 克制、持续、可信。像每周都在更新的公开工作记录。

**Assets:** `capture/screenshots/scroll-066.png`

**Animation choreography:** Blog 卡片 staggered SLIDE IN；高亮词逐字 FILL；数据数字 COUNT UP；底部数据条由下向上 REVEALS；细边框亮度轻微脉冲。

**Transition:** Blur through，0.35s。

**Depth layers:** BG Blog 截图；MG 卡片阵列；FG 高亮词、数据数字、扫光线。

**SFX cues:** 轻打字声底噪，数字出现时一记更亮的提示音。

## BEAT 5 — CTA

**VO:** “这个网站本身，就是一次 vibecoding 的现场示范。五月十七号，杭州。三点五小时，跟她一起把你的第一个网站做出来。”

**Concept:** 最后收束到工作坊报名区，让整支视频从“看她的网站”变成“跟她一起做你的网站”。镜头稳定落在表单和 CTA 按钮上，像一次真实报名动作即将发生。

**Visual description:** `scroll-092` 整体作为背景，左边活动说明区清晰可读，右边表单区被框出并轻微发光。按钮区域最终放大到视觉中心，紫色 CTA 成为全片最亮的一块。结尾回到 `liudayan.com` 和主标题关键词，形成品牌闭环。

**Mood direction:** 行动感、转化感、临门一脚的确定性。

**Assets:** `capture/screenshots/scroll-092.png`, `capture/screenshots/scroll-000.png`

**Animation choreography:** 表单区域从右侧 SLIDES IN；CTA 按钮 GLOWS UP；“3.5 小时” 和 “第一个网站” 两组文字依次 PUNCH IN；最后 brand lockup 和站点名缓慢 SETTLE。

**Transition:** 开场镜头的反向收束，0.5s，带紫色辉光扩散。

**Depth layers:** BG 工作坊截图；MG 左右双栏内容；FG CTA 高亮、品牌锁定、结尾光晕。

**SFX cues:** 低频垫乐上扬，按钮出现时一记确定感 click，结尾收一枚柔和品牌音。

## Production Architecture

```text
site-intro-video/
├── index.html
├── DESIGN.md
├── SCRIPT.md
├── STORYBOARD.md
├── narration.txt
├── transcript.json
├── narration.wav
├── capture/
│   ├── screenshots/
│   ├── assets/
│   ├── extracted/
│   └── AGENTS.md
└── compositions/
    ├── beat-1-hook.html
    ├── beat-2-identity.html
    ├── beat-3-products.html
    ├── beat-4-proof.html
    └── beat-5-cta.html
```
