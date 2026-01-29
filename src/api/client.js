import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://orange-fanta-back.vercel.app";

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const url = String(error?.config?.url || "");
      const allowlist = [
        "/api/auth/login",
        "/api/auth/signup",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/resend-verify",
      ];
      const shouldRedirect = !allowlist.some((path) => url.includes(path));
      if (shouldRedirect) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export { API_BASE };
export default client;
