/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { type PropsWithChildren, useEffect, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import CompanyHeader from "./CompanyHeader";
import CompanyNavbar from "./CompanyNavbar";
import CompanyFooter from "./CompanyFooter";
import "./css/company-layout.css";
import { PermissionProvider } from "@/permission/PermissionProvider";
import { getUserIdFromToken } from "@/utils/token";

type Props = PropsWithChildren<{ initialTall?: boolean }>;

export default function CompanyLayout({ children, initialTall = true }: Props) {
  const { pathname } = useLocation();
  const [fadeKey, setFadeKey] = useState(0);

  const { companyId } = useParams<{ companyId: string }>();
  const userId = getUserIdFromToken();

  useEffect(() => setFadeKey((k) => k + 1), [pathname]);

  // Nếu bạn đã có route auth guard ở ngoài thì chỗ này có thể return null.
  if (!userId) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Missing user session. Please login again.
      </div>
    );
  }

  return (
    <PermissionProvider userId={userId} companyId={companyId ?? null}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-500">
        <div className="flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
          <CompanyNavbar />
        </div>

        <div className="flex flex-col flex-1 w-[calc(100%-45vh)]">
          <CompanyHeader />

          <main
            key={fadeKey}
            className={`cmp-pagefade flex-1 px-3 pb-6 overflow-y-auto bg-white dark:bg-gray-800
                        border-l-[2px] border-gray-200 dark:border-gray-700
                        transition-colors duration-500
                        ${initialTall ? "min-h-[calc(100vh-56px)]" : ""}`}
          >
            {children ?? <Outlet />}
          </main>

          <CompanyFooter />
        </div>
      </div>
    </PermissionProvider>
  );
}
