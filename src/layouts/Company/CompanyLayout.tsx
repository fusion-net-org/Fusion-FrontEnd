import React, { type PropsWithChildren, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CompanyHeader from "./CompanyHeader";
import CompanyNavbar from "./CompanyNavbar";
import CompanyFooter from "./CompanyFooter";
import "./css/company-layout.css"; 

type Props = PropsWithChildren<{ initialTall?: boolean }>;

export default function CompanyLayout({ children, initialTall = true }: Props) {
  const { pathname } = useLocation();
  const [fadeKey, setFadeKey] = useState(0);
  useEffect(() => setFadeKey(k => k + 1), [pathname]);

  return (
    <div className="cmp-theme cmp-shell">
      <CompanyHeader />
      <div className="cmp-content">
        <CompanyNavbar />
        <main key={fadeKey} className={`cmp-main cmp-pagefade ${initialTall ? "is-initialTall" : ""}`}>
          {children ?? <Outlet />}
        </main>
      </div>
      <CompanyFooter />
    </div>
  );
}
