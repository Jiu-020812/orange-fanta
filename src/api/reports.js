import client from "./client";
import { request } from "./request";
import { unwrapObject } from "./utils";

// 파라미터를 URL 쿼리 파라미터로 변환
function buildParams(rangeOrCustom) {
  if (typeof rangeOrCustom === "string") {
    return { dateRange: rangeOrCustom };
  }
  // 커스텀 날짜 범위 { startDate, endDate }
  return rangeOrCustom;
}

// 매출 분석 데이터 가져오기
export async function getSalesAnalysis(rangeOrCustom = "7days") {
  const res = await request(() =>
    client.get("/api/reports/sales-analysis", {
      params: buildParams(rangeOrCustom),
    })
  );
  return res.data?.data || [];
}

// 재고 회전율 데이터 가져오기
export async function getInventoryTurnover(rangeOrCustom = "7days") {
  const res = await request(() =>
    client.get("/api/reports/inventory-turnover", {
      params: buildParams(rangeOrCustom),
    })
  );
  return res.data?.data || [];
}

// 수익률 분석 데이터 가져오기
export async function getProfitAnalysis(rangeOrCustom = "7days") {
  const res = await request(() =>
    client.get("/api/reports/profit-analysis", {
      params: buildParams(rangeOrCustom),
    })
  );
  return res.data?.data || {};
}

// TOP 제품 데이터 가져오기
export async function getTopProducts(rangeOrCustom = "7days") {
  const res = await request(() =>
    client.get("/api/reports/top-products", {
      params: buildParams(rangeOrCustom),
    })
  );
  return res.data?.data || [];
}

// 카테고리별 판매 분포 가져오기
export async function getCategoryBreakdown(rangeOrCustom = "7days") {
  const res = await request(() =>
    client.get("/api/reports/category-breakdown", {
      params: buildParams(rangeOrCustom),
    })
  );
  return res.data?.data || [];
}
