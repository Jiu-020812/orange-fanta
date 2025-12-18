import { useMemo, useState } from "react";
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

  // ✅ 처음 진입: 둘 다 보이게
  const [showPurchase, setShowPurchase] = useState(true);
  const [showSale, setShowSale] = useState(true);

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

  const { data, missingInQty, missingOutQty, hasAny } = useMemo(() => {
    const map = new Map();
    let missingIn = 0;
    let missingOut = 0;

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
          // ✅ 총액은 price * qty 로 집계 (단가 계산이 맞아짐)
          row.inTotal += price * qty;
          row.inQty += qty;
        } else {
          missingIn += qty;
        }
      }

      if (type === "OUT") {
        if (hasPrice(price)) {
          row.outTotal += price * qty;
          row.outQty += qty;
        } else {
          missingOut += qty;
        }
      }
    }

    const arr = Array.from(map.values())
      .sort((a, b) => (a.dateOnly > b.dateOnly ? 1 : -1))
      .map((d) => ({
        label: d.label,
        purchaseUnit: d.inQty > 0 ? Math.round(d.inTotal / d.inQty) : null,
        saleUnit: d.outQty > 0 ? Math.round(d.outTotal / d.outQty) : null,
      }));

    const any = arr.some(
      (d) => Number.isFinite(d.purchaseUnit) || Number.isFinite(d.saleUnit)
    );

    return { data: arr, missingInQty: missingIn, missingOutQty: missingOut, hasAny: any };
  }, [safeRecords]);

  // 토글이 둘 다 꺼지면 자동으로 둘 다 켜주기(빈 차트 방지)
  const effectiveShowPurchase = showPurchase || (!showPurchase && !showSale);
  const effectiveShowSale = showSale || (!showPurchase && !showSale);

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
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
          📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
        </h2>

        {/* ✅ 보기 토글 */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowPurchase((v) => !v)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: showPurchase ? "#111827" : "#ffffff",
              color: showPurchase ? "#ffffff" : "#111827",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            매입
          </button>

          <button
            type="button"
            onClick={() => setShowSale((v) => !v)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: showSale ? "#111827" : "#ffffff",
              color: showSale ? "#ffffff" : "#111827",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            판매
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 10, fontSize: 12, color: "#6b7280" }}>
        • 단가 = 총액 ÷ 수량 (가격 입력된 기록만 반영)<br />
        • 미입력 입고 <b>{missingInQty}</b>개 · 출고 <b>{missingOutQty}</b>개
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} barSize={18} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(v, name) => [
                Number.isFinite(Number(v)) ? `${Number(v).toLocaleString()}원` : "-",
                name === "purchaseUnit" ? "매입 단가" : "판매 단가",
              ]}
            />
            <Legend
              formatter={(v) => (v === "purchaseUnit" ? "매입 단가" : "판매 단가")}
            />

            {/*  색 다르게 지정 */}
            {effectiveShowPurchase && (
              <Bar dataKey="purchaseUnit" name="purchaseUnit" fill="#79ABFF"  />
            )}
            {effectiveShowSale && (
              <Bar dataKey="saleUnit" name="saleUnit" fill="#FF7ECA"  />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
