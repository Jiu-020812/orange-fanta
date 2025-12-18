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

function App() {
  const location = useLocation();
  const hideTopNav = location.pathname.startsWith("/login");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {!hideTopNav && <TopNav />}

      <main style={{ maxWidth: "none", margin: "0 auto", padding: "24px 16px" }}>
        <Routes>
          {/* 로그인 (보호 안 함) */}
          <Route path="/login" element={<LoginPage />} />

          {/* 메인 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* 품목 관리 리스트 */}
          <Route
            path="/manage"
            element={
              <ProtectedRoute>
                <ManageListPage />
              </ProtectedRoute>
            }
          />

          {/* 품목 상세 */}
          <Route
            path="/manage/item/:name"
            element={
              <ProtectedRoute>
                <ManageDetailPage />
              </ProtectedRoute>
            }
          />

          {/* 품목 등록 */}
          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <AddItemPage />
              </ProtectedRoute>
            }
          />

          {/* 마이페이지 */}
          <Route
            path="/mypage"
            element={
              <ProtectedRoute>
                <MyPage />
              </ProtectedRoute>
            }
          />

          {/* 입출고 페이지 */}
          <Route path="/in" element={<InPage />} />
          <Route path="/out" element={<OutPage />} />

          <Route element={<ProtectedRoute />}>
          <Route path="/manage" element={<ManageListPage />} />
          <Route path="/manage/:itemId" element={<ManageDetailPage />} />

         {/* 예전 주소로 들어오면 manage로 보내버리기 (일단 안전하게) */}
          <Route path="/manage/item/:name" element={<Navigate to="/manage" replace />} />
          <Route path="/manage-id/:itemId" element={<Navigate to="/manage" replace />} />
       </Route>

          {/* 마이그레이션 */}
          <Route
            path="/migrate"
            element={
              <ProtectedRoute>
                <MigratePage />
              </ProtectedRoute>
            }
          />

          {/* 이상한 주소 → 메인 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
