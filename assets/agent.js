// liudayan.com 个人 Agent 交互引擎
// 双轨机制：高频入口预设秒回 + 自由提问调用 /api/chat（知识库 RAG，本地自动降级）

const $ = (s) => document.querySelector(s);
const app = $("#app");
const thread = $("#thread");
const stage = $("#stage");

let SITE_DATA = null;
let LOCAL_CHUNKS = [];
let CHAT_HISTORY = [];
let busy = false;
let browsing = false;
let currentSlug = "/";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtRich(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br/>");
}

function renderSectionHtml(sec, site) {
  if (sec.type === "steps") {
    return `<h3 class="doc-h3">${escapeHtml(sec.heading)}</h3>
      <div class="steps">${sec.items
        .map((it) => `<div class="step"><span>${escapeHtml(it.no)}</span><p>${escapeHtml(it.text)}</p></div>`)
        .join("")}</div>`;
  }
  if (sec.type === "list") {
    return `<h3 class="doc-h3">${escapeHtml(sec.heading)}</h3>
      <ul class="doc-list">${sec.items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}</ul>`;
  }
  if (sec.type === "case") {
    let mediaHtml = "";
    if ((sec.images || []).length > 1) {
      const slides = sec.images
        .map((it) => `<div class="car-slide${it.contain ? " contain" : ""}"><img src="${escapeHtml(it.src)}" alt="${escapeHtml(it.caption || sec.heading)}" loading="lazy" /></div>`)
        .join("");
      const dots = sec.images
        .map((_, i) => `<button type="button" class="car-dot${i === 0 ? " on" : ""}" data-idx="${i}" aria-label="第 ${i + 1} 张"></button>`)
        .join("");
      const caps = escapeHtml(JSON.stringify(sec.images.map((it) => it.caption || "")));
      mediaHtml = `<div class="carousel" data-index="0" data-caps="${caps}">
        <div class="car-track">${slides}</div>
        <button type="button" class="car-nav prev" aria-label="上一张">‹</button>
        <button type="button" class="car-nav next" aria-label="下一张">›</button>
        <div class="car-foot">
          <span class="car-cap">${escapeHtml(sec.images[0].caption || "")}</span>
          <div class="car-dots">${dots}</div>
        </div>
      </div>`;
    } else if (sec.image) {
      mediaHtml = `<img class="case-img${sec.imageContain ? " contain" : ""}" src="${escapeHtml(sec.image)}" alt="${escapeHtml(sec.heading)}" loading="lazy" />
         ${sec.imageCaption ? `<div class="case-cap">${escapeHtml(sec.imageCaption)}</div>` : ""}`;
    }
    const mpHtml = sec.miniprogram
      ? `<div class="mp-card">
          <div class="mp-qr">
            <img src="${escapeHtml(sec.miniprogram.qr)}" alt="${escapeHtml(sec.miniprogram.name)}小程序码" onerror="this.remove();this.parentNode.textContent='小程序码\\n待放入'" />
          </div>
          <div class="mp-info">
            <b>${escapeHtml(sec.miniprogram.name)}</b>
            <span>${escapeHtml(sec.miniprogram.tip)}</span>
          </div>
        </div>`
      : "";
    const actionsHtml = (sec.actions || []).length
      ? `<div class="case-actions">${sec.actions
          .map((a) => {
            const cls = `act-btn${a.primary ? " primary" : ""}${!a.href ? " disabled" : ""}`;
            if (!a.href) return `<span class="${cls}" title="${escapeHtml(a.tip || "")}">${escapeHtml(a.label)}</span>`;
            const dl = a.download ? ` download="${escapeHtml(a.download)}"` : "";
            const tgt = a.download ? "" : ` target="_blank" rel="noopener"`;
            return `<a class="${cls}" href="${escapeHtml(a.href)}"${dl}${tgt}>${escapeHtml(a.label)}</a>`;
          })
          .join("")}</div>`
      : "";
    return `<div class="case-box">
      <div class="case-head">
        <h4>${escapeHtml(sec.heading)}</h4>
        ${sec.badge ? `<span class="case-badge">${escapeHtml(sec.badge)}</span>` : ""}
      </div>
      <ul>${sec.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
      ${mediaHtml}${mpHtml}${actionsHtml}
    </div>`;
  }
  if (sec.type === "note") {
    return `<h3 class="doc-h3">${escapeHtml(sec.heading)}</h3>
      <div class="note-box">${escapeHtml(sec.text)}</div>`;
  }
  if (sec.type === "contact") {
    return `
      <div class="wx-box">
        <div class="wx-qr">
          <img src="/assets/photos/wechat-qr.jpg" alt="微信二维码" onerror="this.remove();this.parentNode.textContent='微信二维码\\n待放入'" />
        </div>
        <div>
          <div class="wx-head">
            <b style="font-size:15.5px">微信：${escapeHtml(site.wechat)}</b>
            <button type="button" class="copy-wx-btn" onclick="window.__agent.copyWechat()">复制</button>
          </div>
          <p style="font-size:13px;color:var(--muted);margin-top:4px;line-height:1.65">
            请备注「公司 / 机构 + 想解决的问题」<br/>
            邮箱：${escapeHtml(site.email)}<br/>
            自媒体：${escapeHtml(site.social || "小红书 / 抖音 / 视频号：刘大雁AI版")}
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

function bindLeadForm(root, sourcePath) {
  const form = root.querySelector("#leadForm");
  if (!form) return;
  const msg = root.querySelector("#leadMsg");
  const btn = form.querySelector("button[type=submit]");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.sourcePath = sourcePath;
    btn.disabled = true;
    btn.textContent = "提交中…";
    msg.className = "form-msg";
    try {
      const resp = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.ok) {
        msg.className = "form-msg ok";
        msg.textContent = "已收到你的预约信息，大雁看到后会尽快联系你。急事也可以直接加微信 DaYan__Liu。";
        form.reset();
      } else {
        msg.className = "form-msg err";
        msg.textContent = data.message || "提交未成功，请直接加微信 DaYan__Liu 联系。";
      }
    } catch {
      msg.className = "form-msg err";
      msg.textContent = "当前为本地预览或网络波动，请直接加微信 DaYan__Liu 联系。";
    } finally {
      btn.disabled = false;
      btn.textContent = "提交预约";
    }
  });
}

function renderPageBody(page) {
  const blocks = page.sections.map((s) => renderSectionHtml(s, SITE_DATA.site)).join("");
  const cta = page.id === "contact"
    ? ""
    : `<div class="cv-cta">
        <div><b>想聊聊你的具体场景？</b><small>微信 ${escapeHtml(SITE_DATA.site.wechat)} · 或填写站内预约表单</small></div>
        <button onclick="window.__agent.openPage('contact')">联系 / 预约</button>
      </div>`;
  return `<div class="cv-kicker">${escapeHtml(page.kicker)}</div>
    <h2 class="doc-title">${escapeHtml(page.title)}</h2>
    <p class="doc-lead">${escapeHtml(page.lead)}</p>
    ${blocks}${cta}`;
}

function enterChat() {
  if (browsing) toggleBrowse();
  app.classList.add("chatting");
}

function addUserMsg(text) {
  const d = document.createElement("div");
  d.className = "msg u";
  d.innerHTML = `<div class="msg-body">${escapeHtml(text)}</div>`;
  thread.appendChild(d);
  stage.scrollTop = stage.scrollHeight;
}

function addAiMsg(html) {
  const d = document.createElement("div");
  d.className = "msg";
  d.innerHTML = `<img class="av-s" src="${SITE_DATA.site.avatar}" alt="刘大雁" /><div class="msg-body"><div class="ai-card">${html}</div></div>`;
  thread.appendChild(d);
  stage.scrollTop = stage.scrollHeight;
  return d;
}

function refCardHtml(id) {
  const p = SITE_DATA.pages[id];
  if (!p) return "";
  return `<button class="ref-card" onclick="window.__agent.openPage('${id}')">
    <div class="r-top"><span>${escapeHtml(p.slug)}</span><span>↗</span></div>
    <b>${escapeHtml(p.nav)}</b>
    <p>${escapeHtml(p.summary)}</p>
  </button>`;
}

async function talkPreset(id, customQuestion) {
  if (busy || !SITE_DATA) return;
  const p = SITE_DATA.pages[id];
  if (!p) return;
  busy = true;
  enterChat();

  const q = customQuestion || `想了解：${p.nav}`;
  addUserMsg(q);
  CHAT_HISTORY.push({ role: "user", content: q });

  const t = addAiMsg(`<div class="typing"><i></i><i></i><i></i></div>`);
  await sleep(300);
  t.remove();

  addAiMsg(`<div class="ai-text">${fmtRich(p.presetReply)}</div>
    <div class="ref-list">${refCardHtml(id)}</div>`);
  CHAT_HISTORY.push({ role: "assistant", content: p.presetReply });
  busy = false;
}

// 本地纯静态预览时的轻量检索兜底
function localSearch(query) {
  const q = query.toLowerCase();
  const grams = [];
  for (let i = 0; i < q.length - 1; i++) grams.push(q.slice(i, i + 2));
  const scored = LOCAL_CHUNKS.map((c) => {
    const hay = `${c.title} ${c.heading} ${c.text}`.toLowerCase();
    let s = 0;
    for (const g of grams) if (hay.includes(g)) s += 1;
    return { c, s };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  if (!scored.length) {
    return {
      reply: "这个问题我的公开知识库里还没覆盖到（为了保证准确，我不做猜测回答）。建议直接加微信 **DaYan__Liu** 或填预约表单，由我本人回复。",
      citations: [{ id: "contact", title: "联系与约谈", slug: "/contact" }],
      source: "miss",
    };
  }
  const top = scored[0].c;
  const cites = [];
  const seen = new Set();
  for (const x of scored.slice(0, 3)) {
    if (x.c.pageId && !seen.has(x.c.pageId)) {
      seen.add(x.c.pageId);
      cites.push({ id: x.c.pageId, title: x.c.pageNav || x.c.title, slug: x.c.slug });
    }
  }
  return {
    reply: top.text.slice(0, 220) + (top.text.length > 220 ? "…" : ""),
    citations: cites,
    source: "kb-local",
  };
}

async function askFrom(inputId) {
  const el = $("#" + inputId);
  const q = el.value.trim();
  if (!q || busy || !SITE_DATA) return;
  el.value = "";
  enterChat();
  busy = true;

  addUserMsg(q);
  const t = addAiMsg(`<div class="typing"><i></i><i></i><i></i></div>`);

  let data = null;
  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, history: CHAT_HISTORY.slice(-6) }),
    });
    if (resp.ok) data = await resp.json();
  } catch {
    // 静态本地预览无 /api/chat，自动降级到本地知识块
  }
  if (!data || !data.reply) {
    await sleep(320);
    data = localSearch(q);
  }
  t.remove();

  const citesHtml = (data.citations || []).length
    ? `<div class="rag-cite"><span>相关页面：</span>${data.citations
        .map((c) => `<button class="cite-chip" onclick="window.__agent.openPage('${escapeHtml(c.id)}')">${escapeHtml(c.title)} ↗</button>`)
        .join("")}</div>`
    : "";

  addAiMsg(`<div class="ai-text">${fmtRich(data.reply)}</div>
    ${citesHtml}`);

  CHAT_HISTORY.push({ role: "user", content: q }, { role: "assistant", content: data.reply });
  busy = false;
}

function bindCarousels(root) {
  root.querySelectorAll(".carousel").forEach((car) => {
    const track = car.querySelector(".car-track");
    const dots = car.querySelectorAll(".car-dot");
    const capEl = car.querySelector(".car-cap");
    const caps = JSON.parse(car.dataset.caps || "[]");
    const total = dots.length;
    const go = (idx) => {
      const next = (idx + total) % total;
      car.dataset.index = String(next);
      track.style.transform = `translateX(-${next * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle("on", i === next));
      if (capEl) capEl.textContent = caps[next] || "";
    };
    car.querySelector(".prev")?.addEventListener("click", () => go(Number(car.dataset.index) - 1));
    car.querySelector(".next")?.addEventListener("click", () => go(Number(car.dataset.index) + 1));
    dots.forEach((d) => d.addEventListener("click", () => go(Number(d.dataset.idx))));
  });
}

function openPage(id) {
  const p = SITE_DATA.pages[id];
  if (!p) return;
  currentSlug = p.slug;
  $("#url").innerHTML = `${escapeHtml(SITE_DATA.site.domain)}<b>${escapeHtml(p.slug)}</b>`;
  $("#openFullLink").href = p.slug;
  const body = $("#cvbody");
  body.innerHTML = renderPageBody(p);
  body.scrollTop = 0;
  bindLeadForm(body, p.slug);
  bindCarousels(body);
  $("#canvas").classList.add("open");
  $("#backdrop").classList.add("on");
}

function closeCanvas() {
  $("#canvas").classList.remove("open");
  if (!$("#drawer").classList.contains("open")) $("#backdrop").classList.remove("on");
}
function openDrawer() {
  $("#drawer").classList.add("open");
  $("#backdrop").classList.add("on");
}
function closeDrawer() {
  $("#drawer").classList.remove("open");
  if (!$("#canvas").classList.contains("open")) $("#backdrop").classList.remove("on");
}
function closeAllOverlays() {
  $("#drawer").classList.remove("open");
  $("#canvas").classList.remove("open");
  $("#backdrop").classList.remove("on");
}

function copyWechat() {
  const wx = SITE_DATA?.site?.wechat || "DaYan__Liu";
  navigator.clipboard?.writeText(wx).catch(() => {});
  const t = $("#toast");
  t.textContent = `已复制微信号：${wx}`;
  t.classList.add("on");
  setTimeout(() => t.classList.remove("on"), 1800);
}

function copyLink() {
  const full = `${location.origin}${currentSlug}`;
  navigator.clipboard?.writeText(full).catch(() => {});
  const t = $("#toast");
  t.textContent = `已复制：${SITE_DATA.site.domain}${currentSlug}`;
  t.classList.add("on");
  setTimeout(() => t.classList.remove("on"), 1800);
}

function toggleBrowse() {
  browsing = !browsing;
  $("#bvBtn").textContent = browsing ? "返回对话" : "全部内容";
  const v = $("#browseview");
  v.classList.toggle("on", browsing);
  if (browsing) {
    let h = `<div class="bv-in"><h2>全部内容</h2><p class="sub">适合快速浏览与转发。点击任意卡片查看独立详情页。</p>`;
    let gg = null;
    SITE_DATA.order.forEach((id) => {
      const p = SITE_DATA.pages[id];
      if (p.group !== gg) {
        if (gg) h += `</div>`;
        gg = p.group;
        h += `<div class="b-grp">${escapeHtml(gg)}</div><div class="ref-list">`;
      }
      h += refCardHtml(id);
    });
    v.innerHTML = h + `</div></div>`;
  }
}

function backHome() {
  thread.innerHTML = "";
  CHAT_HISTORY = [];
  app.classList.remove("chatting");
  if (browsing) toggleBrowse();
  closeAllOverlays();
  const inner = $("#introInner");
  inner.querySelectorAll(".beat").forEach((el) => {
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = "";
  });
}

async function init() {
  const [pagesResp, kbResp] = await Promise.all([
    fetch("/data/site-manifest.json").then((r) => (r.ok ? r : fetch("/content/pages.json"))),
    fetch("/data/kb-chunks.json").catch(() => null),
  ]);
  SITE_DATA = await pagesResp.json();
  if (kbResp && kbResp.ok) LOCAL_CHUNKS = await kbResp.json();

  // 渲染抽屉目录
  let gg = null;
  let navHtml = "";
  SITE_DATA.order.forEach((id) => {
    const p = SITE_DATA.pages[id];
    if (p.group !== gg) {
      gg = p.group;
      navHtml += `<div class="grp">${escapeHtml(gg)}</div>`;
    }
    navHtml += `<button class="nav-item" onclick="window.__agent.pickDrawer('${id}')">${escapeHtml(p.nav)}<span>↗</span></button>`;
  });
  $("#nav").innerHTML = navHtml;

  // 渲染开屏快捷胶囊 + 对话快捷栏
  $("#introPrompts").innerHTML = SITE_DATA.quickPrompts
    .map((q) => `<button onclick="window.__agent.talkPreset('${q.id}','${escapeHtml(q.question)}')">${escapeHtml(q.label)}</button>`)
    .join("");
  $("#quickRow").innerHTML = SITE_DATA.order
    .map((id) => `<button onclick="window.__agent.talkPreset('${id}')">${escapeHtml(SITE_DATA.pages[id].nav)}</button>`)
    .join("");

  ["q0", "q1"].forEach((id) => {
    $("#" + id)?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") askFrom(id);
    });
  });

  // 支持通过 ?open=consulting 直接在 Agent 中打开对应画布
  const openParam = new URLSearchParams(location.search).get("open");
  if (openParam && SITE_DATA.pages[openParam]) {
    openPage(openParam);
  }
}

window.__agent = {
  openDrawer,
  closeDrawer,
  closeAllOverlays,
  openPage,
  closeCanvas,
  copyLink,
  copyWechat,
  toggleBrowse,
  backHome,
  talkPreset,
  askFrom,
  pickDrawer: (id) => {
    closeDrawer();
    talkPreset(id);
  },
};

init();
