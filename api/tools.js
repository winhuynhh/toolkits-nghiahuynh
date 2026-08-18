const { Redis } = require("@upstash/redis");

// Supports both naming conventions:
// - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (manual Upstash setup)
// - KV_REST_API_URL / KV_REST_API_TOKEN (Vercel Storage / Marketplace integration)
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis =
  REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const KEY = "toolkit:tools";

module.exports = async (req, res) => {
  if (!redis) {
    return res.status(500).json({
      error:
        "Thiếu cấu hình Redis. Cần set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, hoặc KV_REST_API_URL + KV_REST_API_TOKEN trong Environment Variables.",
    });
  }

  try {
    if (req.method === "GET") {
      const all = await redis.hgetall(KEY);
      const tools = all
        ? Object.entries(all).map(([id, value]) => ({ id, ...safeParse(value) }))
        : [];
      tools.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      return res.status(200).json({ tools });
    }

    if (req.method === "POST") {
      const body = await readBody(req);

      // Password-only check used to unlock edit mode on the client — no data touched.
      if (body && body.action === "verify") {
        if (!checkPassword(body.password)) {
          return res.status(401).json({ error: "Sai mật khẩu" });
        }
        return res.status(200).json({ ok: true });
      }

      const { name, url, icon, description, category, password } = body || {};

      if (!checkPassword(password)) {
        return res.status(401).json({ error: "Sai mật khẩu" });
      }
      if (!name || !url) {
        return res.status(400).json({ error: "Thiếu tên hoặc link" });
      }
      if (!/^https?:\/\//i.test(url)) {
        return res.status(400).json({ error: "Link phải bắt đầu bằng http:// hoặc https://" });
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const tool = {
        name: String(name).slice(0, 80),
        url: String(url).slice(0, 500),
        icon: String(icon || autoIcon(name)).slice(0, 300),
        description: String(description || "").slice(0, 200),
        category: String(category || "Khác").slice(0, 40),
        createdAt: Date.now(),
      };

      await redis.hset(KEY, { [id]: JSON.stringify(tool) });
      return res.status(201).json({ tool: { id, ...tool } });
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      const { id, name, url, icon, description, category, password } = body || {};

      if (!checkPassword(password)) {
        return res.status(401).json({ error: "Sai mật khẩu" });
      }
      if (!id) {
        return res.status(400).json({ error: "Thiếu id" });
      }

      const existingRaw = await redis.hget(KEY, id);
      if (!existingRaw) {
        return res.status(404).json({ error: "Không tìm thấy tool" });
      }
      const existing = safeParse(existingRaw);

      if (url !== undefined && url !== "" && !/^https?:\/\//i.test(url)) {
        return res.status(400).json({ error: "Link phải bắt đầu bằng http:// hoặc https://" });
      }
      if ((name !== undefined && !name) || (url !== undefined && !url)) {
        return res.status(400).json({ error: "Thiếu tên hoặc link" });
      }

      const updated = {
        ...existing,
        name: name !== undefined ? String(name).slice(0, 80) : existing.name,
        url: url !== undefined ? String(url).slice(0, 500) : existing.url,
        icon:
          icon !== undefined
            ? String(icon || autoIcon(name !== undefined ? name : existing.name)).slice(0, 300)
            : existing.icon,
        description: description !== undefined ? String(description).slice(0, 200) : existing.description,
        category: category !== undefined ? String(category).slice(0, 40) : existing.category,
        updatedAt: Date.now(),
      };

      await redis.hset(KEY, { [id]: JSON.stringify(updated) });
      return res.status(200).json({ tool: { id, ...updated } });
    }

    if (req.method === "DELETE") {
      const body = await readBody(req);
      const { id, password } = body || {};

      if (!checkPassword(password)) {
        return res.status(401).json({ error: "Sai mật khẩu" });
      }
      if (!id) {
        return res.status(400).json({ error: "Thiếu id" });
      }

      await redis.hdel(KEY, id);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Lỗi server, thử lại sau." });
  }
};

function checkPassword(pw) {
  const expected = process.env.TOOLKIT_ADMIN_PASSWORD;
  if (!expected) return false; // must be set in Vercel env vars
  return typeof pw === "string" && pw === expected;
}

// Picks an emoji based on keywords found in the tool name. Falls back to a
// generic toolbox icon if nothing matches — never leaves the icon blank.
const ICON_RULES = [
  { icon: "📇", kws: ["flashcard", "flash card", "vocab", "học từ", "từ vựng", "hoc tap", "học tập", "study", "quiz", "flash-card"] },
  { icon: "✍️", kws: ["ký", "signature", "sign", "chữ ký"] },
  { icon: "🪺", kws: ["yến", "nest", "bird"] },
  { icon: "📊", kws: ["chart", "dashboard", "báo cáo", "report", "biểu đồ", "thống kê", "analytics", "xu burn"] },
  { icon: "📈", kws: ["sheet", "excel", "bảng tính", "spreadsheet"] },
  { icon: "🎮", kws: ["game", "trò chơi", "câu cá", "bắt bò"] },
  { icon: "📝", kws: ["blog", "viết", "write", "bài viết", "post", "note", "ghi chú"] },
  { icon: "🖼️", kws: ["photo", "ảnh", "image", "picture", "hình"] },
  { icon: "🎬", kws: ["video", "clip", "phim"] },
  { icon: "🎵", kws: ["music", "nhạc", "audio", "sound", "âm thanh"] },
  { icon: "💻", kws: ["code", "dev", "script", "api", "lập trình"] },
  { icon: "📅", kws: ["calendar", "lịch", "schedule"] },
  { icon: "✉️", kws: ["mail", "email", "thư"] },
  { icon: "💬", kws: ["chat", "tin nhắn", "message"] },
  { icon: "🔒", kws: ["security", "lock", "bảo mật", "mật khẩu", "password"] },
  { icon: "☁️", kws: ["cloud", "storage", "lưu trữ", "drive"] },
  { icon: "💰", kws: ["shop", "mua", "sale", "bán", "cart", "giá", "profit", "lợi nhuận", "tiền", "money", "finance", "tài chính"] },
  { icon: "🔍", kws: ["search", "tìm kiếm"] },
  { icon: "📷", kws: ["camera", "chụp"] },
  { icon: "🗺️", kws: ["map", "bản đồ", "location", "địa điểm"] },
  { icon: "🔳", kws: ["qr"] },
  { icon: "📄", kws: ["cv", "resume", "hồ sơ"] },
  { icon: "🔁", kws: ["convert", "đổi", "chuyển đổi"] },
];

function autoIcon(name) {
  const text = String(name || "").toLowerCase();
  const hit = ICON_RULES.find((rule) => rule.kws.some((kw) => text.includes(kw)));
  return hit ? hit.icon : "🧩";
}

function safeParse(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return {};
  }
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
