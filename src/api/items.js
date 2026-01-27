import api from "./client";
import {
  safeNumber,
  toISODateOnly,
  normType,
  unwrapArray,
  unwrapObject,
} from "./utils";

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

export async function createRecord({
  itemId,
  type = "IN",
  price,
  count,
  date,
  memo,
}) {
  const res = await api.post(`/api/items/${itemId}/records`, {
    type: normType(type),          
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

// ======================= Barcode =======================

// GET /api/items/lookup?barcode=xxxx
export async function lookupItemByBarcode(barcode) {
  const bc = String(barcode ?? "").trim();
  if (!bc) return { ok: false, message: "barcode required" };

  const res = await api.get("/api/items/lookup", {
    params: { barcode: bc },
  });

  // 응답: { ok:true, item } | { ok:false, message }
  return res.data;
}

// ======================= Batch IN / OUT =======================

// POST /api/records/batch
export async function createRecordsBatch({ type = "IN", items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("createRecordsBatch: items required");
  }

  const res = await api.post("/api/records/batch", {
    type,
    items: items.map((x) => ({
      itemId: Number(x.itemId),
      count: Number(x.count ?? 1),
    })),
  });

  return res.data;
}


