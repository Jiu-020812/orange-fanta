import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TodoList from "./TodoList";

function HomePage() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    recentInCount: 0,
    recentOutCount: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 대시보드 통계 데이터 가져오기 (임시 데이터, 나중에 API 연동 가능)
    const fetchDashboardStats = async () => {
      try {
        // TODO: API 연동
        // 임시 데이터
        setDashboardStats({
          totalItems: 127,
          lowStockItems: 8,
          recentInCount: 23,
          recentOutCount: 45,
        });
      } catch (e) {
        console.error("대시보드 통계 가져오기 오류:", e);
      }
    };

    fetchDashboardStats();
  }, []);

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
            padding: "32px 40px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 32,
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

        {/* 통계 카드 (4칸) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
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
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
