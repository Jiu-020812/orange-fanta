import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useMobile from "../hooks/useMobile";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import TodoList from "./TodoList";
import { getDashboardStats } from "../api/items";
import { getReorderAlerts } from "../api/reorder";

function HomePage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [now, setNow] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    lowStockItemsList: [],
    recentInCount: 0,
    recentOutCount: 0,
    topSellingItems: [],
    stockTrend: [],
  });
  const [lowStockSearch, setLowStockSearch] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(() => {
    const saved = localStorage.getItem("lowStockThreshold");
    return saved ? Number(saved) : 10;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [reorderAlerts, setReorderAlerts] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const stats = await getDashboardStats({ lowStockThreshold });
        setDashboardStats({
          totalItems: stats.totalItems || 0,
          lowStockItems: stats.lowStockItems || 0,
          lowStockItemsList: stats.lowStockItemsList || [],
          recentInCount: stats.recentInCount || 0,
          recentOutCount: stats.recentOutCount || 0,
          topSellingItems: stats.topSellingItems || [],
          stockTrend: stats.stockTrend || [],
        });
      } catch (e) {
        console.error("대시보드 통계 가져오기 오류:", e);
      }
    };

    const fetchReorderAlerts = async () => {
      try {
        const data = await getReorderAlerts();
        setReorderAlerts(data.alerts || []);
      } catch (e) {
        console.error("재주문 알림 가져오기 오류:", e);
      }
    };

    fetchDashboardStats();
    fetchReorderAlerts();
  }, [lowStockThreshold]);

  const filteredLowStockItems = useMemo(() => {
    const query = lowStockSearch.trim().toLowerCase();
    if (!query) return dashboardStats.lowStockItemsList;

    return dashboardStats.lowStockItemsList.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const size = (item.size || "").toLowerCase();
      const barcode = (item.barcode || "").toLowerCase();
      return name.includes(query) || size.includes(query) || barcode.includes(query);
    });
  }, [dashboardStats.lowStockItemsList, lowStockSearch]);

  const handleThresholdChange = (value) => {
    const num = Number(value);
    if (num >= 0) {
      setLowStockThreshold(num);
      localStorage.setItem("lowStockThreshold", num);
    }
  };

  const formattedDate = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const formattedTime = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

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
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: isMobile ? "16px" : "32px 40px",
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
                  fontSize: isMobile ? 22 : 32,
                  fontWeight: 900,
                  color: "#7c8db5",
                  marginBottom: 8,
                }}
              >
                📊 재고 관리 대시보드
              </h1>
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                {formattedDate} · {formattedTime}
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
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
              ⚙️ 설정
            </button>
          </div>

          {showSettings && (
            <div
              style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                재고 부족 기준 설정
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <label style={{ fontSize: 13, color: "#6b7280" }}>
                  재고가
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  style={{
                    width: 80,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    textAlign: "center",
                    boxSizing: "border-box",
                  }}
                />
                <label style={{ fontSize: 13, color: "#6b7280" }}>
                  개 이하인 품목을 재고 부족으로 표시
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 통계 카드 (4칸) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(240px, 1fr))",
            gap: isMobile ? "12px" : "20px",
          }}
        >
          <DashboardStatCard
            icon="📦"
            title="전체 품목"
            value={dashboardStats.totalItems}
            subtext="등록된 품목"
            color="#7c8db5"
            onClick={() => navigate("/manage")}
          />
          <DashboardStatCard
            icon="⚠️"
            title="재고 부족"
            value={dashboardStats.lowStockItems}
            subtext="품목이 재고 부족"
            color="#f59e0b"
            onClick={() => navigate("/manage")}
          />
          <DashboardStatCard
            icon="📥"
            title="최근 입고"
            value={dashboardStats.recentInCount}
            subtext="건 (최근 7일)"
            color="#10b981"
            onClick={() => navigate("/in")}
          />
          <DashboardStatCard
            icon="📤"
            title="최근 판매"
            value={dashboardStats.recentOutCount}
            subtext="건 (최근 7일)"
            color="#ef4444"
            onClick={() => navigate("/out")}
          />
        </div>

        {/* 재주문 알림 (상단 전체 너비) */}
        {reorderAlerts.length > 0 && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px 32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "2px solid #f59e0b",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                🔔 재주문 필요 ({reorderAlerts.length}건)
              </h3>
            </div>
            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {reorderAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => navigate(`/manage/${alert.id}`)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: alert.urgency >= 80 ? "#fee2e2" : alert.urgency >= 50 ? "#fef3c7" : "#f0fdf4",
                    border: `1px solid ${alert.urgency >= 80 ? "#fca5a5" : alert.urgency >= 50 ? "#fbbf24" : "#86efac"}`,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                        {alert.name}
                        {alert.size && ` (${alert.size})`}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                        현재 재고: {alert.currentStock}개 / 재주문 포인트: {alert.reorderPoint}개
                      </div>
                      {alert.reorderQuantity && (
                        <div style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>
                          권장 주문량: {alert.reorderQuantity}개
                        </div>
                      )}
                    </div>
                    {alert.urgency >= 80 && (
                      <span style={{ fontSize: 20 }}>🚨</span>
                    )}
                    {alert.urgency >= 50 && alert.urgency < 80 && (
                      <span style={{ fontSize: 20 }}>⚠️</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {reorderAlerts.length > 4 && (
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button
                  onClick={() => navigate("/reorder")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#374151",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  전체 보기 ({reorderAlerts.length}건)
                </button>
              </div>
            )}
          </div>
        )}

        {/* 콘텐츠 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
            gap: isMobile ? "16px" : "20px",
          }}
        >
          {/* 재고 부족 품목 목록 */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                ⚠️ 재고 부족 품목
              </h3>
              {filteredLowStockItems.length !== dashboardStats.lowStockItemsList.length && (
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  {filteredLowStockItems.length}/{dashboardStats.lowStockItemsList.length}
                </span>
              )}
            </div>

            <input
              type="text"
              value={lowStockSearch}
              onChange={(e) => setLowStockSearch(e.target.value)}
              placeholder="품목명/사이즈/바코드 검색"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 13,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />

            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {filteredLowStockItems.length === 0 ? (
                <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, padding: "20px 0" }}>
                  {dashboardStats.lowStockItemsList.length === 0
                    ? "재고 부족 품목이 없습니다."
                    : "검색 결과가 없습니다."}
                </div>
              ) : (
                filteredLowStockItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/manage/${item.id}`)}
                    style={{
                      padding: "12px",
                      borderRadius: 8,
                      background: "#fef3c7",
                      border: "1px solid #fbbf24",
                      marginBottom: 8,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fde68a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fef3c7";
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      {item.name}
                      {item.size && ` (${item.size})`}
                    </div>
                    <div style={{ fontSize: 12, color: "#92400e" }}>
                      현재 재고: {item.currentStock}개
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 판매 순위 차트 */}
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
              📈 판매 TOP 5 (최근 7일)
            </h3>
            {dashboardStats.topSellingItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={dashboardStats.topSellingItems}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}개`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardStats.topSellingItems.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: 280,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: 14,
                }}
              >
                최근 판매 데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 입출고 추이 차트 */}
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
              📊 입출고 추이 (최근 30일)
            </h3>
            {dashboardStats.stockTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dashboardStats.stockTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="in"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="입고"
                    dot={{ fill: "#10b981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="out"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="출고"
                    dot={{ fill: "#ef4444" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: 280,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: 14,
                }}
              >
                최근 입출고 데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 빠른 액션 카드 */}
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
              ⚡ 빠른 실행
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <QuickActionButton
                icon="➕"
                label="품목 등록"
                onClick={() => navigate("/add")}
              />
              <QuickActionButton
                icon="📥"
                label="입고 등록"
                onClick={() => navigate("/in")}
              />
              <QuickActionButton
                icon="📤"
                label="판매 등록"
                onClick={() => navigate("/out")}
              />
              <QuickActionButton
                icon="🔗"
                label="채널 연동"
                onClick={() => navigate("/sync")}
              />
            </div>
          </div>
        </div>

        {/* TodoList 카드 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <TodoList />
        </div>
      </div>
    </div>
  );
}

const COLORS = ["#7c8db5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

function DashboardStatCard({ icon, title, value, subtext, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: color,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{subtext}</div>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        color: "#111827",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f8fafc";
        e.currentTarget.style.borderColor = "#7c8db5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#ffffff";
        e.currentTarget.style.borderColor = "#e5e7eb";
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default HomePage;
