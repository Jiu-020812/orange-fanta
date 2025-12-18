import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * props
 * - records: [{ id, type: "IN"|"OUT", price: number|null, count: number, date }]
 * - itemName: 그래프 제목에 표시할 품목 이름
 * - days: 최근 N일 기준 (기본 30)
 */
export default function StatsSection({ records, itemName, days = 30 }) {
  const safeRecords = Array.isArray(records) ? records : [];

  /* ---------- utils ---------- */
  const toDateOnly = (d) => {
    try {
      const s = String(d ?? "");
      if (s.length >= 10) return s.slice(0, 10);
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return null;
    }
  };

  const hasPrice = (v) => Number.isFinite(Number(v));
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  /* ---------- 기간 필터 ---------- */
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (Number(days) - 1));
  const fromISO = toDateOnly(from);

  const filtered = safeRecords
    .map((r) => ({ ...r, dateOnly: toDateOnly(r.date) }))
    .filter((r) => r.dateOnly && (!fromISO || r.dateOnly >= fromISO));

  /* ---------- 날짜별 집계 ---------- */
  const map = new Map();
  let missingInQty = 0;
  let missingOutQty = 0;

  for (const r of filtered) {
    const key = r.dateOnly;
    if (!map.has(key)) {
      map.set(key, {
        dateOnly: key,
        label: key.slice(5), // 표시용 MM-DD
        inTotal: 0,
        inQty: 0,
        outTotal: 0,
        outQty: 0,
      });
    }

    const row = map.get(key);
    const type = String(r.type || "").toUpperCase();
    const qty = n(r.count);
    const price = Number(r.price);

    if (type === "IN") {
      if (hasPrice(price)) {
        row.inTotal += price;
        row.inQty += qty;
      } else {
        missingInQty += qty;
      }
    }

    if (type === "OUT") {
      if (hasPrice(price)) {
        row.outTotal += price;
        row.outQty += qty;
      } else {
        missingOutQty += qty;
      }
    }
  }

  /* ---------- 차트 데이터 ---------- */
  const data = Array.from(map.values())
    .sort((a, b) => (a.dateOnly > b.dateOnly ? 1 : -1))
    .map((d) => ({
      label: d.label,
      purchaseUnit: d.inQty > 0 ? Math.round(d.inTotal / d.inQty) : null,
      saleUnit: d.outQty > 0 ? Math.round(d.outTotal / d.outQty) : null,
    }));

  const hasAny = data.some(
    (d) => Number.isFinite(d.purchaseUnit) || Number.isFinite(d.saleUnit)
  );

  /* ---------- empty ---------- */
  if (!hasAny) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          minHeight: 260,
        }}
      >
        <h2 style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>
          📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
        </h2>

        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
          최근 {days}일 동안 <b>가격이 입력된</b> 입고/출고 기록이 없어요.
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
          • 원가 미입력 입고: <b>{missingInQty}</b>개<br />
          • 판매가 미입력 출고: <b>{missingOutQty}</b>개
        </div>
      </div>
    );
  }

  /* ---------- chart ---------- */
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>
          📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
        </h2>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          최근 {days}일
        </div>
      </div>

      <div style={{ marginBottom: 10, fontSize: 12, color: "#6b7280" }}>
        • 단가 = 총액 ÷ 수량 (가격 입력된 기록만 반영)
        <br />
        • 미입력 입고 <b>{missingInQty}</b>개 · 출고 <b>{missingOutQty}</b>개
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(value, name) => {
                if (!Number.isFinite(Number(value))) return ["-", name];
                return [
                  `${Number(value).toLocaleString()}원`,
                  name === "purchaseUnit" ? "매입 단가" : "판매 단가",
                ];
              }}
            />
            <Legend
              formatter={(v) =>
                v === "purchaseUnit" ? "매입 단가" : "판매 단가"
              }
            />
            <Bar dataKey="purchaseUnit" />
            <Bar dataKey="saleUnit" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
