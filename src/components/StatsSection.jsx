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
 *
 * ✅ 규칙
 * - price는 "총액" (예: 3000원에 10개면 price=3000, count=10)
 * - 단가(평균) = (총액 합) / (수량 합)  <-- 가중 평균
 */
export default function StatsSection({ records, itemName }) {
  const safeRecords = Array.isArray(records) ? records : [];

  // 처음 진입: 둘 다 보이게
  const [showPurchase, setShowPurchase] = useState(true);
  const [showSale, setShowSale] = useState(true);

  // 기간 필터: 7 / 30 / 90 / ALL
  const [rangeDays, setRangeDays] = useState(30);

  const toDateOnly = (d) => {
    try {
      const s = String(d ?? "");
      if (s.length >= 10) return s.slice(0, 10);
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return null;
    }
  };

  const parseDateOnly = (dateOnly) => {
    // "YYYY-MM-DD" -> Date(UTC midnight) 느낌으로 안정적으로
    // (로컬 타임존 영향 줄이기)
    const [y, m, dd] = String(dateOnly).split("-").map((x) => Number(x));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(dd)) return null;
    return new Date(Date.UTC(y, m - 1, dd));
  };

  const hasPrice = (v) =>
    v !== null && v !== undefined && Number.isFinite(Number(v));
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  // 토글 둘 다 꺼지면 자동으로 둘 다 켜주기(빈 차트 방지)
  const effectiveShowPurchase = showPurchase || (!showPurchase && !showSale);
  const effectiveShowSale = showSale || (!showPurchase && !showSale);

  const {
    data,
    missingInQty,
    missingOutQty,
    hasChartValue,
    avgPurchaseUnit, // ✅ 기간 내 매입 평균 단가
    avgSaleUnit,     // ✅ 기간 내 판매 평균 단가
  } = useMemo(() => {
    // 1) 기간 컷오프 계산(기록들 중 최신 날짜 기준으로 자르는 게 UX 좋음)
    //    - "오늘" 기준 자르면 옛날 데이터만 있는 품목은 항상 비어보일 수 있음
    let maxDate = null;
    for (const r of safeRecords) {
      const d0 = toDateOnly(r?.date);
      if (!d0) continue;
      const dt = parseDateOnly(d0);
      if (!dt) continue;
      if (!maxDate || dt > maxDate) maxDate = dt;
    }

    let cutoff = null;
    if (rangeDays !== "ALL" && maxDate) {
      cutoff = new Date(maxDate.getTime() - (Number(rangeDays) - 1) * 24 * 60 * 60 * 1000);
    }

    // 2) 날짜별 집계 (단가=총액/수량)
    const map = new Map();

    let missingIn = 0;
    let missingOut = 0;

    // ✅ 기간 내 전체 평균 단가(가중평균)
    let inAmountSum = 0;
    let inQtySum = 0;
    let outAmountSum = 0;
    let outQtySum = 0;

    for (const r of safeRecords) {
      const dateOnly = toDateOnly(r?.date);
      if (!dateOnly) continue;

      const dt = parseDateOnly(dateOnly);
      if (!dt) continue;

      if (cutoff && dt < cutoff) continue;

      if (!map.has(dateOnly)) {
        map.set(dateOnly, {
          dateOnly,
          label: dateOnly.slice(5), // MM-DD
          inAmount: 0, // 총액
          inQty: 0,
          outAmount: 0,
          outQty: 0,
        });
      }

      const row = map.get(dateOnly);
      const type = String(r?.type || "IN").toUpperCase();
      const qty = toNum(r?.count);

      if (!Number.isFinite(qty) || qty <= 0) continue;

      const rawPrice = r?.price;

      if (type === "IN") {
        if (hasPrice(rawPrice)) {
          const amount = Number(rawPrice); // ✅ 총액 그대로
          row.inAmount += amount;
          row.inQty += qty;

          inAmountSum += amount;
          inQtySum += qty;
        } else {
          missingIn += qty;
        }
      } else if (type === "OUT") {
        if (hasPrice(rawPrice)) {
          const amount = Number(rawPrice);
          row.outAmount += amount;
          row.outQty += qty;

          outAmountSum += amount;
          outQtySum += qty;
        } else {
          missingOut += qty;
        }
      }
    }

    const arr = Array.from(map.values())
      .sort((a, b) => (a.dateOnly > b.dateOnly ? 1 : -1))
      .map((d) => ({
        label: d.label,
        purchaseUnit: d.inQty > 0 ? Math.round(d.inAmount / d.inQty) : null,
        saleUnit: d.outQty > 0 ? Math.round(d.outAmount / d.outQty) : null,
      }));

    const hasValue = arr.some(
      (d) => Number.isFinite(d.purchaseUnit) || Number.isFinite(d.saleUnit)
    );

    const avgIn = inQtySum > 0 ? Math.round(inAmountSum / inQtySum) : null;
    const avgOut = outQtySum > 0 ? Math.round(outAmountSum / outQtySum) : null;

    return {
      data: arr,
      missingInQty: missingIn,
      missingOutQty: missingOut,
      hasChartValue: hasValue,
      avgPurchaseUnit: avgIn,
      avgSaleUnit: avgOut,
    };
  }, [safeRecords, rangeDays]);

  const SummaryLine = () => (
    <div style={{ marginBottom: 10, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
      <div>
        • 기간 평균 매입 단가:{" "}
        <b>{avgPurchaseUnit != null ? `${avgPurchaseUnit.toLocaleString()}원` : "-"}</b>
        {"  "}· 기간 평균 판매 단가:{" "}
        <b>{avgSaleUnit != null ? `${avgSaleUnit.toLocaleString()}원` : "-"}</b>
      </div>
      <div>
        • 미입력 입고 <b>{missingInQty}</b>개 · 출고 <b>{missingOutQty}</b>개
      </div>
      <div>• 단가 = (총액 합) ÷ (수량 합)</div>
    </div>
  );

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      {/* 상단: 제목 + 필터 + 토글 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
          📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
        </h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* 기간 필터 */}
          <select
            value={rangeDays}
            onChange={(e) => {
              const v = e.target.value;
              setRangeDays(v === "ALL" ? "ALL" : Number(v));
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              fontSize: 12,
              fontWeight: 700,
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            <option value={7}>최근 7일</option>
            <option value={30}>최근 30일</option>
            <option value={90}>최근 90일</option>
            <option value="ALL">전체</option>
          </select>

          {/* 보기 토글 */}
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

      <SummaryLine />

      {/* 차트 or 안내 */}
      {!hasChartValue ? (
        <div style={{ fontSize: 13, color: "#6b7280", minHeight: 220 }}>
          이 기간에는 가격이 입력된 입·출고 기록이 없어서 그래프를 그릴 수 없어요.
        </div>
      ) : (
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
              <Legend formatter={(v) => (v === "purchaseUnit" ? "매입 단가" : "판매 단가")} />

              {effectiveShowPurchase && (
                <Bar dataKey="purchaseUnit" name="purchaseUnit" fill="#79ABFF" />
              )}
              {effectiveShowSale && (
                <Bar dataKey="saleUnit" name="saleUnit" fill="#FF7ECA" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
