import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import FullScreenLoader from "./ui/FullScreenLoader.jsx";

/** Pages inside this route are only shown to logged-in users. */
export default function ProtectedRoute() {
  const { user, isCheckingSession } = useAuth();
  const location = useLocation();

  if (isCheckingSession) return <FullScreenLoader />;

  if (!user) {
    // remember where the user wanted to go, so login can send them back
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Login and register are only shown to logged-out users. */
export function PublicOnlyRoute() {
  const { user, isCheckingSession } = useAuth();

  if (isCheckingSession) return <FullScreenLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
