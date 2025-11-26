import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '@/redux/store';

interface Props {
  children: React.ReactNode;
}

const CompanyProtectedRoute: React.FC<Props> = ({ children }) => {
  const { companyId } = useParams<{ companyId: string }>();
  const user = useSelector((state: RootState) => state.user.user);

  if (!user) return <Navigate to="/login" replace />;

  const hasAccess = user.companies?.some((c) => c.id === companyId);
  if (!hasAccess) return <Navigate to="/company" replace />;

  return <>{children}</>;
};

export default CompanyProtectedRoute;
