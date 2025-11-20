// src/components/MySubscription/CompanySubscriptionDetailModal.tsx
import React from "react";
import { Modal, Spin } from "antd";
import { Eye, CalendarDays, Clock, Users } from "lucide-react";

import type {
  CompanySubscriptionDetailResponse,
  CompanySubscriptionStatus,
} from "@/interfaces/CompanySubscription/CompanySubscription";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
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
  // BE đang dùng SeatsLimitUnit (list) và seatsLimitUnit (active) khác nhau
  const used =
    (detail as any).SeatsLimitUnit ?? (detail as any).seatsLimitUnit ?? null;

  // Các case fallback rõ ràng
  if (total == null && used == null) return "Unlimited";
  if (total == null) return `${used ?? 0} / Unlimited`;
  if (used == null) return `0 / ${total}`;
  return `${used} / ${total}`;
}

type Props = {
  open: boolean;
  loading?: boolean;
  data: CompanySubscriptionDetailResponse | null;
  onClose: () => void;
};

export default function CompanySubscriptionDetailModal({
  open,
  loading,
  data,
  onClose,
}: Props) {
  const detail = data;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={720}
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
        <div className="flex min-h-[160px] items-center justify-center">
          <Spin size="small" />
        </div>
      ) : !detail ? (
        <div className="py-8 text-center text-sm text-slate-500">
          No detail available.
        </div>
      ) : (
        <div className="space-y-5 text-[13px] text-slate-800">
          {/* ===== OVERVIEW (Plan + Company + Status + Seat limit) ===== */}
          <section className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)] sm:items-start">
              {/* Left: Plan / company / share / ID */}
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
                {/* STATUS: label và value canh thẳng cột */}
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

                {/* SEAT LIMIT: SeatsLimitUnit / seatsLimitSnapshot */}
                <p className="mt-4 font-semibold uppercase tracking-wide text-slate-500">
                  Seat limit
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatSeatLimit(detail)}
                </p>
                {detail.seatsLimitSnapshot != null && (
                  <p className="text-[10px] text-slate-400">
                    Used / Total seats
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
}
