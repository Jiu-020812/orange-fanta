import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const join = (base, path) => `${base}${path.startsWith("/") ? "" : "/"}${path}`;

export default function ProtectedRoute() {
  const location = useLocation();
  const [ok, setOk] = useState(null); // null=확인중, true/false

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const url = API_BASE
          ? join(API_BASE, "/api/me")
          : "/api/me";

        const res = await fetch(url, {
          method: "GET",
          credentials: "include", // 
        });

        if (!res.ok) throw new Error("not authenticated");

        if (alive) setOk(true);
      } catch (err) {
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
