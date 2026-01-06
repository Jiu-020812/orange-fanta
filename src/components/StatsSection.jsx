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
 * - IN: 입고(재고 반영, price는 항상 null이 정상)
 * - PURCHASE: 매입(가격 필수, 재고에는 반영 X)
 * - OUT: 판매(재고 반영, price는 선택 / 그래프는 price 있는 것만)
 *
 *  미입고(= 아직 입고 안 된 매입 수량)
 *   = PURCHASE 수량 - IN 수량
 *
 *  그래프(단가)
 * - 매입 단가: PURCHASE(가격 있는 것)만
 * - 판매 단가: OUT 중 price 있는 것만
 *
 *  레거시(IN+price)는 StatsSection에서 억지로 커버하지 않고
 *    별도 스크립트로 PURCHASE로 마이그레이션하는 걸 권장(= B안 목표)
 */
export default function StatsSection({ records, itemName }) {
  const safeRecords = Array.isArray(records) ? records : [];

  const [showPurchase, setShowPurchase] = useState(true);
  const [showSale, setShowSale] = useState(true);

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

    const normType = (t) => {
      const x = String(t || "").toUpperCase();
      if (x === "OUT") return "OUT";
      if (x === "PURCHASE") return "PURCHASE";
      return "IN";
    };

    // 날짜별 집계
    const map = new Map();

    // ===== 수량 집계(미입고/미입력) =====
    let inQtyAll = 0; // IN 총 수량
    let purchaseQtyAll = 0; // PURCHASE 총 수량
    let outQtyAll = 0; // OUT 총 수량
    let outPricedQty = 0; // price 있는 OUT 수량

    // ===== 단가 통계(가격 입력된 것만) =====
    let purchaseTotalAmount = 0;
    let purchaseTotalQty = 0;
    let saleTotalAmount = 0;
    let saleTotalQty = 0;

    let minPurchaseUnit = null;
    let maxPurchaseUnit = null;
    let minSaleUnit = null;
    let maxSaleUnit = null;

    const ensureRow = (dateOnly) => {
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
      return map.get(dateOnly);
    };

    const addPurchase = (row, qty, amountRaw) => {
      purchaseQtyAll += qty;

      const amount = toNum(amountRaw, 0);

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
    };

    const addSale = (row, qty, amountRaw) => {
      const amount = toNum(amountRaw, 0);

      row.saleAmount += amount;
      row.saleQty += qty;

      saleTotalAmount += amount;
      saleTotalQty += qty;

      const unit = amount / qty;
      if (Number.isFinite(unit)) {
        minSaleUnit = minSaleUnit == null ? unit : Math.min(minSaleUnit, unit);
        maxSaleUnit = maxSaleUnit == null ? unit : Math.max(maxSaleUnit, unit);
      }
    };

    for (const r of safeRecords) {
      if (!r) continue;
      if (!inRange(r.date)) continue;

      const dateOnly = toYmd(r.date);
      if (!dateOnly) continue;

      const type = normType(r.type);
      const qty = toNum(r.count, 0);
      if (qty <= 0) continue;

      const row = ensureRow(dateOnly);

      const rawPrice = r.price;

      // IN: 입고 수량만 (price는 무시/정상적으로는 null)
      if (type === "IN") {
        inQtyAll += qty;
        continue;
      }

      //  PURCHASE: 매입(가격 있을 때만 차트/단가)
      if (type === "PURCHASE") {
        if (hasPrice(rawPrice)) {
          addPurchase(row, qty, rawPrice);
        } else {
          // 수량은 '매입'으로는 들어왔지만 가격이 없으면 통계/그래프에는 반영하지 않음
          purchaseQtyAll += qty;
        }
        continue;
      }

      //  OUT: 판매 (price 있을 때만 차트/단가)
      if (type === "OUT") {
        outQtyAll += qty;

        if (hasPrice(rawPrice)) {
          outPricedQty += qty;
          addSale(row, qty, rawPrice);
        }
        continue;
      }
    }

    const data = Array.from(map.values())
      .sort((a, b) => (a.dateOnly > b.dateOnly ? 1 : -1))
      .map((d) => ({
        label: d.label,
        purchaseUnit:
          d.purchaseQty > 0 ? Math.round(d.purchaseAmount / d.purchaseQty) : null,
        saleUnit: d.saleQty > 0 ? Math.round(d.saleAmount / d.saleQty) : null,
      }));

    const hasChartValue = data.some(
      (d) => Number.isFinite(d.purchaseUnit) || Number.isFinite(d.saleUnit)
    );

    const avgPurchaseUnit =
      purchaseTotalQty > 0
        ? Math.round(purchaseTotalAmount / purchaseTotalQty)
        : null;
    const avgSaleUnit =
      saleTotalQty > 0 ? Math.round(saleTotalAmount / saleTotalQty) : null;

    //  미입고(매입은 됐는데 아직 안 들어온 수량)
    const pendingIn = Math.max(0, purchaseQtyAll - inQtyAll);

    // 판매가(가격) 미입력 OUT 수량
    const missingSaleQty = Math.max(0, outQtyAll - outPricedQty);

    return {
      data,
      hasChartValue,
      pendingIn,
      missingSaleQty,
      avgPurchaseUnit,
      avgSaleUnit,
      minPurchaseUnit: minPurchaseUnit == null ? null : Math.round(minPurchaseUnit),
      maxPurchaseUnit: maxPurchaseUnit == null ? null : Math.round(maxPurchaseUnit),
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
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div
        style={{
          background: "#111827",
          color: "#fff",
          borderRadius: 10,
          padding: "8px 10px",
          fontSize: 12,
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{label}</div>
        {payload.map((p) => {
          const name = p.dataKey === "purchaseUnit" ? "매입 단가" : "판매 단가";
          const v = p.value;
          return (
            <div key={p.dataKey} style={{ opacity: 0.95 }}>
              {name}:{" "}
              {Number.isFinite(Number(v)) ? `${Number(v).toLocaleString()}원` : "-"}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      {/* 타이틀 + 토글 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
          📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
        </h2>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowPurchase((v) => !v)}
            style={chipBtn(showPurchase)}
          >
            매입
          </button>
          <button
            type="button"
            onClick={() => setShowSale((v) => !v)}
            style={chipBtn(showSale)}
          >
            판매
          </button>
        </div>
      </div>

      {/* 기간 컨트롤 */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
        }}
      >
        <button type="button" onClick={() => setMode("7")} style={pill(mode === "7")}>
          최근 7일
        </button>
        <button
          type="button"
          onClick={() => setMode("30")}
          style={pill(mode === "30")}
        >
          최근 30일
        </button>
        <button
          type="button"
          onClick={() => setMode("90")}
          style={pill(mode === "90")}
        >
          최근 90일
        </button>
        <button
          type="button"
          onClick={() => setMode("ALL")}
          style={pill(mode === "ALL")}
        >
          전체
        </button>

        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 6 }}>
          기간:
        </span>

        <input
          type="date"
          value={from}
          onChange={(e) => {
            setMode("CUSTOM");
            setFrom(e.target.value);
          }}
          style={dateInput}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>~</span>
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setMode("CUSTOM");
            setTo(e.target.value);
          }}
          style={dateInput}
        />
      </div>

      {/* 요약 */}
      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        <div>
          • 적용 기간: <b>{periodText}</b>
        </div>

        <div>
          • 평균 매입 단가:{" "}
          <b>
            {computed.avgPurchaseUnit != null
              ? `${computed.avgPurchaseUnit.toLocaleString()}원`
              : "-"}
          </b>
          {computed.avgPurchaseUnit != null && (
            <span>
              {" "}
              (최저 {computed.minPurchaseUnit?.toLocaleString() ?? "-"}원 / 최고{" "}
              {computed.maxPurchaseUnit?.toLocaleString() ?? "-"}원)
            </span>
          )}
        </div>

        <div>
          • 평균 판매 단가:{" "}
          <b>
            {computed.avgSaleUnit != null
              ? `${computed.avgSaleUnit.toLocaleString()}원`
              : "-"}
          </b>
          {computed.avgSaleUnit != null && (
            <span>
              {" "}
              (최저 {computed.minSaleUnit?.toLocaleString() ?? "-"}원 / 최고{" "}
              {computed.maxSaleUnit?.toLocaleString() ?? "-"}원)
            </span>
          )}
        </div>

        <div>
          • 미입고 재고: <b>{computed.pendingIn}</b>개 · 판매가 미입력:{" "}
          <b>{computed.missingSaleQty}</b>개
        </div>
      </div>

      {/* 차트 */}
      {!computed.hasChartValue ? (
        <div style={{ marginTop: 14, fontSize: 13, color: "#6b7280" }}>
          가격이 입력된 매입·판매 기록이 없어요. (가격 입력된 기록만 그래프에 반영)
        </div>
      ) : (
        <div style={{ width: "100%", height: 240, marginTop: 8 }}>
          <ResponsiveContainer>
            <BarChart
              data={computed.data}
              barSize={14}
              barCategoryGap={18}
              maxBarSize={18}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
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
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/* styles */
const chipBtn = (active) => ({
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: active ? "#111827" : "#ffffff",
  color: active ? "#ffffff" : "#111827",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
});

const pill = (active) => ({
  padding: "5px 9px",
  borderRadius: 10,
  border: "1px solid " + (active ? "#2563eb" : "#e5e7eb"),
  background: active ? "#2563eb" : "#ffffff",
  color: active ? "#ffffff" : "#111827",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
});

const dateInput = {
  height: 28,
  padding: "0 8px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 12,
};
