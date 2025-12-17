import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getMe, logout } from "../api/auth";

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ 드롭다운 상태
  const [manageOpen, setManageOpen] = useState(false);
  const manageRef = useRef(null);

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

  // ✅ 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function onDocDown(e) {
      if (!manageRef.current) return;
      if (!manageRef.current.contains(e.target)) setManageOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
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
        <span style={{ fontSize: 18, fontWeight: 700 }}>
          📦 평균값 계산 재고관리
        </span>
      </div>

      {/* 가운데: 탭 네비게이션 */}
      <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <NavLink to="/" active={isActive("/") && location.pathname === "/"}>
          메인
        </NavLink>

        {/* ✅ 품목 관리 드롭다운 */}
        <div
          ref={manageRef}
          style={{ position: "relative" }}
          onMouseEnter={() => setManageOpen(true)}
          onMouseLeave={() => setManageOpen(false)}
        >
          <button
            type="button"
            onClick={() => setManageOpen((v) => !v)} // 모바일/터치 대비
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              backgroundColor: isActive("/manage") || isActive("/in") || isActive("/out")
                ? "#dbeafe"
                : "transparent",
              color: isActive("/manage") || isActive("/in") || isActive("/out")
                ? "#1d4ed8"
                : "#4b5563",
            }}
          >
            품목 관리 ▾
          </button>

          {manageOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                minWidth: 160,
                padding: 8,
                borderRadius: 14,
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                zIndex: 1000,
              }}
            >
              <DropItem
                to="/manage"
                active={isActive("/manage")}
                onClick={() => setManageOpen(false)}
              >
                품목 목록/상세
              </DropItem>

              <DropItem
                to="/in"
                active={isActive("/in")}
                onClick={() => setManageOpen(false)}
              >
                입고 관리
              </DropItem>

              <DropItem
                to="/out"
                active={isActive("/out")}
                onClick={() => setManageOpen(false)}
              >
                출고 관리
              </DropItem>
            </div>
          )}
        </div>

        <NavLink to="/add" active={isActive("/add")}>
          품목 등록
        </NavLink>
      </nav>

      {/* 오른쪽: 유저 정보 + 로그아웃 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          zIndex: 99999,
        }}
      >
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
        backgroundColor: active ? "#dbeafe" : "transparent",
        color: active ? "#1d4ed8" : "#4b5563",
      }}
    >
      {children}
    </Link>
  );
}

function DropItem({ to, active, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: "block",
        padding: "10px 12px",
        borderRadius: 12,
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 600,
        backgroundColor: active ? "rgba(29,78,216,0.10)" : "transparent",
        color: "#111827",
      }}
    >
      {children}
    </Link>
  );
}
