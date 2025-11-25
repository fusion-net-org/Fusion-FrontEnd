// src/components/MySubscription/CompanySubscriptionDetailModal.tsx
import React, { useEffect, useState } from "react";
import { Modal, Spin } from "antd";
import { Eye, CalendarDays, Clock, Users } from "lucide-react";

import type {
  CompanySubscriptionDetailResponse,
  CompanySubscriptionStatus,
  CompanySubscriptionUserUsageItem,
} from "@/interfaces/CompanySubscription/CompanySubscription";

import { 
  getCompanySubscriptionUserUsage
 } from "@/services/companysubscription.js";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
}

function shortId(id?: string) {
  if (!id) return "—";
  if (id.length <= 10) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function statusTagClass(status: CompanySubscriptionStatus | string) {
  const s = (status || "").toLowerCase();
  if (s.includes("active"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("pending"))
    return "bg-sky-50 text-sky-700 border-sky-200";
  if (s.includes("expired") || s.includes("cancel"))
    return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

/** Seat limit: used / total */
function formatSeatLimit(detail: CompanySubscriptionDetailResponse) {
  const total = detail.seatsLimitSnapshot ?? null;
  const used =
    (detail as any).SeatsLimitUnit ?? (detail as any).seatsLimitUnit ?? null;

  if (total == null && used == null) return "Unlimited";
  if (total == null) return `${used ?? 0} / Unlimited`;
  if (used == null) return `0 / ${total}`;
  return `${used} / ${total}`;
}

function getInitials(name?: string | null, email?: string | null) {
  const src = name || email || "";
  if (!src) return "?";
  const parts = src.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

type Props = {
  open: boolean;
  loading?: boolean; // loading detail
  data: CompanySubscriptionDetailResponse | null;
  onClose: () => void;
};

const CompanySubscriptionDetailModal: React.FC<Props> = ({
  open,
  loading,
  data,
  onClose,
}) => {
  const detail = data;

  // user usage state
  const [usage, setUsage] = useState<CompanySubscriptionUserUsageItem[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  // load user-usage mỗi khi mở modal + có id
  useEffect(() => {
    if (!open || !detail?.id) return;

    let cancelled = false;
    const fetchUsage = async () => {
      try {
        setUsageLoading(true);
        setUsageError(null);
        const items = await getCompanySubscriptionUserUsage(
          detail.id as unknown as string
        );
        if (!cancelled) {
          setUsage(Array.isArray(items) ? items : []);
        }
      } catch (e: any) {
        if (cancelled) return;
        console.error("getCompanySubscriptionUserUsage error:", e);
        setUsageError(
          e?.message || "Error loading users using this subscription."
        );
      } finally {
        if (!cancelled) setUsageLoading(false);
      }
    };

    fetchUsage();
    return () => {
      cancelled = true;
    };
  }, [open, detail?.id]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={780}
      destroyOnClose
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">
              Company subscription detail
            </div>
            <div className="text-xs text-slate-500">
              All information of this company subscription.
            </div>
          </div>
        </div>
      }
    >
      {loading && !detail ? (
        <div className="flex min-height-[160px] items-center justify-center py-8">
          <Spin size="small" />
        </div>
      ) : !detail ? (
        <div className="py-8 text-center text-sm text-slate-500">
          No detail available.
        </div>
      ) : (
        <div className="space-y-5 text-[13px] text-slate-800">
          {/* ===== OVERVIEW ===== */}
          <section className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)] sm:items-start">
              {/* Left: plan / company / owner */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Plan
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {detail.planName}
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Company:&nbsp;
                  <span className="font-semibold">
                    {detail.companyName || "(Unnamed company)"}
                  </span>
                </p>

                {detail.userName && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>
                      Shared by&nbsp;
                      <span className="font-semibold">{detail.userName}</span>
                    </span>
                  </p>
                )}

                <p className="mt-2 text-[11px] text-slate-500">
                  Company subscription ID:&nbsp;
                  <span className="font-mono text-xs font-medium text-slate-900">
                    {shortId(detail.id as unknown as string)}
                  </span>
                </p>
              </div>

              {/* Right: status + seat limit */}
              <div className="rounded-2xl bg-white px-4 py-3 text-[11px] text-slate-600 shadow-sm sm:ml-auto sm:w-60">
                <p className="font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <div className="mt-1">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-0.5 text-[11px] font-medium",
                      statusTagClass(detail.status)
                    )}
                  >
                    {detail.status}
                  </span>
                </div>

                <p className="mt-4 font-semibold uppercase tracking-wide text-slate-500">
                  Seat limit
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatSeatLimit(detail)}
                </p>
                {detail.seatsLimitSnapshot != null && (
                  <p className="text-[10px] text-slate-400">
                    Used / total seats
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ===== TIMELINE ===== */}
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Timeline
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Shared on
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {formatDate(detail.sharedOn)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Expires at
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <Clock className="h-4 w-4 text-amber-500" />
                  {formatDate(detail.expiredAt)}
                </p>
              </div>
            </div>
          </section>

          {/* ===== ENTITLEMENTS ===== */}
          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Entitlements & features
              </p>
              <p className="text-[11px] font-medium text-slate-400">
                Features granted to this company from the subscription.
              </p>
            </div>

            {detail.entitlements?.length ? (
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {detail.entitlements.map((e) => (
                  <li
                    key={e.featureId}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 flex-shrink-0 rounded-full",
                        e.enabled ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    />
                    <span className="text-[12px] font-medium text-slate-900">
                      {e.featureName ||
                        e.featureCode ||
                        e.featureId.toString().slice(0, 8)}
                    </span>
                    {!e.enabled && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Disabled
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-slate-400">
                No entitlements recorded for this company subscription.
              </p>
            )}
          </section>

          {/* ===== USER USAGE TABLE ===== */}
          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Users using this subscription
              </p>
              <p className="text-[11px] font-medium text-slate-400">
                Distinct users that have used any feature from this company
                subscription.
              </p>
            </div>

            {usageLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spin size="small" />
              </div>
            ) : usageError ? (
              <p className="text-[12px] text-rose-600">{usageError}</p>
            ) : usage.length === 0 ? (
              <p className="text-[12px] text-slate-400">
                No user has used this subscription yet.
              </p>
            ) : (
              <div className="max-h-64 overflow-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-slate-600">
                        User
                      </th>
                      <th className="px-3 py-2 font-semibold text-slate-600">
                        Email
                      </th>
                      <th className="px-3 py-2 font-semibold text-slate-600">
                        First used at
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.map((u) => (
                      <tr
                        key={u.userId as unknown as string}
                        className="border-t border-slate-100"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.userName || ""}
                                className="h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                                {getInitials(u.userName, u.email)}
                              </div>
                            )}
                            <span className="font-medium text-slate-900">
                              {u.userName || "(Unnamed user)"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {u.email || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {formatDateTime(u.firstUsedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ===== FOOTER NOTE ===== */}
          <p className="text-[11px] leading-relaxed text-slate-400">
            This company subscription mirrors entitlements from the source user
            subscription. Updating the user subscription may change the
            features available to this company.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default CompanySubscriptionDetailModal;
