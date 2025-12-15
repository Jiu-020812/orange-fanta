import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import AddItemPage from "./pages/AddItemPage";
import ManageListPage from "./pages/ManageListPage";
import ManageDetailPage from "./pages/ManageDetailPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MigratePage from "./pages/MigratePage";

import { getMe, logout } from "./api/auth";

/* ===================== TopNav ===================== */

function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // 현재 로그인 유저 가져오기
  useEffect(() => {
    let mounted = true;

    async function fetchMe() {
      try {
        const res = await getMe(); // { id, email, name } 또는 { ok, user }
        const u = res.user || res;
        if (mounted) setUser(u);
      } catch (err) {
        // 401이면 그냥 "로그인 안 되어 있음" 이라서 조용히 무시
        console.log("getMe 실패:", err?.message);
      }
    }

    fetchMe();

    return () => {
      mounted = false;
    };
  }, []);

  const linkStyle = {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 14,
    textDecoration: "none",
  };

  const isActivePath = (path) => location.pathname === path;

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error("logout 실패:", err);
    } finally {
      // 혹시 남아있을지도 모르는 토큰 정리
      window.localStorage.removeItem("authToken");
      navigate("/login");
    }
  }

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

        {/* 가운데 메뉴 */}
        <nav
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
          }}
        >
          <NavLink
            to="/"
            style={() => ({
              ...linkStyle,
              color: isActivePath("/") ? "#ffffff" : "#374151",
              backgroundColor: isActivePath("/") ? "#2563eb" : "transparent",
            })}
          >
            메인
          </NavLink>

          <NavLink
            to="/manage"
            style={() => ({
              ...linkStyle,
              color: isActivePath("/manage") ? "#ffffff" : "#374151",
              backgroundColor: isActivePath("/manage")
                ? "#2563eb"
                : "transparent",
            })}
          >
            품목 관리
          </NavLink>

          <NavLink
            to="/add"
            style={() => ({
              ...linkStyle,
              color: isActivePath("/add") ? "#ffffff" : "#374151",
              backgroundColor: isActivePath("/add")
                ? "#2563eb"
                : "transparent",
            })}
          >
            품목 등록
          </NavLink>
        </nav>

        {/* 오른쪽: 유저 + 로그아웃 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: 12,
            fontSize: 13,
            color: "#4b5563",
          }}
        >
          {user && (
            <span
              style={{
                maxWidth: 160,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name || user.email}
            </span>
          )}

          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

/* ===================== App ===================== */

function App() {
  const location = useLocation();
  const hideTopNav = location.pathname.startsWith("/login");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* 로그인 페이지에서는 상단바 숨김 */}
      {!hideTopNav && <TopNav />}

      {/* 페이지 영역 */}
      <main style={{ maxWidth: "none", margin: "0 auto", padding: "24px 16px" }}>
        <Routes>
          {/* 로그인 (보호 안 함) */}
          <Route path="/login" element={<LoginPage />} />

          {/* 메인 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* 품목 관리 리스트 */}
          <Route
            path="/manage"
            element={
              <ProtectedRoute>
                <ManageListPage />
              </ProtectedRoute>
            }
          />

          {/* 품목 상세 */}
          <Route
            path="/manage/item/:name"
            element={
              <ProtectedRoute>
                <ManageDetailPage />
              </ProtectedRoute>
            }
          />

          {/* 품목 등록 */}
          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <AddItemPage />
              </ProtectedRoute>
            }
          />

          {/* 마이그레이션*/ }
          <Route
  path="/migrate"
  element={
    <ProtectedRoute>
      <MigratePage />
    </ProtectedRoute>
  }
/>


          {/* 이상한 주소 → 메인 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;