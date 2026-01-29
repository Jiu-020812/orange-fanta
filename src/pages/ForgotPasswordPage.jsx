import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/auth";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setMsg(data?.message || "메일을 발송했습니다. (스팸함도 확인)");
    } catch (err) {
      setMsg(err?.message || "요청 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, padding: 24, borderRadius: 14, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>비밀번호 찾기</h2>
        <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
          가입한 이메일로 비밀번호 재설정 링크를 보내드려요.
        </div>

        <form onSubmit={submit} style={{ marginTop: 14 }}>
          <label style={{ fontSize: 13 }}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 12, width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "#111827", color: "white", fontWeight: 800, cursor: "pointer" }}
          >
            {loading ? "전송 중..." : "재설정 메일 보내기"}
          </button>
        </form>

        {msg && (
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", fontSize: 13, whiteSpace: "pre-line" }}>
            {msg}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{ marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 12, border: "1px solid #e5e7eb", background: "white", color: "black", cursor: "pointer", fontWeight: 800 }}
        >
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
