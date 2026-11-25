const SITE = process.env.SITE_URL || "https://www.liudayan.com";

const bannedPatterns = [
  /5\/17/i,
  /5 月 17/,
  /立即报名/,
  /报名 5\/17/,
  /#course/,
  /线下营/,
  /近期活动/,
  /2026 \/ Q2/,
  /本周产出/,
  /最近在读/,
  /hi@liudayan\.com/,
  /xiaohongshu\.com\/discovery\/item/,
];

async function readText(path) {
  const res = await fetch(`${SITE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.text();
}

async function readJson(path) {
  const res = await fetch(`${SITE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json();
}

function assertNoBannedText(label, text) {
  for (const pattern of bannedPatterns) {
    if (pattern.test(text)) {
      throw new Error(`${label} still contains banned pattern: ${pattern}`);
    }
  }
}

async function main() {
  const app = await readText("/app.jsx");
  assertNoBannedText("/app.jsx", app);
  const sections = await readText("/sections.jsx");
  assertNoBannedText("/sections.jsx", sections);
  const index = await readText("/");
  if (!index.includes("dayan-theme")) {
    throw new Error("theme bootstrap is missing");
  }

  const guestbook = await readJson("/api/guestbook");
  if ((guestbook.likes ?? 0) < 7) {
    throw new Error(`guestbook likes dropped below expected baseline: ${guestbook.likes}`);
  }
  if (!Array.isArray(guestbook.messages) || guestbook.messages.length < 1) {
    throw new Error("guestbook messages are missing");
  }

  const stats = await readJson("/stats.json");
  for (const key of ["douyin", "xiaohongshu", "shipin", "bilibili"]) {
    if (!stats[key]?.value) throw new Error(`stats.${key}.value is missing`);
  }
  const expectedStats = {
    douyin: "53,000",
    xiaohongshu: "2,981",
    shipin: "6,218",
    bilibili: "689",
  };
  for (const [key, expected] of Object.entries(expectedStats)) {
    if (stats[key].value !== expected) {
      throw new Error(`stats.${key}.value expected ${expected}, got ${stats[key].value}`);
    }
  }

  const content = await readJson("/data/site-content.json");
  const serializedContent = JSON.stringify(content);
  assertNoBannedText("/data/site-content.json", serializedContent);
  const latestWechatPost = content.posts?.find((post) => post.source === "wechat");
  if (!latestWechatPost?.link?.startsWith("https://mp.weixin.qq.com/")) {
    throw new Error("latest WeChat article is missing");
  }

  console.log(`live site ok: ${SITE}`);
  console.log(`guestbook: ${guestbook.likes} likes, ${guestbook.messages.length} messages`);
  console.log(`stats checkedAt: ${stats.checkedAt || "unknown"}`);
  console.log(`stats updatedAt: ${stats.updatedAt || "unknown"}`);
  console.log(`latest WeChat post: ${latestWechatPost.title}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
