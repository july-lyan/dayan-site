// 构建脚本：
// 1. 从 content/pages.json 为每个板块生成独立的静态 SEO HTML 页面（便于单独发链接和外部嵌入）
// 2. 将 content/pages.json + content/kb/*.md 统一编译切块为 data/kb-chunks.json，供 /api/chat RAG 检索

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const ROOT = process.cwd();
const pagesData = JSON.parse(readFileSync(join(ROOT, "content/pages.json"), "utf-8"));
const { site, order, pages } = pagesData;

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSection(sec) {
  if (sec.type === "steps") {
    return `<h3 class="doc-h3">${esc(sec.heading)}</h3>
      <div class="steps">${sec.items
        .map((it) => `<div class="step"><span>${esc(it.no)}</span><p>${esc(it.text)}</p></div>`)
        .join("")}</div>`;
  }
  if (sec.type === "list") {
    return `<h3 class="doc-h3">${esc(sec.heading)}</h3>
      <ul class="doc-list">${sec.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>`;
  }
  if (sec.type === "case") {
    let media = "";
    if ((sec.images || []).length > 1) {
      const slides = sec.images
        .map((it) => `<div class="car-slide${it.contain ? " contain" : ""}"><img src="${esc(it.src)}" alt="${esc(it.caption || sec.heading)}" loading="lazy" /></div>`)
        .join("");
      const dots = sec.images
        .map((_, i) => `<button type="button" class="car-dot${i === 0 ? " on" : ""}" data-idx="${i}" aria-label="第 ${i + 1} 张"></button>`)
        .join("");
      const caps = esc(JSON.stringify(sec.images.map((it) => it.caption || "")));
      media = `<div class="carousel" data-index="0" data-caps="${caps}">
        <div class="car-track">${slides}</div>
        <button type="button" class="car-nav prev" aria-label="上一张">‹</button>
        <button type="button" class="car-nav next" aria-label="下一张">›</button>
        <div class="car-foot">
          <span class="car-cap">${esc(sec.images[0].caption || "")}</span>
          <div class="car-dots">${dots}</div>
        </div>
      </div>`;
    } else if (sec.image) {
      media = `<img class="case-img${sec.imageContain ? " contain" : ""}" src="${esc(sec.image)}" alt="${esc(sec.heading)}" loading="lazy" />
         ${sec.imageCaption ? `<div class="case-cap">${esc(sec.imageCaption)}</div>` : ""}`;
    }
    const mp = sec.miniprogram
      ? `<div class="mp-card">
          <div class="mp-qr">
            <img src="${esc(sec.miniprogram.qr)}" alt="${esc(sec.miniprogram.name)}小程序码" onerror="this.remove();this.parentNode.textContent='小程序码\\n待放入'" />
          </div>
          <div class="mp-info">
            <b>${esc(sec.miniprogram.name)}</b>
            <span>${esc(sec.miniprogram.tip)}</span>
          </div>
        </div>`
      : "";
    const actions = (sec.actions || []).length
      ? `<div class="case-actions">${sec.actions
          .map((a) => {
            const cls = `act-btn${a.primary ? " primary" : ""}${!a.href ? " disabled" : ""}`;
            if (!a.href) return `<span class="${cls}" title="${esc(a.tip || "")}">${esc(a.label)}</span>`;
            const dl = a.download ? ` download="${esc(a.download)}"` : "";
            const tgt = a.download ? "" : ` target="_blank" rel="noopener"`;
            return `<a class="${cls}" href="${esc(a.href)}"${dl}${tgt}>${esc(a.label)}</a>`;
          })
          .join("")}</div>`
      : "";
    return `<div class="case-box">
      <div class="case-head">
        <h4>${esc(sec.heading)}</h4>
        ${sec.badge ? `<span class="case-badge">${esc(sec.badge)}</span>` : ""}
      </div>
      <ul>${sec.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      ${media}${mp}${actions}
    </div>`;
  }
  if (sec.type === "note") {
    return `<h3 class="doc-h3">${esc(sec.heading)}</h3><div class="note-box">${esc(sec.text)}</div>`;
  }
  if (sec.type === "contact") {
    return `
      <div class="wx-box">
        <div class="wx-qr">
          <img src="/assets/photos/wechat-qr.jpg" alt="微信二维码" onerror="this.remove();this.parentNode.textContent='微信二维码\\n待放入'" />
        </div>
        <div>
          <div class="wx-head">
            <b style="font-size:15.5px">微信：${esc(site.wechat)}</b>
            <button type="button" class="copy-wx-btn" data-copy-wx="${esc(site.wechat)}">复制</button>
          </div>
          <p style="font-size:13px;color:var(--muted);margin-top:4px;line-height:1.65">
            请备注「公司 / 机构 + 想解决的问题」<br/>
            邮箱：${esc(site.email)}<br/>
            自媒体：${esc(site.social || "小红书 / 抖音 / 视频号：刘大雁AI版")}
          </p>
        </div>
      </div>
      <h3 class="doc-h3">或填写预约表单（提交直达飞书）</h3>
      <form class="lead-form" id="leadForm">
        <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
        <div class="form-row">
          <div class="field"><label>你的称呼 *</label><input name="name" required placeholder="怎么称呼你" /></div>
          <div class="field"><label>公司 / 机构</label><input name="org" placeholder="选填" /></div>
        </div>
        <div class="form-row">
          <div class="field">
            <label>想聊的方向 *</label>
            <select name="topic">
              <option value="企业 AI 前期咨询">企业 AI 前期咨询</option>
              <option value="AI 工具赋能（培训 / 内训）">AI 工具赋能（培训 / 内训）</option>
              <option value="1 对 1 项目陪跑">1 对 1 项目陪跑</option>
              <option value="亲子探索 / 其他">亲子探索 / 其他</option>
            </select>
          </div>
          <div class="field"><label>微信或手机号 *</label><input name="contact" required placeholder="方便回联" /></div>
        </div>
        <div class="field">
          <label>一句话说明你目前想解决的问题 *</label>
          <textarea name="message" required placeholder="例如：我们是 20 人电商团队，想看商品图和客服流程能不能先跑一个 AI 试点…"></textarea>
        </div>
        <button class="submit-btn" type="submit">提交预约</button>
        <div class="form-msg" id="leadMsg"></div>
      </form>`;
  }
  return "";
}

const LEAD_SCRIPT = `<script>
document.querySelectorAll("[data-copy-wx]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const wx = btn.getAttribute("data-copy-wx");
    navigator.clipboard?.writeText(wx).catch(() => {});
    const old = btn.textContent;
    btn.textContent = "已复制";
    setTimeout(() => { btn.textContent = old; }, 1600);
  });
});
const f = document.getElementById("leadForm");
if (f) {
  const m = document.getElementById("leadMsg");
  const b = f.querySelector("button[type=submit]");
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(f).entries());
    payload.sourcePath = location.pathname;
    b.disabled = true; b.textContent = "提交中…"; m.className = "form-msg";
    try {
      const r = await fetch("/api/lead", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) { m.className = "form-msg ok"; m.textContent = "已收到你的预约信息，大雁看到后会尽快联系你。"; f.reset(); }
      else { m.className = "form-msg err"; m.textContent = d.message || "提交未成功，请直接加微信 DaYan__Liu。"; }
    } catch {
      m.className = "form-msg err"; m.textContent = "提交遇到网络波动，请直接加微信 DaYan__Liu。";
    } finally { b.disabled = false; b.textContent = "提交预约"; }
  });
}
</script>`;

const CAROUSEL_SCRIPT = `<script>
document.querySelectorAll(".carousel").forEach((car) => {
  const track = car.querySelector(".car-track");
  const dots = car.querySelectorAll(".car-dot");
  const capEl = car.querySelector(".car-cap");
  const caps = JSON.parse(car.dataset.caps || "[]");
  const total = dots.length;
  const go = (idx) => {
    const next = (idx + total) % total;
    car.dataset.index = String(next);
    track.style.transform = "translateX(-" + (next * 100) + "%)";
    dots.forEach((d, i) => d.classList.toggle("on", i === next));
    if (capEl) capEl.textContent = caps[next] || "";
  };
  car.querySelector(".prev")?.addEventListener("click", () => go(Number(car.dataset.index) - 1));
  car.querySelector(".next")?.addEventListener("click", () => go(Number(car.dataset.index) + 1));
  dots.forEach((d) => d.addEventListener("click", () => go(Number(d.dataset.idx))));
});
</script>`;

// 1. 生成 6 个独立静态 HTML 页
for (const id of order) {
  const p = pages[id];
  const relPath = p.slug.replace(/^\/+/, "");
  const outFile = join(ROOT, relPath, "index.html");
  mkdirSync(dirname(outFile), { recursive: true });

  const hasContact = p.sections.some((s) => s.type === "contact");
  const hasCarousel = p.sections.some((s) => (s.images || []).length > 1);
  const cta = id === "contact"
    ? ""
    : `<div class="cv-cta">
        <div><b>想聊聊你的具体场景？</b><small>微信 ${esc(site.wechat)} · 或填写站内预约表单</small></div>
        <a href="/contact">联系 / 预约</a>
      </div>`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(p.title)} · ${esc(site.name)}</title>
  <meta name="description" content="${esc(p.lead)}" />
  <link rel="stylesheet" href="/assets/app.css" />
</head>
<body class="standalone-body">
  <header class="sa-top">
    <a class="sa-brand" href="/">
      <img class="mini-av" src="${esc(site.avatar)}" alt="${esc(site.name)}" />
      <span>${esc(site.name)}</span>
    </a>
    <div class="top-r">
      <a class="ghost-btn" href="/">和大雁聊聊</a>
      <a class="wx-pill" href="/contact">联系我</a>
    </div>
  </header>
  <main class="sa-main">
    <div class="cv-kicker">${esc(p.kicker)}</div>
    <h1 class="doc-title">${esc(p.title)}</h1>
    <p class="doc-lead">${esc(p.lead)}</p>
    ${p.sections.map(renderSection).join("\n")}
    ${cta}
  </main>
  ${hasCarousel ? CAROUSEL_SCRIPT : ""}
  ${hasContact ? LEAD_SCRIPT : ""}
</body>
</html>`;

  writeFileSync(outFile, html, "utf-8");
}

// 2. 构建 RAG 知识库索引 data/kb-chunks.json
const chunks = [];

// 2a. 从 pages.json 生成结构化知识块
for (const id of order) {
  const p = pages[id];
  const parts = [p.lead, p.presetReply.replace(/\*\*/g, "")];
  for (const sec of p.sections) {
    if (sec.type === "steps") {
      parts.push(`${sec.heading}：` + sec.items.map((i) => `${i.no} ${i.text}`).join("；"));
    } else if (sec.type === "list") {
      parts.push(`${sec.heading}：` + sec.items.join("；"));
    } else if (sec.type === "case") {
      chunks.push({
        pageId: id,
        pageNav: p.nav,
        slug: p.slug,
        title: p.title,
        heading: sec.heading,
        text: `${sec.heading}。` + sec.bullets.join(" "),
      });
    } else if (sec.type === "note") {
      parts.push(`${sec.heading}：${sec.text}`);
    }
  }
  chunks.push({
    pageId: id,
    pageNav: p.nav,
    slug: p.slug,
    title: p.title,
    heading: p.title,
    text: parts.join("\n"),
  });
}

// 2b. 读取 content/kb/*.md 及白名单同步的 content/kb/synced/*.md 按 ## 切块
const kbDirs = [join(ROOT, "content/kb"), join(ROOT, "content/kb/synced")];
for (const kbDir of kbDirs) {
  if (!existsSync(kbDir)) continue;
  const files = readdirSync(kbDir).filter((f) => f.endsWith(".md")).sort();
  for (const f of files) {
    const raw = readFileSync(join(kbDir, f), "utf-8");
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const meta = {};
    let body = raw;
    if (fmMatch) {
      for (const line of fmMatch[1].split("\n")) {
        const idx = line.indexOf(":");
        if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
      body = fmMatch[2];
    }
    const sections = body.split(/\n(?=##\s+)/).map((s) => s.trim()).filter(Boolean);
    for (const sec of sections) {
      const firstLine = sec.split("\n")[0].replace(/^#+\s*/, "").trim();
      const cleanText = sec.replace(/^#+\s*/gm, "").trim();
      chunks.push({
        pageId: meta.pageId || "consulting",
        pageNav: pages[meta.pageId]?.nav || meta.title || firstLine,
        slug: meta.slug || "/consulting",
        title: meta.title || firstLine,
        heading: firstLine,
        text: cleanText,
      });
    }
  }
}

mkdirSync(join(ROOT, "data"), { recursive: true });
writeFileSync(join(ROOT, "data/kb-chunks.json"), JSON.stringify(chunks, null, 2), "utf-8");

console.log(`Built ${order.length} standalone pages and ${chunks.length} RAG chunks.`);
