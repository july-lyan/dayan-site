// Vercel Serverless Function — POST /api/chat
// 知识库从 /knowledge/*.md 动态读取，更新文件即更新雁飞的知识。
// 部署时只需在 Vercel 环境变量里设置 ANTHROPIC_API_KEY。

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

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

// 启动时读一次，热重启时会重新加载
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
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: "api_key_not_configured" });
    return;
  }

  const { history = [], question = "", mode = "" } = req.body || {};
  if (!question.trim()) {
    res.status(400).json({ error: "empty_question" });
    return;
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (mode === "resume") {
      const resp = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: RESUME_SYSTEM,
        messages: [{ role: "user", content: String(question) }],
      });
      const reply = resp.content?.filter((b) => b.type === "text")?.map((b) => b.text)?.join("")?.trim() || "";
      res.status(200).json({ reply });
      return;
    }

    if (mode === "viral") {
      const resp = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 250,
        system: VIRAL_SYSTEM,
        messages: [{ role: "user", content: String(question) }],
      });
      const reply = resp.content?.filter((b) => b.type === "text")?.map((b) => b.text)?.join("")?.trim() || "";
      res.status(200).json({ reply });
      return;
    }

    const messages = [
      ...history
        .filter((m) => m && m.role && m.content)
        .slice(-8)
        .map((m) => ({ role: m.role, content: String(m.content) })),
      { role: "user", content: String(question) },
    ];

    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: [
        {
          type: "text",
          text: SYSTEM_KB,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    const reply =
      resp.content
        ?.filter((b) => b.type === "text")
        ?.map((b) => b.text)
        ?.join("\n")
        ?.trim() || "（暂时没想清楚怎么回答，可以微信直接问大雁。）";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("[chat] anthropic error", err);
    res.status(500).json({ error: "upstream_error", detail: String(err?.message || err) });
  }
}
