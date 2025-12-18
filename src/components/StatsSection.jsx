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

  // 기간 필터: quick + 직접 선택
  const [mode, setMode] = useState("7"); // "7" | "30" | "90" | "ALL" | "CUSTOM"
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(() => toYmd(new Date()));

  // mode 바뀌면 from/to 자동 세팅(직접 선택은 유지)
  useEffect(() => {
    if (mode === "CUSTOM") return;
    if (mode === "ALL") {
      setFrom("");
      setTo(toYmd(new Date()));
      return;
    }
    const days = Number(mode);
    const end = toYmd(new Date());
    const endDate = new Date(end + "T00:00:00");
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    setFrom(toYmd(startDate));
    setTo(end);
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
      if (mode === "CUSTOM") {
        if (from && ymd < from) return false;
        if (to && ymd > to) return false;
        return true;
      }
      // quick 모드도 from/to가 세팅되어 있으니 동일 로직
      if (from && ymd < from) return false;
      if (to && ymd > to) return false;
      return true;
    };

    // 일자별 집계
    const map = new Map();

    let missingInQty = 0;
    let missingOutQty = 0;

    // 전체(기간 내) 평균/최저/최고 단가
    let inTotalAmount = 0; // 총액 합(=price 합)
    let inTotalQty = 0;
    let outTotalAmount = 0;
    let outTotalQty = 0;

    let minInUnit = null;
    let maxInUnit = null;
    let minOutUnit = null;
    let maxOutUnit = null;

    for (const r of safeRecords) {
      if (!r) continue;
      if (!inRange(r.date)) continue;

      const dateOnly = toYmd(r.date);
      if (!dateOnly) continue;

      const type = String(r.type || "IN").toUpperCase() === "OUT" ? "OUT" : "IN";
      const qty = toNum(r.count, 0);
      if (!Number.isFinite(qty) || qty <= 0) continue;

      if (!map.has(dateOnly)) {
        map.set(dateOnly, {
          dateOnly,
          label: dateOnly.slice(5), // MM-DD
          inAmount: 0,
          inQty: 0,
          outAmount: 0,
          outQty: 0,
        });
      }
      const row = map.get(dateOnly);

      //  price는 "총액"이다.
      const rawPrice = r.price;
      if (type === "IN") {
        if (hasPrice(rawPrice)) {
          const amount = toNum(rawPrice, 0); // 총액
          row.inAmount += amount;
          row.inQty += qty;

          inTotalAmount += amount;
          inTotalQty += qty;

          const unit = amount / qty; 
          if (Number.isFinite(unit)) {
            minInUnit = minInUnit == null ? unit : Math.min(minInUnit, unit);
            maxInUnit = maxInUnit == null ? unit : Math.max(maxInUnit, unit);
          }
        } else {
          missingInQty += qty;
        }
      } else {
        if (hasPrice(rawPrice)) {
          const amount = toNum(rawPrice, 0);
          row.outAmount += amount;
          row.outQty += qty;

          outTotalAmount += amount;
          outTotalQty += qty;

          const unit = amount / qty;
          if (Number.isFinite(unit)) {
            minOutUnit = minOutUnit == null ? unit : Math.min(minOutUnit, unit);
            maxOutUnit = maxOutUnit == null ? unit : Math.max(maxOutUnit, unit);
          }
        } else {
          missingOutQty += qty;
        }
      }
    }

    const data = Array.from(map.values())
      .sort((a, b) => (a.dateOnly > b.dateOnly ? 1 : -1))
      .map((d) => ({
        label: d.label,
        purchaseUnit: d.inQty > 0 ? Math.round(d.inAmount / d.inQty) : null,
        saleUnit: d.outQty > 0 ? Math.round(d.outAmount / d.outQty) : null,
      }));

    const hasChartValue = data.some(
      (d) => Number.isFinite(d.purchaseUnit) || Number.isFinite(d.saleUnit)
    );

    const avgPurchaseUnit =
      inTotalQty > 0 ? Math.round(inTotalAmount / inTotalQty) : null;
    const avgSaleUnit =
      outTotalQty > 0 ? Math.round(outTotalAmount / outTotalQty) : null;

    return {
      data,
      hasChartValue,
      missingInQty,
      missingOutQty,
      avgPurchaseUnit,
      avgSaleUnit,
      minInUnit: minInUnit == null ? null : Math.round(minInUnit),
      maxInUnit: maxInUnit == null ? null : Math.round(maxInUnit),
      minOutUnit: minOutUnit == null ? null : Math.round(minOutUnit),
      maxOutUnit: maxOutUnit == null ? null : Math.round(maxOutUnit),
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
          gap: 8,
          alignItems: "center",
        }}
      >
        <button type="button" onClick={() => setMode("7")} style={pill(mode === "7")}>
          최근 7일
        </button>
        <button type="button" onClick={() => setMode("30")} style={pill(mode === "30")}>
          최근 30일
        </button>
        <button type="button" onClick={() => setMode("90")} style={pill(mode === "90")}>
          최근 90일
        </button>
        <button type="button" onClick={() => setMode("ALL")} style={pill(mode === "ALL")}>
          전체
        </button>

        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 6 }}>기간:</span>

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

      {/* 요약(기간 바뀌면 같이 바뀜) */}
      <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
        <div>• 적용 기간: <b>{periodText}</b></div>

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
              (최저 {computed.minInUnit?.toLocaleString() ?? "-"}원 / 최고{" "}
              {computed.maxInUnit?.toLocaleString() ?? "-"}원)
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
              (최저 {computed.minOutUnit?.toLocaleString() ?? "-"}원 / 최고{" "}
              {computed.maxOutUnit?.toLocaleString() ?? "-"}원)
            </span>
          )}
        </div>

        <div>
          • 가격 미입력: 입고 <b>{computed.missingInQty}</b>개 · 출고{" "}
          <b>{computed.missingOutQty}</b>개
        </div>
      </div>

      {/* 차트 */}
      {!computed.hasChartValue ? (
        <div style={{ marginTop: 14, fontSize: 13, color: "#6b7280" }}>
          가격이 입력된 입·출고 기록이 없어요. (가격 입력된 기록만 그래프에 반영)
        </div>
      ) : (
        <div style={{ width: "100%", height: 260, marginTop: 8 }}>
          <ResponsiveContainer>
            <BarChart
              data={computed.data}
              barSize={14}            
              barCategoryGap={18}     
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />

              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(v) =>
                  v === "purchaseUnit" ? "매입 단가" : v === "saleUnit" ? "판매 단가" : v
                }
              />

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

/* -------- utils / styles -------- */

function toYmd(d) {
  try {
    const s = String(d ?? "");
    if (s.length >= 10) return s.slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

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
  padding: "6px 10px",       
  borderRadius: 10,
  border: "1px solid " + (active ? "#2563eb" : "#e5e7eb"),
  background: active ? "#2563eb" : "#ffffff",
  color: active ? "#ffffff" : "#111827",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
});

const dateInput = {
  height: 30,                
  padding: "0 8px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 12,
};
