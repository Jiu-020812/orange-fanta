import api from "../api";

/**
 * 🔹 모든 품목 가져오기
 *   - 백엔드: GET /api/items
 */
export async function getItems() {
  const res = await api.get("/items");
  return res.data;
}

/**
 * 🔹 품목(아이템) 하나 생성하기
 *   - 백엔드: POST /api/items
 *   - body: { name, size, imageUrl }
 */
export async function createItem({ name, size, imageUrl }) {
  const res = await api.post("/items", {
    name,
    size,
    imageUrl: imageUrl ?? null,
  });
  return res.data;
}

/**
 * 🔹 특정 품목의 기록 목록 가져오기
 *   - 백엔드: GET /api/items/:itemId/records
 */
export async function getRecords(itemId) {
  const res = await api.get(`/items/${itemId}/records`);
  return res.data;
}

/**
 * 🔹 기록 추가하기
 *   - 백엔드: POST /api/items/:itemId/records
 *   - body: { price, count, date }
 */
export async function createRecord({ itemId, price, count, date }) {
  const res = await api.post(`/items/${itemId}/records`, {
    price,
    count,
    date,
  });
  return res.data;
}