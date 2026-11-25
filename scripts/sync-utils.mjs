const SHANGHAI_DATE_FORMAT = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function shanghaiDate(date = new Date()) {
  return SHANGHAI_DATE_FORMAT.format(date).replaceAll("/", ".");
}

export function mergePosts(existingPosts, incomingPosts) {
  const seen = new Set();

  return [...incomingPosts, ...existingPosts]
    .filter((post) => {
      const key = post.id || post.link || `${post.date}:${post.title}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => String(right.date).localeCompare(String(left.date)));
}

export function sameBusinessData(left, right) {
  const withoutCheckTimestamp = (value) => {
    const copy = structuredClone(value);
    delete copy.checkedAt;
    return copy;
  };

  return JSON.stringify(withoutCheckTimestamp(left))
    === JSON.stringify(withoutCheckTimestamp(right));
}

export function bilibiliFollowerValue(payload) {
  if (payload?.code !== 0 || !Number.isFinite(payload?.data?.follower)) {
    throw new Error(`Bilibili API ${payload?.code ?? "invalid response"}`);
  }

  return payload.data.follower.toLocaleString("en-US");
}
