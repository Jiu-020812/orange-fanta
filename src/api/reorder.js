const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * 재주문 포인트 자동 계산
 */
export async function calculateReorderPoint(itemId) {
  const res = await fetch(`${API_URL}/api/reorder/calculate/${itemId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "재주문 포인트 계산 실패");
  }
  return res.json();
}

/**
 * 재주문 포인트 설정 업데이트
 */
export async function updateReorderSettings(itemId, settings) {
  const res = await fetch(`${API_URL}/api/reorder/settings/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "재주문 설정 업데이트 실패");
  }
  return res.json();
}

/**
 * 재주문 알림 목록 가져오기
 */
export async function getReorderAlerts() {
  const res = await fetch(`${API_URL}/api/reorder/alerts`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "재주문 알림 조회 실패");
  }
  return res.json();
}
