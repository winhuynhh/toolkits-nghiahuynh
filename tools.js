const { Redis } = require("@upstash/redis");

const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
const KEY = "toolkit:tools";

module.exports = async (req, res) => {
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
        icon: String(icon || "🔧").slice(0, 300),
        description: String(description || "").slice(0, 200),
        category: String(category || "Khác").slice(0, 40),
        createdAt: Date.now(),
      };

      await redis.hset(KEY, { [id]: JSON.stringify(tool) });
      return res.status(201).json({ tool: { id, ...tool } });
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

    res.setHeader("Allow", "GET, POST, DELETE");
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
