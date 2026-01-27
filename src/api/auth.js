import api from "./client"; // axios 인스턴스 (baseURL: API_BASE, withCredentials: true)

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
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  return "요청에 실패했습니다.";
}

//  핵심: 백엔드가 /api/auth/* 라우트를 쓰므로 prefix 고정
const AUTH_PREFIX = "/api/auth";

// -------------------- 회원가입 --------------------
export async function signup({ email, password, name }) {
  try {
    const res = await api.post(`${AUTH_PREFIX}/signup`, {
      email,
      password,
      name,
    });

    const data = res.data;
    if (data?.token) setAuthToken(data.token);
    return data.user;
  } catch (err) {
    throw new Error(parseError(err));
  }
}

// -------------------- 로그인 --------------------
export async function login({ email, password }) {
  try {
    const res = await api.post(`${AUTH_PREFIX}/login`, {
      email,
      password,
    });

    const data = res.data;
    if (data?.token) setAuthToken(data.token);
    return data.user;
  } catch (err) {
    throw new Error(parseError(err));
  }
}

// -------------------- 내 정보 조회 --------------------
export async function getMe() {
  try {
    const res = await api.get(`${AUTH_PREFIX}/me`);
    return res.data.user;
  } catch (err) {
    throw new Error(parseError(err));
  }
}

// -------------------- 로그아웃 --------------------
export async function logout() {
  try {
    await api.post(`${AUTH_PREFIX}/logout`);
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
