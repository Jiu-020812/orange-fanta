import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-back.vercel.app";

/* ----------------------------------------------------------------
   📌 1) 전체 품목 가져오기
---------------------------------------------------------------- */
export async function getItems() {
  const res = await axios.get(`${API_BASE}/api/items`);
  return res.data; // ← JSON만 반환
}

/* ----------------------------------------------------------------
   📌 2) 품목 생성
      (name, size, imageUrl)
---------------------------------------------------------------- */
export async function createItem({ name, size, imageUrl }) {
  const res = await axios.post(`${API_BASE}/api/items`, {
    name,
    size,
    imageUrl,
  });
  return res.data;
}

/* ----------------------------------------------------------------
   📌 3) 특정 품목의 매입 기록 가져오기
---------------------------------------------------------------- */
export async function getRecords(itemId) {
  const res = await axios.get(`${API_BASE}/api/items/${itemId}/records`);
  return res.data;
}

/* ----------------------------------------------------------------
   📌 4) 특정 품목에 매입 기록 추가하기
---------------------------------------------------------------- */
export async function createRecord({ itemId, price, count, date }) {
  const res = await axios.post(
    `${API_BASE}/api/items/${itemId}/records`,
    { price, count, date }
  );
  return res.data;
}