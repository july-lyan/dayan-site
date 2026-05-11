// app.jsx — root composition: announce bar + nav + hero + sections + footer
//
// Tweaks panel: 默认隐藏。在 URL 后加 #tweaks 或按 Shift+T 调出。
//   主色 4 套（紫 / 青 / 洋红 / 终端绿）· 标题字体 3 套（Space / Serif / Mono）
//   扫描线 / 网格背景开关 · AI 助手位置（Hero 内嵌 / 独立区块 / 右下浮窗） · 名字直改
//
// 🔧 PLACEHOLDER DATA TO REPLACE BEFORE DEPLOY (search "TODO:replace"):
//   - 名字 / 微信号 / 邮箱 / 域名 (SITE 对象)
//   - 履历 (sections.jsx → TIMELINE)
//   - 项目数据 (sections.jsx → PROJECTS)
//   - Blog 文章 (sections.jsx → POSTS)
//   - Dashboard 数据 (sections.jsx → Dashboard cells)
//   - 课程信息 (sections.jsx → Course)

const SITE = {
  domain: "liudayan.com",
  wechat: "DaYan__Liu",
  email: "hi@liudayan.com",            // 等域名邮箱配好；或换成你的常用邮箱
  buildVer: "0.1.3",
};

// 社媒：联络区与 Hero CTA 共用同一来源，单点维护
const SOCIALS = {
  xhs: {
    label: "小红书",
    handle: "刘大雁AI版",
    url: "https://www.xiaohongshu.com/user/profile/5b810cb3db2e605e7777b2d5",
  },
  douyin: {
    label: "抖音",
    handle: "刘大雁AI版",
    url: "https://v.douyin.com/GASPAvymhfA/",
  },
  gzh: {
    label: "公众号",
    handle: "刘大雁AI笔记",
    url: "http://weixin.qq.com/r/mp/WyNBWXfEwSq_rTM693ZJ",   // 公众号关注/二维码短链
  },
};

const TWEAK_DEFAULTS = {
  primary: "#8b7cff",                  // 紫色（主色辉光）
  scanlines: true,
  grid: true,
  chatPosition: "floating",            // ← 默认右下浮窗
  displayFont: "space",
  name: "大雁",                         // TODO:replace 名字
};

const PRIMARIES = {
  "#8b7cff": { glow: "rgba(139,124,255,0.55)", soft: "rgba(139,124,255,0.10)" }, // 紫
  "#4dd4e0": { glow: "rgba(77,212,224,0.55)",  soft: "rgba(77,212,224,0.10)"  }, // 青
  "#ff6b8a": { glow: "rgba(255,107,138,0.55)", soft: "rgba(255,107,138,0.10)" }, // 洋红
  "#5dd49a": { glow: "rgba(93,212,154,0.55)",  soft: "rgba(93,212,154,0.10)"  }, // 终端绿
};

const FONT_STACKS = {
  space: '"Space Grotesk", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif',
  serif: '"Fraunces", "Noto Serif SC", Georgia, serif',
  mono:  '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // 把 tweaks 应用到 CSS 变量
  React.useEffect(() => {
    const root = document.documentElement;
    const p = PRIMARIES[t.primary] || PRIMARIES["#8b7cff"];
    root.style.setProperty("--primary", t.primary);
    root.style.setProperty("--primary-glow", p.glow);
    root.style.setProperty("--primary-soft", p.soft);
    root.style.setProperty("--scanlines", t.scanlines ? "1" : "0");
    root.style.setProperty("--grid", t.grid ? "0.7" : "0");
    root.style.setProperty("--f-display", FONT_STACKS[t.displayFont] || FONT_STACKS.space);
  }, [t.primary, t.scanlines, t.grid, t.displayFont]);

  const days = useDaysUntil("2026-05-17");

  return (
    <>
      <AnnounceBar days={days} />
      <Nav name={t.name} domain={SITE.domain} ver={SITE.buildVer} />
      <main>
        <Hero
          name={t.name}
          domain={SITE.domain}
          wechat={SITE.wechat}
          email={SITE.email}
          chatInline={t.chatPosition === "hero"}
        />
        {t.chatPosition === "section" && (
          <section className="section" data-screen-label="01b Chat">
            <div className="shell">
              <div className="section-head">
                <div>
                  <div className="t-eyebrow"><span className="dot" />01.5 / Ask</div>
                  <h2 className="section-title">
                    直接<span className="accent">问雁飞</span>。
                  </h2>
                  <p className="section-sub">
                    AI 助手基于公开博客 + 项目数据回答。问什么都行。
                  </p>
                </div>
              </div>
              <div style={{ maxWidth: 720, margin: "0 auto" }}><Chat /></div>
            </div>
          </section>
        )}
        <About />
        <Projects />
        <DemoStrip />
        <Blog />
        <Dashboard />
        <Course />
      </main>
      <Footer name={t.name} domain={SITE.domain} email={SITE.email} wechat={SITE.wechat} />

      {t.chatPosition === "floating" && <FloatingChat />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="主题" />
        <TweakColor
          label="主色辉光"
          value={t.primary}
          options={["#8b7cff", "#4dd4e0", "#ff6b8a", "#5dd49a"]}
          onChange={(v) => setTweak("primary", v)}
        />
        <TweakRadio
          label="标题字体"
          value={t.displayFont}
          options={[
            { value: "space", label: "Space" },
            { value: "serif", label: "Serif" },
            { value: "mono",  label: "Mono" },
          ]}
          onChange={(v) => setTweak("displayFont", v)}
        />
        <TweakSection label="氛围" />
        <TweakToggle label="扫描线" value={t.scanlines} onChange={(v) => setTweak("scanlines", v)} />
        <TweakToggle label="网格背景" value={t.grid} onChange={(v) => setTweak("grid", v)} />
        <TweakSection label="AI 助手" />
        <TweakRadio
          label="位置"
          value={t.chatPosition}
          options={[
            { value: "hero",     label: "Hero 内嵌" },
            { value: "section",  label: "独立区块" },
            { value: "floating", label: "右下浮窗" },
          ]}
          onChange={(v) => setTweak("chatPosition", v)}
        />
        <TweakSection label="身份" />
        <TweakText
          label="名字"
          value={t.name}
          onChange={(v) => setTweak("name", v)}
          placeholder="大雁"
        />
      </TweaksPanel>
    </>
  );
}

/* ────────────────────────────── ANNOUNCE BAR ────────────────────────────── */

function useDaysUntil(dateStr) {
  return React.useMemo(() => {
    const target = new Date(dateStr + "T09:00:00");
    const now = new Date();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [dateStr]);
}

function AnnounceBar({ days }) {
  return (
    <div className="announce">
      <div className="announce-inner">
        <span className="announce-tag">WORKSHOP</span>
        <span className="announce-text">
          杭州 vibecoding 工作坊 · 5/17（周日）13:30{" "}
          <span style={{ color: "var(--fg-faint)" }}>
            ({days > 0 ? `还剩 ${days} 天` : days === 0 ? "今日开营" : "已结束"})
          </span>{" "}
          · ¥149 · 仅 10 席
        </span>
        <a className="announce-cta" href="#course">立即报名</a>
      </div>
    </div>
  );
}

/* ────────────────────────────── NAV ────────────────────────────── */

function Nav({ name, domain, ver }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="brand" href="#top">
          <img className="brand-mark" src="assets/logo-dayan-vibecoder-256.png?v=20260511d" alt="大雁 logo" />
          <span>{domain}</span>
          <span className="brand-meta">v{ver}</span>
        </a>
        <div className="nav-links">
          <a href="#about">关于</a>
          <a href="#projects">作品</a>
          <a href="#blog">Blog</a>
          <a href="#dash">数据</a>
          <a href="#course">线下营</a>
        </div>
        <div className="nav-status">
          <span className="dot" />
          ONLINE
        </div>
      </div>
    </nav>
  );
}

/* ────────────────────────────── HERO ────────────────────────────── */

function Hero({ name, domain, wechat, email, chatInline }) {
  return (
    <section className="hero" id="top" data-screen-label="01 Hero">
      <div className="shell">
        <div className="hero-grid">
          <div>
            <span className="hero-eyebrow">
              <span className="badge">2026 / Q2</span>
              freelance · vibecoding · 杭州
            </span>
            <h1 className="hero-title">
              用 <span className="accent">vibecoding</span> 把想法
              <br />
              变成产品<span className="cursor-blink"></span>
            </h1>
            <p className="hero-sub">
              从想法到可付费的链接，24 小时。15 年大厂运营和 PM 沉淀，今天用 AI 编排把它压缩进一周一个产品。
            </p>
            <div className="hero-id">
              <span>10y 阿里运营</span>
              <span className="arrow">→</span>
              <span>5y 小电 PM</span>
              <span className="arrow">→</span>
              <span className="now">freelance · vibecoding</span>
            </div>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#course">
                报名 5/17 工作坊 <span className="arrow">→</span>
              </a>
              <a className="btn btn-ghost" href="#contact">
                微信 / 邮箱
              </a>
              <span className="hero-cta-meta">
                wechat: {wechat} · {email}
              </span>
            </div>
            {chatInline && <Chat />}
          </div>
          <NowCard />
        </div>
      </div>
    </section>
  );
}

function NowCard() {
  const daysToEvent = useDaysUntil("2026-05-17");
  const weekNum = React.useMemo(() => {
    const d = new Date();
    return Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
  }, []);

  const eventLabel = daysToEvent > 0
    ? `还剩 ${daysToEvent} 天`
    : daysToEvent === 0 ? "今日开营" : "已结束";

  const socials = [
    { platform: "小红书", value: "—" },
    { platform: "抖音",   value: "—" },
    { platform: "视频号", value: "—" },
    { platform: "B站",   value: "—" },
  ];

  return (
    <div className="now-card">
      <div className="now-card-header">
        <span>
          <span className="now-card-header-dot" />
          此刻
        </span>
        <span className="now-card-live">
          <span className="now-card-live-dot" />
          实时
        </span>
      </div>

      <div className="now-card-rows">
        <div className="now-card-row">
          <div className="now-card-icon">▶</div>
          <div className="now-card-body">
            <div className="now-card-label">正在做</div>
            <div className="now-card-value">ContentFlow 2.0 · 选题标签 UI</div>
          </div>
          <span className="now-card-badge now-card-badge-primary">开发中</span>
        </div>

        <div className="now-card-row">
          <div className="now-card-icon">✦</div>
          <div className="now-card-body">
            <div className="now-card-label">本周产出</div>
            <div className="now-card-value">整理中…</div>
          </div>
          <span className="now-card-meta">第 {weekNum} 周</span>
        </div>

        <div className="now-card-row">
          <div className="now-card-icon">♪</div>
          <div className="now-card-body">
            <div className="now-card-label">最近在读</div>
            <div className="now-card-value">《Working in Public》— Nadia Eghbal</div>
          </div>
          <span className="now-card-meta">p.142</span>
        </div>

        <div className="now-card-row">
          <div className="now-card-icon">◎</div>
          <div className="now-card-body">
            <div className="now-card-label">近期活动</div>
            <div className="now-card-value">5/17 杭州 vibecoding 工作坊</div>
          </div>
          <span className="now-card-badge now-card-badge-warn">{eventLabel}</span>
        </div>

        <div className="now-card-row">
          <div className="now-card-icon">◈</div>
          <div className="now-card-body">
            <div className="now-card-label">自媒体数据</div>
            <div className="now-card-socials">
              {socials.map(s => (
                <span key={s.platform} className="now-card-social-item">
                  <span className="now-card-social-platform">{s.platform}</span>
                  <span className="now-card-social-val">{s.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="now-card-footer">
        <span>每 30 秒自动同步</span>
        <span className="now-card-online">
          <span className="now-card-online-dot" />
          在线
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────── FLOATING CHAT ────────────────────────────── */

function FloatingChat() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            zIndex: 60,
            boxShadow: "0 24px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px var(--hairline-bright)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            background: "var(--surface)",
          }}
        >
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 2,
                background: "var(--surface-2)",
                border: "1px solid var(--hairline-strong)",
                borderRadius: 6,
                color: "var(--fg-dim)",
                width: 26,
                height: 26,
                cursor: "pointer",
                fontFamily: "var(--f-mono)",
              }}
              aria-label="关闭"
            >
              ×
            </button>
            <Chat />
          </div>
        </div>
      )}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 60,
            background: "var(--primary)",
            color: "#0a0a14",
            border: "none",
            borderRadius: 999,
            padding: "12px 18px",
            fontFamily: "var(--f-mono)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 8px 28px var(--primary-glow), 0 0 0 1px rgba(255,255,255,0.1)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#0a0a14",
              boxShadow: "0 0 0 2px #0a0a14",
            }}
          />
          聊聊大雁的项目
        </button>
      )}
    </>
  );
}

/* ────────────────────────────── FOOTER ────────────────────────────── */

// 通用 click-to-copy：用于无 web 主页的渠道（微信号）
// 默认在文字后加一个 [复制] 提示，让用户清楚这是复制按钮而不是死链
function CopyLink({ value, title, children, copiedLabel }) {
  const [copied, setCopied] = React.useState(false);
  const onClick = (e) => {
    e.preventDefault();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).catch(() => {});
    } else {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <a href="#" onClick={onClick} title={title || `点击复制：${value}`}>
      {copied ? (
        <span style={{ color: "var(--good)" }}>✓ {copiedLabel || ("已复制 " + value)}</span>
      ) : (
        <>
          {children}
          <span style={{ marginLeft: 6, fontSize: 10, color: "var(--fg-faint)", letterSpacing: "0.04em" }}>
            [复制]
          </span>
        </>
      )}
    </a>
  );
}

// 外链：显式用 window.open 兜底，避免某些浏览器 / 扩展把 target="_blank" 拦下来
function ExternalLink({ url, title, children }) {
  const onClick = (e) => {
    e.preventDefault();
    try {
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) location.href = url;
    } catch (_) {
      location.href = url;
    }
  };
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClick} title={title}>
      {children}
      <span style={{ marginLeft: 4, fontSize: 10, color: "var(--fg-faint)" }}>↗</span>
    </a>
  );
}

function Footer({ name, domain, email, wechat }) {
  return (
    <footer className="footer" id="contact">
      <div className="shell">
        <div className="footer-grid">
          <div>
            <a className="brand" href="#top" style={{ marginBottom: 12 }}>
              <img className="brand-mark" src="assets/logo-dayan-vibecoder-256.png?v=20260511d" alt="大雁 logo" />
              <span>{domain}</span>
            </a>
            <p style={{ marginTop: 12, color: "var(--fg-muted)", maxWidth: "32ch", lineHeight: 1.6 }}>
              一个用 AI 把想法变成产品的杭州独立产品人。本站本身就是 vibecoding 的实验场。
            </p>
            <div style={{ marginTop: 18, fontSize: 11, color: "var(--fg-faint)" }}>
              built in 6h · self-hosted · open-source
            </div>
          </div>
          <div>
            <h5>页内</h5>
            <ul>
              <li><a href="#about">关于</a></li>
              <li><a href="#projects">作品</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#course">工作坊</a></li>
            </ul>
          </div>
          <div>
            <h5>联络</h5>
            <ul>
              <li>
                <CopyLink
                  value={wechat}
                  title={`点击复制微信号：${wechat}`}
                  copiedLabel={`已复制 ${wechat}，去微信粘贴`}
                >微信</CopyLink>
              </li>
              <li>
                <ExternalLink url={SOCIALS.xhs.url} title={`小红书：${SOCIALS.xhs.handle}`}>
                  小红书
                </ExternalLink>
              </li>
              <li>
                <ExternalLink url={SOCIALS.gzh.url} title={`公众号：${SOCIALS.gzh.handle}`}>
                  公众号
                </ExternalLink>
              </li>
              <li>
                <ExternalLink url={SOCIALS.douyin.url} title={`抖音：${SOCIALS.douyin.handle}`}>
                  抖音
                </ExternalLink>
              </li>
            </ul>
          </div>
          <div>
            <h5>订阅 / 报名</h5>
            <ul>
              <li><a href="#blog">vibecoding 日报</a></li>
              <li><a href="#course">5/17 杭州工作坊</a></li>
              <li>
                <CopyLink
                  value={wechat}
                  title={`点击复制微信号：${wechat}`}
                  copiedLabel={`已复制 ${wechat}`}
                >加微信进群</CopyLink>
              </li>
              <li>
                <CopyLink
                  value={email}
                  title={`点击复制邮箱：${email}`}
                  copiedLabel={`已复制 ${email}`}
                >邮箱</CopyLink>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {name}. all systems nominal.</span>
          <span>// {new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>
    </footer>
  );
}
