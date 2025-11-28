// src/components/MySubscription/CompanySubscriptionDetailModal.tsx
import React, { useEffect, useState } from "react";
import { Modal, Spin } from "antd";
import { Eye, CalendarDays, Clock, Users, RefreshCcw } from "lucide-react";

import type {
  CompanySubscriptionDetailResponse,
  CompanySubscriptionStatus,
  CompanySubscriptionUserUsageItem,
} from "@/interfaces/CompanySubscription/CompanySubscription";

import { getCompanySubscriptionUserUsage } from "@/services/companysubscription.js";

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
  loading?: boolean;
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
  const isAutoMonthly = !!detail && !detail.expiredAt; // gói free auto-month

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
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold text-slate-900">
                Company subscription detail
              </div>
              {isAutoMonthly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <RefreshCcw className="h-3 w-3" />
                  Auto monthly quota
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              All information of this company subscription.
            </div>
          </div>
        </div>
      }
    >
      {loading && !detail ? (
        <div className="flex min-h-[160px] items-center justify-center py-8">
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

              {/* Right: status + seat limit + auto-month note */}
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
    <p className="text-[10px] text-slate-400">Used / total seats</p>
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
                <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                  {isAutoMonthly ? (
                    <>
                      <RefreshCcw className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-700">
                        -
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-slate-900">
                        {formatDate(detail.expiredAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ===== ENTITLEMENTS ===== */}
          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Entitlements & features
              </p>
              <p className="text-[11px] text-slate-400">
                Remaining uses in this month.
              </p>
            </div>

            {detail.entitlements?.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {detail.entitlements.map((e) => {
                  // ẩn label "company"
                  const categoryLabel =
                    e.category && e.category.toLowerCase() !== "company"
                      ? e.category
                      : null;

                  const hasMonthlyLimit = (e as any).monthlyLimit !== undefined;
                  const unlimited = hasMonthlyLimit && e.monthlyLimit == null;
                  const remaining =
                    hasMonthlyLimit && e.monthlyLimit != null ? e.monthlyLimit : null;

                  return (
                    <li
                      key={e.featureId}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* LEFT: feature info */}
                        <div className="flex flex-1 items-start gap-2">
                          <span
                            className={cn(
                              "mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                              e.enabled ? "bg-emerald-500" : "bg-slate-300"
                            )}
                          />
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[12px] font-semibold text-slate-900">
                                {e.featureName ||
                                  e.featureCode ||
                                  e.featureId.toString().slice(0, 8)}
                              </span>

                              {categoryLabel && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                  {categoryLabel}
                                </span>
                              )}

                              {!e.enabled && (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-rose-600">
                                  Disabled
                                </span>
                              )}
                            </div>

                            {/* mô tả ngắn, không dài dòng */}
                            {hasMonthlyLimit && !unlimited && (
                              <p className="text-[11px] text-slate-500">
                                Remaining for this month.
                              </p>
                            )}
                            {hasMonthlyLimit && unlimited && (
                              <p className="text-[11px] text-slate-500">
                                Unlimited this month.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: số lần còn lại / unlimited */}
                        {hasMonthlyLimit && !unlimited ? (
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">
                              Uses left
                            </p>
                            <p className="text-xl font-semibold leading-none text-slate-900">
                              {remaining?.toLocaleString("vi-VN")}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              this month
                            </p>
                          </div>
                        ) : hasMonthlyLimit && unlimited ? (
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">
                              Uses
                            </p>
                            <p className="text-lg font-semibold leading-none text-slate-900">
                              ∞
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              this month
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
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
