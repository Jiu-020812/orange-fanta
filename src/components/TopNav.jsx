import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getMe, logout } from "../api/auth";

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // 현재 로그인한 사용자 정보
  const [user, setUser] = useState(null);

  // 최초 로딩 시 /api/auth/me 호출해서 유저 정보 가져오기
  useEffect(() => {
    async function fetchMe() {
      try {
        const me = await getMe(); // { id, email, name }
        setUser(me);
      } catch (err) {
        // 로그인 안 되어 있거나 토큰 만료된 경우 → 굳이 에러 띄우지 않음
        console.warn("getMe 실패 (로그인 안 되어 있을 수 있음):", err.message);
      }
    }
    fetchMe();
  }, []);

  // 현재 path가 탭과 일치하는지 확인
  function isActive(pathPrefix) {
    return location.pathname.startsWith(pathPrefix);
  }

  // 로그아웃 처리
  async function handleLogout() {
    try {
      await logout(); // 서버 쿠키 삭제
    } catch (err) {
      console.error("로그아웃 요청 실패:", err);
    } finally {
      // 클라이언트 토큰 제거
      window.localStorage.removeItem("authToken");
      // 혹시 axios 기본 헤더도 같이 제거
      try {
        const api = (await import("../api/items")).default;
        delete api.defaults.headers.common["Authorization"];
      } catch (e) {
        // import 실패해도 치명적이지 않음
      }

      // 로그인 페이지로 이동
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
      }}
    >
      {/* 왼쪽: 제목 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>🍊 평균값 계산 재고관리</span>
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <>
            <span
              style={{
                fontSize: 13,
                color: "#4b5563",
              }}
            >
              {user.name ? `${user.name} 님` : user.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              로그아웃
            </button>
          </>
        ) : (
          // 로그인 안 된 상태 → 로그인 페이지로 이동 버튼
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              backgroundColor: "#f9fafb",
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

// 탭용 작은 컴포넌트 (선택 여부에 따라 스타일 변경)
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
        backgroundColor: active ? "#111827" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}