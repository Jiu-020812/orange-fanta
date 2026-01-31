import api from "./client";
import { request } from "./request";

// 재고 실사 목록 조회
export async function getStockAudits() {
  const res = await request(() => api.get("/api/stock-audits"));
  return res.data.audits;
}

// 재고 실사 생성
export async function createStockAudit(data) {
  const res = await request(() => api.post("/api/stock-audits", data));
  return res.data.audit;
}

// 창고별 재고 실사 이력 조회
export async function getStockAuditsByWarehouse(warehouseId) {
  const res = await request(() => api.get(`/api/stock-audits/warehouse/${warehouseId}`));
  return res.data.audits;
}

// 품목별 재고 실사 이력 조회
export async function getStockAuditsByItem(itemId) {
  const res = await request(() => api.get(`/api/stock-audits/item/${itemId}`));
  return res.data.audits;
}
