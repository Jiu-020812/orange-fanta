export function formatNumber(num) {
  if (num == null || isNaN(num)) return "0";
  return Number(num).toLocaleString("ko-KR");
}

export function formatCurrency(num) {
  return `₩${formatNumber(num)}`;
}

export function toYmd(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normType(t) {
  const v = String(t ?? "").toUpperCase();
  if (v === "IN") return "IN";
  if (v === "OUT") return "OUT";
  if (v === "PURCHASE") return "PURCHASE";
  return "IN";
}

export function getTypeLabel(type) {
  const normalized = normType(type);
  switch (normalized) {
    case "IN":
      return "입고";
    case "OUT":
      return "출고";
    case "PURCHASE":
      return "구매";
    default:
      return "입고";
  }
}

export function getTypeColor(type) {
  const normalized = normType(type);
  switch (normalized) {
    case "IN":
      return "#10b981";
    case "OUT":
      return "#f59e0b";
    case "PURCHASE":
      return "#3b82f6";
    default:
      return "#10b981";
  }
}
