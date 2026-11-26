// 前后端共享的口语归一化 + 近义词拓展 + 意图路由 + 分层加权 RAG 检索引擎
// 同时被 /api/chat.js（Node/Vercel）与 /assets/agent.js（浏览器）复用，保证两端召回 100% 一致

const COLLOQUIAL_REPLACEMENTS = [
  [/干啥的|干嘛的|做什么的|谁呀|谁啊|啥来头/g, "你是谁"],
  [/干过|搞过|做过的|整过/g, "做过"],
  [/啥/g, "什么"],
  [/咋样|咋弄|咋搞|咋办|咋/g, "怎么"],
  [/1v1|1V1|一对一|1对1/g, "1 对 1"],
  [/贵不贵|咋算|怎么算|几块钱|啥价|费用多少/g, "怎么收费"],
  [/多久恢复/g, "多久回复"],
  [/帮我看看|给我讲讲|说说看/g, "介绍"],
];

// 领域近义词组：查询命中任一词，自动拓展同组核心业务词参与 RAG 检索
const SYNONYM_GROUPS = [
  ["出图", "生图", "做图", "商品图", "电商图", "美工", "跨境", "sku"],
  ["客服", "售后", "工单", "坐席", "外包", "机器人", "分流", "copilot"],
  ["培训", "内训", "上课", "讲课", "讲座", "工作坊", "课程", "夜校", "赋能"],
  ["陪跑", "带做", "辅导", "1 对 1", "小程序", "德语", "表情包"],
  ["收费", "报价", "价格", "费用", "预算", "多少钱"],
  ["亲子", "孩子", "带娃", "小朋友", "儿童", "一年级", "听写", "口算", "家长"],
  ["自媒体", "小红书", "抖音", "视频号", "公众号", "账号", "刘大雁ai版"],
  ["履历", "简历", "经历", "背景", "阿里", "天猫", "菜鸟", "支付宝", "小电", "iot", "学历", "毕业"],
  ["案例", "项目", "作品", "战绩", "交付", "成果"],
];

export function normalizeQuery(raw) {
  let q = String(raw || "").trim();
  for (const [pattern, rep] of COLLOQUIAL_REPLACEMENTS) {
    q = q.replace(pattern, rep);
  }
  return q;
}

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
    match: /(你做过什么|做过哪些|有哪些案例|代表作|项目经验|交付过|成功案例|有什么案例|有什么作品|战绩)/,
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
    match: /(多久回复|什么时候回|多快回复|响应时间|几天回)/,
    reply: "加微信 **DaYan__Liu**（备注公司与需求）或提交站内预约表单后，通常会在**工作日 24 小时内**由大雁本人查看并回复；如果有紧急排期，建议在备注里写明截止时间。",
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
    match: /(亲子|听写本|家长课堂|小朋友|儿童|一年级|给娃)/,
    reply: "亲子 AI 是我的实验副线，目前在做两件事：\n1. **小小听写本**：面向一年级上册的听写与口算练习工具，站内可直接打开试用或下载离线版。\n2. **社区家长 AI 课堂**：带家长和孩子用 AI 动手做出生活里的小工具，不制造焦虑。",
    citations: [{ id: "lab", title: "亲子探索", slug: "/lab" }],
  },
];

const STOP_WORDS = new Set([
  "怎么", "什么", "可以", "你们", "我们", "自己", "请问", "如何", "一下", "有没有",
  "是否", "这个", "那个", "这些", "那些", "一个", "了解", "关于", "老师", "大雁",
  "问题", "做过", "介绍", "东西", "事情", "这里", "那里", "觉得", "应该", "需要",
]);

function expandTokens(normalizedQuery) {
  const lower = normalizedQuery.toLowerCase();
  const clean = lower.replace(/[^\u4e00-\u9fa5a-z0-9]+/g, " ").trim();
  const base = new Set();
  for (const part of clean.split(/\s+/)) {
    if (!part) continue;
    if (/^[a-z0-9]+$/.test(part)) {
      if (part.length >= 2) base.add(part);
    } else {
      if (part.length >= 2 && part.length <= 4 && !STOP_WORDS.has(part)) base.add(part);
      for (let i = 0; i < part.length - 1; i++) {
        const bg = part.slice(i, i + 2);
        if (!STOP_WORDS.has(bg)) base.add(bg);
      }
    }
  }
  const expanded = new Set(base);
  for (const group of SYNONYM_GROUPS) {
    if (group.some((w) => lower.includes(w))) {
      for (const w of group) expanded.add(w);
    }
  }
  return { base: Array.from(base), all: Array.from(expanded) };
}

export function matchIntent(rawQuery) {
  const q = normalizeQuery(rawQuery);
  for (const route of INTENT_ROUTES) {
    if (route.match.test(q)) return route;
  }
  return null;
}

export function retrieveChunks(rawQuery, chunks, topK = 4) {
  const q = normalizeQuery(rawQuery);
  const { base, all } = expandTokens(q);
  if (!all.length || !chunks.length) return [];

  const baseSet = new Set(base);
  const scored = chunks
    .map((c) => {
      const titleHay = `${c.title} ${c.heading}`.toLowerCase();
      const bodyHay = String(c.text || "").toLowerCase();
      let rawScore = 0;
      let matchedBase = 0;
      for (const t of all) {
        const isBase = baseSet.has(t);
        const w = isBase ? 1.0 : 0.45; // 近义词给适度加权，避免喧宾夺主
        const inTitle = titleHay.includes(t);
        const inBody = bodyHay.includes(t);
        if (inTitle || inBody) {
          if (isBase) matchedBase += 1;
          rawScore += (inTitle ? 3.5 : 1.0) * w;
        }
      }
      if (rawScore === 0) return { chunk: c, score: 0 };
      const tierBoost = c.tier === "core" ? 1.8 : 1.0;
      const lenNorm = 1 / Math.log2(Math.max(8, bodyHay.length / 40));
      const coverage = base.length ? matchedBase / base.length : 0.5;
      const score = rawScore * tierBoost * (0.6 + coverage) * (0.7 + lenNorm);
      return { chunk: c, score };
    })
    .filter((x) => x.score >= 2.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((x) => x.chunk);
}

export function buildCitations(chunks) {
  const seen = new Set();
  const list = [];
  for (const c of chunks) {
    if (!c.pageId || seen.has(c.pageId)) continue;
    seen.add(c.pageId);
    list.push({ id: c.pageId, title: c.pageNav || c.title, slug: c.slug });
  }
  return list.slice(0, 3);
}
