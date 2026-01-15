import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, signup } from "../api/auth";  
import api from "../api/items";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const verified = new URLSearchParams(location.search).get("verified") === "1";
  const [notice, setNotice] = useState("");

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
      setNotice("");
      setLoading(true);
    
      try {
        if (mode === "login") {
          const result = await login({ email, password });
    
          if (result && result.token) {
            const token = result.token;
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            window.localStorage.setItem("authToken", token);
          }
    
          navigate("/");
          return;
        }
    
        //  회원가입 (자동 로그인 X)
        const result = await signup({ email, password, name });
    
        // 서버가 message를 주면 그걸 우선 사용
        setNotice(
          result?.message ||
            "회원가입이 완료되었습니다.\n가입하신 이메일로 인증 메일을 보냈어요. 이메일 인증 후 로그인할 수 있습니다."
        );
    
        // 로그인 모드로 전환 + 비번 입력은 남겨도 되고 지워도 됨(여기서는 지움 추천)
        setMode("login");
        setPassword("");
      } catch (err) {
        // 이메일 인증이 필요할 때 더 친절하게
        const status = err?.status || err?.response?.status;
        const msg = err?.message || err?.response?.data?.message || "";
    
        if (status === 403 && msg.includes("이메일 인증")) {
          setError(
            "이메일 인증이 완료되지 않았습니다.\n가입하신 이메일(스팸함 포함)에서 인증을 완료한 뒤 로그인해주세요."
          );
        } else {
          setError(msg || "오류가 발생했습니다.");
        }
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

        {/* 인증 완료 배너 */}
{verified && (
  <div
    style={{
      padding: "10px 12px",
      borderRadius: 8,
      background: "#ecfdf5",
      border: "1px solid #a7f3d0",
      color: "#065f46",
      fontSize: 13,
      marginBottom: 12,
      lineHeight: 1.4,
    }}
  >
     이메일 인증이 완료되었습니다. 이제 로그인해주세요.
  </div>
)}

{/* 회원가입 완료 안내 */}
{notice && (
  <div
    style={{
      padding: "10px 12px",
      borderRadius: 8,
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      color: "#9a3412",
      fontSize: 13,
      marginBottom: 12,
      lineHeight: 1.4,
      whiteSpace: "pre-line",
    }}
  >
    📧 {notice}
  </div>
)}

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
            type="button"    
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
            type="button"  
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
              : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
}
