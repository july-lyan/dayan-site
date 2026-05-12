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

const RESUME_SYSTEM = `你是一名资深 HR 顾问，专精中文简历优化，服务过阿里、腾讯、字节等大厂候选人。

## 任务
将用户提供的一段普通工作经历描述，改写成一句高质量的中文简历 bullet point。

## 改写框架
结构：【强动词】+【核心动作/方法】+【量化结果】
- 强动词：主导 / 推动 / 搭建 / 操盘 / 设计 / 落地 / 牵头 / 优化 / 孵化 / 负责
- 核心动作：提炼用户描述中最有价值的行为，删除模糊表达
- 量化结果：用户给出数字则保留；未给出则用方向性表达（提升 X% / 扩大 X 倍 / 降低成本 X%）
  - 禁止编造具体数字（如 50%、100万），只做方向性表达

## 格式要求
- 只输出改写后的一句话，≤60 字
- 不加引号、序号、换行或任何解释
- 语言简洁有力，体现候选人对业务的实质贡献`;

const VIRAL_SYSTEM = `你是一名小红书爆款内容顾问，深度研究过 10 万条爆款标题的传播规律。

## 任务
分析用户提供的小红书标题，给出结构化评估，并仿写 3 条更优标题。

## 评分维度（每项 0-20 分，满分 100）
1. 情绪共鸣：是否触发好奇、焦虑、羡慕、共鸣等强情绪
2. 数字冲击：是否包含具体数字，增强可信度和对比感
3. 悬念反差：是否制造意外感、反转或信息差
4. 痛点精准：是否直击目标读者的真实困境或欲望
5. 传播潜力：是否让人有转发冲动，受众是否足够宽泛

## 小红书标题规范
- 字数：≤20 字（中文字符计数，含标点）
- 要素：情绪 / 数字 / 悬念 / 反差，至少含一项
- 风格：口语化、有画面感、让人忍不住点进去
- 仿写标题必须严格控制在 20 字以内，不得超标

## 输出格式（严格按此格式，不输出任何额外内容）
爆款指数 XX 分
• 亮点：[15字内]
• 亮点：[15字内]
• 亮点：[15字内]
改进：[不超过25字的具体建议]
仿写1：[≤20字标题]
仿写2：[≤20字标题]
仿写3：[≤20字标题]`;

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
