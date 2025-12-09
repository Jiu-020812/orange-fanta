import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-back.vercel.app";

// axios 인스턴스
const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// 아이템 목록 가져오기
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

// 특정 아이템의 기록 목록 가져오기
export async function getRecords(itemId) {
  const res = await api.get("/records", { params: { itemId } });
  return res.data;
}

// 특정 아이템에 기록 추가
export async function createRecord({ itemId, price, count, date }) {
  const res = await api.post("/records", {
    itemId,
    price,
    count,
    date,
  });
  return res.data;
}

export default api;