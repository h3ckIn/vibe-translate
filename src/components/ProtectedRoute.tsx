import { useAuth } from '../store/useAuth';
import { useApp } from '../store/useApp';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const setView = useApp((s) => s.setView);
  const isAuthenticated = !!user && !!token;

  if (!isAuthenticated) {
    setView('login');
    return null;
  }

  return <>{children}</>;
}
