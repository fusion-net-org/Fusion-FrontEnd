import React from "react";

export default function CompanyFooter() {
  return (
    <footer className="cmp-footer">
      <div className="cmp-footer__inner">© {new Date().getFullYear()} Fusion — Company Console</div>
    </footer>
  );
}
