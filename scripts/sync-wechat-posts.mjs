import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { mergePosts, shanghaiDate } from "./sync-utils.mjs";

const TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token";
const PUBLISHED_URL = "https://api.weixin.qq.com/cgi-bin/freepublish/batchget";
const CONTENT_PATH = "data/site-content.json";
const SOURCES_PATH = "data/wechat-article-sources.json";

function loadDotEnv(path = ".env") {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(Number(timestamp) * 1000);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("/", ".");
}

function normalizeText(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFrom(article) {
  const digest = normalizeText(article.digest);
  if (digest) return digest.length > 86 ? `${digest.slice(0, 86)}...` : digest;
  const content = normalizeText(article.content);
  return content.length > 86 ? `${content.slice(0, 86)}...` : content;
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function inferCategory(article) {
  const text = `${article.title || ""} ${article.digest || ""}`;
  if (/自媒体|平台|流量|播放|公众号|小红书|视频号|B站|百家号/.test(text)) return "media";
  if (/一人公司|创业|土老板|交易|生意/.test(text)) return "solo";
  if (/产品|上线|复盘|OPC 周记|OPC周记/.test(text)) return "post";
  return "vibe";
}

async function readWechatJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (data.errcode) {
    throw new Error(`WeChat API ${data.errcode}: ${data.errmsg || "unknown error"}`);
  }
  return data;
}

async function fetchArticleSource(source) {
  const res = await fetch(source.url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`${source.url} returned ${res.status}`);
  const html = await res.text();
  const title = decodeHtml(html.match(/var msg_title = ['"]([^'"]+)['"]/)?.[1] || html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || "");
  const digest = decodeHtml(html.match(/var msg_desc = ['"]([^'"]*)['"]/)?.[1] || html.match(/<meta property="og:description" content="([^"]*)"/)?.[1] || "");
  const publishDate = html.match(/var ct = ['"]?(\d+)['"]?/)?.[1];
  if (!title) throw new Error(`Could not extract title from ${source.url}`);
  return {
    date: source.date || formatDate(publishDate),
    cat: source.cat || inferCategory({ title, digest }),
    title: normalizeText(title),
    excerpt: normalizeText(source.excerpt || digest),
    link: source.url,
    source: "wechat",
  };
}

async function getSourceArticles() {
  if (!existsSync(SOURCES_PATH)) return [];
  const sources = readJson(SOURCES_PATH).filter((source) => source?.url);
  const articles = [];
  for (const source of sources) {
    try {
      articles.push(await fetchArticleSource(source));
    } catch (err) {
      console.warn(`wechat source skipped: ${err.message || err}`);
    }
  }
  return articles;
}

async function getAccessToken(appid, secret) {
  const url = new URL(TOKEN_URL);
  url.searchParams.set("grant_type", "client_credential");
  url.searchParams.set("appid", appid);
  url.searchParams.set("secret", secret);
  const data = await readWechatJson(url);
  if (!data.access_token) throw new Error("WeChat API did not return access_token");
  return data.access_token;
}

async function getPublishedArticles(accessToken, limit) {
  const url = new URL(PUBLISHED_URL);
  url.searchParams.set("access_token", accessToken);
  const data = await readWechatJson(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ offset: 0, count: limit, no_content: 0 }),
  });

  const articles = [];
  for (const item of data.item || []) {
    const newsItems = item.content?.news_item || [];
    for (const article of newsItems) {
      if (!article.title || !article.url) continue;
      articles.push({
        date: formatDate(article.create_time || item.create_time || item.update_time),
        cat: inferCategory(article),
        title: normalizeText(article.title),
        excerpt: excerptFrom(article),
        link: article.url,
        source: "wechat",
      });
    }
  }
  return articles;
}

async function main() {
  loadDotEnv();
  const appid = process.env.WECHAT_MP_APPID;
  const secret = process.env.WECHAT_MP_APPSECRET;
  const limit = Number(process.env.WECHAT_MP_POST_LIMIT || 20);

  const content = readJson(CONTENT_PATH);
  const sourcePosts = await getSourceArticles();
  let apiPosts = [];

  if (appid && secret) {
    try {
      const token = await getAccessToken(appid, secret);
      apiPosts = await getPublishedArticles(token, limit);
    } catch (err) {
      console.warn(`wechat api skipped: ${err.message || err}`);
    }
  }

  const wechatPosts = mergePosts(sourcePosts, apiPosts);
  if (!wechatPosts.length) {
    console.warn("wechat posts synced: 0");
    return;
  }

  const nextPosts = mergePosts(content.posts || [], wechatPosts);
  const changed = JSON.stringify(nextPosts) !== JSON.stringify(content.posts || []);
  content.posts = nextPosts;
  content.checkedAt = shanghaiDate();
  if (changed) content.updatedAt = shanghaiDate();
  writeJson(CONTENT_PATH, content);
  console.log(`wechat posts synced: ${wechatPosts.length}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
