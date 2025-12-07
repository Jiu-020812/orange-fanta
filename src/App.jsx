import { Routes, Route, Navigate, NavLink } from "react-router-dom";

import HomePage from "./pages/HomePage";
import AddItemPage from "./pages/AddItemPage";
import ManageListPage from "./pages/ManageListPage";
import ManageDetailPage from "./pages/ManageDetailPage";
import SyncToServerPage from "./pages/SyncToServerPage";

// 상단 네비게이션 바
function TopNav() {
  const linkStyle = {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 14,
    textDecoration: "none",
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* 왼쪽 문구 */}
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          📦 평균값 계산 재고관리
        </div>

        {/* 오른쪽 메뉴 */}
        <nav
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
          }}
        >
          <NavLink
            to="/"
            style={({ isActive }) => ({
              ...linkStyle,
              color: isActive ? "#ffffff" : "#374151",
              backgroundColor: isActive ? "#2563eb" : "transparent",
            })}
          >
            메인
          </NavLink>
          <NavLink
            to="/manage"
            style={({ isActive }) => ({
              ...linkStyle,
              color: isActive ? "#ffffff" : "#374151",
              backgroundColor: isActive ? "#2563eb" : "transparent",
            })}
          >
            품목 관리
          </NavLink>
          <NavLink
            to="/add"
            style={({ isActive }) => ({
              ...linkStyle,
              color: isActive ? "#ffffff" : "#374151",
              backgroundColor: isActive ? "#2563eb" : "transparent",
            })}
          >
            품목 등록
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* 상단 바 */}
      <TopNav />

      {/* 페이지 영역 */}
      <main style={{ maxWidth: "none", margin: "0 auto", padding: "24px 16px" }}>
        <Routes>
          {/* 메인 */}
          <Route path="/" element={<HomePage />} />

          {/* 품목 관리 리스트 */}
          <Route path="/manage" element={<ManageListPage />} />

          {/* 품목 상세 → item/:name */}
        <Route path="/manage/item/:name" element={<ManageDetailPage />} />

          {/* 품목 등록 */}
          <Route path="/add" element={<AddItemPage />} />

          {/* 이상한 주소 → 메인으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />

          {/* 일회용*/ }
          <Route path="/sync" element={<SyncToServerPage />} />

        </Routes>
      </main>
    </div>
  );
}

export default App;