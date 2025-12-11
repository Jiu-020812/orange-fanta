import api from "./items"; // axios 인스턴스 (withCredentials: true 설정되어 있음)

// 공통: 토큰 저장 & axios 기본 헤더 세팅
function setAuthToken(token) {
  if (!token) return;
  try {
    window.localStorage.setItem("authToken", token);
  } catch (e) {
    console.warn("localStorage 저장 실패:", e);
  }
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// 공통: 에러 메시지 정리
function parseError(err) {
  console.error("🔴 [auth.js] 요청 실패:", err);

  // 백엔드에서 내려준 메시지 우선 사용
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.message) return err.message;
  return "요청에 실패했습니다.";
}

// -------------------- 회원가입 --------------------
export async function signup({ email, password, name }) {
  try {
    const res = await api.post("/auth/signup", {
      email,
      password,
      name,
    });

    const data = res.data;
    // 백엔드 authRoutes.js 기준: { ok, mode:"signup", user, token }
    if (data?.token) {
      setAuthToken(data.token);
    }

    return data.user; // 필요하면 LoginPage에서 써도 됨
  } catch (err) {
    throw new Error(parseError(err));
  }
}

// -------------------- 로그인 --------------------
export async function login({ email, password }) {
  try {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    const data = res.data;
    // { ok, mode:"login", user, token } 기대
    if (data?.token) {
      setAuthToken(data.token);
    }

    return data.user;
  } catch (err) {
    throw new Error(parseError(err));
  }
}

// -------------------- 내 정보 조회 --------------------
export async function getMe() {
  try {
    const res = await api.get("/auth/me");
    // 백엔드: { ok: true, user: {...} }
    return res.data.user;
  } catch (err) {
    throw new Error(parseError(err));
  }
}

// -------------------- 로그아웃 --------------------
export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.warn("로그아웃 요청 실패 (무시 가능):", err);
  }

  try {
    window.localStorage.removeItem("authToken");
  } catch (e) {
    console.warn("localStorage 제거 실패:", e);
  }
  delete api.defaults.headers.common["Authorization"];
}