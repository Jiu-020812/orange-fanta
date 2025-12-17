import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getMe, logout } from "../api/auth";

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchMe() {
      try {
        const me = await getMe(); // { id, email, name }
        setUser(me);
      } catch (err) {
        console.warn("getMe 실패:", err?.message || err);
      }
    }
    fetchMe();
  }, []);

  function isActive(pathPrefix) {
    return location.pathname.startsWith(pathPrefix);
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error("로그아웃 요청 실패:", err);
    } finally {
      window.localStorage.removeItem("authToken");
      try {
        const api = (await import("../api/items")).default;
        delete api.defaults.headers.common["Authorization"];
      } catch {}
      navigate("/login");
    }
  }

  return (
    <header
      style={{
        height: 56,
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* 왼쪽: 제목 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>📦 평균값 계산 재고관리</span>
      </div>

      {/* 가운데: 탭 네비게이션 */}
      <nav style={{ display: "flex", gap: 16 }}>
        <NavLink to="/" active={isActive("/") && location.pathname === "/"}>
          메인
        </NavLink>
        <NavLink to="/manage" active={isActive("/manage")}>
          품목 관리
        </NavLink>
        <NavLink to="/add" active={isActive("/add")}>
          품목 등록
        </NavLink>
      </nav>

      {/* 오른쪽: 유저 정보 + 로그아웃 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 99999 }}>
  {user ? (
    <>
      <Link
        to="/mypage"
        title="마이페이지"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          fontSize: 13,
          color: "#4b5563",
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 3,

          position: "relative",
          zIndex: 999999,
          pointerEvents: "auto",
          display: "inline-block",
        }}
      >
        {user.name ? `${user.name} 님` : user.email}
      </Link>

      <button
        onClick={handleLogout}
        style={{
          padding: "6px 14px",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          backgroundColor: "#ef4444",
          color: "#ffffff",
        }}
      >
        로그아웃
      </button>
    </>
  ) : (
    <button
      onClick={() => navigate("/login")}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: "1px solid #111827",
        backgroundColor: "#111827",
        color: "#ffffff",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      로그인
    </button>
  )}
</div>

    </header>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        color: active ? "#ffffff" : "#4b5563",
        backgroundColor: active ? "##8BBDFF" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}
