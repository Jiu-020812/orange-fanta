const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getPurchaseOrders(status) {
  let url = `${API_URL}/api/purchase-orders`;
  if (status) {
    url += `?status=${status}`;
  }
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "발주서 목록 조회 실패");
  }
  return res.json();
}

export async function getPurchaseOrder(orderId) {
  const res = await fetch(`${API_URL}/api/purchase-orders/${orderId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "발주서 조회 실패");
  }
  return res.json();
}

export async function createPurchaseOrder(orderData) {
  const res = await fetch(`${API_URL}/api/purchase-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "발주서 생성 실패");
  }
  return res.json();
}

export async function updatePurchaseOrderStatus(orderId, status) {
  const res = await fetch(`${API_URL}/api/purchase-orders/${orderId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "발주서 상태 업데이트 실패");
  }
  return res.json();
}

export async function receivePurchaseOrder(orderId, items) {
  const res = await fetch(`${API_URL}/api/purchase-orders/${orderId}/receive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "입고 처리 실패");
  }
  return res.json();
}

export async function deletePurchaseOrder(orderId) {
  const res = await fetch(`${API_URL}/api/purchase-orders/${orderId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "발주서 삭제 실패");
  }
  return res.json();
}
