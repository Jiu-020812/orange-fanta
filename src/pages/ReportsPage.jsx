import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";
import {
  getSalesAnalysis,
  getInventoryTurnover,
  getProfitAnalysis,
  getTopProducts,
  getCategoryBreakdown,
} from "../api/reports";

function ReportsPage() {
  const [dateRange, setDateRange] = useState("7days");
  const [reportData, setReportData] = useState({
    salesAnalysis: [],
    inventoryTurnover: [],
    profitAnalysis: [],
    topProducts: [],
    categoryBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [salesAnalysis, inventoryTurnover, profitAnalysis, topProducts, categoryBreakdown] =
        await Promise.all([
          getSalesAnalysis(dateRange),
          getInventoryTurnover(dateRange),
          getProfitAnalysis(dateRange),
          getTopProducts(dateRange),
          getCategoryBreakdown(dateRange),
        ]);

      setReportData({
        salesAnalysis: salesAnalysis || [],
        inventoryTurnover: inventoryTurnover || [],
        profitAnalysis: profitAnalysis || {
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          profitMargin: 0,
        },
        topProducts: topProducts || [],
        categoryBreakdown: categoryBreakdown || [],
      });
    } catch (error) {
      console.error("보고서 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    try {
      // 워크북 생성
      const wb = XLSX.utils.book_new();

      // 1. 수익 요약 시트
      const summaryData = [
        ["항목", "값"],
        ["총 매출", `₩${reportData.profitAnalysis.totalRevenue?.toLocaleString()}`],
        ["총 비용", `₩${reportData.profitAnalysis.totalCost?.toLocaleString()}`],
        ["총 수익", `₩${reportData.profitAnalysis.totalProfit?.toLocaleString()}`],
        ["수익률", `${reportData.profitAnalysis.profitMargin}%`],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, "수익 요약");

      // 2. 매출 추이 시트
      const salesData = [
        ["날짜", "매출", "수익"],
        ...reportData.salesAnalysis.map((item) => [
          item.date,
          item.sales,
          item.profit,
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, ws2, "매출 추이");

      // 3. 재고 회전율 시트
      const turnoverData = [
        ["제품명", "회전율", "현재재고", "판매량"],
        ...reportData.inventoryTurnover.map((item) => [
          item.name,
          item.turnover,
          item.currentStock || 0,
          item.soldInPeriod || 0,
        ]),
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(turnoverData);
      XLSX.utils.book_append_sheet(wb, ws3, "재고 회전율");

      // 4. TOP 제품 시트
      const topProductsData = [
        ["제품명", "판매량"],
        ...reportData.topProducts.map((item) => [item.name, item.value]),
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(topProductsData);
      XLSX.utils.book_append_sheet(wb, ws4, "TOP 제품");

      // 5. 카테고리 분포 시트
      const categoryData = [
        ["카테고리", "비율(%)"],
        ...reportData.categoryBreakdown.map((item) => [item.name, item.value]),
      ];
      const ws5 = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, ws5, "카테고리 분포");

      // 파일 다운로드
      const fileName = `보고서_${new Date().toISOString().split("T")[0]}`;
      if (format === "excel") {
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else if (format === "csv") {
        // CSV는 첫 번째 시트만 저장
        XLSX.writeFile(wb, `${fileName}.csv`, { bookType: "csv" });
      }
    } catch (error) {
      console.error("내보내기 실패:", error);
      alert("파일 내보내기에 실패했습니다.");
    }
  };

  const COLORS = ["#7c8db5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "linear-gradient(135deg, #b8c5f2 0%, #c5b3d9 50%, #e8d4f0 100%)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px 40px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#7c8db5",
                  marginBottom: 8,
                }}
              >
                📊 보고서 및 분석
              </h1>
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                매출 분석, 재고 회전율, 수익률을 한눈에 확인하세요
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <option value="7days">최근 7일</option>
                <option value="30days">최근 30일</option>
                <option value="90days">최근 90일</option>
                <option value="1year">최근 1년</option>
              </select>
              <button
                onClick={() => handleExport("excel")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#7c8db5",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📥 Excel 내보내기
              </button>
              <button
                onClick={() => handleExport("csv")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#374151",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📄 CSV 내보내기
              </button>
            </div>
          </div>
        </div>

        {/* 수익 요약 카드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          <SummaryCard
            icon="💰"
            title="총 매출"
            value={`₩${reportData.profitAnalysis.totalRevenue?.toLocaleString()}`}
            color="#7c8db5"
          />
          <SummaryCard
            icon="💸"
            title="총 비용"
            value={`₩${reportData.profitAnalysis.totalCost?.toLocaleString()}`}
            color="#f59e0b"
          />
          <SummaryCard
            icon="📈"
            title="총 수익"
            value={`₩${reportData.profitAnalysis.totalProfit?.toLocaleString()}`}
            color="#10b981"
          />
          <SummaryCard
            icon="📊"
            title="수익률"
            value={`${reportData.profitAnalysis.profitMargin}%`}
            color="#ef4444"
          />
        </div>

        {/* 매출 추이 차트 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 20,
            }}
          >
            📈 매출 및 수익 추이
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.salesAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#7c8db5"
                name="매출"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                name="수익"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 재고 회전율 & TOP 제품 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {/* 재고 회전율 */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 20,
              }}
            >
              🔄 재고 회전율
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={reportData.inventoryTurnover}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="turnover" fill="#7c8db5" name="회전율" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* TOP 제품 */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 20,
              }}
            >
              🏆 TOP 제품 (판매량)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={reportData.topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}개`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 카테고리 분포 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 20,
            }}
          >
            📦 카테고리별 판매 분포
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={reportData.categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, title, value, color }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default ReportsPage;
