const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getLots(itemId) {
  const url = itemId
    ? `${API_URL}/api/lots?itemId=${itemId}`
    : `${API_URL}/api/lots`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "로트 목록 조회 실패");
  }
  return res.json();
}

export async function createLot(lotData) {
  const res = await fetch(`${API_URL}/api/lots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(lotData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "로트 생성 실패");
  }
  return res.json();
}

export async function updateLot(lotId, lotData) {
  const res = await fetch(`${API_URL}/api/lots/${lotId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(lotData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "로트 수정 실패");
  }
  return res.json();
}

export async function deleteLot(lotId) {
  const res = await fetch(`${API_URL}/api/lots/${lotId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "로트 삭제 실패");
  }
  return res.json();
}

export async function getNextLotForShipment(itemId) {
  const res = await fetch(`${API_URL}/api/lots/next-for-shipment?itemId=${itemId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "출고 로트 조회 실패");
  }
  return res.json();
}

export async function getExpiringLots(days = 30) {
  const res = await fetch(`${API_URL}/api/lots/expiring?days=${days}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "만료 예정 로트 조회 실패");
  }
  return res.json();
}
