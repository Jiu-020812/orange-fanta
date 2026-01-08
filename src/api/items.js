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

//  FIX: PURCHASE 포함
function normType(t) {
  const v = String(t ?? "").trim().toUpperCase();
  if (v === "IN" || v === "OUT" || v === "PURCHASE") return v;
  return "IN";
}

// ======================= Records =======================

// GET /api/items/:itemId/records
export async function getRecords(itemId) {
  const numericItemId = safeNumber(itemId);
  if (!numericItemId) throw new Error("getRecords: invalid itemId");

  const res = await api.get(`/api/items/${numericItemId}/records`);
  if (res.data && Array.isArray(res.data.records)) return res.data.records;
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
    type: normType(type), // 이제 PURCHASE가 그대로 전달됨
    ...(memo != null ? { memo: String(memo) } : {}),
  });

  return unwrapObject(res.data);
}

// PUT /api/items/:itemId/records
export async function updateRecord({ itemId, id, price, count, date, type, memo }) {
  const numericItemId = safeNumber(itemId);
  const numericId = safeNumber(id);
  if (!numericItemId) throw new Error("updateRecord: invalid itemId");
  if (!numericId) throw new Error("updateRecord: invalid id");

  const body = {
    id: numericId,
    ...(price !== undefined ? { price: safeNumber(price, null) } : {}),
    ...(count !== undefined ? { count: safeNumber(count, null) } : {}),
    ...(date !== undefined ? { date: toISODateOnly(date) } : {}),
    ...(type !== undefined ? { type: normType(type) } : {}), // ✅ PURCHASE 허용
    ...(memo !== undefined ? { memo: memo ? String(memo) : null } : {}),
  };

  const res = await api.put(`/api/items/${numericItemId}/records`, body);
  return unwrapObject(res.data);
}


// ======================= Categories =======================

// GET /api/categories
export async function getCategories() {
  const res = await api.get("/api/categories");
  return unwrapArray(res.data);
}

// POST /api/categories  body: { name, sortOrder? }
export async function createCategory({ name, sortOrder } = {}) {
  const n = String(name ?? "").trim();
  if (!n) throw new Error("createCategory: name required");

  const res = await api.post("/api/categories", {
    name: n,
    ...(sortOrder != null ? { sortOrder: Number(sortOrder) } : {}),
  });

  // 백엔드는 category 객체를 그대로 내려줌
  return unwrapObject(res.data);
}

// PATCH /api/categories/:id  body: { name?, sortOrder? }
export async function updateCategory(id, patch = {}) {
  const numericId = safeNumber(id);
  if (!numericId) throw new Error("updateCategory: invalid id");

  const nextPatch = { ...patch };

  if ("name" in nextPatch) {
    nextPatch.name = String(nextPatch.name ?? "").trim();
  }
  if ("sortOrder" in nextPatch && nextPatch.sortOrder != null) {
    nextPatch.sortOrder = Number(nextPatch.sortOrder);
  }

  const res = await api.patch(`/api/categories/${numericId}`, nextPatch);
  return unwrapObject(res.data);
}

// DELETE /api/categories/:id
export async function deleteCategory(id) {
  const numericId = safeNumber(id);
  if (!numericId) throw new Error("deleteCategory: invalid id");

  await api.delete(`/api/categories/${numericId}`);
}

// ======================= Items =======================

// GET /api/items?categoryId=123
export async function getItems(categoryId) {
  const cid = Number(categoryId);
  const params =
    Number.isFinite(cid) && cid > 0 ? { params: { categoryId: cid } } : undefined;

  const res = await api.get("/api/items", params);
  return unwrapArray(res.data);
}

// GET /api/items/:itemId/records  (v2 detail)
export async function getItemDetail(itemId) {
  const numericItemId = safeNumber(itemId);
  if (!numericItemId) throw new Error("getItemDetail: invalid itemId");

  const res = await api.get(`/api/items/${numericItemId}/records`);
  return res.data; // { ok:true, item, records, stock, timing }
}

// POST /api/items  body: { name, size, categoryId, barcode?, imageUrl? }
export async function createItem({ name, size, categoryId, barcode, imageUrl }) {
  const res = await api.post("/api/items", {
    name,
    size,
    categoryId: safeNumber(categoryId, null),
    barcode: barcode ?? null,
    imageUrl: imageUrl ?? null,
  });
  return unwrapObject(res.data);
}

// PUT /api/items/:id  (barcode/categoryId 수정 가능)
export async function updateItem(id, patch) {
  const numericId = safeNumber(id);
  if (!numericId) throw new Error("updateItem: invalid id");

  const nextPatch = { ...patch };
  if ("categoryId" in nextPatch) {
    const cid = safeNumber(nextPatch.categoryId, null);
    nextPatch.categoryId = cid;
  }

  const res = await api.put(`/api/items/${numericId}`, nextPatch);
  return unwrapObject(res.data);
}

// DELETE /api/items/:id
export async function deleteItem(id) {
  const numericId = safeNumber(id);
  if (!numericId) throw new Error("deleteItem: invalid id");

  await api.delete(`/api/items/${numericId}`);
}

// ======================= Barcode =======================

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

  if (res.data && Array.isArray(res.data.records)) return res.data.records;
  return unwrapArray(res.data);
}

// POST /api/items/:itemId/records
export async function createRecord({ itemId, price, count, date, type = "IN", memo = null }) {
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
export async function updateRecord({ itemId, id, price, count, date, type, memo }) {
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

// ======================= Batch IN / OUT =======================

// POST /api/records/batch
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
