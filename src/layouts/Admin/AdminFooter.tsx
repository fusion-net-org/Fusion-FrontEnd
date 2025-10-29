import React from "react";

export default function AdminFooter() {
  return (
    <footer className="cmp-footer">
      <div className="cmp-footer__inner">© {new Date().getFullYear()} Fusion</div>
    </footer>
  );
}
