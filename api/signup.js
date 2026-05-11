export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, wechat, track, note } = req.body;
  if (!name || !wechat) {
    return res.status(400).json({ error: "姓名和微信号必填" });
  }

  const APP_ID = process.env.FEISHU_APP_ID;
  const APP_SECRET = process.env.FEISHU_APP_SECRET;
  const APP_TOKEN = process.env.FEISHU_SIGNUP_APP_TOKEN;
  const TABLE_ID = process.env.FEISHU_SIGNUP_TABLE_ID;

  // 获取飞书 token
  const tokenRes = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
    }
  );
  const { tenant_access_token } = await tokenRes.json();

  // 写入飞书多维表格
  const recordRes = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tenant_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          姓名: name,
          微信号: wechat,
          学习方向: track || "",
          备注: note || "",
          日期: Date.now(),
        },
      }),
    }
  );
  const result = await recordRes.json();

  if (result.code !== 0) {
    console.error("Feishu error:", result);
    return res.status(500).json({ error: "写入失败，请稍后重试" });
  }

  res.status(200).json({ ok: true });
}
