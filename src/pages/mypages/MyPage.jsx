import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// 비밀번호 정책: 8자 이상 + 숫자 + 특수문자
const PASSWORD_REGEX =
  /^(?=.*\d)(?=.*[!@#$%^&*()[\]{};:'",.<>/?\\|`~+=_-]).{8,}$/;

export default function MyPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  const [name, setName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [toast, setToast] = useState("");

  const pwPolicyOk = useMemo(
    () => PASSWORD_REGEX.test(newPassword),
    [newPassword]
  );
  const pwMatchOk = useMemo(
    () => newPassword.length > 0 && newPassword === newPassword2,
    [newPassword, newPassword2]
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /* ================== 내 정보 불러오기 ================== */
  async function fetchMe() {
    try {
      const res = await axios.get(`${API_BASE}/api/me`, {
        withCredentials: true,
      });

      if (res.data?.ok) {
        setMe(res.data.user);
        setName(res.data.user?.name ?? "");
      } else {
        navigate("/login");
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/login");
      }
      console.error("GET /api/me error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================== 닉네임 저장 ================== */
  async function saveName() {
    const trimmed = String(name ?? "").trim();

    if (trimmed.length < 2) {
      return alert("닉네임은 2자 이상이어야 합니다.");
    }
    if (trimmed.length > 20) {
      return alert("닉네임은 20자 이하로 해주세요.");
    }

    try {
      const res = await axios.patch(
        `${API_BASE}/api/me`,
        { name: trimmed },
        { withCredentials: true }
      );

      if (res.data?.ok) {
        setMe(res.data.user);
        showToast("닉네임 저장 완료!");
      } else {
        alert(res.data?.message || "닉네임 저장 실패");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "닉네임 저장 실패");
    }
  }

  /* ================== 비밀번호 변경 ================== */
  async function changePassword() {
    if (!currentPassword) {
      return alert("현재 비밀번호를 입력해 주세요.");
    }
    if (!pwPolicyOk) {
      return alert("비밀번호는 8자 이상이며 숫자와 특수문자를 포함해야 합니다.");
    }
    if (!pwMatchOk) {
      return alert("새 비밀번호 확인이 일치하지 않습니다.");
    }

    try {
      const res = await axios.patch(
        `${API_BASE}/api/me/password`,
        {
          currentPassword,
          newPassword,
        },
        { withCredentials: true }
      );

      if (res.data?.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setNewPassword2("");
        showToast("비밀번호 변경 완료!");
      } else {
        alert(res.data?.message || "비밀번호 변경 실패");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "비밀번호 변경 실패");
    }
  }

  /* ================== 렌더 ================== */
  if (loading) {
    return <div style={{ padding: 24 }}>로딩 중...</div>;
  }

  if (!me) {
    return <div style={{ padding: 24 }}>로그인이 필요합니다.</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 14px",
            borderRadius: 999,
            backgroundColor: "rgba(59,130,246,0.95)",
            color: "white",
            fontSize: 13,
            zIndex: 200,
          }}
        >
          {toast}
        </div>
      )}

      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
        마이페이지
      </h2>

      <div style={{ color: "#64748b", marginTop: 6, fontSize: 13 }}>
        이메일: <b>{me.email}</b>
      </div>

      {/* ================== 닉네임 ================== */}
      <div
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
          닉네임 변경
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="닉네임"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />

        <button
          onClick={saveName}
          style={{
            marginTop: 10,
            padding: "8px 14px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          저장
        </button>
      </div>

      {/* ================== 비밀번호 ================== */}
      <div
        style={{
          marginTop: 14,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
          비밀번호 변경
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <input
            type="password"
            placeholder="현재 비밀번호"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />

          <input
            type="password"
            placeholder="새 비밀번호"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />

          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginTop: 10, fontSize: 13 }}>
          <div style={{ color: pwPolicyOk ? "#16a34a" : "#dc2626" }}>
            • 8자 이상 + 숫자 + 특수문자 포함
          </div>
          <div style={{ color: pwMatchOk ? "#16a34a" : "#dc2626" }}>
            • 새 비밀번호 확인 일치
          </div>
        </div>

        <button
          onClick={changePassword}
          style={{
            marginTop: 12,
            padding: "8px 14px",
            borderRadius: 10,
            border: "none",
            background: "#111827",
            color: "white",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          비밀번호 변경
        </button>
      </div>

      <button
        onClick={() => navigate("/manage")}
        style={{
          marginTop: 16,
          padding: "8px 14px",
          borderRadius: 10,
          border: "1px solidhsl(262, 13.50%, 52.00%)",
          background: "#f8fafc",
          color : black ,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        관리로 돌아가기
      </button>
    </div>
  );
}
