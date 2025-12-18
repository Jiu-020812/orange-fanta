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

  // 처음 진입: 둘 다 보이게
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

  const hasPrice = (v) =>
    v !== null && v !== undefined && Number.isFinite(Number(v));
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const { data, missingInQty, missingOutQty, hasChartValue } = useMemo(() => {
    const map = new Map();
    let missingIn = 0;
    let missingOut = 0;

    for (const r of safeRecords) {
      const dateOnly = toDateOnly(r?.date);
      if (!dateOnly) continue;

      if (!map.has(dateOnly)) {
        map.set(dateOnly, {
          dateOnly,
          label: dateOnly.slice(5), // MM-DD
          inTotal: 0,   // ✅ 총액
          inQty: 0,     // ✅ 수량
          outTotal: 0,
          outQty: 0,
        });
      }

      const row = map.get(dateOnly);
      const type = String(r?.type || "IN").toUpperCase();
      const qty = toNum(r?.count);
      if (qty <= 0) continue;

      const rawPrice = r?.price;

      if (type === "IN") {
        if (hasPrice(rawPrice)) {
          row.inTotal += Number(rawPrice); // ✅ 총액만 더함
          row.inQty += qty;
        } else {
          missingIn += qty;
        }
      } else if (type === "OUT") {
        if (hasPrice(rawPrice)) {
          row.outTotal += Number(rawPrice);
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
        purchaseUnit:
          d.inQty > 0 ? Math.round(d.inTotal / d.inQty) : null,
        saleUnit:
          d.outQty > 0 ? Math.round(d.outTotal / d.outQty) : null,
      }));

    const hasValue = arr.some(
      (d) =>
        Number.isFinite(d.purchaseUnit) ||
        Number.isFinite(d.saleUnit)
    );

    return {
      data: arr,
      missingInQty: missingIn,
      missingOutQty: missingOut,
      hasChartValue: hasValue,
    };
  }, [safeRecords]);

  const effectiveShowPurchase =
    showPurchase || (!showPurchase && !showSale);
  const effectiveShowSale =
    showSale || (!showPurchase && !showSale);

  if (!hasChartValue) {
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

        <div style={{ fontSize: 13, color: "#6b7280" }}>
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
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>
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
                `${Number(v).toLocaleString()}원`,
                name === "purchaseUnit" ? "매입 단가" : "판매 단가",
              ]}
            />
            <Legend />

            {effectiveShowPurchase && (
              <Bar dataKey="purchaseUnit" fill="#79ABFF" name="매입 단가" />
            )}
            {effectiveShowSale && (
              <Bar dataKey="saleUnit" fill="#FF7ECA" name="판매 단가" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
