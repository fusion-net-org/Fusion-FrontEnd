import React from "react";
import { useNavigate } from "react-router-dom";

export default function CompanyHeader({
  companyName = "Company Name",
  userName = "Nguyen Duy",
}: { companyName?: string; userName?: string }) {
  const nav = useNavigate();
  const goBack = () => nav(-1);

  return (
    <header className="cmp-header">
      <div className="cmp-header__inner">
        <div className="cmp-header__brand">
          {/* nút back */}
          <button className="cmp-header__back" onClick={goBack} aria-label="Back">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1e6fde" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="cmp-header__logo" />
          <span className="cmp-header__name">{companyName}</span>
          <span className="cmp-header__owner">Owner</span>
        </div>

        <div className="cmp-header__right">
          <button className="cmp-header__iconBtn" aria-label="Notifications">🔔</button>
          <div className="cmp-header__user">
            <div className="cmp-header__avatar" />
            <span>{userName}</span>
            <span style={{ color: "#9aa4b2" }}>▾</span>
          </div>
        </div>
      </div>
    </header>
  );
}
