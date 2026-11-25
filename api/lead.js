// Vercel Serverless Function — POST /api/lead
// 站内原生预约表单 → 写入飞书多维表格（Bitable）
// 所需 Vercel 环境变量：
//   FEISHU_APP_ID
//   FEISHU_APP_SECRET
//   FEISHU_BITABLE_APP_TOKEN
//   FEISHU_BITABLE_TABLE_ID

async function getTenantAccessToken(appId, appSecret) {
  const resp = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const data = await resp.json();
  if (!resp.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`feishu_auth_failed: ${data.msg || resp.status}`);
  }
  return data.tenant_access_token;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const ready = Boolean(
      process.env.FEISHU_APP_ID &&
      process.env.FEISHU_APP_SECRET &&
      process.env.FEISHU_BITABLE_APP_TOKEN &&
      process.env.FEISHU_BITABLE_TABLE_ID
    );
    res.status(200).json({ ok: true, configured: ready, target: "feishu-bitable" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = req.body || {};
  // 蜜罐反垃圾字段
  if (body.website) {
    res.status(200).json({ ok: true });
    return;
  }

  const name = String(body.name || "").trim().slice(0, 60);
  const org = String(body.org || "").trim().slice(0, 100);
  const topic = String(body.topic || "企业 AI 前期咨询").trim().slice(0, 60);
  const contact = String(body.contact || "").trim().slice(0, 100);
  const message = String(body.message || "").trim().slice(0, 1000);
  const sourcePath = String(body.sourcePath || "/contact").trim().slice(0, 120);

  if (!name || !contact || !message) {
    res.status(400).json({ error: "missing_required_fields", message: "请填写称呼、联系方式和简短背景" });
    return;
  }

  const {
    FEISHU_APP_ID,
    FEISHU_APP_SECRET,
    FEISHU_BITABLE_APP_TOKEN,
    FEISHU_BITABLE_TABLE_ID,
  } = process.env;

  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_BITABLE_APP_TOKEN || !FEISHU_BITABLE_TABLE_ID) {
    res.status(503).json({
      error: "feishu_not_configured",
      message: "预约表单后端尚未配置飞书多维表格凭证，请先直接加微信 DaYan__Liu 联系。",
    });
    return;
  }

  try {
    const token = await getTenantAccessToken(FEISHU_APP_ID, FEISHU_APP_SECRET);
    const submittedAt = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

    // 多维表格字段名约定（在飞书多维表格里建同名文本列即可）
    const fields = {
      称呼: name,
      公司或机构: org || "未填写",
      咨询方向: topic,
      联系方式: contact,
      需求背景: message,
      来源页面: sourcePath,
      提交时间: submittedAt,
    };

    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_BITABLE_APP_TOKEN}/tables/${FEISHU_BITABLE_TABLE_ID}/records`;
    const writeResp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fields }),
    });

    const writeData = await writeResp.json();
    if (!writeResp.ok || writeData.code !== 0) {
      throw new Error(`feishu_write_failed: ${writeData.msg || writeResp.status}`);
    }

    res.status(200).json({ ok: true, recordId: writeData.data?.record?.record_id || "" });
  } catch (err) {
    console.error("[api/lead] error:", err);
    res.status(502).json({
      error: "upstream_feishu_error",
      message: "提交暂时遇到网络波动，请直接加微信 DaYan__Liu 联系。",
    });
  }
}
