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
 * - records: [{ id, type: "IN"|"OUT", price, count, date }]
 * - itemName: 그래프 제목
 */
export default function StatsSection({ records, itemName }) {
  const safeRecords = Array.isArray(records) ? records : [];

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

  /* ---------- 날짜별 집계 ---------- */
  const map = new Map();
  let missingInQty = 0;
  let missingOutQty = 0;

  for (const r of safeRecords) {
    const dateOnly = toDateOnly(r.date);
    if (!dateOnly) continue;

    if (!map.has(dateOnly)) {
      map.set(dateOnly, {
        dateOnly,
        label: dateOnly.slice(5), // MM-DD
        inTotal: 0,
        inQty: 0,
        outTotal: 0,
        outQty: 0,
      });
    }

    const row = map.get(dateOnly);
    const type = String(r.type || "IN").toUpperCase();
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

  if (!hasAny) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          minHeight: 260,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>
          📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
        </h2>
        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
          가격이 입력된 입·출고 기록이 없어요.
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
          • 원가 미입력 입고: <b>{missingInQty}</b>개<br />
          • 판매가 미입력 출고: <b>{missingOutQty}</b>개
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
        📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
      </h2>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(v, name) => [
                Number.isFinite(v) ? `${v.toLocaleString()}원` : "-",
                name === "purchaseUnit" ? "매입 단가" : "판매 단가",
              ]}
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
