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

  // 회원탈퇴 모달
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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

    if (trimmed.length < 2) return alert("닉네임은 2자 이상이어야 합니다.");
    if (trimmed.length > 20) return alert("닉네임은 20자 이하로 해주세요.");

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
    if (!currentPassword) return alert("현재 비밀번호를 입력해 주세요.");
    if (!pwPolicyOk)
      return alert("비밀번호는 8자 이상이며 숫자와 특수문자를 포함해야 합니다.");
    if (!pwMatchOk) return alert("새 비밀번호 확인이 일치하지 않습니다.");

    try {
      const res = await axios.patch(
        `${API_BASE}/api/me/password`,
        { currentPassword, newPassword },
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

  /* ================== 회원탈퇴 실행 ================== */
  async function handleDeleteAccount() {
    if (!deletePassword) {
      alert("탈퇴를 진행하려면 비밀번호를 입력해주세요.");
      return;
    }

    const ok = window.confirm("마지막 확인: 삭제 후 복구할 수 없습니다. 정말 탈퇴할까요?");
    if (!ok) return;

    try {
      setDeleteLoading(true);

      await axios.delete(`${API_BASE}/api/me`, {
        withCredentials: true,
        data: { password: deletePassword }, 
      });

      localStorage.removeItem("authToken");
      showToast("회원탈퇴가 완료되었습니다.");

      setTimeout(() => {
        window.location.href = "/login";
      }, 400);
    } catch (err) {
      alert(err?.response?.data?.message || "회원탈퇴 실패");
    } finally {
      setDeleteLoading(false);
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
      {/* 토스트 */}
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

      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>마이페이지</h2>

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

      {/* ================== 회원탈퇴 ================== */}
      <div
        style={{
          marginTop: 14,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #fee2e2",
          background: "#fff1f2",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: "#991b1b" }}>
          회원탈퇴
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#7f1d1d",
            lineHeight: 1.5,
          }}
        >
          • 탈퇴 시 카테고리/상품/기록 등 모든 데이터가 삭제됩니다.
          <br />
          • 삭제 후 복구할 수 없습니다.
        </div>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "12px 0",
            borderRadius: 12,
            border: "1px solid #fecaca",
            background: "#fee2e2",
            color: "#991b1b",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: 13,
          }}
        >
          회원탈퇴 진행하기
        </button>
      </div>

      <button
        onClick={() => navigate("/manage")}
        style={{
          marginTop: 16,
          padding: "8px 14px",
          borderRadius: 10,
          border: "1px solid hsl(262, 13.50%, 52.00%)",
          background: "#f8fafc",
          color: "black",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        돌아가기
      </button>

      {/* ================== 회원탈퇴 모달 ================== */}
      {deleteOpen && (
        <div
          onClick={() => {
            if (!deleteLoading) {
              setDeleteOpen(false);
              setDeletePassword("");
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 16,
              background: "white",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              padding: 18,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 900, color: "#991b1b" }}>
              정말 회원탈퇴 하시겠어요?
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "#374151",
                lineHeight: 1.6,
              }}
            >
              아래 항목이 모두 삭제됩니다:
              <div style={{ marginTop: 8, paddingLeft: 14 }}>
                • 카테고리
                <br />
                • 상품(아이템)
                <br />
                • 입고/출고/매입 기록
                <br />
              </div>
              <div style={{ marginTop: 8, color: "#991b1b", fontWeight: 800 }}>
                삭제 후 복구할 수 없습니다.
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                비밀번호 확인
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="현재 비밀번호를 입력해주세요"
                autoComplete="current-password"
                disabled={deleteLoading}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                취소
              </button>

              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteAccount}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 12,
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                {deleteLoading ? "삭제 중..." : "회원탈퇴"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
