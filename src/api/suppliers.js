const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getSuppliers(isActive) {
  let url = `${API_URL}/api/suppliers`;
  if (isActive !== undefined) {
    url += `?isActive=${isActive}`;
  }
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "공급업체 목록 조회 실패");
  }
  return res.json();
}

export async function createSupplier(supplierData) {
  const res = await fetch(`${API_URL}/api/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(supplierData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "공급업체 생성 실패");
  }
  return res.json();
}

export async function updateSupplier(supplierId, supplierData) {
  const res = await fetch(`${API_URL}/api/suppliers/${supplierId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(supplierData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "공급업체 수정 실패");
  }
  return res.json();
}

export async function deleteSupplier(supplierId) {
  const res = await fetch(`${API_URL}/api/suppliers/${supplierId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "공급업체 삭제 실패");
  }
  return res.json();
}
