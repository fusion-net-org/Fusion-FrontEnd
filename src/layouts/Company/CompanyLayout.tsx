/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

export default function CompanyLayout({ children, initialTall = true }: Props) {
  const { pathname } = useLocation();
  const [fadeKey, setFadeKey] = useState(0);
  const { companyId } = useParams();
  const [permKey, setPermKey] = useState(0);
  const userId = getUserIdFromToken();

  useEffect(() => setFadeKey((k) => k + 1), [pathname]);

  useEffect(() => {
    if (companyId) setCurrentCompanyId(String(companyId));
    else clearCurrentCompanyId();

    setPermKey((k) => k + 1);
    return () => {
      if (!companyId) clearCurrentCompanyId();
    };
  }, [companyId]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-500">
      <div className="flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <CompanyNavbar />
      </div>

      <div className="flex flex-col flex-1 w-[calc(100%-45vh)]">
        <CompanyHeader />

        <PermissionProvider key={permKey} userId={userId ?? ''} companyId={companyId as string}>
          <main
            key={fadeKey}
            className={`cmp-pagefade flex-1 px-3 pb-6 overflow-y-auto bg-white dark:bg-gray-800
                        border-l-[2px] border-gray-200 dark:border-gray-700
                        transition-colors duration-500
                        ${initialTall ? 'min-h-[calc(100vh-56px)]' : ''}`}
          >
            {children ?? <Outlet />}
          </main>
        </PermissionProvider>

        <CompanyFooter />
      </div>
    </div>
  );
}
