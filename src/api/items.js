import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-back.vercel.app";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

/* ===================== utils ===================== */

function safeNumber(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toISODateOnly(d) {
  if (!d) return undefined;
  const s = String(d);
  if (s.length >= 10) return s.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

/**
 * 🔥 핵심 수정 포인트
 * - PURCHASE를 IN으로 바꾸지 않는다
 */
function normType(t) {
  const v = String(t ?? "").toUpperCase();
  if (v === "IN") return "IN";
  if (v === "OUT") return "OUT";
  if (v === "PURCHASE") return "PURCHASE";
  return "IN";
}

function unwrapArray(data) {
  if (Array.isArray(data)) return data;
  if (data?.records && Array.isArray(data.records)) return data.records;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

function unwrapObject(data) {
  if (data?.item) return data.item;
  if (data?.record) return data.record;
  return data;
}

/* ===================== categories ===================== */

export async function getCategories() {
  const res = await api.get("/api/categories");
  return unwrapArray(res.data);
}

export async function createCategory({ name, sortOrder } = {}) {
  const res = await api.post("/api/categories", {
    name: String(name).trim(),
    ...(sortOrder != null ? { sortOrder } : {}),
  });
  return unwrapObject(res.data);
}

export async function updateCategory(id, patch) {
  const res = await api.patch(`/api/categories/${id}`, patch);
  return unwrapObject(res.data);
}

export async function deleteCategory(id) {
  await api.delete(`/api/categories/${id}`);
}

/* ===================== items ===================== */

export async function getItems(categoryId) {
  const params =
    categoryId != null ? { params: { categoryId } } : undefined;
  const res = await api.get("/api/items", params);
  return unwrapArray(res.data);
}

export async function getItemDetail(itemId) {
  const res = await api.get(`/api/items/${itemId}/records`);
  return res.data; // { ok, item, records, stock, pendingIn }
}

export async function createItem(data) {
  const res = await api.post("/api/items", data);
  return unwrapObject(res.data);
}

export async function updateItem(id, patch) {
  const res = await api.put(`/api/items/${id}`, patch);
  return unwrapObject(res.data);
}

export async function deleteItem(id) {
  await api.delete(`/api/items/${id}`);
}

/* ===================== records ===================== */

/**
 * 특정 item 기록 조회
 */
export async function getRecords(itemId) {
  const res = await api.get(`/api/items/${itemId}/records`);
  return unwrapArray(res.data.records);
}

/**
 * 기록 생성 (🔥 PURCHASE 정상 전달)
 */
export async function createRecord({
  itemId,
  type = "IN",
  price,
  count,
  date,
  memo,
}) {
  const res = await api.post(`/api/items/${itemId}/records`, {
    type: normType(type),          // ✅ PURCHASE 유지
    price: safeNumber(price, null),
    count: safeNumber(count, 1),
    date: toISODateOnly(date),
    ...(memo != null ? { memo } : {}),
  });

  return unwrapObject(res.data);
}

/**
 * 기록 수정
 */
export async function updateRecord({
  itemId,
  id,
  type,
  price,
  count,
  date,
  memo,
}) {
  const res = await api.put(`/api/items/${itemId}/records`, {
    id,
    ...(type != null ? { type: normType(type) } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(count !== undefined ? { count } : {}),
    ...(date !== undefined ? { date: toISODateOnly(date) } : {}),
    ...(memo !== undefined ? { memo } : {}),
  });

  return unwrapObject(res.data);
}

/**
 * 기록 삭제
 */
export async function deleteRecord({ itemId, id }) {
  await api.delete(`/api/items/${itemId}/records`, {
    params: { id },
  });
}

/* ===================== purchase arrive ===================== */

export async function arrivePurchase({
  purchaseId,
  count,
  date,
  memo,
}) {
  const res = await api.post(
    `/api/purchases/${purchaseId}/arrive`,
    {
      ...(count != null ? { count } : {}),
      ...(date != null ? { date: toISODateOnly(date) } : {}),
      ...(memo != null ? { memo } : {}),
    }
  );

  return res.data;
}

/* ===================== all records ===================== */

export async function getAllRecords({ type, priceMissing } = {}) {
  const res = await api.get("/api/records", {
    params: {
      ...(type ? { type } : {}),
      ...(priceMissing ? { priceMissing: 1 } : {}),
    },
  });
  return unwrapArray(res.data.records);
}

export default api;
