import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getMe } from "../api/me";

export default function ProtectedRoute() {
  const location = useLocation();
  const [ok, setOk] = useState(null); // null=확인중, true/false

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        console.log("[ProtectedRoute] 인증 확인 시작");
        const data = await getMe();
        console.log("[ProtectedRoute] getMe 응답:", data);
        if (!data?.ok) throw new Error("not authenticated");
        if (alive) {
          console.log("[ProtectedRoute] 인증 성공");
          setOk(true);
        }
      } catch (err) {
        console.error("[ProtectedRoute] 인증 실패:", err);
        if (alive) setOk(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (ok === null) {
    return (
      <div style={{ padding: 24, fontSize: 14, color: "#6b7280" }}>
        인증 확인 중...
      </div>
    );
  }

  if (ok === false) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
