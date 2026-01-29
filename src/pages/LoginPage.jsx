import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, signup, resendVerify } from "../api/auth";
import api from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 / 회원가입 모드
  const [mode, setMode] = useState("login"); // login | signup

  // 입력값
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // 상태
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  //  이메일 인증 필요 상태인지(에러로 판단)
  const needVerify = error.includes("이메일 인증");

  // 이메일 인증 완료 배너
  const verified = new URLSearchParams(location.search).get("verified") === "1";

  //  인증 메일 재전송
  async function handleResendVerify() {
    if (!email) {
      setError("인증 메일을 다시 받으려면 이메일을 먼저 입력해주세요.");
      return;
    }

    setError("");
    setNotice("📨 인증 메일을 다시 보내는 중...");

    try {
      await resendVerify(email);

      setNotice(
        "📧 인증 메일을 다시 보냈어요.\n메일함(스팸함 포함)을 확인해주세요."
      );
    } catch (e) {
      setNotice("");
      setError(
        e?.message ||
          "인증 메일 재전송에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await login({ email, password });

        // (토큰 방식이면 유지, 쿠키 방식이면 없어도 OK)
        if (result?.token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;
          localStorage.setItem("authToken", result.token);
        }

        navigate("/");
        return;
      }

      // 회원가입 (자동 로그인 X)
      const r = await signup({ email, password, name });

      setMode("login");
      setNotice(
        r?.message ||
          "회원가입이 완료되었습니다.\n📧 가입하신 이메일(스팸함 포함)에서 인증을 완료한 뒤 로그인해주세요."
      );
      setPassword("");
      return;
    } catch (err) {
      if (err.status === 403 && err.message.includes("이메일")) {
        setError(
          "이메일 인증이 완료되지 않았습니다.\n" +
            "가입하신 이메일(스팸함 포함)을 확인한 뒤 인증을 완료해주세요."
        );
      } else {
        setError(err.message || "오류가 발생했습니다.");
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
        {/* 탭 */}
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
            onClick={() => {
              setMode("login");
              setError("");
              setNotice("");
            }}
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
            onClick={() => {
              setMode("signup");
              setError("");
              setNotice("");
            }}
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
            }}
          >
             이메일 인증이 완료되었습니다. 로그인해주세요.
          </div>
        )}

        {/* 회원가입 후 안내 / 재전송 성공 안내 */}
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
              whiteSpace: "pre-line",
            }}
          >
            {notice}
          </div>
        )}

        {/* 에러 */}
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
              whiteSpace: "pre-line",
            }}
          >
            ❗ {error}
          </div>
        )}

        {/* 이메일 인증 필요할 때 재전송 버튼 */}
        {mode === "login" && needVerify && (
          <button
            type="button"
            onClick={handleResendVerify}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 12,
              border: "1px solid #fed7aa",
              background: "#fff7ed",
              color: "#9a3412",
              fontWeight: 800,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            인증 메일 다시 보내기
          </button>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13 }}>이름 / 닉네임</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13 }}>이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13 }}>비밀번호</label>
            <input
              type="password"
               placeholder="abcd1234!"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

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
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </button>

          {mode === "login" && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
       <button
        type="button"
        onClick={() => navigate("/forgot-password")}
        style={{
        background: "transparent",
        border: "none",
        color: "#2563eb",
        cursor: "pointer",
        fontSize: 13,
        textDecoration: "underline",
        padding: 0,
      }}
    >
      비밀번호를 잊으셨나요?
    </button>
  </div>
)}
        </form>
      </div>
    </div>
  );
}
