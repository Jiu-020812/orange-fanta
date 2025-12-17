import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-back.vercel.app";

const api = axios.create({
  baseURL: API_BASE,        // 백엔드가 /api/... 라우트 이미 보유
  withCredentials: true,    //  쿠키(token) 인증
});

// ---------------------- 유틸 ----------------------
function safeNumber(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toISODateOnly(d) {
  try {
    if (!d) return null;
    const s = String(d);
    if (s.length >= 10) return s.slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function normType(t) {
  return t === "OUT" ? "OUT" : "IN";
}

function unwrapArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

function unwrapObject(data) {
  if (data && data.item && typeof data.item === "object") return data.item;
  if (data && data.record && typeof data.record === "object") return data.record;
  return data;
}

// ======================= Items =======================

// GET /api/items
export async function getItems() {
  const res = await api.get("/api/items");
  return unwrapArray(res.data);
}

// POST /api/items
export async function createItem({ name, size, imageUrl, category }) {
  const res = await api.post("/api/items", {
    name,
    size,
    imageUrl: imageUrl ?? null,
    category: category ?? undefined,
  });
  return unwrapObject(res.data);
}

// PUT /api/items/:id
export async function updateItem(id, patch) {
  const numericId = safeNumber(id);
  if (!numericId) throw new Error("updateItem: invalid id");

  const res = await api.put(`/api/items/${numericId}`, patch);
  return unwrapObject(res.data);
}

// DELETE /api/items/:id
export async function deleteItem(id) {
  const numericId = safeNumber(id);
  if (!numericId) throw new Error("deleteItem: invalid id");

  await api.delete(`/api/items/${numericId}`);
}

// ======================= Records =======================

// GET /api/items/:itemId/records
export async function getRecords(itemId) {
  const numericItemId = safeNumber(itemId);
  if (!numericItemId) throw new Error("getRecords: invalid itemId");

  const res = await api.get(`/api/items/${numericItemId}/records`);
  return unwrapArray(res.data);
}

// POST /api/items/:itemId/records
// body: { price, count, date, type?, memo? }
export async function createRecord({
  itemId,
  price,
  count,
  date,
  type = "IN",   //  기본은 매입
  memo = null,
}) {
  const numericItemId = safeNumber(itemId);
  if (!numericItemId) throw new Error("createRecord: invalid itemId");

  const res = await api.post(`/api/items/${numericItemId}/records`, {
    price: safeNumber(price, null),
    count: safeNumber(count, 1) ?? 1,
    date: toISODateOnly(date) ?? undefined,
    type: normType(type),                 //  "IN" | "OUT"
    ...(memo != null ? { memo: String(memo) } : {}),
  });

  return unwrapObject(res.data);
}

// PUT /api/items/:itemId/records
// body: { id, price?, count?, date?, type?, memo? }
export async function updateRecord({
  itemId,
  id,
  price,
  count,
  date,
  type,
  memo,
}) {
  const numericItemId = safeNumber(itemId);
  const numericId = safeNumber(id);
  if (!numericItemId) throw new Error("updateRecord: invalid itemId");
  if (!numericId) throw new Error("updateRecord: invalid id");

  const body = {
    id: numericId,
    ...(price != null ? { price: safeNumber(price, null) } : {}),
    ...(count != null ? { count: safeNumber(count, null) } : {}),
    ...(date != null ? { date: toISODateOnly(date) } : {}),
    ...(type != null ? { type: normType(type) } : {}),
    ...(memo != null ? { memo: memo ? String(memo) : null } : {}),
  };

  const res = await api.put(`/api/items/${numericItemId}/records`, body);
  return unwrapObject(res.data);
}

// DELETE /api/items/:itemId/records?id=123
export async function deleteRecord({ itemId, id }) {
  const numericItemId = safeNumber(itemId);
  const numericId = safeNumber(id);
  if (!numericItemId) throw new Error("deleteRecord: invalid itemId");
  if (!numericId) throw new Error("deleteRecord: invalid id");

  await api.delete(`/api/items/${numericItemId}/records`, {
    params: { id: numericId },
  });
}

export default api;
