import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import HomePage from "./pages/HomePage";
import AddItemPage from "./pages/AddItemPage";
import ManageListPage from "./pages/ManageListPage";
import ManageDetailPage from "./pages/ManageDetailPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MigratePage from "./pages/MigratePage";
import MyPage from "./pages/mypages/MyPage";
import InPage from "./pages/InPage.jsx";
import OutPage from "./pages/OutPage.jsx";
import TopNav from "./components/TopNav.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  const location = useLocation();
  const hideTopNav = location.pathname.startsWith("/login");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {!hideTopNav && <TopNav />}

      <main style={{ maxWidth: "none", margin: "0 auto", padding: "24px 16px" }}>
        <Routes>
          {/* ================= 공개 ================= */}
          <Route path="/login" element={<LoginPage />} />

          {/* ================= 보호 ================= */}
          <Route element={<ProtectedRoute />}>
            {/* 메인 */}
            <Route path="/" element={<HomePage />} />

            {/* 품목 관리 */}
            <Route path="/manage" element={<ManageListPage />} />
            <Route path="/manage/:itemId" element={<ManageDetailPage />} />

            {/* 품목 등록 */}
            <Route path="/add" element={<AddItemPage />} />

            {/* 마이페이지 */}
            <Route path="/mypage" element={<MyPage />} />

            {/* 입출고 */}
            <Route path="/in" element={<InPage />} />
            <Route path="/out" element={<OutPage />} />

            {/* 마이그레이션 */}
            <Route path="/migrate" element={<MigratePage />} />
          </Route>

          {/* ================= 예전/잘못된 주소 처리 ================= */}
          <Route
            path="/manage/item/:name"
            element={<Navigate to="/manage" replace />}
          />
          <Route
            path="/manage-id/:itemId"
            element={<Navigate to="/manage" replace />}
          />

          {/* ================= fallback ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* ================= 비밀번호 재설정 ================= */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </main>
    </div>
  );
}

export default App;
