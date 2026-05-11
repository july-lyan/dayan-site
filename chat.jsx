// chat.jsx — AI 助手「雁飞」
// 替换原 window.claude.complete (Claude Design sandbox-only) 为真实 /api/chat 调用。
// 若 API 未配置，使用 canned 兜底，保证页面体验完整。

const SUGGESTIONS = [
  "什么是 vibecoding？",
  "5/17 工作坊讲什么？",
  "零代码也能上手吗？",
  "为什么从大厂出来？",
  "怎么开始学 vibecoding？",
];

const INITIAL_MSGS = [
  {
    role: "bot",
    text: "嗨，我是雁飞，大雁站点的 AI 接待。问我任何关于 vibecoding、项目、或者 5/17 杭州工作坊的事。",
  },
];

// 兜底回复——/api/chat 不可用时使用
const FALLBACK_ANSWERS = {
  vibe: "vibecoding = 自然语言 + AI 编排开发，把想法到上线压到天级。不是无脑 prompt，而是产品 sense × AI 编排 × 快速迭代。",
  why: "在大厂做了 15 年别人想做的事（10y 阿里运营 + 5y 小电高级 PM），现在想做点自己想做的。AI 时代单兵作战的窗口期。",
  course: "5/17 周日下午 13:30-17:00 杭州工作坊，¥149，10 席。3.5 小时用 CodeBuddy + EdgeOne 现场做出你的第一个网站，三赛道任选（个人主页/小工具/小游戏），课后 7 天答疑。",
  zero: "零代码基础也能上手——工作坊用 CodeBuddy + EdgeOne，AI 帮你写代码、自动部署。3.5 小时离场就能带走一个能发朋友圈的网站链接。",
  start: "三步：(1) 来 5/17 杭州工作坊（最快路径）(2) 看大雁的 vibecoding 28 天录播课 (3) 跟着她每日内容抄作业。",
  default: "这部分大雁还没写过公开内容，可以微信直接问她（DaYan__Liu，注意双下划线）。",
};

function pickFallback(q) {
  const s = q.toLowerCase();
  if (s.includes("零代码") || s.includes("基础") || s.includes("不会写代码") || s.includes("新手")) return FALLBACK_ANSWERS.zero;
  if (s.includes("5/17") || s.includes("517") || s.includes("工作坊") || s.includes("营") || s.includes("名额") || s.includes("报名")) return FALLBACK_ANSWERS.course;
  if (s.includes("大厂") || s.includes("出来") || s.includes("阿里") || s.includes("小电")) return FALLBACK_ANSWERS.why;
  if (s.includes("vibecoding") || s.includes("是什么")) return FALLBACK_ANSWERS.vibe;
  if (s.includes("学") || s.includes("入门") || s.includes("怎么开始")) return FALLBACK_ANSWERS.start;
  return FALLBACK_ANSWERS.default;
}

function Chat() {
  const [msgs, setMsgs] = React.useState(INITIAL_MSGS);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const bodyRef = React.useRef(null);

  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, loading]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: msgs.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
          })),
          question: q,
        }),
      });
      if (!resp.ok) throw new Error(`api ${resp.status}`);
      const data = await resp.json();
      const reply = (data && data.reply) ? data.reply : pickFallback(q);
      setMsgs((m) => [...m, { role: "bot", text: reply.trim() }]);
    } catch (err) {
      // canned fallback — 保证 demo 体验完整
      setMsgs((m) => [...m, { role: "bot", text: pickFallback(q) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat" data-comment-anchor="chat-module">
      <div className="chat-head">
        <span className="title">
          <span className="dot"></span>
          ASSISTANT · 雁飞
        </span>
        <span>haiku-4.5 · rag</span>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <div className="who">{m.role === "user" ? "访客" : "雁飞"}</div>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="chat-msg bot">
            <div className="who">雁飞</div>
            <span className="typing">
              <span></span><span></span><span></span>
            </span>
          </div>
        )}
      </div>
      <div className="chat-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chat-sug" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="chat-input-wrap">
        <input
          className="chat-input"
          placeholder="问点什么…  例如：你们怎么做小红书矩阵？"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={loading}
        />
        <button
          className="chat-send"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          {loading ? "…" : "发送 ↵"}
        </button>
      </div>
    </div>
  );
}
