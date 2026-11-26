// 本地全栈开发服务器：静态页面 + /api/chat + /api/lead + 自动读取 .env
import { createServer } from "http";
import { readFileSync, existsSync, statSync } from "fs";
import { join, extname } from "path";
import chatHandler from "../api/chat.js";
import leadHandler from "../api/lead.js";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 3000);

// 加载本地 .env
const envPath = join(ROOT, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function enhanceRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  if (pathname === "/api/chat" || pathname === "/api/lead") {
    req.body = req.method === "POST" ? await readBody(req) : {};
    const handler = pathname === "/api/chat" ? chatHandler : leadHandler;
    await handler(req, enhanceRes(res));
    return;
  }

  let filePath = join(ROOT, pathname === "/" ? "index.html" : pathname);
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  } else if (!existsSync(filePath) && existsSync(filePath + ".html")) {
    filePath = filePath + ".html";
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.statusCode = 404;
    res.end("Not Found");
    return;
  }

  const ext = extname(filePath).toLowerCase();
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.end(readFileSync(filePath));
});

server.listen(PORT, () => {
  console.log(`liudayan.com local dev running at http://localhost:${PORT}`);
  console.log(`- /api/chat: ${process.env.DEEPSEEK_API_KEY ? "DeepSeek configured" : "local KB fallback"}`);
  console.log(`- /api/lead: ${process.env.FEISHU_BITABLE_APP_TOKEN ? "Feishu Bitable configured" : "Feishu env missing (see .env.example)"}`);
});
