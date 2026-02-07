import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, signup, resendVerify } from "../api/auth";
import api from "../api/client";
import SEO from "../components/SEO";

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

  // 베타 서비스 동의
  const [betaAgreed, setBetaAgreed] = useState(false);
  const [betaAgreementText, setBetaAgreementText] = useState("");

  // 상태
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

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
    setDebugLog([]);

    const addLog = (msg) => {
      setDebugLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
      console.log(msg);
    };

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
      if (!betaAgreed || betaAgreementText !== "동의합니다") {
        setError("베타 서비스 이용 약관에 동의해주세요. (하단에 '동의합니다'를 입력해주세요)");
        return;
      }
    }

    setLoading(true);
    addLog(`시작: ${mode === "login" ? "로그인" : "회원가입"}`);

    try {
      if (mode === "login") {
        addLog("로그인 API 호출 시작");
        const result = await login({ email, password });
        addLog(`로그인 API 응답: ${JSON.stringify(result)}`);

        const storedToken = window.localStorage.getItem("authToken");
        addLog(`저장된 토큰: ${storedToken ? "있음" : "없음"}`);
        addLog(`토큰 값: ${storedToken?.substring(0, 20)}...`);

        if (storedToken) {
          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          addLog("토큰 헤더 설정 완료");
        }

        addLog("홈으로 이동 시도");
        addLog(`현재 경로: ${window.location.pathname}`);

        // 5초 후에 이동 (디버깅용)
        addLog("5초 후 이동합니다. 로그를 확인하세요.");
        setTimeout(() => {
          navigate("/home");
          addLog("navigate 호출 완료");
        }, 5000);
      } else {
        addLog("회원가입 API 호출 시작");
        await signup({ email, password, name });
        addLog("회원가입 완료");
        setNotice(
          "✅ 회원가입 완료!\n이메일 인증 링크를 확인해주세요. (스팸함 포함)"
        );
        setMode("login");
        setPassword("");
        setPasswordConfirm("");
        setName("");
      }
    } catch (err) {
      addLog(`에러 발생: ${err?.message || err}`);
      addLog(`에러 타입: ${err?.constructor?.name || typeof err}`);
      addLog(`에러 스택: ${err?.stack || "없음"}`);
      addLog(`에러 response: ${JSON.stringify(err?.response)}`);
      addLog(`에러 request: ${err?.request ? "있음" : "없음"}`);
      addLog(`에러 config: ${JSON.stringify(err?.config?.url)}`);
      addLog(`전체 에러: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`);
      setError(err?.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
      addLog("완료");
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
    <>
      <SEO
        title={mode === "login" ? "로그인 - MyInventory" : "회원가입 - MyInventory"}
        description={mode === "login" ? "MyInventory 재고 관리 시스템에 로그인하세요. 네이버, 쿠팡 연동 재고관리" : "MyInventory 무료 회원가입. 베타 기간 중 가입 시 특별 혜택 제공"}
        url={`https://myinvetory.com${mode === "signup" ? "?mode=signup" : "/login"}`}
        noindex={true}
        nofollow={true}
      />
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

            {/* 베타 서비스 동의 */}
            {mode === "signup" && (
              <div
                style={{
                  padding: '16px',
                  background: '#fef3c7',
                  border: '2px solid #f59e0b',
                  borderRadius: '12px',
                  marginTop: '8px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>
                  ⚠️ 베타 서비스 이용 약관
                </div>
                <div style={{ fontSize: '11px', color: '#78350f', lineHeight: '1.6', marginBottom: '12px' }}>
                  현재 MyInventory는 <strong>무료 베타 버전</strong>으로 운영 중입니다.
                  향후 정식 서비스 전환 시 유료화가 진행될 수 있으나, 베타 기간 중 가입하신 초기 사용자분들께는
                  <strong style={{ color: '#10b981' }}> 특별 혜택 및 할인</strong>이 제공될 예정입니다.
                  서비스 이용 중 발생하는 데이터 손실 및 장애에 대해서는 책임을 지지 않으며,
                  베타 테스트 참여에 동의하시는 경우에만 회원가입을 진행해주시기 바랍니다.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    checked={betaAgreed}
                    onChange={(e) => {
                      setBetaAgreed(e.target.checked);
                      if (!e.target.checked) setBetaAgreementText("");
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                    }}
                  />
                  <label style={{ fontSize: '12px', color: '#78350f', fontWeight: '600', flex: 1 }}>
                    위 내용을 확인하였으며 베타 서비스 이용에 동의합니다
                  </label>
                </div>

                {betaAgreed && (
                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="text"
                      placeholder="동의합니다"
                      value={betaAgreementText}
                      onChange={(e) => setBetaAgreementText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        border: `2px solid ${betaAgreementText === "동의합니다" ? '#10b981' : '#f59e0b'}`,
                        borderRadius: '8px',
                        outline: 'none',
                        textAlign: 'center',
                        fontWeight: '600',
                        background: 'white',
                      }}
                    />
                    {betaAgreementText && betaAgreementText !== "동의합니다" && (
                      <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', textAlign: 'center' }}>
                        정확히 "동의합니다"를 입력해주세요
                      </div>
                    )}
                    {betaAgreementText === "동의합니다" && (
                      <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', textAlign: 'center' }}>
                        ✓ 동의 완료
                      </div>
                    )}
                  </div>
                )}
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
                setBetaAgreed(false);
                setBetaAgreementText("");
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

          {/* 디버그 로그 (모바일 디버깅용) */}
          {debugLog.length > 0 && (
            <div
              style={{
                marginTop: '20px',
                padding: '12px',
                background: '#1f2937',
                color: '#10b981',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                maxHeight: '200px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {debugLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
