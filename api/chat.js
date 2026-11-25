// Vercel Serverless Function — POST /api/chat
// 架构：知识库片段检索（RAG）+ DeepSeek 严格忠实回答 + 来源页面引用（零外部依赖，原生 fetch）
// 环境变量：DEEPSEEK_API_KEY（与旧版保持一致）

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

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

const STOP_WORDS = new Set(["怎么", "什么", "可以", "你们", "请问", "如何", "一下", "有没有", "是否", "这个", "那个", "了解", "关于", "老师", "大雁"]);

// 轻量中英文分词 + 双字切分，过滤高频虚词
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
      if (part.length <= 4 && !STOP_WORDS.has(part)) tokens.add(part);
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
      const hay = `${c.title} ${c.heading} ${c.text}`.toLowerCase();
      let score = 0;
      for (const t of qTokens) {
        if (hay.includes(t)) {
          score += c.title.toLowerCase().includes(t) || c.heading.toLowerCase().includes(t) ? 3 : 1;
        }
      }
      return { chunk: c, score };
    })
    .filter((x) => x.score >= 2)
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

  const hits = retrieve(q, 4);
  const citations = buildCitations(hits);

  // 未命中任何知识库片段：直接诚实兜底，避免幻觉
  if (hits.length === 0) {
    res.status(200).json({
      reply: "这个问题我的公开知识库里还没有覆盖到（为了保证准确，我不做猜测回答）。建议直接加微信 **DaYan__Liu** 或填写预约表单，把你的具体场景发给大雁本人回复。",
      citations: [{ id: "contact", title: "联系与约谈", slug: "/contact" }],
      source: "miss",
    });
    return;
  }

  // 若未配置 DEEPSEEK_API_KEY（例如本地静态开发时），优雅降级返回最相关知识库片段
  if (!process.env.DEEPSEEK_API_KEY) {
    const top = hits[0];
    res.status(200).json({
      reply: `${top.text.slice(0, 220)}${top.text.length > 220 ? "…" : ""}`,
      citations,
      source: "kb-local",
    });
    return;
  }

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
    // 上游异常时降级到命中片段，不让页面报错崩溃
    const top = hits[0];
    res.status(200).json({
      reply: `${top.text.slice(0, 220)}${top.text.length > 220 ? "…" : ""}`,
      citations,
      source: "kb-fallback",
    });
  }
}
