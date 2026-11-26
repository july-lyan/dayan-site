// Vercel Serverless Function — POST /api/chat
// 三层精准召回架构：
//   1. 高频核心意图精准路由（你是谁 / 做过什么 / 收费 / 联系 / 自媒体 / 亲子等，100% 准确秒回）
//   2. 升级版 RAG 片段检索（停用词过滤 + core/article 分层权重 + 长度归一化）
//   3. DeepSeek 严格忠实总结（无余额/异常时优雅降级返回高相关知识块，永不胡说）

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

// 第一层：高频核心意图精准路由（解决「你是谁」「介绍下你自己」「你做过什么」等口语短问句）
const INTENT_ROUTES = [
  {
    match: /^(你好|hi|hello|哈喽|嗨|在吗)[!！。.？?]*$/i,
    reply: "你好，我是**刘大雁**（雁洄文化科技主理人），15 年产品与运营实战背景，现在专注企业 AI 落地咨询、实战培训与 1 对 1 项目陪跑。你想了解咨询、案例、培训还是我的履历，直接问我就行。",
    citations: [
      { id: "about", title: "关于大雁 · 15 年履历", slug: "/about" },
      { id: "consulting", title: "企业 AI 前期咨询", slug: "/consulting" },
    ],
  },
  {
    match: /(你是谁|介绍.*自己|自我介绍|你叫什么|认识.*你|你的背景|你的履历|简历|个人介绍|介绍一下)/,
    reply: "我是**刘大雁**（刘艳），杭州雁洄文化科技主理人，**15 年产品与运营实战经验**（阿里巴巴 2010–2020 历经天猫国际、菜鸟、支付宝；小电 2021–2025 任资深产品经理，主导多 Agent 智能客服与 IoT 平台）。现在专注帮企业想清楚 AI 能在哪落地，做企业 AI 前期咨询、实战培训和 1 对 1 项目陪跑。",
    citations: [
      { id: "about", title: "关于大雁 · 15 年履历", slug: "/about" },
      { id: "consulting", title: "企业 AI 前期咨询", slug: "/consulting" },
    ],
  },
  {
    match: /(你做过什么|做过哪些|有哪些案例|代表作|项目经验|交付过|成功案例|做过啥)/,
    reply: "代表交付主要分三块：\n1. **FDE 企业 AI 落地（匿名）**：跨境电商 AI 出图流程诊断（深测 412 张图，给出 Conditional Go 与飞书工作台方案）；大型消费服务企业多 Agent 智能客服（转人工准确率 95%，一期上线外包成本降约 50%）。\n2. **AI 工具赋能培训**：杭州青年夜校小程序开发系列课、OPC 学院 AI 工具入门与创作营。\n3. **1 对 1 项目陪跑与探索**：德语学习小程序、AI 表情包小程序，以及亲子方向的小小听写本与社区家长课堂。",
    citations: [
      { id: "fde", title: "FDE 企业 AI 落地案例", slug: "/cases/fde" },
      { id: "ai-enablement", title: "AI 工具赋能（培训产品）", slug: "/products/ai-enablement" },
      { id: "coaching", title: "1 对 1 项目陪跑", slug: "/products/coaching" },
    ],
  },
  {
    match: /(能做什么|提供什么服务|有哪些服务|业务范围|怎么合作|可以帮.*什么)/,
    reply: "目前核心承接三类合作：\n1. **企业 AI 前期咨询（主航道）**：需求诊断、场景梳理，设计并验收第一个可落地的 AI 试点。\n2. **AI 工具赋能（培训 / 内训）**：覆盖办公提效、内容设计、AI 编程、智能体工作流、亲子创作 5 个方向，按团队定制。\n3. **1 对 1 项目陪跑**：带着你把具体的小程序或工具想法从 0 到 1 做出来并完成验收。",
    citations: [
      { id: "consulting", title: "企业 AI 前期咨询", slug: "/consulting" },
      { id: "ai-enablement", title: "AI 工具赋能（培训产品）", slug: "/products/ai-enablement" },
      { id: "coaching", title: "1 对 1 项目陪跑", slug: "/products/coaching" },
    ],
  },
  {
    match: /(自媒体|小红书|抖音|视频号|公众号|在哪.*看.*内容|关注你)/,
    reply: "有的，**小红书、抖音、视频号**全网同名 **「刘大雁AI版」**，直接搜索就能找到我，主要分享企业 AI 落地复盘、Vibe Coding 产品实战与工作方式记录。",
    citations: [{ id: "contact", title: "联系与约谈", slug: "/contact" }],
  },
  {
    match: /(怎么联系|微信号|加微信|邮箱|预约|找你聊)/,
    reply: "加微信 **DaYan__Liu**（中间是双下划线）最快，备注「公司 / 机构 + 想解决的问题」；也可以直接填写站内预约表单，或发邮件到 **hi@liudayan.com**。",
    citations: [{ id: "contact", title: "联系与约谈", slug: "/contact" }],
  },
  {
    match: /^(怎么收费|多少钱|报价|收费标准|价格)[？?！!。.]*$/,
    reply: "企业 AI 前期咨询、AI 工具赋能培训/内训、1 对 1 项目陪跑均采用**「按具体场景评估，不公开标价」**的方式——综合看业务复杂度、课时天数与定制深度。加微信 **DaYan__Liu** 或填预约表单发一句你的场景，我会直接给评估。",
    citations: [
      { id: "contact", title: "联系与约谈", slug: "/contact" },
      { id: "consulting", title: "企业 AI 前期咨询", slug: "/consulting" },
    ],
  },
  {
    match: /(亲子|听写本|家长课堂|小朋友|儿童|一年级)/,
    reply: "亲子 AI 是我的实验副线，目前在做两件事：\n1. **小小听写本**：面向一年级上册的听写与口算练习工具，站内可直接打开试用或下载离线版。\n2. **社区家长 AI 课堂**：带家长和孩子用 AI 动手做出生活里的小工具，不制造焦虑。",
    citations: [{ id: "lab", title: "亲子探索", slug: "/lab" }],
  },
];

let cachedChunks = null;
function loadChunks() {
  if (cachedChunks) return cachedChunks;
  const p = join(process.cwd(), "data", "kb-chunks.json");
  if (!existsSync(p)) return [];
  try {
    cachedChunks = JSON.parse(readFileSync(p, "utf-8"));
    return cachedChunks;
  } catch {
    return [];
  }
}

const STOP_WORDS = new Set([
  "怎么", "什么", "可以", "你们", "我们", "自己", "请问", "如何", "一下", "有没有",
  "是否", "这个", "那个", "这些", "那些", "一个", "了解", "关于", "老师", "大雁",
  "问题", "做过", "介绍", "东西", "事情", "这里", "那里", "觉得", "应该", "需要",
]);

function tokenize(text) {
  const clean = String(text || "")
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, " ")
    .trim();
  const tokens = new Set();
  for (const part of clean.split(/\s+/)) {
    if (!part) continue;
    if (/^[a-z0-9]+$/.test(part)) {
      if (part.length >= 2) tokens.add(part);
    } else {
      if (part.length >= 2 && part.length <= 4 && !STOP_WORDS.has(part)) tokens.add(part);
      for (let i = 0; i < part.length - 1; i++) {
        const bg = part.slice(i, i + 2);
        if (!STOP_WORDS.has(bg)) tokens.add(bg);
      }
    }
  }
  return Array.from(tokens);
}

function retrieve(query, topK = 4) {
  const chunks = loadChunks();
  const qTokens = tokenize(query);
  if (!qTokens.length || !chunks.length) return [];

  const scored = chunks
    .map((c) => {
      const titleHay = `${c.title} ${c.heading}`.toLowerCase();
      const bodyHay = String(c.text || "").toLowerCase();
      let rawScore = 0;
      let matchedTokens = 0;
      for (const t of qTokens) {
        const inTitle = titleHay.includes(t);
        const inBody = bodyHay.includes(t);
        if (inTitle || inBody) {
          matchedTokens += 1;
          rawScore += inTitle ? 3.5 : 1;
        }
      }
      if (rawScore === 0) return { chunk: c, score: 0 };
      // 核心站内文档权重高于长文，且对过长文章做轻微长度衰减，避免长文靠字数抢召回
      const tierBoost = c.tier === "core" ? 1.8 : 1.0;
      const lenNorm = 1 / Math.log2(Math.max(8, bodyHay.length / 40));
      const coverage = matchedTokens / qTokens.length;
      const score = rawScore * tierBoost * (0.6 + coverage) * (0.7 + lenNorm);
      return { chunk: c, score, matchedTokens };
    })
    .filter((x) => x.score >= 2.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((x) => x.chunk);
}

function buildCitations(chunks) {
  const seen = new Set();
  const list = [];
  for (const c of chunks) {
    if (!c.pageId || seen.has(c.pageId)) continue;
    seen.add(c.pageId);
    list.push({ id: c.pageId, title: c.pageNav || c.title, slug: c.slug });
  }
  return list.slice(0, 3);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const chunks = loadChunks();
    res.status(200).json({
      ok: true,
      configured: Boolean(process.env.DEEPSEEK_API_KEY),
      model: MODEL,
      chunks: chunks.length,
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { question = "", history = [] } = req.body || {};
  const q = String(question || "").trim();
  if (!q) {
    res.status(400).json({ error: "empty_question" });
    return;
  }

  // 第一层：高频核心意图精准路由
  for (const route of INTENT_ROUTES) {
    if (route.match.test(q)) {
      res.status(200).json({
        reply: route.reply,
        citations: route.citations,
        source: "intent",
      });
      return;
    }
  }

  // 第二层：分层加权 RAG 检索
  const hits = retrieve(q, 4);
  const citations = buildCitations(hits);

  if (hits.length === 0) {
    res.status(200).json({
      reply: "这个问题我的公开知识库里还没有覆盖到（为了保证准确，我不做猜测回答）。建议直接加微信 **DaYan__Liu** 或填写预约表单，把你的具体场景发给大雁本人回复。",
      citations: [{ id: "contact", title: "联系与约谈", slug: "/contact" }],
      source: "miss",
    });
    return;
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    const top = hits[0];
    res.status(200).json({
      reply: `${top.text.slice(0, 260)}${top.text.length > 260 ? "…" : ""}`,
      citations,
      source: "kb-local",
    });
    return;
  }

  // 第三层：DeepSeek 忠实回答
  const contextBlock = hits
    .map((h, i) => `[片段${i + 1} | 来源：${h.title} (${h.slug})]\n${h.text}`)
    .join("\n\n");

  const systemPrompt = `你是刘大雁个人网站（liudayan.com）的个人 Agent。请严格依据下面检索到的知识库片段回答访客问题。

规则：
1. 语气专业、克制、真诚、自然，像本人直接交流，不喊口号，不堆形容词。
2. 回答控制在 2-4 句话，重点清晰；可使用 **加粗** 突出关键信息。
3. 严禁编造报价数字、客户真实名称、未上线的承诺或知识库里没有的数据。
4. 涉及报价时明确说明「按具体场景评估，不公开标价」。
5. 如果检索片段不足以回答访客的具体问题，坦诚说明未覆盖，并引导对方加微信 DaYan__Liu 或填写站内预约表单。

--- 检索到的知识库片段 ---
${contextBlock}
--- 片段结束 ---`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history
        .filter((m) => m && m.role && m.content)
        .slice(-6)
        .map((m) => ({
          role: m.role === "assistant" || m.role === "bot" ? "assistant" : "user",
          content: String(m.content),
        })),
      { role: "user", content: q },
    ];

    const apiResp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 450,
        temperature: 0.3,
        messages,
      }),
    });

    if (!apiResp.ok) {
      throw new Error(`deepseek_http_${apiResp.status}`);
    }
    const resp = await apiResp.json();
    const choice = resp.choices?.[0]?.message;
    const reply = (choice?.content || choice?.reasoning_content || "").trim()
      || "这个问题建议直接加微信 **DaYan__Liu** 和大雁本人沟通。";

    res.status(200).json({ reply, citations, source: "rag", model: MODEL });
  } catch (err) {
    console.error("[api/chat] deepseek error:", err);
    const top = hits[0];
    res.status(200).json({
      reply: `${top.text.slice(0, 260)}${top.text.length > 260 ? "…" : ""}`,
      citations,
      source: "kb-fallback",
    });
  }
}
