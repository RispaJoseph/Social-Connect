// src/routes/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function ProtectedRoute({
  children,
  roles,
}: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles?.includes("admin") && !user.is_admin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
