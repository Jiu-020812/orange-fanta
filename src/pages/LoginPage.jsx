import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await signup({ email, password, name });
      }

      // 로그인/회원가입 성공 → 메인 페이지로 이동
      navigate("/");
    } catch (err) {
      setError(err.message || "실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
      }}
    >
      <div
        style={{
          width: 360,
          padding: 24,
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            marginBottom: 16,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          📦 재고 관리 로그인
        </h1>

        <div
          style={{
            display: "flex",
            marginBottom: 16,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: "8px 0",
              border: "none",
              background: mode === "login" ? "#111827" : "transparent",
              color: mode === "login" ? "#fff" : "#6b7280",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              padding: "8px 0",
              border: "none",
              background: mode === "signup" ? "#111827" : "transparent",
              color: mode === "signup" ? "#fff" : "#6b7280",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ marginBottom: 12 }}>
              <label
                style={{ display: "block", fontSize: 13, marginBottom: 4 }}
              >
                이름 / 닉네임
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
              required
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
              required
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: 12,
                fontSize: 13,
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 999,
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              background: "#111827",
              color: "#fff",
              marginTop: 4,
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