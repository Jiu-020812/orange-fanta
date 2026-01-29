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
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export { API_BASE };
export default client;
