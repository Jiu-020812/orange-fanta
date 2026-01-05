import { useMemo, useState, useEffect } from "react";
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

  // 보기 토글
  const [showPurchase, setShowPurchase] = useState(true);
  const [showSale, setShowSale] = useState(true);

  // 기간 필터
  const [mode, setMode] = useState("ALL"); // "7" | "30" | "90" | "ALL" | "CUSTOM"
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(() => toYmd(new Date()));

  useEffect(() => {
    if (mode === "CUSTOM") return;

    const today = toYmd(new Date());
    if (mode === "ALL") {
      setFrom("");
      setTo(today);
      return;
    }

    const days = Number(mode);
    const endDate = new Date(today + "T00:00:00");
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));

    setFrom(toYmd(startDate));
    setTo(today);
  }, [mode]);

  // 둘 다 꺼지면 빈 차트 방지
  const effectiveShowPurchase = showPurchase || (!showPurchase && !showSale);
  const effectiveShowSale = showSale || (!showPurchase && !showSale);

  const computed = useMemo(() => {
    const hasPrice = (v) =>
      v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
    const toNum = (v, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const inRange = (d) => {
      const ymd = toYmd(d);
      if (!ymd) return false;
      if (mode === "ALL") return true;
      if (from && ymd < from) return false;
      if (to && ymd > to) return false;
      return true;
    };

    const map = new Map();

    // 🔹 수량 누적 (미입력 계산용)
    let inQtyAll = 0;        // 전체 입고
    let inPricedQty = 0;     // price 있는 입고 (= 매입)
    let outQtyAll = 0;       // 전체 출고
    let outPricedQty = 0;    // price 있는 출고

    // 🔹 단가 통계
    let purchaseTotalAmount = 0;
    let purchaseTotalQty = 0;
    let saleTotalAmount = 0;
    let saleTotalQty = 0;

    let minPurchaseUnit = null;
    let maxPurchaseUnit = null;
    let minSaleUnit = null;
    let maxSaleUnit = null;

    for (const r of safeRecords) {
      if (!r) continue;
      if (!inRange(r.date)) continue;

      const dateOnly = toYmd(r.date);
      if (!dateOnly) continue;

      const type = String(r.type || "IN").toUpperCase(); // IN / OUT
      const qty = toNum(r.count, 0);
      if (qty <= 0) continue;

      if (!map.has(dateOnly)) {
        map.set(dateOnly, {
          dateOnly,
          label: dateOnly.slice(5),
          purchaseAmount: 0,
          purchaseQty: 0,
          saleAmount: 0,
          saleQty: 0,
        });
      }
      const row = map.get(dateOnly);
      const rawPrice = r.price;

      // ================= IN (입고 / 매입)
      if (type === "IN") {
        inQtyAll += qty;

        if (hasPrice(rawPrice)) {
          // 👉 매입
          inPricedQty += qty;

          const amount = toNum(rawPrice, 0);
          row.purchaseAmount += amount;
          row.purchaseQty += qty;

          purchaseTotalAmount += amount;
          purchaseTotalQty += qty;

          const unit = amount / qty;
          if (Number.isFinite(unit)) {
            minPurchaseUnit =
              minPurchaseUnit == null ? unit : Math.min(minPurchaseUnit, unit);
            maxPurchaseUnit =
              maxPurchaseUnit == null ? unit : Math.max(maxPurchaseUnit, unit);
          }
        }
        continue;
      }

      // ================= OUT (판매)
      if (type === "OUT") {
        outQtyAll += qty;

        if (hasPrice(rawPrice)) {
          outPricedQty += qty;

          const amount = toNum(rawPrice, 0);
          row.saleAmount += amount;
          row.saleQty += qty;

          saleTotalAmount += amount;
          saleTotalQty += qty;

          const unit = amount / qty;
          if (Number.isFinite(unit)) {
            minSaleUnit =
              minSaleUnit == null ? unit : Math.min(minSaleUnit, unit);
            maxSaleUnit =
              maxSaleUnit == null ? unit : Math.max(maxSaleUnit, unit);
          }
        }
      }
    }

    const data = Array.from(map.values())
      .sort((a, b) => (a.dateOnly > b.dateOnly ? 1 : -1))
      .map((d) => ({
        label: d.label,
        purchaseUnit:
          d.purchaseQty > 0
            ? Math.round(d.purchaseAmount / d.purchaseQty)
            : null,
        saleUnit:
          d.saleQty > 0 ? Math.round(d.saleAmount / d.saleQty) : null,
      }));

    const hasChartValue = data.some(
      (d) => Number.isFinite(d.purchaseUnit) || Number.isFinite(d.saleUnit)
    );

    const avgPurchaseUnit =
      purchaseTotalQty > 0
        ? Math.round(purchaseTotalAmount / purchaseTotalQty)
        : null;
    const avgSaleUnit =
      saleTotalQty > 0
        ? Math.round(saleTotalAmount / saleTotalQty)
        : null;

    // ✅ 가격 미입력 (A안 핵심)
    const missingPurchaseQty = Math.max(0, inQtyAll - inPricedQty);
    const missingSaleQty = Math.max(0, outQtyAll - outPricedQty);

    return {
      data,
      hasChartValue,
      missingPurchaseQty,
      missingSaleQty,
      avgPurchaseUnit,
      avgSaleUnit,
      minPurchaseUnit:
        minPurchaseUnit == null ? null : Math.round(minPurchaseUnit),
      maxPurchaseUnit:
        maxPurchaseUnit == null ? null : Math.round(maxPurchaseUnit),
      minSaleUnit: minSaleUnit == null ? null : Math.round(minSaleUnit),
      maxSaleUnit: maxSaleUnit == null ? null : Math.round(maxSaleUnit),
    };
  }, [safeRecords, mode, from, to]);

  const periodText = useMemo(() => {
    if (mode === "ALL") return "전체";
    if (mode === "CUSTOM") return `${from || "?"} ~ ${to || "?"}`;
    return `최근 ${mode}일`;
  }, [mode, from, to]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#111827", color: "#fff", padding: 8, borderRadius: 8 }}>
        <b>{label}</b>
        {payload.map((p) => (
          <div key={p.dataKey}>
            {p.dataKey === "purchaseUnit" ? "매입" : "판매"}:{" "}
            {p.value != null ? `${p.value.toLocaleString()}원` : "-"}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: 16, borderRadius: 16, border: "1px solid #e5e7eb" }}>
      <h3>📊 단가 그래프 {itemName ? `- ${itemName}` : ""}</h3>

      <div style={{ fontSize: 12, color: "#6b7280" }}>
        • 기간: <b>{periodText}</b><br />
        • 가격 미입력: 매입 <b>{computed.missingPurchaseQty}</b>개 · 판매{" "}
        <b>{computed.missingSaleQty}</b>개
      </div>

      {!computed.hasChartValue ? (
        <div style={{ marginTop: 12, color: "#6b7280" }}>
          가격 입력된 매입·판매 기록이 없어요.
        </div>
      ) : (
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={computed.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {effectiveShowPurchase && (
                <Bar dataKey="purchaseUnit" name="매입 단가" fill="#79ABFF" />
              )}
              {effectiveShowSale && (
                <Bar dataKey="saleUnit" name="판매 단가" fill="#FF7ECA" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* utils */
function toYmd(v) {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
