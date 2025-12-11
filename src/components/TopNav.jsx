import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMe, logout } from "../api/auth";

export default function TopNav() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);   // 현재 로그인한 사용자 정보
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------
  // 로그인한 사용자 정보 가져오기
  // ------------------------------------------------------
  useEffect(() => {
    async function fetchUser() {
      try {
        const me = await getMe();
        setUser(me); // { id, email, name }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  // ------------------------------------------------------
  // 로그아웃 처리
  // ------------------------------------------------------
  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  }

  return (
    <nav
      style={{
        width: "100%",
        height: 56,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {/* 왼쪽 로고 */}
      <Link to="/" style={{ fontWeight: 700, fontSize: 18, textDecoration: "none", color: "#111827" }}>
        재고관리
      </Link>

      {/* 오른쪽 사용자 영역 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* 로그인 상태 로딩 중일 때 */}
        {loading && <span style={{ fontSize: 14, color: "#6b7280" }}>불러오는 중...</span>}

        {/* 로그인 안 된 상태 */}
        {!loading && !user && (
          <Link
            to="/login"
            style={{
              fontSize: 14,
              color: "#111827",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            로그인
          </Link>
        )}

        {/* 로그인 된 상태 */}
        {!loading && user && (
          <>
            {/* 사용자 이메일/이름 표시 */}
            <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>
              {user.name ? user.name : user.email}
            </span>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </nav>
  );
}