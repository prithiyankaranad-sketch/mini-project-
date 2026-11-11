import { Navigate, Outlet } from "react-router-dom";
import type { AppRole } from "../../types/database";
import { useAuth } from "./AuthProvider";
import { configurationReady } from "../../lib/supabase";
import { ErrorMessage, Loading } from "../../components/ui/status";
export function RequireAuth({
  role,
  staff,
}: {
  role?: AppRole;
  staff?: boolean;
}) {
  const auth = useAuth();
  if (!configurationReady) return <Navigate to="/setup" replace />;
  if (auth.loading) return <Loading />;
  if (auth.error) return <ErrorMessage message={auth.error} />;
  if (!auth.user) return <Navigate to="/login" replace />;
  if (!auth.user.email_confirmed_at)
    return <Navigate to="/verification-required" replace />;
  if (
    !auth.profile?.is_active ||
    (role && !auth.roles.includes(role)) ||
    (staff && !auth.roles.some((r) => r === "organizer" || r === "admin"))
  )
    return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
