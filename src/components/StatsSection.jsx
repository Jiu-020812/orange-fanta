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

  // 표시 토글
  const [showPurchase, setShowPurchase] = useState(true);
  const [showSale, setShowSale] = useState(true);

  // 프리셋 기간
  const [presetDays, setPresetDays] = useState(30); // 7 | 30 | 90 | "ALL"

  // 직접 기간
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ---------------- utils ---------------- */
  const toDateOnly = (d) => {
    try {
      const s = String(d ?? "");
      if (s.length >= 10) return s.slice(0, 10);
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return null;
    }
  };

  const parseDate = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  const hasPrice = (v) =>
    v !== null && v !== undefined && Number.isFinite(Number(v));
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const effectiveShowPurchase = showPurchase || (!showPurchase && !showSale);
  const effectiveShowSale = showSale || (!showPurchase && !showSale);

  /* ---------------- 핵심 계산 ---------------- */
  const {
    data,
    missingInQty,
    missingOutQty,
    avgPurchaseUnit,
    avgSaleUnit,
    minPurchaseUnit,
    maxPurchaseUnit,
    minSaleUnit,
    maxSaleUnit,
    hasChartValue,
  } = useMemo(() => {
    // 1️⃣ 기간 계산
    let start = null;
    let end = null;

    if (fromDate && toDate) {
      start = parseDate(fromDate);
      end = parseDate(toDate);
      if (end) end.setHours(23, 59, 59, 999);
    } else if (presetDays !== "ALL") {
      const dates = safeRecords
        .map((r) => parseDate(toDateOnly(r?.date)))
        .filter(Boolean);
      const max = dates.length ? new Date(Math.max(...dates)) : null;
      if (max) {
        start = new Date(max);
        start.setDate(start.getDate() - (presetDays - 1));
      }
    }

    // 2️⃣ 집계
    const map = new Map();
    let missingIn = 0;
    let missingOut = 0;

    let inAmountSum = 0;
    let inQtySum = 0;
    let outAmountSum = 0;
    let outQtySum = 0;

    let inMin = null;
    let inMax = null;
    let outMin = null;
    let outMax = null;

    for (const r of safeRecords) {
      const d0 = toDateOnly(r?.date);
      const d = parseDate(d0);
      if (!d) continue;
      if (start && d < start) continue;
      if (end && d > end) continue;

      if (!map.has(d0)) {
        map.set(d0, {
          label: d0.slice(5),
          inAmount: 0,
          inQty: 0,
          outAmount: 0,
          outQty: 0,
        });
      }

      const row = map.get(d0);
      const qty = toNum(r?.count);
      if (qty <= 0) continue;

      const type = String(r?.type || "IN").toUpperCase();
      const price = r?.price;

      if (type === "IN") {
        if (hasPrice(price)) {
          row.inAmount += price;
          row.inQty += qty;
          inAmountSum += price;
          inQtySum += qty;

          const unit = price / qty;
          inMin = inMin == null ? unit : Math.min(inMin, unit);
          inMax = inMax == null ? unit : Math.max(inMax, unit);
        } else {
          missingIn += qty;
        }
      } else {
        if (hasPrice(price)) {
          row.outAmount += price;
          row.outQty += qty;
          outAmountSum += price;
          outQtySum += qty;

          const unit = price / qty;
          outMin = outMin == null ? unit : Math.min(outMin, unit);
          outMax = outMax == null ? unit : Math.max(outMax, unit);
        } else {
          missingOut += qty;
        }
      }
    }

    const arr = Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([, d]) => ({
        label: d.label,
        purchaseUnit: d.inQty ? Math.round(d.inAmount / d.inQty) : null,
        saleUnit: d.outQty ? Math.round(d.outAmount / d.outQty) : null,
      }));

    return {
      data: arr,
      missingInQty: missingIn,
      missingOutQty: missingOut,
      avgPurchaseUnit: inQtySum ? Math.round(inAmountSum / inQtySum) : null,
      avgSaleUnit: outQtySum ? Math.round(outAmountSum / outQtySum) : null,
      minPurchaseUnit: inMin && Math.round(inMin),
      maxPurchaseUnit: inMax && Math.round(inMax),
      minSaleUnit: outMin && Math.round(outMin),
      maxSaleUnit: outMax && Math.round(outMax),
      hasChartValue: arr.some(
        (d) =>
          Number.isFinite(d.purchaseUnit) || Number.isFinite(d.saleUnit)
      ),
    };
  }, [safeRecords, presetDays, fromDate, toDate]);

  const fmt = (v) => (v == null ? "-" : `${v.toLocaleString()}원`);

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>
        📊 단가 그래프 {itemName && `- ${itemName}`}
      </h2>

      {/* 기간 선택 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => {
              setPresetDays(d);
              setFromDate("");
              setToDate("");
            }}
          >
            최근 {d}일
          </button>
        ))}
        <button onClick={() => setPresetDays("ALL")}>전체</button>

        <span>기간:</span>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        ~
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      {/* 요약 */}
      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
        • 평균 매입 단가: <b>{fmt(avgPurchaseUnit)}</b> (최저 {fmt(minPurchaseUnit)} / 최고 {fmt(maxPurchaseUnit)})<br />
        • 평균 판매 단가: <b>{fmt(avgSaleUnit)}</b> (최저 {fmt(minSaleUnit)} / 최고 {fmt(maxSaleUnit)})<br />
        • 가격 미입력 입고 <b>{missingInQty}</b>개 · 출고 <b>{missingOutQty}</b>개
      </div>

      {/* 차트 */}
      {hasChartValue && (
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {effectiveShowPurchase && <Bar dataKey="purchaseUnit" fill="#79ABFF" />}
              {effectiveShowSale && <Bar dataKey="saleUnit" fill="#FF7ECA" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
