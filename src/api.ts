import axios from "axios";

// 백엔드 베이스 URL (환경변수 우선, 없으면 배포주소 사용)
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://orange-fanta-back.vercel.app";

// axios 인스턴스 생성
const api = axios.create({
  baseURL: `${API_BASE}/api`, // 예: https://orange-fanta-back.vercel.app/api
  withCredentials: true,      // 쿠키 사용 시 필요
});

// 타입 정의
export type Item = {
  id: number;
  name: string;
  size: string;
  imageUrl?: string | null;
  createdAt: string;
};

export type PurchaseRecord = {
  id: number;
  itemId: number;
  price: number;
  count: number;
  date: string;
};

// --------------------------- Items ---------------------------

// 모든 아이템 가져오기
export async function getItems(): Promise<Item[]> {
  const res = await api.get<Item[]>("/items");
  return res.data;
}

// 아이템 생성
export async function createItem(data: {
  name: string;
  size: string;
  imageUrl?: string | null;
}): Promise<Item> {
  console.log("🌐 [items.ts] createItem 호출 → 서버 전송:", data);
  const res = await api.post<Item>("/items", data);
  return res.data;
}

// --------------------------- Records ---------------------------

// 특정 Item의 기록 목록
export async function getRecords(itemId: number): Promise<PurchaseRecord[]> {
  const res = await api.get<PurchaseRecord[]>(`/items/${itemId}/records`);
  return res.data;
}

// 특정 Item에 기록 추가
export async function createRecord(data: {
  itemId: number;
  price: number;
  count: number;
  date: string;
}): Promise<PurchaseRecord> {
  console.log("🌐 [items.ts] createRecord 요청 →", data);
  const res = await api.post<PurchaseRecord>(
    `/items/${data.itemId}/records`,
    {
      price: data.price,
      count: data.count,
      date: data.date,
    }
  );
  return res.data;
}

export default api;