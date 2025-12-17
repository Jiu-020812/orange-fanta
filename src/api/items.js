import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-back.vercel.app";

const api = axios.create({
  baseURL: API_BASE, // ✅ 백엔드가 /api/... 라우트를 이미 가지고 있음
  withCredentials: true, // ✅ 쿠키(token) 인증
});

// ---------------------- 유틸 ----------------------
function safeNumber(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toISODateOnly(d) {
  // "YYYY-MM-DD" 형태로 맞추기
  try {
    if (!d) return null;
    const s = String(d);
    if (s.length >= 10) return s.slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function unwrapArray(data) {
  // 백엔드가 배열을 직접 주는 구조면 그대로
  if (Array.isArray(data)) return data;
  // 혹시라도 {items:[]} 같은 형태 대비
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.records)) return data.records;
  return [];
}

function unwrapObject(data) {
  // 혹시 { ok:true, item } / { ok:true, record } 같은 형태 대비
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
// ✅ 네 백엔드 라우트는 /api/items/:itemId/records

// GET /api/items/:itemId/records
export async function getRecords(itemId) {
  const numericItemId = safeNumber(itemId);
  if (!numericItemId) throw new Error("getRecords: invalid itemId");

  const res = await api.get(`/api/items/${numericItemId}/records`);
  return unwrapArray(res.data);
}

// POST /api/items/:itemId/records
// ⚠️ 현재 백엔드는 { price, count, date }만 받음
// ✅ 출고 대비로 type/memo를 파라미터로 받아도,
//    백엔드가 아직 저장 안 하니까 "보내지 않는" 기본값으로 둠.
//    (백엔드 수정 후 아래 주석만 해제하면 됨)
export async function createRecord({
  itemId,
  price,
  count,
  date,
  // type, // "IN" | "OUT"  (백엔드 추가되면 사용)
  // memo, // string         (백엔드 추가되면 사용)
}) {
  const numericItemId = safeNumber(itemId);
  if (!numericItemId) throw new Error("createRecord: invalid itemId");

  const res = await api.post(`/api/items/${numericItemId}/records`, {
    price: safeNumber(price, 0),
    count: safeNumber(count, 1) ?? 1,
    date: toISODateOnly(date) ?? undefined,

    // ✅ 백엔드가 type/memo 받게 되면 아래 주석 해제
    // ...(type != null ? { type } : {}),
    // ...(memo != null ? { memo } : {}),
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
  // type,
  // memo,
}) {
  const numericItemId = safeNumber(itemId);
  const numericId = safeNumber(id);
  if (!numericItemId) throw new Error("updateRecord: invalid itemId");
  if (!numericId) throw new Error("updateRecord: invalid id");

  const body = {
    id: numericId,
    ...(price != null ? { price: safeNumber(price, 0) } : {}),
    ...(count != null ? { count: safeNumber(count, 1) } : {}),
    ...(date != null ? { date: toISODateOnly(date) } : {}),

    // ✅ 백엔드가 type/memo 받게 되면 아래 주석 해제
    // ...(type != null ? { type } : {}),
    // ...(memo != null ? { memo } : {}),
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
