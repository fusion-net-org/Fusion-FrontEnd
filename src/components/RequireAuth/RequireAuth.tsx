// src/routes/RequireAuth.tsx
import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';

type Props = { children: ReactNode };

export default function RequireAuth({ children }: Props) {
  const location = useLocation();
  const user = useAppSelector((s) => s.user.user);
  const isChecking = useAppSelector(
    (s) => (s.user as any)?.isLoading || (s.user as any)?.status === 'loading',
  );

  if (isChecking) return <div className="p-4 text-gray-600">Checking session…</div>;
  if (!user) return <Navigate to="/auth/login" state={{ from: location }} replace />;

  return <>{children}</>;
}
