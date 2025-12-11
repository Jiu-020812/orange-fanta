const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ?? "https://orange-fanta-back.vercel.app";
  
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include", // 쿠키 포함!
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message || "요청 실패";
    throw new Error(msg);
  }

  return data;
}

export function signup({ email, password, name }) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export function login({ email, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return request("/api/auth/me", {
    method: "GET",
  });
}

export function logout() {
  return request("/api/auth/logout", {
    method: "POST",
  });
}