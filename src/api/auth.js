import api from "./client"; // axios 인스턴스 (baseURL: API_BASE, withCredentials: true)
import { request, handleError } from "./request";

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

//  핵심: 백엔드가 /api/auth/* 라우트를 쓰므로 prefix 고정
const AUTH_PREFIX = "/api/auth";

// -------------------- 회원가입 --------------------
export async function signup({ email, password, name }) {
  const res = await request(() =>
    api.post(`${AUTH_PREFIX}/signup`, {
      email,
      password,
      name,
    })
  );

  const data = res.data;
  if (data?.token) setAuthToken(data.token);
  return data.user;
}

// -------------------- 로그인 --------------------
export async function login({ email, password }) {
  const res = await request(() =>
    api.post(`${AUTH_PREFIX}/login`, {
      email,
      password,
    })
  );

  const data = res.data;
  if (data?.token) setAuthToken(data.token);
  return data.user;
}

// -------------------- 내 정보 조회 (인증용) --------------------
export async function getAuthMe() {
  const res = await request(() => api.get(`${AUTH_PREFIX}/me`));
  return res.data.user;
}

// -------------------- 로그아웃 --------------------
export async function logout() {
  try {
    await request(() => api.post(`${AUTH_PREFIX}/logout`));
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

export async function resendVerify(email) {
  const res = await request(() =>
    api.post(`${AUTH_PREFIX}/resend-verify`, { email })
  );
  return res.data;
}

export async function forgotPassword(email) {
  const res = await request(() =>
    api.post(`${AUTH_PREFIX}/forgot-password`, { email })
  );
  return res.data;
}

export async function resetPassword({ token, newPassword }) {
  const res = await request(() =>
    api.post(`${AUTH_PREFIX}/reset-password`, { token, newPassword })
  );
  return res.data;
}

export { handleError };
