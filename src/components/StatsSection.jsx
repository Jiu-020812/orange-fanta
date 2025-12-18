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
 * - price는 "총액" (예: 3000원에 10개 샀으면 price=3000, count=10)
 * - 단가 = (총액 합) / (수량 합)
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

  // "가격 입력됨"의 정의: null/undefined가 아니고 숫자로 변환 가능
  // (0도 유효)
  const hasPrice = (v) => v !== null && v !== undefined && Number.isFinite(Number(v));
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const {
    data,
    missingInQty,
    missingOutQty,
    hasChartValue,
    // ✅ 추가: 상단 요약에 쓸 총액/수량
    inTotalAmount,
    outTotalAmount,
    inTotalQty,
    outTotalQty,
  } = useMemo(() => {
    const map = new Map();

    let missingIn = 0;
    let missingOut = 0;

    // ✅ 전체 요약 (총액/수량)
    let totalInAmount = 0;
    let totalOutAmount = 0;
    let totalInQty = 0;
    let totalOutQty = 0;

    for (const r of safeRecords) {
      const dateOnly = toDateOnly(r?.date);
      if (!dateOnly) continue;

      if (!map.has(dateOnly)) {
        map.set(dateOnly, {
          dateOnly,
          label: dateOnly.slice(5), // MM-DD
          inTotalAmount: 0, // ✅ 총액 합
          inQty: 0,         // ✅ 수량 합
          outTotalAmount: 0,
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
          const amount = Number(rawPrice);      // ✅ 총액 그대로
          row.inTotalAmount += amount;
          row.inQty += qty;

          // ✅ 전체 요약 누적
          totalInAmount += amount;
          totalInQty += qty;
        } else {
          missingIn += qty;
        }
      } else if (type === "OUT") {
        if (hasPrice(rawPrice)) {
          const amount = Number(rawPrice);
          row.outTotalAmount += amount;
          row.outQty += qty;

          totalOutAmount += amount;
          totalOutQty += qty;
        } else {
          missingOut += qty;
        }
      }
    }

    const arr = Array.from(map.values())
      .sort((a, b) => (a.dateOnly > b.dateOnly ? 1 : -1))
      .map((d) => ({
        label: d.label,
        // ✅ 단가 = 총액합 / 수량합
        purchaseUnit: d.inQty > 0 ? Math.round(d.inTotalAmount / d.inQty) : null,
        saleUnit: d.outQty > 0 ? Math.round(d.outTotalAmount / d.outQty) : null,
      }));

    const hasValue = arr.some(
      (d) => Number.isFinite(d.purchaseUnit) || Number.isFinite(d.saleUnit)
    );

    return {
      data: arr,
      missingInQty: missingIn,
      missingOutQty: missingOut,
      hasChartValue: hasValue,
      inTotalAmount: totalInAmount,
      outTotalAmount: totalOutAmount,
      inTotalQty: totalInQty,
      outTotalQty: totalOutQty,
    };
  }, [safeRecords]);

  // 토글이 둘 다 꺼지면 자동으로 둘 다 켜주기(빈 차트 방지)
  const effectiveShowPurchase = showPurchase || (!showPurchase && !showSale);
  const effectiveShowSale = showSale || (!showPurchase && !showSale);

  // ✅ 위에 조그만한 요약(매입/판매 총액) + 미입력 수량은
  // 차트가 없어도 보여주는 게 UX가 좋아서 공통으로 넣음
  const SummaryLine = () => (
    <div style={{ marginBottom: 10, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
      {/* ✅ “조그만하게 있던 매입 총액” 복구 */}
      <div>
        • 매입 총액{" "}
        <b>{Number(inTotalAmount || 0).toLocaleString()}원</b>{" "}
        <span style={{ color: "#9ca3af" }}>
          ({inTotalQty || 0}개)
        </span>
        {"  "}· 판매 총액{" "}
        <b>{Number(outTotalAmount || 0).toLocaleString()}원</b>{" "}
        <span style={{ color: "#9ca3af" }}>
          ({outTotalQty || 0}개)
        </span>
      </div>

      {/* ✅ “가격 미입력 갯수 얼마다” 복구 */}
      <div>
        • 미입력 입고 <b>{missingInQty}</b>개 · 출고 <b>{missingOutQty}</b>개
      </div>

      <div>
        • 단가 = 총액 ÷ 수량 (가격 입력된 기록만 반영)
      </div>
    </div>
  );

  // 가격 입력된 기록이 하나도 없으면: 차트 대신 안내 (요약은 유지)
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
            📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
          </h2>

          {/* 보기 토글 (차트 없어도 유지) */}
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

        <SummaryLine />

        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
          가격이 입력된 입·출고 기록이 없어서 그래프를 그릴 수 없어요.
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
          📊 단가 그래프 {itemName ? `- ${itemName}` : ""}
        </h2>

        {/* 보기 토글 */}
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

      {/* ✅ 요약 라인 복구 */}
      <SummaryLine />

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            barSize={18}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip
              formatter={(v, name) => [
                Number.isFinite(Number(v))
                  ? `${Number(v).toLocaleString()}원`
                  : "-",
                name === "purchaseUnit" ? "매입 단가" : "판매 단가",
              ]}
            />
            <Legend
              formatter={(v) => (v === "purchaseUnit" ? "매입 단가" : "판매 단가")}
            />

            {effectiveShowPurchase && (
              <Bar dataKey="purchaseUnit" name="purchaseUnit" fill="#79ABFF" />
            )}
            {effectiveShowSale && (
              <Bar dataKey="saleUnit" name="saleUnit" fill="#FF7ECA" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
