import axios from "axios";

// 백엔드 베이스 URL (환경변수 우선, 없으면 배포주소 사용)
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "https://orange-fanta-back.vercel.app";

// axios 인스턴스 생성
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true, // 쿠키 자동 포함 (로그인 유지에 필수)
});

// --------------------------- Items ---------------------------

// 모든 아이템 가져오기
export async function getItems() {
  const res = await api.get("/items");
  return res.data;
}

// 아이템 생성
export async function createItem(data) {
  console.log("🌐 [items.js] createItem 호출 → 서버 전송:", data);
  const res = await api.post("/items", data);
  return res.data;
}

// --------------------------- Records ---------------------------

// 특정 Item의 기록 목록
export async function getRecords(itemId) {
  const res = await api.get(`/items/${itemId}/records`);
  return res.data;
}

// 특정 Item에 기록 추가
export async function createRecord(data) {
  console.log("🌐 [items.js] createRecord 요청 →", data);
  const res = await api.post(`/items/${data.itemId}/records`, {
    price: data.price,
    count: data.count,
    date: data.date,
  });
  return res.data;
}

export default api;