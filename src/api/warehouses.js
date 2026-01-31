import api from "./client";
import { request } from "./request";

// 창고 목록 조회
export async function getWarehouses() {
  const res = await request(() => api.get("/api/warehouses"));
  return res.data.warehouses;
}

// 창고 생성
export async function createWarehouse(data) {
  const res = await request(() => api.post("/api/warehouses", data));
  return res.data.warehouse;
}

// 창고 상세 조회
export async function getWarehouse(id) {
  const res = await request(() => api.get(`/api/warehouses/${id}`));
  return res.data.warehouse;
}

// 창고 수정
export async function updateWarehouse(id, data) {
  const res = await request(() => api.put(`/api/warehouses/${id}`, data));
  return res.data.warehouse;
}

// 창고 삭제
export async function deleteWarehouse(id) {
  const res = await request(() => api.delete(`/api/warehouses/${id}`));
  return res.data;
}
