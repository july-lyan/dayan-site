// 白名单安全同步脚本：从本地个人知识库 /Users/july/knowledge/ 只同步白名单中的公开文章到 content/kb/synced/
// 严守隐私与商业边界：不扫全库、不同步未授权客户原件、个人隐私或内部台账。

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const cfg = JSON.parse(readFileSync(join(ROOT, "content/kb-whitelist.json"), "utf-8"));
const outDir = join(ROOT, "content/kb/synced");

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let count = 0;
for (const item of cfg.items || []) {
  const srcPath = join(cfg.knowledgeRoot, item.source);
  if (!existsSync(srcPath)) {
    console.warn(`[sync:kb] skip missing: ${srcPath}`);
    continue;
  }
  const raw = readFileSync(srcPath, "utf-8");
  // 剥离原始内部 frontmatter，仅保留正文并写入标准公开元信息
  const body = raw.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
  const out = `---
pageId: ${item.pageId}
slug: ${item.slug}
title: ${item.title}
---

${body}
`;
  writeFileSync(join(outDir, item.outName), out, "utf-8");
  count++;
}

console.log(`Synced ${count} whitelisted public KB docs into content/kb/synced/.`);
