// Vercel Serverless Function — POST /api/chat
// 知识库从 /knowledge/*.md 动态读取，更新文件即更新雁飞的知识。
// 部署时只需在 Vercel 环境变量里设置 DEEPSEEK_API_KEY。

import OpenAI from "openai";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const MODEL_FLASH = "deepseek-v4-flash";
const MODEL_PRO = "deepseek-v4-pro";

const KB_PROMPT_PREFIX = `你是大雁个人网站上的 AI 助手「雁飞」。根据以下知识库回答访客的问题。

回答规范：
- 语气友好、专业，不卖弄
- 使用第三人称指代大雁（"她" / "大雁"）
- 2-4 句话简短回复，不啰嗦
- 如问题超出知识库范围，诚实说"这部分大雁还没公开过，可以微信直接问她（DaYan__Liu）"
- 不编造数据、价格、链接或承诺

--- 知识库开始 ---

`;

const KB_PROMPT_SUFFIX = `
--- 知识库结束 ---`;

function loadKnowledge() {
  const dir = join(process.cwd(), "knowledge");
  if (!existsSync(dir)) return KB_PROMPT_PREFIX + "（知识库暂未配置）" + KB_PROMPT_SUFFIX;
  try {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort();
    const content = files
      .map((f) => readFileSync(join(dir, f), "utf-8"))
      .join("\n\n");
    return KB_PROMPT_PREFIX + content + KB_PROMPT_SUFFIX;
  } catch {
    return KB_PROMPT_PREFIX + "（知识库读取失败）" + KB_PROMPT_SUFFIX;
  }
}

const SYSTEM_KB = loadKnowledge();

const RESUME_SYSTEM = `你是一个专业的简历优化专家。用户给你一句普通的工作经历描述，将它改写成一句强力的中文简历 bullet point。

规则：
- 以动词开头（主导/推动/搭建/优化/操盘/负责等）
- 结尾加量化结果；用户若未提供数字，用"提升 X%"等合理方向性表达
- 不超过 60 字
- 只输出改写后的一句话，不要解释、不要引号、不要换行`;

const VIRAL_SYSTEM = `你是一个小红书爆款内容分析专家。用户给你一条小红书标题或文案，分析其爆款潜力。

严格按以下格式输出，不要多余文字：
爆款指数 XX 分
• 亮点：内容（15字内）
• 亮点：内容（15字内）
• 亮点：内容（15字内）
改进：建议内容（25字内）

评分标准：情绪共鸣+数字+悬念+痛点+稀缺感各20分，客观打分，不要虚高。`;

export default async function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      configured: Boolean(process.env.DEEPSEEK_API_KEY),
      provider: "deepseek",
      model: MODEL_FLASH,
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    res.status(503).json({ error: "api_key_not_configured" });
    return;
  }

  const { history = [], question = "", mode = "" } = req.body || {};
  if (!question.trim()) {
    res.status(400).json({ error: "empty_question" });
    return;
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });

    if (mode === "resume") {
      const resp = await client.chat.completions.create({
        model: MODEL_PRO,
        max_tokens: 200,
        messages: [
          { role: "system", content: RESUME_SYSTEM },
          { role: "user", content: String(question) },
        ],
      });
      const reply = resp.choices?.[0]?.message?.content?.trim() || "";
      res.status(200).json({ reply, source: "model", provider: "deepseek", model: MODEL_PRO });
      return;
    }

    if (mode === "viral") {
      const resp = await client.chat.completions.create({
        model: MODEL_PRO,
        max_tokens: 250,
        messages: [
          { role: "system", content: VIRAL_SYSTEM },
          { role: "user", content: String(question) },
        ],
      });
      const reply = resp.choices?.[0]?.message?.content?.trim() || "";
      res.status(200).json({ reply, source: "model", provider: "deepseek", model: MODEL_PRO });
      return;
    }

    const messages = [
      { role: "system", content: SYSTEM_KB },
      ...history
        .filter((m) => m && m.role && m.content)
        .slice(-8)
        .map((m) => ({ role: m.role === "bot" ? "assistant" : m.role, content: String(m.content) })),
      { role: "user", content: String(question) },
    ];

    const resp = await client.chat.completions.create({
      model: MODEL_FLASH,
      max_tokens: 500,
      messages,
    });

    const reply = resp.choices?.[0]?.message?.content?.trim()
      || "（暂时没想清楚怎么回答，可以微信直接问大雁。）";

    res.status(200).json({ reply, source: "model", provider: "deepseek", model: MODEL_FLASH });
  } catch (err) {
    console.error("[chat] deepseek error", err);
    res.status(500).json({ error: "upstream_error", detail: String(err?.message || err) });
  }
}
