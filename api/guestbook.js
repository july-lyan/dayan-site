// Vercel Serverless Function — GET+POST /api/guestbook
// GET  → { likes: number, messages: [...] }
// POST { action:"like" }                     → { likes: newCount }
// POST { action:"message", name, text }      → { ok: true }
// 依赖: SUPABASE_URL + SUPABASE_SERVICE_KEY 环境变量

import { createHmac } from "node:crypto";

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const FEISHU_WEBHOOK_URL = process.env.LIUDAYAN_GUESTBOOK_WEBHOOK_URL;
const FEISHU_WEBHOOK_SECRET = process.env.LIUDAYAN_GUESTBOOK_WEBHOOK_SECRET;

function sb(path, init = {}) {
  const { prefer, ...rest } = init;
  return fetch(`${SB_URL}/rest/v1${path}`, {
    ...rest,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
  });
}

function buildFeishuSign(timestamp, secret) {
  if (!secret) return undefined;
  return createHmac("sha256", `${timestamp}\n${secret}`).update("").digest("base64");
}

async function notifyGuestbookMessage({ name, message, createdAt }) {
  if (!FEISHU_WEBHOOK_URL) {
    return { ok: true, skipped: true };
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const response = await fetch(FEISHU_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timestamp,
      sign: buildFeishuSign(timestamp, FEISHU_WEBHOOK_SECRET),
      msg_type: "text",
      content: {
        text: [
          "liudayan.com 收到新留言",
          `时间: ${createdAt}`,
          `昵称: ${name}`,
          `内容: ${message}`,
        ].join("\n"),
      },
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    return { ok: false, status: response.status, error: responseText };
  }

  try {
    const payload = JSON.parse(responseText);
    if (typeof payload.code === "number" && payload.code !== 0) {
      return { ok: false, status: response.status, error: payload.msg || responseText };
    }
  } catch {
    if (responseText.trim()) {
      return { ok: false, status: response.status, error: responseText };
    }
  }

  return { ok: true, status: response.status };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const [lr, mr] = await Promise.all([
      sb("/likes?id=eq.1&select=count"),
      sb("/guestbook?select=id,name,message,created_at&order=created_at.desc&limit=20"),
    ]);
    const [lrow] = await lr.json();
    const msgs = await mr.json();
    return res.json({
      likes: lrow?.count ?? 0,
      messages: Array.isArray(msgs) ? msgs : [],
    });
  }

  if (req.method === "POST") {
    const body = req.body || {};

    if (body.action === "like") {
      const r = await sb("/rpc/increment_likes", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const count = await r.json();
      return res.json({ likes: typeof count === "number" ? count : 0 });
    }

    if (body.action === "message") {
      const name = String(body.name || "").trim().slice(0, 20) || "匿名访客";
      const message = String(body.text || "").trim().slice(0, 100);
      if (!message) return res.status(400).json({ error: "留言内容不能为空" });

      const createdAt = new Date().toISOString();
      const r = await sb("/guestbook", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ name, message }),
      });
      if (!r.ok) return res.status(500).json({ error: "写入失败，请稍后重试" });

      let notification = { ok: true };
      try {
        notification = await notifyGuestbookMessage({ name, message, createdAt });
      } catch (error) {
        notification = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }

      return res.json({ ok: true, notification });
    }

    return res.status(400).json({ error: "unknown action" });
  }

  res.status(405).end();
}
