import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-back.vercel.app";

// 공통 axios 인스턴스
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true, // 쿠키 인증(JWT cookie) 사용
});

/**
 * 임시 userId (백엔드가 userId를 요구하는 동안만)
 * - 네가 프론트에서 userId를 안 만지고 싶으면,
 *   백엔드에서 쿠키/세션/JWT로 userId를 뽑도록 바꾸면 이 함수는 필요 없어짐.
 *
 * - 지금은 "있으면 보내고 없으면 안 보내는" 호환 방식.
 */
function getUserIdIfExists() {
  const v1 = Number(localStorage.getItem("userId"));
  if (Number.isFinite(v1) && v1 > 0) return v1;

  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    const v2 = Number(u?.id);
    if (Number.isFinite(v2) && v2 > 0) return v2;
  } catch {}

  return null;
}

/* ======================= 응답 정규화 유틸 ======================= */
function unwrapItems(data) {
  // 가능한 형태들:
  // 1) items[] (배열)
  // 2) { ok:true, items:[...] }
  // 3) { items:[...] }
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

function unwrapItem(data) {
  // 1) item 객체
  // 2) { ok:true, item:{...} }
  if (data && data.item && typeof data.item === "object") return data.item;
  return data;
}

function unwrapRecords(data) {
  // 1) records[] (배열)
  // 2) { ok:true, records:[...], stock }
  // 3) { records:[...] }
  if (Array.isArray(data)) return { records: data, stock: null };
  if (data && Array.isArray(data.records)) return { records: data.records, stock: data.stock ?? null };
  return { records: [], stock: null };
}

function unwrapRecord(data) {
  // 1) record 객체
  // 2) { ok:true, record:{...}, stock }
  if (data && data.record && typeof data.record === "object") return { record: data.record, stock: data.stock ?? null };
  return { record: data, stock: data?.stock ?? null };
}

/* ======================= Items ======================= */

// 아이템 목록 가져오기
//  백엔드: GET /api/items (?userId=1&category=SHOE)
export async function getItems({ category } = {}) {
  const userId = getUserIdIfExists();

  const res = await api.get("/items", {
    params: {
      ...(userId ? { userId } : {}),
      ...(category ? { category } : {}),
    },
  });

  // 항상 "배열"로 돌려주기 (ManageDetailPage가 Array.isArray로 다루기 쉬움)
  return unwrapItems(res.data);
}

// 아이템 생성
// 백엔드: POST /api/items
export async function createItem({ name, size, imageUrl, category, legacyId, memo }) {
  const userId = getUserIdIfExists();

  const res = await api.post("/items", {
    ...(userId ? { userId } : {}),
    name,
    size,
    imageUrl: imageUrl ?? null,
    category: category ?? undefined,
    legacyId: legacyId ?? undefined,
    memo: memo ?? undefined,
  });

  // 항상 "item 객체"로 돌려주기
  return unwrapItem(res.data);
}

/**
 * 아이템 수정 (옵션 수정/메모 저장)
 *  백엔드가 "PUT /api/items" (body에 { id, ...patch })를 지원해야 함 */
export async function updateItem(id, patch) {
  const userId = getUserIdIfExists();

  const res = await api.put("/items", {
    ...(userId ? { userId } : {}),
    id,
    ...patch,
  });

  return unwrapItem(res.data);
}

// 아이템 삭제 (기록도 같이 삭제)
//  백엔드: DELETE /api/items?id=123 (&userId=1)
export async function deleteItem(id) {
  const userId = getUserIdIfExists();

  await api.delete("/items", {
    params: {
      id,
      ...(userId ? { userId } : {}),
    },
  });
}

/* ======================= Records ======================= */

// 특정 아이템의 기록 목록 가져오기
//  백엔드: GET /api/records?itemId=123 (&userId=1)
export async function getRecords(itemId) {
  const userId = getUserIdIfExists();

  const res = await api.get("/records", {
    params: {
      itemId,
      ...(userId ? { userId } : {}),
    },
  });

  // ManageDetailPage에서 편하게 쓰라고 {records, stock} 형태로 돌려줌
  // 배열만 쓰던 코드면, ManageDetailPage 쪽 unwrap만 해주면 됨
  return unwrapRecords(res.data);
}

// 기록 추가 (매입/출고 공용)
// 백엔드: POST /api/records (body에 itemId 포함)
export async function createRecord({ itemId, type = "IN", price, count, date, memo }) {
  const userId = getUserIdIfExists();

  const res = await api.post("/records", {
    ...(userId ? { userId } : {}),
    itemId,
    type,               // "IN" | "OUT"
    price,
    count,
    date,
    memo: memo ?? null,
  });

  // { record, stock } 형태로 정규화해서 반환
  return unwrapRecord(res.data);
}

// 기록 수정 (type/memo 포함 가능)
//  백엔드: PUT /api/records
export async function updateRecord({ id, type, price, count, date, memo }) {
  const userId = getUserIdIfExists();

  const res = await api.put("/records", {
    ...(userId ? { userId } : {}),
    id,
    ...(type != null ? { type } : {}),
    ...(price != null ? { price } : {}),
    ...(count != null ? { count } : {}),
    ...(date != null ? { date } : {}),
    ...(memo != null ? { memo } : {}),
  });

  return unwrapRecord(res.data);
}

// 기록 삭제
//  백엔드: DELETE /api/records?id=123 (&userId=1)
export async function deleteRecord({ id }) {
  const userId = getUserIdIfExists();

  const res = await api.delete("/records", {
    params: {
      id,
      ...(userId ? { userId } : {}),
    },
  });

  // 백엔드가 { ok:true, stock } 주면 활용 가능
  return res.data;
}

export default api;
