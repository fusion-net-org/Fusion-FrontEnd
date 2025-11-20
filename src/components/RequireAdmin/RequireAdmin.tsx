// src/routes/RequireAdmin.tsx
import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';

type Props = { children: ReactNode };

export default function RequireAdmin({ children }: Props) {
  const location = useLocation();

  const user = useAppSelector((s) => s.user.user);

  const isChecking = useAppSelector(
    (s) => (s.user as any)?.isLoading || (s.user as any)?.status === 'loading',
  );

  if (isChecking) return <div className="p-4 text-gray-600">Checking session…</div>;

  if (!user) return <Navigate to="/" state={{ from: location }} replace />;

  if ((user as any).role !== 'Admin') return <Navigate to="/*" replace />;

  return <>{children}</>;
}
