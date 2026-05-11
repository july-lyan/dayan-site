// sections.jsx — About, Projects, Demo, Blog, Dashboard, Course, Newsletter
// All sections share window-scope so app.jsx can compose them.

/* ────────────────────────────── DATA ────────────────────────────── */

const TIMELINE = [
  {
    period: "2025 — now",
    duration: "freelance",
    nowTag: true,
    role: "独立产品人 / vibecoder",
    org: "自由职业 · 杭州",
    body: "把 15 年大厂沉淀带进 AI 时代，以一人公司模式持续实践：搭 AI 自媒体内容矩阵（小红书 + 公众号日更），独立开发 AI 识字小程序与表情包生成工具并完成上线。Vibe Coding 实践者，用 Claude Code / Codex 走完从需求到部署的完整闭环。",
    tags: ["vibecoding", "AI 产品", "独立开发", "内容创作"],
  },
  {
    period: "2021 — 2025",
    duration: "约5年",
    role: "资深产品经理",
    org: "小电科技",
    body: "主导公司首套智能客服多 Agent 体系从 0 到 1，覆盖「意图识别 → 路由 → 自动执行 → 人工兜底」全链路，上线后外包客服成本降低 50%，意图识别转人工准确率达 95%。同期搭建两轮充电桩与共享寄存柜 IOT 平台，横跨平台 / B 端 / C 端共 4 个模态产品。",
    tags: ["AI 产品", "智能客服", "IOT 系统"],
  },
  {
    period: "2010 — 2020",
    duration: "10 年",
    role: "产品 / 运营",
    org: "阿里巴巴",
    body: "历经天猫国际、菜鸟、支付宝三条业务线。天猫国际做过流量搜索的产品与运营；菜鸟期间针对非标品建立结构化 SKU 数据标准，优化人货场匹配效率；支付宝期间搭建传媒服务团队 SOP 与舆情监控体系。十年沉淀了从 C 端运营到 B 端产品的完整认知迁移路径。",
    tags: ["电商运营", "B 端产品", "数据产品"],
  },
];

const PROJECTS = [
  {
    id: "contentflow",
    glyph: "CF",
    name: "ContentFlow",
    desc: "自媒体创作者 AI 一体化工具。一次输入生成图文/口播，5 层去 AI 痕迹处理，支持爆款拆解仿写，覆盖小红书 / 公众号全流程。",
    stack: ["Next.js", "Claude"],
    status: "live",
    link: "contentflow.one",
    screenshot: "assets/proj-contentflow.png",
    stat: null,
  },
  {
    id: "sticker",
    glyph: "ST",
    name: "AI 表情包批量工场",
    desc: "AI 表情包生成工具。上传图片 + 输入文案，多模态模型秒出个性化贴纸，内置多种艺术风格，支持自定义文案，从创意到下载一步完成。",
    stack: ["React", "Tailwind", "多模态模型"],
    status: "live",
    link: "cines.top",
    screenshot: "assets/proj-sticker.png",
    stat: null,
  },
  {
    id: "magic-words",
    glyph: "字",
    name: "魔法识字课",
    desc: "专为幼儿设计的 AI 识字小程序。基于真实家庭教育场景，游戏化互动帮助孩子认字，独立完成从设计到上线全流程。",
    stack: ["微信小程序", "AI"],
    status: "live",
    link: "微信小程序",
    qr: "assets/qr-magic-words.png",
    screenshot: "assets/proj-magic-words.png",
    stat: null,
  },
  {
    id: "drama-clip",
    glyph: "DC",
    name: "drama-clip",
    desc: "短剧二创自动化流水线桌面工具。扫描本地剧集目录，AI 自动生成分镜脚本 + TTS 配音 + 字幕对齐，批量渲染导出，本地运行无需云端。",
    stack: ["Electron", "Python", "TTS", "AI"],
    status: "wip",
    link: null,
    screenshot: "assets/proj-drama-clip.png",
    stat: null,
  },
  {
    id: "pic-learn",
    glyph: "看",
    name: "看图识字",
    desc: "AI 个性化识字绘本小程序。基于孩子当前识字量智能生成专属绘本，每本新增 3-5 个生字，大字配拼音支持跟读，故事角色可按孩子喜好定制，科学分级自动进阶。",
    stack: ["微信小程序", "多模态模型", "TTS"],
    status: "wip",
    link: null,
    screenshot: "assets/proj-pic-learn.png",
    stat: null,
  },
  {
    id: "e-book",
    glyph: "绘",
    name: "电子绘本",
    desc: "AI 辅助实体绘本生成工具。输入主题与角色，AI 完成构思→分镜→生图→排版→封面全流程，最终输出可印刷的高清 PDF，生成一本真正属于孩子的实体绘本。",
    stack: ["AI 生图", "TTS", "微信小程序"],
    status: "wip",
    link: null,
    screenshot: "assets/proj-e-book.png",
    stat: null,
  },
];

const STATUS_LABELS = {
  live: { cn: "已上线", dot: "●" },
  wip: { cn: "开发中", dot: "◐" },
  archived: { cn: "已归档", dot: "○" },
};

const BLOG_CATS = [
  { id: "all", label: "全部" },
  { id: "vibe", label: "vibecoding 教程" },
  { id: "post", label: "产品复盘" },
  { id: "media", label: "自媒体运营" },
  { id: "solo", label: "一人公司" },
];

const POSTS = [
  {
    date: "2026.05.09",
    cat: "post",
    title: "OPC 周记：比预期晚了半年，我的第一个产品终于上线了",
    excerpt: "从去年 11 月开始，原计划 3 月上线，5 月才验收通过。跑通了整条商业链路——有支付，有生成，能跑的那种。",
    link: "https://mp.weixin.qq.com/s/fnnvjCJvqN60dq64YsQcdA",
  },
  {
    date: "2026.04.22",
    cat: "vibe",
    title: "OPC 周记：当 AI 开始互相沟通，我这个「老板」在做什么？",
    excerpt: "Claude 在发邮件，Codex 在跑流水线，我发现自己的角色变了——不再是执行者，是指挥者。一人公司的下一阶段。",
    link: "https://mp.weixin.qq.com/s/2BhtO2XNJM2uRIgveqYBtg",
  },
  {
    date: "2026.04.17",
    cat: "media",
    title: "OPC 上班第 2 周：5 个平台、3 条路、1 个答案",
    excerpt: "百家号和 B 站同时过审，我却慌了。5 个平台同时跑，一个人扛得住吗？想清楚了哪条认真打，哪条搬运就行。",
    link: "https://mp.weixin.qq.com/s/UtK0fSUqKsixUcp-KNmwhA",
  },
  {
    date: "2026.04.14",
    cat: "solo",
    title: "OPC 日记：今天和几个「土老板」聊完，我想明白一件事",
    excerpt: "卖汽车的、做保温杯的、跑外贸的，他们聊 AI 不聊模型——聊「我卖什么」。格子间出来的人该听的一课。",
    link: "https://www.xiaohongshu.com/discovery/item/69de3d55000000001d01bc19",
  },
  {
    date: "2026.04.08",
    cat: "vibe",
    title: "vibecoding 了个口播剪辑器，来看看我的思路",
    excerpt: "做口播视频最痛的不是录，是剪——语气词、重复段、停顿。用 Claude Code 写了个专属粗剪工具，问题解决了。",
    link: "https://www.xiaohongshu.com/discovery/item/69d61fa60000000021039675",
  },
  {
    date: "2026.04.05",
    cat: "media",
    title: "一条视频百万播放后，我想明白了一件事",
    excerpt: "播放量上来了，我坐在那没什么感觉。后来才想明白，自媒体的终点不是流量，是找到真正和你同频的那群人。",
    link: "https://mp.weixin.qq.com/s/JKK2AbfR-wzTkHduW8Y42w",
  },
  {
    date: "2026.03.24",
    cat: "vibe",
    title: "微信能直接跟 Claude 对话了？5 分钟搞定",
    excerpt: "发现一个方法，5 分钟让微信直接接上 Claude。从此聊天窗口就是 AI 工作台，有记忆，能调上下文。",
    link: "https://www.xiaohongshu.com/discovery/item/69c1fb5a0000000022003b6b",
  },
  {
    date: "2026.03.15",
    cat: "vibe",
    title: "别再空谈 Agent、Skills、Workflow、MCP！用真实项目讲清楚本质",
    excerpt: "这四个词你一定听过，但大多数解释都在空转。用自己跑通的项目拆解：什么时候用 Agent，什么时候用 Workflow。",
    link: "https://mp.weixin.qq.com/s/IqHRiry5972eZSGvzsK7qg",
  },
  {
    date: "2026.03.08",
    cat: "vibe",
    title: "Vibecoding 的 idea 从哪来？用 GitHub + Cursor「抄」出第一个可运行版本",
    excerpt: "找 idea 最快的方法不是头脑风暴，是找一个已验证的项目，用 Cursor 跑通，再做成你自己想要的样子。",
    link: "https://mp.weixin.qq.com/s/8xEtTjP98ZZTbzVflFJebg",
  },
  {
    date: "2025.12.31",
    cat: "post",
    title: "2025 年终总结：用 AI 做产品，也把生活重新搭起来",
    excerpt: "2025 年做了什么、亏了多少、学到什么。最重要的不是跑通了几个产品，是终于知道自己想做什么。",
    link: "https://mp.weixin.qq.com/s/TzbgE0BrKejH4WYUqLI-fA",
  },
];

/* ────────────────────────────── ABOUT ────────────────────────────── */

function About() {
  return (
    <section id="about" className="section" data-screen-label="02 About">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="t-eyebrow">
              <span className="dot"></span>02 / About
            </div>
            <h2 className="section-title">
              做了 <span className="accent">15 年</span> 别人想做的事，
              <br />
              现在做自己想做的。
            </h2>
            <p className="section-sub">
              履历不是简历。是关于路径依赖与跳出路径依赖。
            </p>
          </div>
          <div className="section-meta">
            <div>// born 1989</div>
            <div>// based in Hangzhou</div>
          </div>
        </div>

        <div className="about-grid">
          <div className="portrait-stack">
            <div className="portrait-main">
              <div className="portrait-ph portrait-ph-1">
                <span className="portrait-glyph">大</span>
              </div>
              <div className="portrait-caption">
                <span>2026 · 杭州</span>
                <span className="portrait-dim">daily</span>
              </div>
            </div>
            <div className="portrait-row">
              <div className="portrait-thumb">
                <div className="portrait-ph portrait-ph-2">
                  <span className="portrait-glyph portrait-glyph-sm">V</span>
                </div>
                <div className="portrait-caption">
                  <span>workshop</span>
                </div>
              </div>
              <div className="portrait-thumb">
                <div className="portrait-ph portrait-ph-3">
                  <span className="portrait-glyph portrait-glyph-sm">∞</span>
                </div>
                <div className="portrait-caption">
                  <span>archive</span>
                </div>
              </div>
            </div>
          </div>
          <div className="timeline">
            {TIMELINE.map((t, i) => (
              <div key={i} className={`tl-item${t.nowTag ? " now" : ""}`}>
                <div className="tl-period">
                  <span>{t.period}</span>
                  <span className="duration">· {t.duration}</span>
                  {t.nowTag && <span className="now-tag">now</span>}
                </div>
                <h3 className="tl-role">{t.role}</h3>
                <div className="tl-org">{t.org}</div>
                <div className="tl-content">
                  <div className="tl-body-box">
                    <p className="tl-body">{t.body}</p>
                  </div>
                  <div className="tl-tags-col">
                    {t.tags.map((tag) => (
                      <span key={tag} className="chip">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── PROJECTS ────────────────────────────── */

function Projects() {
  const [filter, setFilter] = React.useState("all");
  const counts = {
    all: PROJECTS.length,
    live: PROJECTS.filter((p) => p.status === "live").length,
    wip: PROJECTS.filter((p) => p.status === "wip").length,
  };

  const groups = [
    { id: "live", title: "已上线", filter: (p) => p.status === "live" },
    { id: "wip", title: "开发中", filter: (p) => p.status === "wip" },
  ];

  return (
    <section id="projects" className="section" data-screen-label="03 Projects">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="t-eyebrow">
              <span className="dot"></span>03 / Projects
            </div>
            <h2 className="section-title">
              一些 <span className="accent">在跑的东西</span>。
            </h2>
            <p className="section-sub">
              凡是公开能看到的，都已经付费验证过。剩下的还在炉子里。
            </p>
          </div>
          <div className="proj-filters">
            {[
              { id: "all", l: "全部" },
              { id: "live", l: "已上线" },
              { id: "wip", l: "开发中" },
            ].map((f) => (
              <button
                key={f.id}
                className={`proj-filter${filter === f.id ? " active" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.l}
                <span className="count">{counts[f.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {groups
          .filter((g) => filter === "all" || filter === g.id)
          .map((g) => {
            const items = PROJECTS.filter(g.filter);
            if (items.length === 0) return null;
            return (
              <div className="proj-group" key={g.id}>
                <div className="proj-group-head">
                  <h3>{g.title}</h3>
                  <span className="count">— {items.length}</span>
                  <span className="proj-group-line" />
                </div>
                <div className="proj-grid">
                  {items.map((p) => (
                    <ProjectCard key={p.id} p={p} />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}

function ProjectCard({ p }) {
  const [qrOpen, setQrOpen] = React.useState(false);
  const status = STATUS_LABELS[p.status];
  const chipClass =
    p.status === "live" ? "chip-live" : p.status === "wip" ? "chip-wip" : "chip-archived";
  const href = p.link && (p.link.startsWith("http") || p.link.includes("."))
    ? `https://${p.link}` : "#";
  const isExternal = !!p.link && href !== "#";
  return (
    <a
      className="proj-card"
      href={isExternal ? href : undefined}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      onClick={(e) => { if (p.status === "archived" || p.qr) e.preventDefault(); }}
    >
      <div className="proj-shot">
        {p.screenshot ? (
          <img
            src={p.screenshot}
            alt={p.name}
            className="proj-shot-img"
          />
        ) : (
          <>
            <div className="grid-bg" />
            <span className="glyph">{p.glyph}</span>
          </>
        )}
        <span className={`chip ${chipClass} proj-status`}>
          {status.dot} {status.cn}
        </span>
      </div>
      <div className="proj-body">
        <h4>{p.name}</h4>
        <p>{p.desc}</p>
        <div className="proj-stack">
          {p.stack.map((s) => (
            <span key={s} className="chip">{s}</span>
          ))}
          {p.qr ? (
            <div style={{ position: "relative" }}>
              <button
                className="proj-link-tag"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQrOpen(v => !v); }}
              >
                扫码 ↗
              </button>
              {qrOpen && (
                <div className="proj-qr-pop" onClick={(e) => e.stopPropagation()}>
                  <img src={p.qr} alt="小程序二维码" />
                  <p>微信扫码打开小程序</p>
                </div>
              )}
            </div>
          ) : isExternal ? (
            <a
              className="proj-link-tag"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {p.link} →
            </a>
          ) : null}
        </div>
      </div>
    </a>
  );
}

/* ────────────────────────────── BLOG ────────────────────────────── */

function Blog() {
  return (
    <section id="blog" className="section" data-screen-label="05 Blog">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="t-eyebrow">
              <span className="dot"></span>05 / Blog
            </div>
            <h2 className="section-title">
              写下来才算<span className="accent"> 真的想清楚 </span>。
            </h2>
            <p className="section-sub">
              每周更，复盘 + 教程为主。不写情绪文。
            </p>
          </div>
          <div className="section-meta">
            <div>// {POSTS.length} entries</div>
            <div>// latest first</div>
          </div>
        </div>

        <div className="blog-cards">
          {POSTS.slice(0, 4).map((p, i) => (
            <a
              key={i}
              className="blog-card"
              href={p.link || "#"}
              target={p.link ? "_blank" : undefined}
              rel={p.link ? "noopener noreferrer" : undefined}
            >
              <div className="blog-card-meta">
                <span className="chip">{BLOG_CATS.find((c) => c.id === p.cat)?.label}</span>
                <span className="blog-card-date">{p.date}</span>
              </div>
              <h3 className="blog-card-title">{p.title}</h3>
              <p className="blog-card-excerpt">{p.excerpt}</p>
              <div className="blog-card-foot">
                读全文 <span className="blog-card-arrow">↗</span>
              </div>
            </a>
          ))}
        </div>

        <a href="blog.html" className="blog-more-link">
          查看全部 {POSTS.length} 篇文章 →
        </a>
      </div>
    </section>
  );
}

/* ────────────────────────────── LIVE DEMO ────────────────────────────── */

function DemoStrip() {
  return (
    <section id="demo" className="section" data-screen-label="04 Demo">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="t-eyebrow">
              <span className="dot"></span>04 / Live demo
            </div>
            <h2 className="section-title">
              不要 iframe，<span className="accent">直接在站内跑</span>。
            </h2>
            <p className="section-sub">
              工具就在这里。点一下，立刻见结果。
            </p>
          </div>
        </div>
        <div className="demo-strip">
          <DemoResume />
          <DemoContentFlow />
        </div>
      </div>
    </section>
  );
}

function DemoResume() {
  const PLACEHOLDER = "我在阿里巴巴工作，做了一些运营相关的事情。";
  const [input, setInput] = React.useState("");
  const [result, setResult] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState("");

  function buildResumeFallback(text) {
    const compact = (text || PLACEHOLDER).replace(/\s+/g, "");
    if (compact.includes("运营")) {
      return "负责运营策略制定与执行，优化增长链路，推动核心转化效率持续提升";
    }
    if (compact.includes("产品")) {
      return "主导产品方案设计与迭代，协同研发落地，推动关键指标稳步提升";
    }
    if (compact.includes("销售")) {
      return "负责重点客户拓展与成交转化，优化销售流程，推动业绩持续增长";
    }
    return "推动重点项目落地并持续优化执行链路，提升协作效率与业务结果";
  }

  async function handlePolish() {
    const text = input.trim() || PLACEHOLDER;
    setLoading(true);
    setResult("");
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, mode: "resume" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.reply) {
        setResult(data.reply);
      } else {
        setResult(buildResumeFallback(text));
        setError("当前展示的是离线演示结果。");
      }
    } catch {
      setResult(buildResumeFallback(text));
      setError("当前展示的是离线演示结果。");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleReset() {
    setInput("");
    setResult("");
    setError("");
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <span className="lhs">📝 简历改写工具 · 试一下</span>
        <span className="live"><span className="dot" /> LIVE</span>
      </div>
      <div className="demo-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            disabled={loading}
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              color: "var(--fg)",
              fontSize: 13.5,
              lineHeight: 1.6,
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          {result && (
            <div
              style={{
                padding: 12,
                background: "var(--primary-soft)",
                border: "1px solid rgba(139,124,255,0.3)",
                borderRadius: 8,
                fontSize: 13.5,
                lineHeight: 1.7,
                color: "#d8d3ff",
                position: "relative",
              }}
            >
              <div className="t-eyebrow" style={{ marginBottom: 6 }}>改写后</div>
              <div>{result}</div>
              <button
                onClick={handleCopy}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "rgba(139,124,255,0.15)",
                  border: "1px solid rgba(139,124,255,0.3)",
                  borderRadius: 5,
                  color: "#b8b0ff",
                  fontSize: 11,
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                {copied ? "已复制 ✓" : "复制"}
              </button>
            </div>
          )}
          {error && (
            <div style={{ fontSize: 12.5, color: "var(--danger, #f87171)" }}>{error}</div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handlePolish}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? "AI 改写中…" : "✦ AI 改写"}
            </button>
            {(result || input) && (
              <button className="btn btn-ghost" onClick={handleReset}>
                重置
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoContentFlow() {
  const PLACEHOLDER = "月薪3000，我靠副业一个月多赚2万的真实经历";
  const [input, setInput] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // parse "爆款指数 XX 分\n• ...\n改进：..." into structured data
  function parseResult(text) {
    const scoreMatch = text.match(/爆款指数\s*(\d+)\s*分/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    const highlights = [];
    const hlLines = text.match(/•[^•\n]+/g) || [];
    hlLines.forEach((l) => highlights.push(l.replace(/^•\s*/, "").replace(/^亮点：/, "").trim()));
    const suggMatch = text.match(/改进[：:]\s*(.+)/);
    const suggestion = suggMatch ? suggMatch[1].trim() : "";
    return { score, highlights, suggestion, raw: text };
  }

  function scoreColor(s) {
    if (s >= 80) return "#4ade80";
    if (s >= 60) return "#facc15";
    return "#f87171";
  }

  function buildViralFallback(text) {
    const q = (text || PLACEHOLDER).trim();
    let score = 45;
    if (/\d/.test(q)) score += 15;
    if (/[万千百亿%]/.test(q)) score += 10;
    if (/[我你她他]/.test(q)) score += 8;
    if (/[？?]/.test(q)) score += 8;
    if (/(真实|副业|月薪|逆袭|普通人|避坑|干货|崩溃|翻盘)/.test(q)) score += 14;
    score = Math.max(35, Math.min(92, score));

    const highlights = [];
    if (/\d/.test(q)) highlights.push("数字结果抓眼");
    if (/(真实|亲测|经历)/.test(q)) highlights.push("真实感比较强");
    if (/(副业|赚钱|涨薪|变现)/.test(q)) highlights.push("利益点很明确");
    if (/(普通人|新手|小白)/.test(q)) highlights.push("受众定位清晰");
    while (highlights.length < 3) {
      highlights.push(["情绪张力够用", "有讨论空间", "选题有传播面"][highlights.length]);
    }

    let suggestion = "补一个更具体的结果数字";
    if (!/[？?]/.test(q)) suggestion = "结尾补悬念或反差提问";
    if (!/\d/.test(q)) suggestion = "标题里补数字或时间成本";

    return [
      `爆款指数 ${score} 分`,
      `• 亮点：${highlights[0]}`,
      `• 亮点：${highlights[1]}`,
      `• 亮点：${highlights[2]}`,
      `改进：${suggestion}`,
    ].join("\n");
  }

  async function handleAnalyze() {
    const text = input.trim() || PLACEHOLDER;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, mode: "viral" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.reply) {
        setResult(parseResult(data.reply));
      } else {
        setResult(parseResult(buildViralFallback(text)));
        setError("当前展示的是离线演示结果。");
      }
    } catch {
      setResult(parseResult(buildViralFallback(text)));
      setError("当前展示的是离线演示结果。");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setInput("");
    setResult(null);
    setError("");
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <span className="lhs">🔥 小红书爆款分析 · 试一下</span>
        <span className="live"><span className="dot" /> LIVE</span>
      </div>
      <div className="demo-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            disabled={loading}
            rows={2}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              color: "var(--fg)",
              fontSize: 13.5,
              lineHeight: 1.6,
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          {result && (
            <div
              style={{
                padding: 14,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid var(--hairline)",
                borderRadius: 8,
                fontSize: 13,
                lineHeight: 1.75,
              }}
            >
              {result.score !== null && (
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                  <span style={{ color: "var(--fg-dim)", fontSize: 12 }}>爆款指数</span>
                  <span style={{ fontSize: 32, fontWeight: 700, color: scoreColor(result.score), lineHeight: 1 }}>
                    {result.score}
                  </span>
                  <span style={{ color: "var(--fg-dim)", fontSize: 12 }}>/ 100</span>
                </div>
              )}
              {result.highlights.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {result.highlights.map((h, i) => (
                    <div key={i} style={{ color: "var(--fg-dim)", fontSize: 12.5 }}>
                      <span style={{ color: "var(--accent)", marginRight: 5 }}>✦</span>{h}
                    </div>
                  ))}
                </div>
              )}
              {result.suggestion && (
                <div style={{
                  paddingTop: 8,
                  borderTop: "1px solid var(--hairline)",
                  color: "#facc15",
                  fontSize: 12.5,
                }}>
                  💡 {result.suggestion}
                </div>
              )}
            </div>
          )}
          {error && (
            <div style={{ fontSize: 12.5, color: "var(--danger, #f87171)" }}>{error}</div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? "分析中…" : "🔥 分析爆款潜力"}
            </button>
            {(result || input) && (
              <button className="btn btn-ghost" onClick={handleReset}>重置</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── DASHBOARD ────────────────────────────── */

const SPARK = (seed) => {
  const pts = [];
  let v = 30 + (seed % 20);
  for (let i = 0; i < 14; i++) {
    v += (Math.sin(i * 0.7 + seed) + 1) * 6 + (i * 1.4);
    pts.push(v);
  }
  return pts;
};
const sparkPath = (pts, w = 100, h = 30) => {
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  return pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};

function Dashboard() {
  const [stats, setStats] = React.useState(null);
  const [qrOpen, setQrOpen] = React.useState(false);

  React.useEffect(() => {
    fetch("/stats.json")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  const cells = [
    { l: stats?.douyin?.label      ?? "抖音粉丝",  v: stats?.douyin?.value      ?? "—", url: stats?.douyin?.url },
    { l: stats?.xiaohongshu?.label ?? "小红书粉丝", v: stats?.xiaohongshu?.value ?? "—", url: stats?.xiaohongshu?.url },
    { l: stats?.shipin?.label      ?? "视频号粉丝", v: stats?.shipin?.value      ?? "—", qr: true },
    { l: stats?.bilibili?.label    ?? "B站粉丝",   v: stats?.bilibili?.value    ?? "—", url: stats?.bilibili?.url },
  ];

  const updatedAt = stats?.updatedAt ?? "—";

  return (
    <section id="dash" className="section" data-screen-label="06 Data">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="t-eyebrow">
              <span className="dot"></span>06 / vibecoding 实战数据
            </div>
            <h2 className="section-title">
              <span className="accent">真实数据</span>是最好的简历。
            </h2>
            <p className="section-sub">
              全平台同名：<span style={{ color: "var(--fg)" }}>刘大雁AI版</span>
              {"  ·  "}数据截至 <span style={{ color: "var(--fg)" }}>{updatedAt}</span>
            </p>
          </div>
          <div className="section-meta">
            <div>// 手动更新</div>
            <div>// stats.json</div>
          </div>
        </div>

        <div className="dash-grid">
          {cells.map((c, i) => {
            const inner = (
              <>
                <div className="label">
                  <span>{c.l}</span>
                  {(c.url || c.qr) && <span className="dash-arrow">{c.qr ? "⊞" : "↗"}</span>}
                </div>
                <div className="value">{c.v}</div>
              </>
            );
            if (c.qr) {
              return (
                <div key={i} className="dash-cell dash-cell--link" onClick={() => setQrOpen(true)} style={{ cursor: "pointer" }}>
                  {inner}
                </div>
              );
            }
            return c.url ? (
              <a key={i} className="dash-cell dash-cell--link" href={c.url} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <div key={i} className="dash-cell">{inner}</div>
            );
          })}
        </div>
      </div>

      {qrOpen && (
        <div className="qr-overlay" onClick={() => setQrOpen(false)}>
          <div className="qr-box" onClick={(e) => e.stopPropagation()}>
            <p className="qr-label">微信扫码关注视频号</p>
            <img src="/assets/qr-shipin.png" alt="视频号二维码" className="qr-img" />
            <button className="qr-close" onClick={() => setQrOpen(false)}>关闭</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ────────────────────────────── COURSE ────────────────────────────── */

function Course() {
  const [form, setForm] = React.useState({ name: "", wechat: "", track: "个人主页", note: "" });
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const SEATS_TOTAL = 10;
  const SEATS_LEFT = 10;
  const filled = SEATS_TOTAL - SEATS_LEFT;
  const pct = (filled / SEATS_TOTAL) * 100;

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.wechat) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const d = await res.json();
        setError(d.error || "提交失败，请稍后重试");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="course" className="section" data-screen-label="07 Course">
      <div className="shell">
        <div className="section-head">
          <div>
            <div className="t-eyebrow">
              <span className="dot"></span>07 / 杭州工作坊
            </div>
            <h2 className="section-title">
              5 月 17 日，<span className="accent">3.5 小时做出你的第一个网站</span>。
            </h2>
          </div>
        </div>

        <div className="course">
          <div className="course-head">
            <div>
              <div className="course-eyebrow">
                <span className="pulse" />
                Vibecoding 杭州 · 工作坊
              </div>
              <h3 className="course-title">
                现场跟做，<br />
                当天上线。
              </h3>
              <p className="course-sub">
                13:30 你带一个想法到现场。17:00 你的网站已经上线、能发朋友圈。
                零代码基础也能上手——我们用 CodeBuddy + EdgeOne，让 AI 替你写得对。
              </p>
              <div className="course-facts">
                <div className="course-fact">
                  <div className="k">Date</div>
                  <div className="v">5 月 17 日<small>· 周日</small></div>
                </div>
                <div className="course-fact">
                  <div className="k">Time</div>
                  <div className="v">13:30<small>— 17:00</small></div>
                </div>
                <div className="course-fact">
                  <div className="k">Location</div>
                  <div className="v">杭州<small>· 具体地址私聊</small></div>
                </div>
                <div className="course-fact">
                  <div className="k">Seats</div>
                  <div className="v">{SEATS_TOTAL}<small>· 粉丝预留</small></div>
                </div>
                <div className="course-fact">
                  <div className="k">Price</div>
                  <div className="v">¥149<small>· 市场费用</small></div>
                </div>
                <div className="course-fact">
                  <div className="k">After</div>
                  <div className="v">7<small>天答疑</small></div>
                </div>
              </div>
            </div>

            <div className="course-form">
              {submitted ? (
                <div className="course-success">
                  <div className="glyph">✓</div>
                  <div style={{ color: "var(--fg)", marginBottom: 8, fontSize: 16, fontWeight: 600 }}>
                    收到，{form.name}
                  </div>
                  <div style={{ color: "var(--fg-muted)", fontSize: 13, lineHeight: 1.6 }}>
                    24 小时内通过微信 <span style={{ color: "var(--primary)" }}>{form.wechat}</span>{" "}
                    联系你确认席位。
                    <br />
                    或直接微信加大雁，备注「<span style={{ color: "var(--primary)" }}>杭州5/17</span>」锁定更快。
                  </div>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <h4>锁定席位</h4>
                  <div className="seats">
                    剩 {SEATS_LEFT} / {SEATS_TOTAL}
                    <span className="meter"><span style={{ width: `${pct}%` }} /></span>
                  </div>
                  <div className="form-row">
                    <label>称呼</label>
                    <input
                      className="field"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="希望被怎么称呼"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>微信号</label>
                    <input
                      className="field"
                      value={form.wechat}
                      onChange={(e) => update("wechat", e.target.value)}
                      placeholder="用于发地址 / 群"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>赛道选择</label>
                    <select
                      className="field"
                      value={form.track}
                      onChange={(e) => update("track", e.target.value)}
                    >
                      <option>个人主页</option>
                      <option>小工具</option>
                      <option>小游戏</option>
                      <option>还没想好</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>你想做什么？（选填）</label>
                    <textarea
                      className="field"
                      style={{ minHeight: 60, resize: "vertical" }}
                      value={form.note}
                      onChange={(e) => update("note", e.target.value)}
                      placeholder="一句话足够"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: submitting ? 0.6 : 1 }}
                  >
                    {submitting ? "提交中…" : <><span>提交报名</span><span className="arrow">→</span></>}
                  </button>
                  {error && <div style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>{error}</div>}
                  <div
                    style={{
                      marginTop: 10,
                      fontFamily: "var(--f-mono)",
                      fontSize: 11,
                      color: "var(--fg-faint)",
                      textAlign: "center",
                    }}
                  >
                    或微信私信备注「杭州5/17」直接锁定
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="course-curriculum">
            <h5>// 三赛道任选 · 离场带走一个能发朋友圈的网站链接</h5>
            <div className="curr-grid">
              <div className="curr-cell">
                <div className="day">Track A</div>
                <div className="topic">个人主页</div>
                像本站这种——简历 / 作品集 / 联系入口。最适合 PM、运营、求职者。
              </div>
              <div className="curr-cell">
                <div className="day">Track B</div>
                <div className="topic">小工具</div>
                解决一个具体小痛点的网页工具。最适合想做 SaaS 的创业者。
              </div>
              <div className="curr-cell">
                <div className="day">Track C</div>
                <div className="topic">小游戏</div>
                轻量休闲、能发圈的小玩意。最适合想做内容引流的人。
              </div>
            </div>
            <h5 style={{ marginTop: 28 }}>// 适合谁来</h5>
            <div className="curr-grid">
              <div className="curr-cell">
                想把小想法做成网站的<strong style={{ color: "var(--fg)" }}>新手</strong>
              </div>
              <div className="curr-cell">
                <strong style={{ color: "var(--fg)" }}>产品经理 / 运营 / 创业者</strong>
              </div>
              <div className="curr-cell">
                看过录播课但<strong style={{ color: "var(--fg)" }}>一直没动手</strong>的人
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.About = About;
window.Projects = Projects;
window.Blog = Blog;
window.DemoStrip = DemoStrip;
window.Dashboard = Dashboard;
window.Course = Course;
