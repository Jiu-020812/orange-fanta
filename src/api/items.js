// src/api/items.js
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-back.vercel.app";

// 공통 axios 인스턴스
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true, // 쿠키 & CORS 같이 쓰려고
});

// ======================= Items =======================

// 아이템 목록 가져오기 (현재 로그인 유저 기준)
export async function getItems() {
  const res = await api.get("/items");
  return res.data;
}

// 아이템 생성
export async function createItem({ name, size, imageUrl }) {
  const res = await api.post("/items", {
    name,
    size,
    imageUrl: imageUrl ?? null,
  });
  return res.data;
}

// 아이템 삭제 (기록도 같이 삭제)
export async function deleteItem(id) {
  // 백엔드가 /api/items/:id DELETE 를 받도록 구현되어 있다고 가정
  await api.delete(`/items/${id}`);
}

// ======================= Records =======================
// ※ 이제 /records 가 아니라 /items/:itemId/records 로 요청 보냄

// 특정 아이템의 기록 목록 가져오기
export async function getRecords(itemId) {
  const res = await api.get(`/items/${itemId}/records`);
  return res.data;
}

// 특정 아이템에 기록 추가
export async function createRecord({ itemId, price, count, date }) {
  const res = await api.post(`/items/${itemId}/records`, {
    price,
    count,
    date,
  });
  return res.data;
}

// 기록 수정
export async function updateRecord({ itemId, id, price, count, date }) {
  const res = await api.put(`/items/${itemId}/records`, {
    id,
    price,
    count,
    date,
  });
  return res.data;
}

// 기록 삭제
export async function deleteRecord({ itemId, id }) {
  await api.delete(`/items/${itemId}/records`, {
    params: { id },
  });
}

export default api;