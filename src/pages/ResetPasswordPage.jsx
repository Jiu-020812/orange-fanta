import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const PASSWORD_REGEX =
  /^(?=.*\d)(?=.*[!@#$%^&*()[\]{};:'",.<>/?\\|`~+=_-]).{8,}$/;

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const policyOk = PASSWORD_REGEX.test(pw1);
  const matchOk = pw1.length > 0 && pw1 === pw2;

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    if (!token) return setMsg("유효하지 않은 링크입니다.");
    if (!policyOk) return setMsg("비밀번호는 8자 이상이며 숫자와 특수문자를 포함해야 합니다.");
    if (!matchOk) return setMsg("비밀번호 확인이 일치하지 않습니다.");

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/auth/reset-password`,
        { token, newPassword: pw1 },
        { withCredentials: true }
      );
      navigate("/login?reset=1");
    } catch (err) {
      setMsg(err?.response?.data?.message || "변경 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, padding: 24, borderRadius: 14, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>비밀번호 재설정</h2>

        <form onSubmit={submit} style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            placeholder="새 비밀번호"
            autoComplete="new-password"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="새 비밀번호 확인"
            autoComplete="new-password"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
          />

          <div style={{ fontSize: 13 }}>
            <div style={{ color: policyOk ? "#16a34a" : "#dc2626" }}>• 8자 이상 + 숫자 + 특수문자 포함</div>
            <div style={{ color: matchOk ? "#16a34a" : "#dc2626" }}>• 새 비밀번호 확인 일치</div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 6, width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "#111827", color: "white", fontWeight: 800, cursor: "pointer" }}
          >
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>

        {msg && (
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13, whiteSpace: "pre-line" }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
