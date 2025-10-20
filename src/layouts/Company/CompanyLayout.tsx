import React, { type PropsWithChildren, useEffect, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import CompanyHeader from './CompanyHeader';
import CompanyNavbar from './CompanyNavbar';
import CompanyFooter from './CompanyFooter';
import './css/company-layout.css';
import { setCurrentCompanyId, clearCurrentCompanyId } from '@/apiConfig.js';
import { PermissionProvider } from '@/permission/PermissionProvider';
import { getUserIdFromToken } from '@/utils/token';
type Props = PropsWithChildren<{ initialTall?: boolean }>;
function getUserIdFromStorage() {
  // ADD: lấy userId cho PermissionProvider
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    const u = JSON.parse(raw);
    return u?.userId || u?.id || u?.sub || '';
  } catch {
    return '';
  }
}
export default function CompanyLayout({ children, initialTall = true }: Props) {
  const { pathname } = useLocation();
  const [fadeKey, setFadeKey] = useState(0);
  const { companyId } = useParams();
  const [permKey, setPermKey] = useState(0); // ADD: reset PermissionProvider khi đổi company
  const userId = getUserIdFromToken();

  useEffect(() => setFadeKey((k) => k + 1), [pathname]);
  useEffect(() => {
    if (companyId) {
      setCurrentCompanyId(String(companyId));
    } else {
      clearCurrentCompanyId();
    }
    setPermKey((k) => k + 1);
    return () => {
      if (!companyId) clearCurrentCompanyId();
    };
  }, [companyId]);
  return (
    <div className="cmp-theme cmp-shell">
      <CompanyHeader />
      <div className="cmp-content">
        <CompanyNavbar />

        <PermissionProvider
          key={permKey}
          userId={userId ?? ''}
          companyId={companyId as string}
        >
          <main
            key={fadeKey}
            className={`cmp-main cmp-pagefade ${initialTall ? 'is-initialTall' : ''}`}
          >
            {children ?? <Outlet />}
          </main>
        </PermissionProvider>
      </div>
      <CompanyFooter />
    </div>
  );
}
