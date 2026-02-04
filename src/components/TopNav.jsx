import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuthMe, logout } from "../api/auth";
import useMobile from "../hooks/useMobile";

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const isMobile = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  //  드롭다운 상태
  const [manageOpen, setManageOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const manageRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => {
    async function fetchMe() {
      try {
        const me = await getAuthMe(); // { id, email, name }
        setUser(me);
      } catch (err) {
        console.warn("getAuthMe 실패:", err?.message || err);
      }
    }
    fetchMe();
  }, []);

  //  바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function onDocDown(e) {
      if (manageRef.current && !manageRef.current.contains(e.target)) {
        setManageOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
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
        const api = (await import("../api/client")).default;
        delete api.defaults.headers.common["Authorization"];
      } catch {}
      navigate("/login");
    }
  }

  return (
    <header
      style={{
        minHeight: 56,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(102, 126, 234, 0.1)",
        boxShadow: "0 2px 20px rgba(102, 126, 234, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {/* 왼쪽: 제목 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          📦 평균값 계산 재고관리
        </span>
      </div>

      {/* 모바일 햄버거 */}
      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 24,
            cursor: "pointer",
            color: "#4b5563",
            padding: "4px 8px",
            borderRadius: 8,
          }}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      )}

      {/* 가운데: 탭 네비게이션 (desktop) */}
      <nav
        style={{
          display: isMobile ? "none" : "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <NavLink to="/home" active={isActive("/home")}>
          메인
        </NavLink>

        {/* 품목 관리 드롭다운 */}
        <div
  ref={manageRef}
  style={{ position: "relative" }}
  onMouseEnter={() => setManageOpen(true)}
  onMouseLeave={() => setManageOpen(false)}
>
  <button
    type="button"
    onClick={() => setManageOpen((v) => !v)}
    style={{
      padding: "8px 12px",
      borderRadius: 999,
      fontSize: 14,
      fontWeight: 500,
      border: "none",
      cursor: "pointer",
      backgroundColor:
        isActive("/manage") || isActive("/in") || isActive("/out")
          ? "#dbeafe"
          : "transparent",
      color:
        isActive("/manage") || isActive("/in") || isActive("/out")
          ? "#1d4ed8"
          : "#4b5563",
    }}
  >
    품목 관리 ▾
  </button>

  {manageOpen && (
    // "hover 브릿지" 컨테이너 (공백 8px를 hover 영역으로 만듦)
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        paddingTop: 8,     
        zIndex: 1000,
      }}
    >
      <div
        style={{
          minWidth: 160,
          padding: 8,
          borderRadius: 14,
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <DropItem to="/manage" active={isActive("/manage")} onClick={() => setManageOpen(false)}>
          품목 목록/상세
        </DropItem>
        <DropItem to="/in" active={isActive("/in")} onClick={() => setManageOpen(false)}>
          입고 관리
        </DropItem>
        <DropItem to="/out" active={isActive("/out")} onClick={() => setManageOpen(false)}>
          판매 관리
        </DropItem>
      </div>
    </div>
  )}
</div>

        <NavLink to="/sync" active={isActive("/sync")}>
          채널 연동
        </NavLink>

        <NavLink to="/reports" active={isActive("/reports")}>
          보고서
        </NavLink>

        <NavLink to="/add" active={isActive("/add")}>
          품목 등록
        </NavLink>

        {/* 관리 드롭다운 */}
        <div
          ref={moreRef}
          style={{ position: "relative" }}
          onMouseEnter={() => setMoreOpen(true)}
          onMouseLeave={() => setMoreOpen(false)}
        >
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              backgroundColor:
                isActive("/purchase-orders") || isActive("/suppliers") || isActive("/excel") ||
                isActive("/warehouses") || isActive("/stock-transfers") || isActive("/stock-audits") ||
                isActive("/backup")
                  ? "#dbeafe"
                  : "transparent",
              color:
                isActive("/purchase-orders") || isActive("/suppliers") || isActive("/excel") ||
                isActive("/warehouses") || isActive("/stock-transfers") || isActive("/stock-audits") ||
                isActive("/backup")
                  ? "#1d4ed8"
                  : "#4b5563",
            }}
          >
            관리 ▾
          </button>

          {moreOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                paddingTop: 8,
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  minWidth: 160,
                  padding: 8,
                  borderRadius: 14,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              >
                <DropItem to="/purchase-orders" active={isActive("/purchase-orders")} onClick={() => setMoreOpen(false)}>
                  발주 관리
                </DropItem>
                <DropItem to="/suppliers" active={isActive("/suppliers")} onClick={() => setMoreOpen(false)}>
                  공급업체 관리
                </DropItem>
                <DropItem to="/warehouses" active={isActive("/warehouses")} onClick={() => setMoreOpen(false)}>
                  창고 목록
                </DropItem>
                <DropItem to="/stock-transfers" active={isActive("/stock-transfers")} onClick={() => setMoreOpen(false)}>
                  재고 이동
                </DropItem>
                <DropItem to="/stock-audits" active={isActive("/stock-audits")} onClick={() => setMoreOpen(false)}>
                  재고 실사
                </DropItem>
                <DropItem to="/excel" active={isActive("/excel")} onClick={() => setMoreOpen(false)}>
                  엑셀 관리
                </DropItem>
                <DropItem to="/backup" active={isActive("/backup")} onClick={() => setMoreOpen(false)}>
                  백업/복원
                </DropItem>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 모바일 메뉴 드롭다운 */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 999,
            padding: "8px 0",
          }}
        >
          <MobileLink to="/home" active={isActive("/home")} onClick={() => setMobileMenuOpen(false)}>메인</MobileLink>
          <div style={{ padding: "4px 16px 0", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>품목</div>
          <MobileLink to="/manage" active={isActive("/manage")} onClick={() => setMobileMenuOpen(false)}>품목 목록</MobileLink>
          <MobileLink to="/in" active={isActive("/in")} onClick={() => setMobileMenuOpen(false)}>입고 관리</MobileLink>
          <MobileLink to="/out" active={isActive("/out")} onClick={() => setMobileMenuOpen(false)}>판매 관리</MobileLink>
          <MobileLink to="/add" active={isActive("/add")} onClick={() => setMobileMenuOpen(false)}>품목 등록</MobileLink>
          <MobileLink to="/sync" active={isActive("/sync")} onClick={() => setMobileMenuOpen(false)}>채널 연동</MobileLink>
          <MobileLink to="/reports" active={isActive("/reports")} onClick={() => setMobileMenuOpen(false)}>보고서</MobileLink>
          <div style={{ padding: "4px 16px 0", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginTop: 4 }}>관리</div>
          <MobileLink to="/purchase-orders" active={isActive("/purchase-orders")} onClick={() => setMobileMenuOpen(false)}>발주 관리</MobileLink>
          <MobileLink to="/suppliers" active={isActive("/suppliers")} onClick={() => setMobileMenuOpen(false)}>공급업체 관리</MobileLink>
          <MobileLink to="/warehouses" active={isActive("/warehouses")} onClick={() => setMobileMenuOpen(false)}>창고 목록</MobileLink>
          <MobileLink to="/stock-transfers" active={isActive("/stock-transfers")} onClick={() => setMobileMenuOpen(false)}>재고 이동</MobileLink>
          <MobileLink to="/stock-audits" active={isActive("/stock-audits")} onClick={() => setMobileMenuOpen(false)}>재고 실사</MobileLink>
          <MobileLink to="/excel" active={isActive("/excel")} onClick={() => setMobileMenuOpen(false)}>엑셀 관리</MobileLink>
          <MobileLink to="/backup" active={isActive("/backup")} onClick={() => setMobileMenuOpen(false)}>백업/복원</MobileLink>
        </div>
      )}

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
            <button
              type="button"
              title="마이페이지"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/mypage");
              }}
              style={{
                fontSize: 13,
                color: "#4b5563",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                border: "none",
                background: "transparent",
                padding: 0,
              }}
            >
              {user.name ? `${user.name} 님` : user.email}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
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

function MobileLink({ to, active, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: "block",
        padding: "12px 20px",
        textDecoration: "none",
        fontSize: 15,
        fontWeight: 600,
        backgroundColor: active ? "#eff6ff" : "transparent",
        color: active ? "#1d4ed8" : "#111827",
        borderLeft: active ? "3px solid #1d4ed8" : "3px solid transparent",
      }}
    >
      {children}
    </Link>
  );
}
