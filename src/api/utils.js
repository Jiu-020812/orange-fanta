function safeNumber(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toISODateOnly(d) {
  if (!d) return undefined;
  const s = String(d);
  if (s.length >= 10) return s.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

function normType(t) {
  const v = String(t ?? "").toUpperCase();
  if (v === "IN") return "IN";
  if (v === "OUT") return "OUT";
  if (v === "PURCHASE") return "PURCHASE";
  return "IN";
}

function unwrapArray(data) {
  if (Array.isArray(data)) return data;
  if (data?.records && Array.isArray(data.records)) return data.records;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

function unwrapObject(data) {
  if (data?.item) return data.item;
  if (data?.record) return data.record;
  return data;
}

export {
  safeNumber,
  toISODateOnly,
  normType,
  unwrapArray,
  unwrapObject,
};
