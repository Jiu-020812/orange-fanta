import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import api from "./api/client";

// 토큰 복구 (localStorage 또는 sessionStorage)
const savedToken =
  window.localStorage.getItem("authToken") ||
  window.sessionStorage.getItem("authToken");

if (savedToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
  console.log("[App Init] 저장된 토큰 복구 완료");
} else {
  console.log("[App Init] 저장된 토큰 없음");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
