// 白名单与动态发布同步脚本（npm run sync:kb）：
// 1. 从本地个人知识库白名单同步公开长文到 content/kb/synced/（仅进 RAG 知识库）
// 2. 扫描知识库中约定发布目录 published/*.md（仅同步 status: active 且非 "_" 开头的文件），
//    自动生成 content/dynamic-pages.json（同时生成独立页、目录入口与 RAG 知识库）

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "fs";
import { join, basename } from "path";

const ROOT = process.cwd();
const cfg = JSON.parse(readFileSync(join(ROOT, "content/kb-whitelist.json"), "utf-8"));
const syncedKbDir = join(ROOT, "content/kb/synced");
const publishedSrcDir = join(cfg.knowledgeRoot, "04-项目/02-历史项目/dayan-site/published");

// 1. 同步白名单公开长文
if (existsSync(syncedKbDir)) rmSync(syncedKbDir, { recursive: true, force: true });
mkdirSync(syncedKbDir, { recursive: true });

let kbCount = 0;
for (const item of cfg.items || []) {
  const srcPath = join(cfg.knowledgeRoot, item.source);
  if (!existsSync(srcPath)) {
    console.warn(`[sync:kb] skip missing: ${srcPath}`);
    continue;
  }
  const raw = readFileSync(srcPath, "utf-8");
  const body = raw.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
  const out = `---
pageId: ${item.pageId}
slug: ${item.slug}
title: ${item.title}
---

${body}
`;
  writeFileSync(join(syncedKbDir, item.outName), out, "utf-8");
  kbCount++;
}

// 2. 扫描约定发布目录 published/*.md 生成动态页面配置
function parseMarkdownDoc(raw) {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n*([\s\S]*)$/);
  const meta = {};
  let body = raw;
  if (fmMatch) {
    for (const line of fmMatch[1].split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf(":");
      if (idx > 0) meta[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
    }
    body = fmMatch[2].trim();
  }

  // 把 ## 二级标题与列表/段落自动转为页面 sections 结构
  const sections = [];
  const blocks = body.split(/\n(?=##\s+)/).map((s) => s.trim()).filter(Boolean);
  for (const blk of blocks) {
    const lines = blk.split("\n").map((l) => l.trim()).filter(Boolean);
    const heading = lines[0].replace(/^#+\s*/, "").trim();
    const rest = lines.slice(1);
    const bullets = rest.filter((l) => /^[-*•]\s+/.test(l)).map((l) => l.replace(/^[-*•]\s+/, ""));
    const paras = rest.filter((l) => !/^[-*•]\s+/.test(l));
    if (bullets.length > 0 && paras.length === 0) {
      sections.push({ type: "list", heading, items: bullets });
    } else if (bullets.length > 0) {
      sections.push({ type: "case", heading, bullets: [...paras, ...bullets] });
    } else if (paras.length > 0) {
      sections.push({ type: "note", heading, text: paras.join("\n") });
    }
  }
  return { meta, sections };
}

const dynamicPages = [];
if (existsSync(publishedSrcDir)) {
  const files = readdirSync(publishedSrcDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .sort();

  for (const f of files) {
    const raw = readFileSync(join(publishedSrcDir, f), "utf-8");
    const { meta, sections } = parseMarkdownDoc(raw);
    if ((meta.status || "").toLowerCase() !== "active") continue;

    const id = basename(f, ".md").replace(/[^a-zA-Z0-9_-]/g, "-");
    const slug = (meta.slug || `/events/${id}`).startsWith("/")
      ? meta.slug || `/events/${id}`
      : `/${meta.slug}`;

    dynamicPages.push({
      id,
      group: meta.group || "近期活动",
      nav: meta.nav || meta.title || id,
      slug,
      kicker: meta.kicker || meta.group || "近期活动",
      title: meta.title || meta.nav || id,
      summary: meta.summary || meta.lead || "",
      lead: meta.lead || meta.summary || "",
      presetReply: meta.presetReply || meta.lead || `可以点开下方卡片查看「${meta.title || id}」的完整介绍。`,
      pinOnHome: meta.pin_on_home === "true",
      sections,
    });
  }
}

writeFileSync(join(ROOT, "content/dynamic-pages.json"), JSON.stringify(dynamicPages, null, 2), "utf-8");
console.log(`Synced ${kbCount} whitelisted KB docs and ${dynamicPages.length} active published pages.`);
