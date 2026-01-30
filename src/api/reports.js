import client from "./client";
import { request } from "./request";
import { unwrapObject } from "./utils";

// 매출 분석 데이터 가져오기
export async function getSalesAnalysis(dateRange = "7days") {
  const res = await request(() =>
    client.get("/api/reports/sales-analysis", {
      params: { dateRange },
    })
  );
  return res.data?.data || [];
}

// 재고 회전율 데이터 가져오기
export async function getInventoryTurnover(dateRange = "7days") {
  const res = await request(() =>
    client.get("/api/reports/inventory-turnover", {
      params: { dateRange },
    })
  );
  return res.data?.data || [];
}

// 수익률 분석 데이터 가져오기
export async function getProfitAnalysis(dateRange = "7days") {
  const res = await request(() =>
    client.get("/api/reports/profit-analysis", {
      params: { dateRange },
    })
  );
  return res.data?.data || {};
}

// TOP 제품 데이터 가져오기
export async function getTopProducts(dateRange = "7days") {
  const res = await request(() =>
    client.get("/api/reports/top-products", {
      params: { dateRange },
    })
  );
  return res.data?.data || [];
}

// 카테고리별 판매 분포 가져오기
export async function getCategoryBreakdown(dateRange = "7days") {
  const res = await request(() =>
    client.get("/api/reports/category-breakdown", {
      params: { dateRange },
    })
  );
  return res.data?.data || [];
}
