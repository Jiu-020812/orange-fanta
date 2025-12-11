import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "../api/auth";  //  경로는 수정

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function checkLogin() {
      try {
        await getMe();      //  로그인하면 성공
        setLoggedIn(true);  // 로그인됨
      } catch {
        setLoggedIn(false); // 로그인 안 됨
      } finally {
        setChecking(false); // 로딩 종료
      }
    }

    checkLogin();
  }, []);

  if (checking) return <div>Loading...</div>;

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}