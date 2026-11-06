// Локальный мок API для e2e: те же ручки, что у Cloudflare Worker'а,
// но всё в памяти. Пароль dev-мок — "test" (это не секрет прода).
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 8790);
const PASSWORD = process.env.MOCK_API_PASSWORD ?? "test";
const TOKEN = "mock-token-123";

const now = () => Math.floor(Date.now() / 1000);

const db = {
  dayNotes: new Map(),
  stopNotes: new Map(),
  dayTexts: new Map(),
  guideTags: new Map(),
  params: {
    people: 2,
    trip_days: 13,
    reserve_pct: 0.1,
    cny_rate: 11.4,
    hkd_rate: 10.6,
    hk_nights: 5,
    hk_hotel: 9000,
    hk_food: 4200,
    hk_transport: 1200,
    cq_nights: 4,
    cq_hotel: 4200,
    cq_food: 2400,
    cq_transport: 900,
  },
  categories: [
    { id: "cat_flights", name: "Перелёты", sort: 0, updated_at: now() },
    { id: "cat_hotels", name: "Отели", sort: 1, updated_at: now() },
    { id: "cat_food", name: "Еда", sort: 2, updated_at: now() },
  ],
  items: [
    {
      id: "item_flights",
      category_id: "cat_flights",
      name: "China Eastern, куплено",
      note: "бронь PEEPS5",
      qty: 1,
      qty_formula: null,
      unit_price: 86926,
      price_formula: null,
      currency: "RUB",
      sort: 0,
      updated_at: now(),
    },
    {
      id: "item_hotels",
      category_id: "cat_hotels",
      name: "Гонконг, отель",
      note: null,
      qty: null,
      qty_formula: "hk_nights",
      unit_price: 9000,
      price_formula: null,
      currency: "RUB",
      sort: 0,
      updated_at: now(),
    },
    {
      id: "item_food",
      category_id: "cat_food",
      name: "Еда в Гонконге",
      note: null,
      qty: null,
      qty_formula: "hk_nights",
      unit_price: 4200,
      price_formula: null,
      currency: "RUB",
      sort: 0,
      updated_at: now(),
    },
  ],
};

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function authorized(req) {
  const header = req.headers.authorization ?? "";
  return header === "Bearer " + TOKEN;
}

const routes = {
  "GET /api/health": (_req, res) => json(res, 200, { ok: true }),

  "POST /api/login": async (req, res) => {
    const body = await readBody(req);
    if (body.password !== PASSWORD) return json(res, 403, { error: "wrong_password" });
    return json(res, 200, { token: TOKEN, expires_at: now() + 30 * 24 * 3600 });
  },

  "GET /api/day-notes": (_req, res) =>
    json(res, 200, { notes: [...db.dayNotes.values()] }),
  "GET /api/stop-notes": (_req, res) =>
    json(res, 200, { notes: [...db.stopNotes.values()] }),
  "GET /api/day-texts": (_req, res) =>
    json(res, 200, { notes: [...db.dayTexts.values()] }),
  "GET /api/guide-tags": (_req, res) =>
    json(res, 200, { tags: [...db.guideTags.values()] }),

  "GET /api/budget": (_req, res) =>
    json(res, 200, {
      params: db.params,
      params_updated_at: now(),
      categories: db.categories,
      items: db.items,
      version: now() * 1000,
    }),

  "PATCH /api/params": async (req, res) => {
    const body = await readBody(req);
    Object.assign(db.params, body);
    return json(res, 200, db.params);
  },

  "POST /api/categories": async (req, res) => {
    const body = await readBody(req);
    const category = {
      id: "cat_" + Math.random().toString(36).slice(2, 8),
      name: String(body.name ?? "Новая категория"),
      sort: db.categories.length,
      updated_at: now(),
    };
    db.categories.push(category);
    return json(res, 200, category);
  },

  "POST /api/items": async (req, res) => {
    const body = await readBody(req);
    const item = {
      id: "item_" + Math.random().toString(36).slice(2, 8),
      category_id: body.category_id ?? db.categories[0]?.id,
      name: String(body.name ?? "Статья"),
      note: body.note ?? null,
      qty: body.qty_formula ? null : (body.qty ?? 1),
      qty_formula: body.qty_formula ?? null,
      unit_price: body.unit_price ?? 0,
      price_formula: body.price_formula ?? null,
      currency: body.currency ?? "RUB",
      sort: db.items.length,
      updated_at: now(),
    };
    db.items.push(item);
    return json(res, 200, item);
  },
};

function notFound(res) {
  json(res, 404, { error: "not_found" });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const path = url.pathname;
  const method = req.method ?? "GET";

  if (method === "OPTIONS") return json(res, 204, {});

  const key = `${method} ${path}`;
  const handler = routes[key];
  if (handler) return handler(req, res);

  // защищённые мутации
  if (!authorized(req)) return json(res, 401, { error: "unauthorized" });

  const dayNote = /^\/api\/day-notes\/(.+)$/.exec(path);
  if (dayNote) {
    const k = decodeURIComponent(dayNote[1]);
    if (method === "PUT") {
      const body = await readBody(req);
      const text = String(body.body ?? "").trim();
      if (!text) {
        db.dayNotes.delete(k);
        return json(res, 200, { note: null });
      }
      const note = { day_key: k, body: text, updated_at: now() };
      db.dayNotes.set(k, note);
      return json(res, 200, { note });
    }
    if (method === "DELETE") {
      db.dayNotes.delete(k);
      return json(res, 200, { ok: true });
    }
  }

  const stopNote = /^\/api\/stop-notes\/(.+)$/.exec(path);
  if (stopNote) {
    const k = decodeURIComponent(stopNote[1]);
    if (method === "PUT") {
      const body = await readBody(req);
      const text = String(body.body ?? "").trim();
      if (!text) {
        db.stopNotes.delete(k);
        return json(res, 200, { note: null });
      }
      const note = { stop_key: k, body: text, updated_at: now() };
      db.stopNotes.set(k, note);
      return json(res, 200, { note });
    }
    if (method === "DELETE") {
      db.stopNotes.delete(k);
      return json(res, 200, { ok: true });
    }
  }

  const dayText = /^\/api\/day-texts\/(.+)$/.exec(path);
  if (dayText) {
    const k = decodeURIComponent(dayText[1]);
    if (method === "PUT") {
      const body = await readBody(req);
      const texts = body.texts ?? {};
      if (!Object.keys(texts).length) {
        db.dayTexts.delete(k);
        return json(res, 200, { note: null });
      }
      const note = { day_key: k, texts, updated_at: now() };
      db.dayTexts.set(k, note);
      return json(res, 200, { note });
    }
    if (method === "DELETE") {
      db.dayTexts.delete(k);
      return json(res, 200, { ok: true });
    }
  }

  const guideTag = /^\/api\/guide-tags\/(.+)$/.exec(path);
  if (guideTag) {
    const k = decodeURIComponent(guideTag[1]);
    if (method === "PUT") {
      const body = await readBody(req);
      const tag = { tag_key: k, tag: body.tag ?? "choice", updated_at: now() };
      db.guideTags.set(k, tag);
      return json(res, 200, { tag });
    }
    if (method === "DELETE") {
      db.guideTags.delete(k);
      return json(res, 200, { ok: true });
    }
  }

  const itemMatch = /^\/api\/items\/(.+)$/.exec(path);
  if (itemMatch) {
    const id = decodeURIComponent(itemMatch[1]);
    const idx = db.items.findIndex((i) => i.id === id);
    if (method === "PATCH" && idx >= 0) {
      const body = await readBody(req);
      db.items[idx] = { ...db.items[idx], ...body, updated_at: now() };
      return json(res, 200, db.items[idx]);
    }
    if (method === "DELETE" && idx >= 0) {
      db.items.splice(idx, 1);
      return json(res, 200, { ok: true });
    }
  }

  const categoryMatch = /^\/api\/categories\/(.+)$/.exec(path);
  if (categoryMatch) {
    const id = decodeURIComponent(categoryMatch[1]);
    const idx = db.categories.findIndex((c) => c.id === id);
    if (method === "PATCH" && idx >= 0) {
      const body = await readBody(req);
      db.categories[idx] = { ...db.categories[idx], ...body, updated_at: now() };
      return json(res, 200, db.categories[idx]);
    }
    if (method === "DELETE" && idx >= 0) {
      db.categories.splice(idx, 1);
      db.items = db.items.filter((i) => i.category_id !== id);
      return json(res, 200, { ok: true });
    }
  }

  return notFound(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock api: http://127.0.0.1:${PORT}`);
});
