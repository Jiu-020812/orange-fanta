import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../api/auth";  
import api from "../api/items";

export default function LoginPage() {
  const navigate = useNavigate();

  //  로그인 / 회원가입 모드
  const [mode, setMode] = useState("login"); // login | signup

  //  입력값
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  //  상태
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 
    // 로그인 / 회원가입 처리
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;

      if (mode === "login") {
        // 로그인
        result = await login({ email, password });
      } else {
        // 회원가입 후 자동 로그인
        result = await signup({ email, password, name });
      }

      // 🔑 서버에서 내려준 토큰 있으면 axios + localStorage에 저장
      if (result && result.token) {
        const token = result.token;

        // 앞으로의 모든 api 요청에 Authorization 헤더 추가
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // 새로고침 후에도 유지되도록 저장
        window.localStorage.setItem("authToken", token);
      }

      // 성공 → 홈으로 이동
      navigate("/");
    } catch (err) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          padding: 24,
          borderRadius: 14,
          background: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* -------------------------------------
            상단 탭 (로그인 / 회원가입)
        -------------------------------------- */}
        <div
          style={{
            display: "flex",
            marginBottom: 20,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: "10px 0",
              fontWeight: 600,
              background: mode === "login" ? "#111827" : "transparent",
              color: mode === "login" ? "#fff" : "#6b7280",
              border: "none",
              cursor: "pointer",
            }}
          >
            로그인
          </button>

          <button
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              padding: "10px 0",
              fontWeight: 600,
              background: mode === "signup" ? "#111827" : "transparent",
              color: mode === "signup" ? "#fff" : "#6b7280",
              border: "none",
              cursor: "pointer",
            }}
          >
            회원가입
          </button>
        </div>

        {/* -------------------------------------
            입력 폼
        -------------------------------------- */}
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, marginBottom: 4, display: "block" }}>
                이름 / 닉네임
              </label>
              <input
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, marginBottom: 4, display: "block" }}>
              이메일
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, marginBottom: 4, display: "block" }}>
              비밀번호
            </label>
            <input
              type="password"
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: 13,
                marginBottom: 12,
                lineHeight: 1.4,
            }}
            >
                ❗ {error}
                </div>
            )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 12,
              border: "none",
              background: "#111827",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {loading
              ? "처리 중..."
              : mode === "login"
              ? "로그인"
              : "회원가입 후 로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
