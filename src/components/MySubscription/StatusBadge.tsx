import React from "react";
import type { SubscriptionStatus } from "@/interfaces/UserSubscription/UserSubscription";

const StatusBadge: React.FC<{ value: SubscriptionStatus }> = ({ value }) => {
  const map: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Expired: "bg-rose-50 text-rose-700 ring-rose-200",
    InActive: "bg-slate-100 text-slate-700 ring-slate-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        map[value] || "bg-slate-100 text-slate-700 ring-slate-300"
      }`}
    >
      {value}
    </span>
  );
};

export default StatusBadge;
