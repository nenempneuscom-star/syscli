import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth-store';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Guilherme Machado Systems</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestao Clinica</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
