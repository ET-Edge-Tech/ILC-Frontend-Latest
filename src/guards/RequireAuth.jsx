import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store.js';
import { useSessionRefresh } from '../features/auth/hooks.js';
import { GATE_ROUTES, areaAllowed, gateFor, homeFor } from '../features/auth/routing.js';

// Wraps every signed-in page. Sends people to the screen they must finish first.
export default function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  useSessionRefresh();

  if (!token || !user) return <Navigate to="/login" replace />;

  const gate = gateFor(user);
  if (gate && pathname !== gate) return <Navigate to={gate} replace />;
  if (!gate && (GATE_ROUTES.includes(pathname) || !areaAllowed(user, pathname))) {
    return <Navigate to={homeFor(user)} replace />;
  }
  return <Outlet />;
}
