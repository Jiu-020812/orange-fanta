import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, signup, resendVerify } from "../api/auth";
import api from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 마우스 위치 추적
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // 로그인 / 회원가입 모드
  const [mode, setMode] = useState("login");

  // 입력값
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");

  // 상태
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const needVerify = error.includes("이메일 인증");
  const verified = new URLSearchParams(location.search).get("verified") === "1";

  // 마우스 움직임 추적
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setMousePos({ x, y });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  async function handleResendVerify() {
    if (!email) {
      setError("인증 메일을 다시 받으려면 이메일을 먼저 입력해주세요.");
      return;
    }

    setError("");
    setNotice("📨 인증 메일을 다시 보내는 중...");

    try {
      await resendVerify(email);
      setNotice("📧 인증 메일을 다시 보냈어요.\n메일함(스팸함 포함)을 확인해주세요.");
    } catch (e) {
      setNotice("");
      setError(e?.message || "인증 메일 재전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) {
        setError("비밀번호는 8자 이상이어야 합니다.");
        return;
      }
      if (password !== passwordConfirm) {
        setError("비밀번호가 일치하지 않습니다.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await login({ email, password });
        const storedToken = window.localStorage.getItem("authToken");
        if (storedToken) {
          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        }
        navigate("/home");
      } else {
        await signup({ email, password, name });
        setNotice(
          "✅ 회원가입 완료!\n이메일 인증 링크를 확인해주세요. (스팸함 포함)"
        );
        setMode("login");
        setPassword("");
        setPasswordConfirm("");
        setName("");
      }
    } catch (err) {
      setError(err?.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 캐릭터 기울기 계산
  const getCharacterStyle = (index) => {
    const baseRotate = (mousePos.x * 15) * (index === 1 ? 1 : index === 0 ? 0.7 : 1.3);
    const baseTranslate = mousePos.x * 10 * (index === 1 ? 1 : index === 0 ? 0.5 : 1.5);

    return {
      transform: `translateX(${baseTranslate}px) rotate(${baseRotate}deg)`,
      transition: 'transform 0.3s ease-out',
    };
  };

  // 눈동자 위치 계산
  const getEyeStyle = () => {
    return {
      transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 8}px)`,
      transition: 'transform 0.2s ease-out',
    };
  };

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 애니메이션 */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.3,
          background: `radial-gradient(circle at ${50 + mousePos.x * 20}% ${50 + mousePos.y * 20}%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
          transition: 'background 0.3s ease-out',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* 캐릭터들 */}
        <div
          style={{
            display: 'flex',
            gap: '60px',
            marginBottom: '20px',
          }}
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                ...getCharacterStyle(index),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* 캐릭터 몸통 */}
              <div
                style={{
                  width: '100px',
                  height: '120px',
                  background: `linear-gradient(135deg, ${
                    index === 0 ? '#ff6b9d, #ffa5c5' :
                    index === 1 ? '#4facfe, #00f2fe' :
                    '#43e97b, #38f9d7'
                  })`,
                  borderRadius: '50% 50% 45% 45%',
                  position: 'relative',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                }}
              >
                {/* 얼굴 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '70px',
                    height: '70px',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {/* 눈 */}
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {[0, 1].map((eyeIndex) => (
                      <div
                        key={eyeIndex}
                        style={{
                          width: '12px',
                          height: '12px',
                          background: 'white',
                          borderRadius: '50%',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            ...getEyeStyle(),
                            width: '8px',
                            height: '8px',
                            background: '#111',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-4px',
                            marginLeft: '-4px',
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* 입 */}
                  <div
                    style={{
                      width: '20px',
                      height: '10px',
                      borderBottom: '3px solid #ff6b9d',
                      borderRadius: '0 0 20px 20px',
                    }}
                  />
                </div>

                {/* 팔 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '60px',
                    left: '-15px',
                    width: '30px',
                    height: '40px',
                    background: `linear-gradient(135deg, ${
                      index === 0 ? '#ff6b9d, #ffa5c5' :
                      index === 1 ? '#4facfe, #00f2fe' :
                      '#43e97b, #38f9d7'
                    })`,
                    borderRadius: '15px',
                    transform: 'rotate(-20deg)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '60px',
                    right: '-15px',
                    width: '30px',
                    height: '40px',
                    background: `linear-gradient(135deg, ${
                      index === 0 ? '#ff6b9d, #ffa5c5' :
                      index === 1 ? '#4facfe, #00f2fe' :
                      '#43e97b, #38f9d7'
                    })`,
                    borderRadius: '15px',
                    transform: 'rotate(20deg)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 로그인 카드 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <h2
            style={{
              fontSize: '32px',
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {mode === "login" ? "로그인" : "회원가입"}
          </h2>

          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
            📦 평균값 계산 재고관리
          </p>

          {/* 알림 메시지 */}
          {verified && (
            <div
              style={{
                padding: '12px',
                background: '#d1fae5',
                border: '1px solid #10b981',
                borderRadius: '8px',
                color: '#065f46',
                marginBottom: '20px',
                fontSize: '14px',
              }}
            >
              ✅ 이메일 인증이 완료되었습니다! 로그인해주세요.
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '12px',
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#991b1b',
                marginBottom: '20px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              style={{
                padding: '12px',
                background: '#dbeafe',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                color: '#1e40af',
                marginBottom: '20px',
                fontSize: '14px',
                whiteSpace: 'pre-line',
              }}
            >
              {notice}
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === "signup" && (
              <input
                type="text"
                placeholder="이름 (선택)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
            )}

            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '14px 16px',
                fontSize: '15px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />

            <input
              type="password"
              placeholder={mode === "signup" ? "비밀번호 (8자 이상)" : "비밀번호"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '14px 16px',
                fontSize: '15px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />

            {mode === "signup" && (
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                style={{
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: `2px solid ${passwordConfirm && password !== passwordConfirm ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = passwordConfirm && password !== passwordConfirm ? '#ef4444' : '#667eea')}
                onBlur={(e) => (e.target.style.borderColor = passwordConfirm && password !== passwordConfirm ? '#ef4444' : '#e5e7eb')}
              />
            )}

            {mode === "signup" && passwordConfirm && password !== passwordConfirm && (
              <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '-8px' }}>
                비밀번호가 일치하지 않습니다.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </button>
          </form>

          {/* 모드 전환 */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setNotice("");
                setPasswordConfirm("");
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {mode === "login" ? "회원가입하기" : "로그인하기"}
            </button>

            {mode === "login" && (
              <>
                <span style={{ margin: '0 8px', color: '#d1d5db' }}>|</span>
                <button
                  onClick={() => navigate("/forgot-password")}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  비밀번호 찾기
                </button>
              </>
            )}
          </div>

          {/* 인증 메일 재전송 */}
          {needVerify && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={handleResendVerify}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f59e0b',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                📧 인증 메일 다시 받기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
