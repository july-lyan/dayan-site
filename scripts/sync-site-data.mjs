import { readFileSync, writeFileSync } from "node:fs";

import {
  bilibiliFollowerValue,
  shanghaiDate,
} from "./sync-utils.mjs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function normalizeContent() {
  const path = "data/site-content.json";
  const data = readJson(path);
  const before = JSON.stringify({
    projects: data.projects || [],
    posts: data.posts || [],
  });

  data.projects = (data.projects || []).filter((p) => p && p.id && p.name);
  data.posts = (data.posts || [])
    .filter((p) => p && p.date && p.title)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const after = JSON.stringify({
    projects: data.projects,
    posts: data.posts,
  });
  if (before !== after) data.updatedAt = shanghaiDate();
  writeJson(path, data);
}

async function fetchBilibiliFollowers(mid) {
  const response = await fetch(
    `https://api.bilibili.com/x/relation/stat?vmid=${encodeURIComponent(mid)}`,
    {
      headers: {
        "user-agent": "Mozilla/5.0 dayan-site-sync/1.0",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Bilibili returned ${response.status}`);
  }
  return bilibiliFollowerValue(await response.json());
}

async function normalizeStats() {
  const path = "stats.json";
  const stats = readJson(path);
  const checkedAt = shanghaiDate();
  let businessChanged = false;
  let checkedAnySource = false;
  const envMap = {
    douyin: "DOUYIN_FOLLOWERS",
    xiaohongshu: "XHS_FOLLOWERS",
    shipin: "SHIPIN_FOLLOWERS",
  };

  for (const [key, envName] of Object.entries(envMap)) {
    const value = process.env[envName];
    if (!value || !stats[key]) continue;
    if (stats[key].value !== value) businessChanged = true;
    stats[key].value = value;
    stats[key].source = "manual-env";
    stats[key].verifiedAt = checkedAt;
    checkedAnySource = true;
  }

  try {
    const bilibiliValue = process.env.BILIBILI_FOLLOWERS
      || await fetchBilibiliFollowers(process.env.BILIBILI_MID || "613257828");
    if (stats.bilibili?.value !== bilibiliValue) businessChanged = true;
    stats.bilibili.value = bilibiliValue;
    stats.bilibili.source = process.env.BILIBILI_FOLLOWERS
      ? "manual-env"
      : "bilibili-api";
    stats.bilibili.verifiedAt = checkedAt;
    checkedAnySource = true;
    console.log(`bilibili followers verified: ${bilibiliValue}`);
  } catch (err) {
    console.warn(`bilibili sync skipped: ${err.message || err}`);
  }

  if (checkedAnySource) stats.checkedAt = checkedAt;
  if (businessChanged) stats.updatedAt = checkedAt;
  writeJson(path, stats);
}

async function main() {
  normalizeContent();
  await normalizeStats();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
