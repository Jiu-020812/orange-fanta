import api from "./items"; // 경로: items.js랑 같은 폴더라면 이게 맞음

// 공통 요청 래퍼 (에러 메시지 통일용)
async function request(path, options = {}) {
  try {
    const method = options.method || "GET";
    const data = options.body ? JSON.parse(options.body) : undefined;

    let res;
    if (method === "GET") {
      res = await api.get(path);
    } else {
      res = await api.request({
        url: path,
        method,
        data,
      });
    }

    return res.data;
  } catch (err) {
    console.error("🔴 [auth.js] 요청 실패:", err);

    // 서버에서 보낸 에러 메시지 우선 사용
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "요청에 실패했습니다.";

    throw new Error(msg);
  }
}

// -------------------- 로그인 --------------------
export function login({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// -------------------- 회원가입 --------------------
export function signup({ email, password, name }) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

// -------------------- 내 정보 조회 --------------------
export function getMe() {
  return request("/auth/me", {
    method: "GET",
  });
}

// -------------------- 로그아웃 --------------------
export function logout() {
  return request("/auth/logout", {
    method: "POST",
  });
}