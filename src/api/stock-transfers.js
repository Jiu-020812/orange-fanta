import api from "./client";
import { request } from "./request";

// 재고 이동 목록 조회
export async function getStockTransfers() {
  const res = await request(() => api.get("/api/stock-transfers"));
  return res.data.transfers;
}

// 재고 이동 생성
export async function createStockTransfer(data) {
  const res = await request(() => api.post("/api/stock-transfers", data));
  return res.data.transfer;
}

// 품목별 재고 이동 이력 조회
export async function getStockTransfersByItem(itemId) {
  const res = await request(() => api.get(`/api/stock-transfers/item/${itemId}`));
  return res.data.transfers;
}
