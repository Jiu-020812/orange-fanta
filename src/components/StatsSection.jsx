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
 * - records: [{ id, type: "IN"|"OUT", price: number|null, count: number, date: string|Date, ... }]
 * - itemName: 그래프 제목에 표시할 품목 이름
 * - days: (optional) 최근 N일 기준으로 필터링 (기본 30)
 */
export default function StatsSection({ records, itemName, days = 30 }) {
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

  const isPriceEntered = (r) => Number.isFinite(Number(r?.price));
  const nCount = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
    };

  // 기간 필터 (최근 N일)
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (Number(days) - 1));
  const fromISO = toDateOnly(from);

  const filtered = safeRecords
    .map((r) => ({ ...r, dateOnly: toDateOnly(r.date) }))
    .filter((r) => r.dateOnly && (!fromISO || r.dateOnly >= fromISO));

  // 날짜별 집계: IN/OUT 각각 (가격 있는 것만 단가 계산)
  const map = new Map();
  let missingInQty = 0;
  let missingOutQty = 0;

  for (const r of filtered) {
    const key = r.dateOnly;
    if (!map.has(key)) {
      map.set(key, {
        label: key.slice(5), // "MM-DD"로 짧게
        dateOnly: key,
        inTotal: 0,
        inQty: 0,
        outTotal: 0,
        outQty: 0,
      });
    }
    const row = map.get(key);

    const type = String(r.type || "").toUpperCase();
    const qty = nCount(r.count);
    const price = Number(r.price);

    if (type === "IN") {
      if (isPriceEntered(r)) {
        row.inTotal += price;
        row.inQty += qty;
      } else {
        missingInQty += qty;
      }
    } else if (type === "OUT") {
      if (isPriceEntered(r)) {
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

  // 데이터가 전혀 없으면 안내
  const hasAny = data.some((d) => Number.isFinite(d.purchaseUnit) || Number.isFinite(d.saleUnit));

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
        <h2 style={{ marginBottom: 8, fontSize: 18, fontWeight: 600, color: "#111827" }}>
          📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
        </h2>

        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
          최근 {days}일 동안 <b>가격이 입력된</b> 입고/출고 기록이 없어요.
          <br />
          (가격 미입력 기록은 재고에는 반영되지만, 그래프에는 포함되지 않아요)
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
          • 원가 미입력 입고 수량: <b>{missingInQty}</b>
          <br />• 판매가 미입력 출고 수량: <b>{missingOutQty}</b>
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
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ marginBottom: 6, fontSize: 18, fontWeight: 600, color: "#111827" }}>
          📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
        </h2>

        <div style={{ fontSize: 12, color: "#6b7280" }}>
          최근 {days}일
        </div>
      </div>

      <div style={{ marginBottom: 10, fontSize: 12, color: "#6b7280" }}>
        • <b>가격 입력된 기록만</b> 그래프에 반영돼요. (단가 = 총액 ÷ 수량)
        <br />
        • 원가 미입력 입고: <b>{missingInQty}</b>개 · 판매가 미입력 출고: <b>{missingOutQty}</b>개
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(value, name) => {
                if (!Number.isFinite(Number(value))) return ["-", name];
                const label = name === "purchaseUnit" ? "매입 단가" : "판매 단가";
                return [`${Number(value).toLocaleString()}원`, label];
              }}
              labelFormatter={(l) => `${l}`}
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: 10,
                padding: "8px 10px",
                color: "#e5e7eb",
              }}
              labelStyle={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}
              itemStyle={{ fontSize: 12 }}
            />
            <Legend
              formatter={(v) => (v === "purchaseUnit" ? "매입 단가" : "판매 단가")}
            />
            <Bar dataKey="purchaseUnit" name="purchaseUnit" />
            <Bar dataKey="saleUnit" name="saleUnit" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
