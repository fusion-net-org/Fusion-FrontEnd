import React from "react";

export default function AdminTransactionsPage() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ad-card" style={{ fontWeight: 700, fontSize: 18 }}>Transactions</div>
      <div className="ad-card" style={{ padding: 24, color: "var(--text-2)" }}>
        Show latest payments with filters (date range, amount, status, package). Export CSV/PDF.
      </div>
    </div>
  );
}
