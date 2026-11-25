import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  bilibiliFollowerValue,
  mergePosts,
  sameBusinessData,
  shanghaiDate,
} from "../scripts/sync-utils.mjs";

test("mergePosts deduplicates by link and sorts newest first", () => {
  const existingPosts = [
    {
      date: "2026.01.01",
      title: "旧文章",
      link: "https://example.com/old",
    },
  ];
  const incomingPosts = [
    {
      date: "2026.07.23",
      title: "新文章",
      link: "https://example.com/new",
    },
    {
      date: "2026.01.01",
      title: "更新后的旧文章",
      link: "https://example.com/old",
    },
  ];

  assert.deepEqual(
    mergePosts(existingPosts, incomingPosts).map((post) => post.title),
    ["新文章", "更新后的旧文章"],
  );
});

test("mergePosts keeps distinct cards that share a stable profile link", () => {
  const profileLink = "https://example.com/profile";
  const posts = [
    { id: "note-a", date: "2026.07", title: "A", link: profileLink },
    { id: "note-b", date: "2026.07", title: "B", link: profileLink },
  ];

  assert.equal(mergePosts(posts, []).length, 2);
});

test("sameBusinessData ignores check timestamps and compares content", () => {
  assert.equal(
    sameBusinessData(
      { value: "689", checkedAt: "2026.07.22" },
      { value: "689", checkedAt: "2026.07.23" },
    ),
    true,
  );
  assert.equal(
    sameBusinessData({ value: "689" }, { value: "690" }),
    false,
  );
});

test("shanghaiDate uses dotted date format", () => {
  assert.equal(
    shanghaiDate(new Date("2026-07-22T16:30:00Z")),
    "2026.07.23",
  );
});

test("bilibiliFollowerValue validates and formats API data", () => {
  assert.equal(
    bilibiliFollowerValue({ code: 0, data: { follower: 12345 } }),
    "12,345",
  );
  assert.throws(
    () => bilibiliFollowerValue({ code: -400, data: null }),
    /Bilibili API -400/,
  );
});

test("site defaults to paper theme and keeps dark theme", () => {
  const index = readFileSync("index.html", "utf8");
  const app = readFileSync("app.jsx", "utf8");
  const styles = readFileSync("styles.css", "utf8");

  assert.match(index, /dayan-theme/);
  assert.match(app, /ThemeToggle/);
  assert.match(styles, /#f4efe5/i);
  assert.match(styles, /data-theme="dark"/);
});

test("homepage removes stale realtime copy", () => {
  const app = readFileSync("app.jsx", "utf8");

  assert.doesNotMatch(app, /2026 \/ Q2|本周产出|最近在读|>\s*实时\s*</);
  assert.match(app, /最近核验/);
});

test("published data uses verified values and excludes dead note links", () => {
  const stats = JSON.parse(readFileSync("stats.json", "utf8"));
  const content = readFileSync("data/site-content.json", "utf8");

  assert.equal(stats.xiaohongshu.value, "2,981");
  assert.equal(stats.douyin.value, "53,000");
  assert.equal(stats.shipin.value, "6,218");
  assert.equal(stats.bilibili.value, "689");
  assert.doesNotMatch(content, /xiaohongshu\.com\/discovery\/item/);
});
