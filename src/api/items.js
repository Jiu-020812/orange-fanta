import client from "./client";
import {
  safeNumber,
  toISODateOnly,
  normType,
  unwrapArray,
  unwrapObject,
} from "./utils";
import { handleError, request } from "./request";

export class ItemsAPI {
  static async getDetail(itemId) {
    const res = await request(() =>
      client.get(`/api/items/${itemId}/records`)
    );
    return res.data;
  }

  static handleError(error) {
    return handleError(error);
  }
}

/* ===================== categories ===================== */

export async function getCategories() {
  const res = await request(() => client.get("/api/categories"));
  return unwrapArray(res.data);
}

export async function createCategory({ name, sortOrder } = {}) {
  const res = await request(() =>
    client.post("/api/categories", {
      name: String(name).trim(),
      ...(sortOrder != null ? { sortOrder } : {}),
    })
  );
  return unwrapObject(res.data);
}

export async function updateCategory(id, patch) {
  const res = await request(() =>
    client.patch(`/api/categories/${id}`, patch)
  );
  return unwrapObject(res.data);
}

export async function deleteCategory(id) {
  await request(() => client.delete(`/api/categories/${id}`));
}

/* ===================== items ===================== */

export async function getItems(categoryId) {
  const params =
    categoryId != null ? { params: { categoryId } } : undefined;
  const res = await request(() => client.get("/api/items", params));
  return unwrapArray(res.data);
}

export async function searchItems(query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];

  const res = await request(() => client.get("/api/items"));
  const list = unwrapArray(res.data);
  return list.filter((item) => {
    const hay = [
      item?.name,
      item?.size,
      item?.barcode,
    ]
      .map((v) => String(v ?? "").toLowerCase())
      .join(" ");
    return hay.includes(q);
  });
}

export async function getItemDetail(itemId) {
  return ItemsAPI.getDetail(itemId);
}

export async function createItem(data) {
  const res = await request(() => client.post("/api/items", data));
  return unwrapObject(res.data);
}

export async function updateItem(id, patch) {
  const res = await request(() =>
    client.put(`/api/items/${id}`, patch)
  );
  return unwrapObject(res.data);
}

export async function deleteItem(id) {
  await request(() => client.delete(`/api/items/${id}`));
}

export async function upsertItemPolicy(itemId, payload) {
  const res = await request(() =>
    client.put(`/api/items/${itemId}/policy`, payload)
  );
  return res.data;
}

export async function upsertChannelListing(itemId, payload) {
  const res = await request(() =>
    client.post(`/api/items/${itemId}/listings`, payload)
  );
  return res.data;
}

export async function syncInventory(itemId) {
  const res = await request(() =>
    client.post(`/api/items/${itemId}/sync-inventory`)
  );
  return res.data;
}

/* ===================== records ===================== */

/**
 * 특정 item 기록 조회
 */
export async function getRecords(itemId) {
  const res = await request(() =>
    client.get(`/api/items/${itemId}/records`)
  );
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
  const res = await request(() =>
    client.post(`/api/items/${itemId}/records`, {
      type: normType(type),
      price: safeNumber(price, null),
      count: safeNumber(count, 1),
      date: toISODateOnly(date),
      ...(memo != null ? { memo } : {}),
    })
  );

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
  const res = await request(() =>
    client.put(`/api/items/${itemId}/records`, {
      id,
      ...(type != null ? { type: normType(type) } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(count !== undefined ? { count } : {}),
      ...(date !== undefined ? { date: toISODateOnly(date) } : {}),
      ...(memo !== undefined ? { memo } : {}),
    })
  );

  return unwrapObject(res.data);
}

/**
 * 기록 삭제
 */
export async function deleteRecord({ itemId, id }) {
  await request(() =>
    client.delete(`/api/items/${itemId}/records`, {
      params: { id },
    })
  );
}

/* ===================== purchase arrive ===================== */

export async function arrivePurchase({
  purchaseId,
  count,
  date,
  memo,
}) {
  const res = await request(() =>
    client.post(`/api/purchases/${purchaseId}/arrive`, {
      ...(count != null ? { count } : {}),
      ...(date != null ? { date: toISODateOnly(date) } : {}),
      ...(memo != null ? { memo } : {}),
    })
  );

  return res.data;
}

/* ===================== all records ===================== */

export async function getAllRecords({ type, priceMissing } = {}) {
  const res = await request(() =>
    client.get("/api/records", {
      params: {
        ...(type ? { type } : {}),
        ...(priceMissing ? { priceMissing: 1 } : {}),
      },
    })
  );
  return unwrapArray(res.data.records);
}

// ======================= Barcode =======================

// GET /api/items/lookup?barcode=xxxx
export async function lookupItemByBarcode(barcode) {
  const bc = String(barcode ?? "").trim();
  if (!bc) return { ok: false, message: "barcode required" };

  const res = await request(() =>
    client.get("/api/items/lookup", {
      params: { barcode: bc },
    })
  );

  // 응답: { ok:true, item } | { ok:false, message }
  return res.data;
}

// ======================= Batch IN / OUT =======================

// POST /api/records/batch
export async function createRecordsBatch({ type = "IN", items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("createRecordsBatch: items required");
  }

  const res = await request(() =>
    client.post("/api/records/batch", {
      type,
      items: items.map((x) => ({
        itemId: Number(x.itemId),
        count: Number(x.count ?? 1),
      })),
    })
  );

  return res.data;
}

/* ===================== channel webhooks ===================== */

// GET /api/sync/logs - 동기화 로그 조회
export async function getSyncLogs({ limit = 50 } = {}) {
  const res = await request(() =>
    client.get("/api/sync/logs", { params: { limit } })
  );
  return unwrapArray(res.data.logs);
}

// POST /api/sync/manual - 수동 동기화 트리거
export async function triggerManualSync({ provider, startDate, endDate } = {}) {
  const res = await request(() =>
    client.post("/api/sync/manual", {
      provider,
      startDate,
      endDate,
    })
  );
  return unwrapObject(res.data);
}

// GET /api/sync/status - 채널별 동기화 상태 조회
export async function getSyncStatus() {
  const res = await request(() => client.get("/api/sync/status"));
  return unwrapArray(res.data.channels);
}

// POST /api/sync/settings - 자동 동기화 설정
export async function updateSyncSettings({ provider, enabled, interval } = {}) {
  const res = await request(() =>
    client.post("/api/sync/settings", {
      provider,
      enabled,
      interval,
    })
  );
  return unwrapObject(res.data);
}

export default client;
