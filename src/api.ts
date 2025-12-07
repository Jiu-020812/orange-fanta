import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://orange-fanta-back.vercel.app";

// axios 인스턴스 생성
const api = axios.create({
  baseURL: `${API_BASE}/api`,
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


// 아이템 목록 가져오기

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


// 특정 Item의 기록 목록

export async function getRecords(itemId: number): Promise<PurchaseRecord[]> {
  const res = await api.get<PurchaseRecord[]>(`/items/${itemId}/records`);
  return res.data;
}


// 특정 Item에 기록 추가하기

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