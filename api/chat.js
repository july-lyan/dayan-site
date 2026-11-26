// Vercel Serverless Function — POST /api/chat
// 复用 assets/retrieval.js 共享召回引擎（口语归一化 + 近义词拓展 + 意图路由 + 分层加权 RAG）

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { normalizeQuery, matchIntent, retrieveChunks, buildCitations } from "../assets/retrieval.js";

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

// 未命中提问自动收集到飞书多维表格「未命中提问收集」表（静默容错，不阻塞或报错）
async function logMissedQuestion(rawQ, normQ) {
  const {
    FEISHU_APP_ID,
    FEISHU_APP_SECRET,
    FEISHU_BITABLE_APP_TOKEN,
    FEISHU_BITABLE_MISS_TABLE_ID,
  } = process.env;
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_BITABLE_APP_TOKEN || !FEISHU_BITABLE_MISS_TABLE_ID) {
    return false;
  }
  try {
    const authResp = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }),
      signal: AbortSignal.timeout(3000),
    });
    const authData = await authResp.json();
    if (authData.code !== 0 || !authData.tenant_access_token) return false;

    const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    const writeResp = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_BITABLE_APP_TOKEN}/tables/${FEISHU_BITABLE_MISS_TABLE_ID}/records`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${authData.tenant_access_token}`,
        },
        body: JSON.stringify({
          fields: {
            提问内容: rawQ.slice(0, 300),
            归一化后: normQ.slice(0, 300),
            提问时间: now,
            处理状态: "待补充",
          },
        }),
        signal: AbortSignal.timeout(3000),
      }
    );
    const wd = await writeResp.json();
    return writeResp.ok && wd.code === 0;
  } catch {
    return false;
  }
}

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

  // 第一层：口语归一化 + 高频核心意图精准路由
  const intent = matchIntent(q);
  if (intent) {
    res.status(200).json({
      reply: intent.reply,
      citations: intent.citations,
      source: "intent",
    });
    return;
  }

  // 第二层：近义词拓展 + 分层加权 RAG 检索
  const hits = retrieveChunks(q, loadChunks(), 4);
  const citations = buildCitations(hits);

  if (hits.length === 0) {
    const logged = await logMissedQuestion(q, normalizeQuery(q));
    res.status(200).json({
      reply: "这个问题我暂时还没整理进公开问答里，我已经顺手记下来了，后续会补充。你现在可以直接加微信 **DaYan__Liu** 或填预约表单，由我本人回复你。",
      citations: [{ id: "contact", title: "联系与约谈", slug: "/contact" }],
      source: "miss",
      logged,
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
