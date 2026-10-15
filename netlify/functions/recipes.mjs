import { getStore } from "@netlify/blobs";

const KEY = "recipes";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const url = (v) => {
  const u = str(v, 500);
  return /^https?:\/\//i.test(u) ? u : "";
};
const tags = (v) =>
  Array.isArray(v)
    ? [...new Set(v.map((t) => str(t, 30).toLowerCase()).filter(Boolean))].slice(0, 10)
    : [];
const date = (v) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

// Only keep fields we know about, with sane limits.
function clean(input, existing = {}) {
  const out = { ...existing };
  if ("name" in input) out.name = str(input.name, 120);
  if ("url" in input) out.url = url(input.url);
  if ("tags" in input) out.tags = tags(input.tags);
  if ("notes" in input) out.notes = str(input.notes, 1000);
  if ("active" in input) out.active = input.active !== false;
  if ("lastMade" in input) out.lastMade = date(input.lastMade);
  return out;
}

export default async (req) => {
  const store = getStore({ name: "dinner-wheel", consistency: "strong" });
  const list = (await store.get(KEY, { type: "json" })) ?? [];

  if (req.method === "GET") return json({ recipes: list });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Optional household passcode: set APP_PASSCODE in Netlify's environment variables.
  const passcode = Netlify.env.get("APP_PASSCODE");
  if (passcode && req.headers.get("x-passcode") !== passcode) {
    return json({ error: "Wrong passcode" }, 401);
  }

  let op;
  try {
    op = await req.json();
  } catch {
    return json({ error: "Request body must be JSON" }, 400);
  }

  let next = list;
  if (op.action === "add") {
    const recipe = clean(op.recipe || {}, {
      id: crypto.randomUUID(),
      name: "",
      url: "",
      tags: [],
      notes: "",
      active: true,
      lastMade: null,
      createdAt: new Date().toISOString(),
    });
    if (!recipe.name) return json({ error: "A recipe needs a name" }, 400);
    if (list.length >= 1000) return json({ error: "Recipe limit reached (1000)" }, 400);
    next = [...list, recipe];
  } else if (op.action === "update") {
    const i = list.findIndex((r) => r.id === op.id);
    if (i === -1) return json({ error: "That recipe no longer exists. Refresh the page." }, 404);
    const updated = clean(op.changes || {}, list[i]);
    if (!updated.name) return json({ error: "A recipe needs a name" }, 400);
    next = list.map((r, j) => (j === i ? updated : r));
  } else if (op.action === "delete") {
    next = list.filter((r) => r.id !== op.id);
  } else {
    return json({ error: "Unknown action" }, 400);
  }

  await store.setJSON(KEY, next);
  return json({ recipes: next });
};

export const config = { path: "/api/recipes" };
