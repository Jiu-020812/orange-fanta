import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * props
 * - records: [{ id, shoeId, price, count, date }]
 * - itemName: 그래프 제목에 표시할 품목 이름 (예: "조던1 (260)")
 */
export default function StatsSection({ records, itemName }) {
  const safeRecords = Array.isArray(records) ? records : [];

  // 데이터 없으면 안내만 표시
  if (safeRecords.length === 0) {
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
        <h2
          style={{
            marginBottom: 8,
            fontSize: 18,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          📊 품목 평균 매입 금액
        </h2>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          그래프로 표시할 데이터가 없습니다.
        </div>
      </div>
    );
  }

  // 날짜별로 평균 매입 금액 계산
  const grouped = safeRecords.reduce((acc, r) => {
    const date = r.date || "";
    if (!acc[date]) {
      acc[date] = { totalPrice: 0, totalCount: 0 };
    }
    acc[date].totalPrice += Number(r.price) || 0;
    acc[date].totalCount +=
      r.count === "" || r.count == null ? 1 : Number(r.count);
    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([date, v]) => {
      const avg =
        v.totalCount > 0 ? Math.round(v.totalPrice / v.totalCount) : 0;
      return {
        date,
        avgPrice: avg,
      };
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  // 전체 평균 (그래프 제목 오른쪽에 표시할 값)
  const overallAvg =
    chartData && chartData.length > 0
      ? Math.round(
          chartData.reduce((sum, d) => sum + (d.avgPrice || 0), 0) /
            chartData.length
        )
      : null;

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
      {/* 제목 + 우측 평균 텍스트 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          📊 {itemName || "품목"} 평균 매입 금액 (1개 기준)
        </h2>

        {overallAvg != null && (
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            평균: {overallAvg.toLocaleString()}원
          </div>
        )}
      </div>

      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 16, left: -10, bottom: 10 }}
            barSize={22}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #4b5563",
                borderRadius: 8,
                padding: "6px 10px",
                color: "#e5e7eb",
              }}
              labelStyle={{
                fontSize: 11,
                color: "#9ca3af",
                marginBottom: 2,
              }}
              itemStyle={{ fontSize: 12 }}
              formatter={(value) => [
                `${value.toLocaleString()}원`,
                "1개당 평균",
              ]}
            />
            {/* 보라색 바 */}
            <Bar dataKey="avgPrice" fill="#c4b5fd" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}