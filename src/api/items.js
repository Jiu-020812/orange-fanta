import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-back.vercel.app";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // 쿠키(token) 인증
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

// GET /api/items?category=SHOE|FOOD
export async function getItems(category) {
  const params = category ? { params: { category } } : undefined;
  const res = await api.get("/api/items", params);
  return unwrapArray(res.data);
}


// POST /api/items  
export async function createItem({
  name,
  size,
  barcode,
  imageUrl,
  category,
}) {
  const res = await api.post("/api/items", {
    name,
    size,
    barcode: barcode ?? null,  
    imageUrl: imageUrl ?? null,
    category: category ?? undefined,
  });
  return unwrapObject(res.data);
}

// PUT /api/items/:id  (barcode 수정 가능)
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

// ======================= 🔫 Barcode =======================

// GET /api/items/lookup?barcode=xxxx
export async function lookupItemByBarcode(barcode) {
  if (!barcode) return { ok: false };

  const res = await api.get("/api/items/lookup", {
    params: { barcode },
  });

  // 응답: { ok:true, item } | { ok:false }
  return res.data;
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
export async function createRecord({
  itemId,
  price,
  count,
  date,
  type = "IN",
  memo = null,
}) {
  const numericItemId = safeNumber(itemId);
  if (!numericItemId) throw new Error("createRecord: invalid itemId");

  const res = await api.post(`/api/items/${numericItemId}/records`, {
    price: safeNumber(price, null),
    count: safeNumber(count, 1) ?? 1,
    date: toISODateOnly(date) ?? undefined,
    type: normType(type),
    ...(memo != null ? { memo: String(memo) } : {}),
  });

  return unwrapObject(res.data);
}

// PUT /api/items/:itemId/records
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

// ======================= 📦 Batch IN / OUT =======================

// POST /api/records/batch
// payload: { type: "IN" | "OUT", items: [{ itemId, count }] }
export async function createRecordsBatch({ type = "IN", items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("createRecordsBatch: items required");
  }

  const res = await api.post("/api/records/batch", {
    type: normType(type),
    items: items.map((x) => ({
      itemId: safeNumber(x.itemId),
      count: safeNumber(x.count, 1) ?? 1,
    })),
  });

  return res.data;
}

// ======================= 전체 기록 =======================

// 입출고 페이지용
export async function getAllRecords({ type, priceMissing } = {}) {
  const res = await api.get("/api/records", {
    params: {
      ...(type ? { type } : {}),
      ...(priceMissing ? { priceMissing: 1 } : {}),
    },
  });
  return res.data?.records ?? [];
}

export default api;
