// src/components/MySubscription/SubscriptionDetailModal.tsx
import React, { useEffect, useState } from "react";
import { Modal, Button, Spin, message } from "antd";
import {
  Layers,
  CalendarDays,
  CreditCard,
  Users,
  Building2,
  Check,
  Clock,
  Share2,
} from "lucide-react";

import type { UserSubscriptionDetailResponse } from "@/interfaces/UserSubscription/UserSubscription";
import type {
  BillingPeriod,
  LicenseScope,
  PaymentMode,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";
import type { CompanyListResponse } from "@/interfaces/Company/company";
import type { CompanySubscriptionCreateRequest } from "@/interfaces/CompanySubscription/CompanySubscription";

import { getCompaniesOfCurrentUser } from "@/services/companyService.js";
import { createCompanySubscription } from "@/services/companysubscription.js";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

/* ===== Helpers ===== */

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function formatCurrency(amount: number, currency: string) {
  try {
    return amount.toLocaleString("vi-VN") + " " + currency;
  } catch {
    return `${amount} ${currency}`;
  }
}

function statusTagColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active")) return "bg-emerald-50 text-emerald-700";
  if (s.includes("pending")) return "bg-sky-50 text-sky-700";
  if (s.includes("expired") || s.includes("cancel"))
    return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function formatLicenseScope(scope: LicenseScope | string) {
  if (scope === "Userlimits") return "User-limits license";
  if (scope === "EntireCompany") return "Entire-company license";
  return String(scope);
}

function formatBillingShort(period: BillingPeriod | string, count: number) {
  const unit = String(period).toLowerCase(); // week/month/year
  if (count === 1) return `Every ${unit}`;
  return `Every ${count} ${unit}s`;
}

function formatPaymentMode(
  paymentMode: PaymentMode | string,
  installmentCount?: number | null,
  installmentInterval?: BillingPeriod | string | null
) {
  if (paymentMode === "Installments") {
    const count = installmentCount ?? 0;
    const interval = installmentInterval ?? "Month";
    const base = String(interval).toLowerCase();
    if (count > 0) {
      return `${count} installments · billed every ${base}`;
    }
    return `Installments · billed every ${base}`;
  }
  return "Prepaid (charged upfront)";
}

type Props = {
  open: boolean;
  loading?: boolean;
  data: UserSubscriptionDetailResponse | null;
  onClose: () => void;
};

export default function UserSubscriptionDetailModal({
  open,
  loading,
  data,
  onClose,
}: Props) {
  const detail = data;
  const isAutoMonthly = !!detail && detail.unitPrice === 0; // free auto-month plan

  // Số company còn có thể share (ưu tiên field companyShareRemaining nếu có)
  const companyShareRemaining =
    (detail as any)?.companyShareRemaining ??
    detail?.companyShareLimit ??
    null;

  // ===== SHARE STATE =====
  const [shareOpen, setShareOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyListResponse[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [shareLoaded, setShareLoaded] = useState(false);

  const [shareSubmittingId, setShareSubmittingId] = useState<string | null>(
    null
  );
  const [sharedMap, setSharedMap] = useState<Record<string, boolean>>({});

  // confirm modal
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTargetCompany, setConfirmTargetCompany] =
    useState<CompanyListResponse | null>(null);

  // reset share state khi đóng modal detail
  useEffect(() => {
    if (!open) {
      setShareOpen(false);
      setCompanies([]);
      setShareLoading(false);
      setListError(null);
      setShareLoaded(false);
      setShareSubmittingId(null);
      setSharedMap({});
      setConfirmVisible(false);
      setConfirmTargetCompany(null);
    }
  }, [open]);

  const handleToggleShare = async () => {
    const next = !shareOpen;
    setShareOpen(next);

    if (next && !shareLoaded && !shareLoading) {
      try {
        setShareLoading(true);
        setListError(null);
        const list = await getCompaniesOfCurrentUser();
        setCompanies(Array.isArray(list) ? list : []);
        setShareLoaded(true);
      } catch (err: any) {
        console.error(err);
        setListError(
          err?.message || "Failed to load companies of current user."
        );
      } finally {
        setShareLoading(false);
      }
    }
  };

  const handleShareToCompany = (company: CompanyListResponse) => {
    setConfirmTargetCompany(company);
    setConfirmVisible(true);
  };

  const handleCancelConfirm = () => {
    if (shareSubmittingId) return;
    setConfirmVisible(false);
    setConfirmTargetCompany(null);
  };

  const doShareToCompany = async (company: CompanyListResponse) => {
    if (!detail) return;
    if (!company.id) {
      message.error("Company id is missing.");
      return;
    }

    const companyId = company.id;
    const payload: CompanySubscriptionCreateRequest = {
      userSubscriptionId: detail.id,
      companyId: companyId,
      ownerUserId: detail.userId,
    };

    try {
      setShareSubmittingId(companyId);

      const result = await createCompanySubscription(payload);

      if (!result) {
        throw new Error("Create company subscription failed.");
      }

      setSharedMap((prev) => ({ ...prev, [companyId]: true }));
      message.success(
        `Shared plan "${detail.planName}" to company "${company.companyName}" successfully.`
      );
      setConfirmVisible(false);
      setConfirmTargetCompany(null);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.message || "Failed to share subscription to this company.";
      message.error(msg);
    } finally {
      setShareSubmittingId(null);
    }
  };

  const handleConfirmShareNow = async () => {
    if (!confirmTargetCompany) return;
    await doShareToCompany(confirmTargetCompany);
  };

  // Có cho share nữa không? (nếu biết rõ còn 0 thì disable)
  const canShareMore =
    companyShareRemaining === null || companyShareRemaining > 0;

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={780}
        destroyOnClose
        title={
          <div className="flex items-center justify-between gap-3 pr-12">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50">
                <Layers className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  Subscription details
                </div>
                <div className="truncate text-[11px] text-slate-500">
                  Review your plan, billing, company share and entitlements.
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Button
                size="small"
                type="default"
                onClick={handleToggleShare}
                disabled={!canShareMore}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium",
                  !canShareMore && "opacity-60 cursor-not-allowed",
                  shareOpen && canShareMore
                    ? "!border-indigo-500 !bg-indigo-600 !text-white hover:!bg-indigo-700"
                    : "!border-indigo-200 !bg-white !text-indigo-700 hover:!border-indigo-400"
                )}
                icon={<Share2 className="h-3.5 w-3.5" />}
              >
                {!canShareMore
                  ? "No share left"
                  : shareOpen
                  ? "Hide share"
                  : "Share to company"}
              </Button>
            </div>
          </div>
        }
      >
        {loading && !detail ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <Spin size="small" />
          </div>
        ) : !detail ? (
          <div className="py-6 text-center text-sm text-slate-500">
            No detail available.
          </div>
        ) : (
          <div className="space-y-5 pb-2">
            {/* TOP: PLAN OVERVIEW */}
            <section className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              {/* Left: plan / status / term */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Plan
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {detail.planName}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 font-medium",
                      statusTagColor(detail.status)
                    )}
                  >
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {detail.status}
                  </span>

                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5">
                    <CalendarDays className="mr-1 h-3.5 w-3.5 text-slate-500" />
                    {formatDate(detail.termStart)}&nbsp;-&nbsp;
                    {formatDate(detail.termEnd)}
                  </span>

                  {detail.nextPaymentDueAt && !isAutoMonthly && (
                    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-slate-600">
                      <Clock className="mr-1 h-3.5 w-3.5 text-amber-500" />
                      Next payment: {formatDate(detail.nextPaymentDueAt)}
                    </span>
                  )}

                  {isAutoMonthly && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">
                      Free monthly plan
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Created + unit price */}
              <div className="rounded-2xl bg-white px-4 py-3 text-right text-xs text-slate-600 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Created at
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDate(detail.createdAt)}
                </p>

                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Unit price
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm font-semibold",
                    isAutoMonthly ? "text-emerald-600" : "text-indigo-600"
                  )}
                >
                  {isAutoMonthly
                    ? "Free"
                    : formatCurrency(detail.unitPrice, detail.currency)}
                </p>
              </div>
            </section>

            {/* BILLING + SCOPE / COMPANY SHARE */}
            <section className="grid gap-4 md:grid-cols-2">
              {/* Billing */}
              <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Billing & payment
                  </span>
                  <CreditCard className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {isAutoMonthly
                      ? "Free monthly plan"
                      : formatBillingShort(
                          detail.billingPeriod as BillingPeriod,
                          detail.periodCount
                        )}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {isAutoMonthly
                      ? "Free plan · limited free uses reset every month on specific features."
                      : formatPaymentMode(
                          detail.paymentMode as PaymentMode,
                          detail.installmentCount,
                          detail.installmentInterval as BillingPeriod | null
                        )}
                  </p>
                </div>
                {detail.nextPaymentDueAt && !isAutoMonthly && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Next payment due on{" "}
                    <span className="font-medium text-slate-800">
                      {formatDate(detail.nextPaymentDueAt)}
                    </span>
                    .
                  </p>
                )}
              </div>

              {/* Scope + Company share */}
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    License scope & company share
                  </span>
                  <Users className="h-4 w-4 text-indigo-500" />
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatLicenseScope(
                    detail.licenseScope as LicenseScope | string
                  )}
                </p>

                <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  {/* Company share block – highlight "3 companies" */}
                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <Building2 className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Company share
                      </p>
                      {companyShareRemaining !== null ? (
                        <>
                          <p className="text-base font-semibold text-slate-900">
                            {companyShareRemaining}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              companies left
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            You can still share this plan to{" "}
                            <span className="font-medium">
                              {companyShareRemaining}
                            </span>{" "}
                            more company(ies).
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-semibold text-slate-900">
                            Up to 3{" "}
                            <span className="text-xs font-normal text-slate-500">
                              companies
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            You can share this plan to multiple companies.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Seats per company */}
                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <Users className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Seats per company
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {detail.seatsPerCompanyLimit != null
                          ? `${detail.seatsPerCompanyLimit} seats`
                          : "Unlimited"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Maximum number of users in each company using this plan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SHARE PANEL */}
            {shareOpen && (
              <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs text-slate-700">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                    Share this subscription to company
                  </p>
                  {shareLoading && (
                    <span className="text-[11px] text-slate-500">
                      Loading...
                    </span>
                  )}
                </div>

                {!canShareMore ? (
                  <p className="text-[11px] text-slate-600">
                    You have used all company shares for this plan.
                  </p>
                ) : listError ? (
                  <p className="text-[11px] text-rose-600">{listError}</p>
                ) : companies.length === 0 && !shareLoading ? (
                  <p className="text-[11px] text-slate-600">
                    You don&apos;t belong to any active company yet.
                  </p>
                ) : (
                  <ul className="mt-1 space-y-1.5">
                    {companies.map((c) => {
                      const id = c.id ?? "";
                      const isSubmitting = shareSubmittingId === id;
                      const isShared = !!sharedMap[id];

                      return (
                        <li
                          key={id || c.companyName || Math.random().toString(36)}
                          className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-1 hover:bg-white"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="text-[11px] font-medium text-slate-800">
                              {c.companyName || "(Unnamed company)"}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={!id || isSubmitting || isShared}
                            onClick={() => id && handleShareToCompany(c)}
                            className={cn(
                              "text-[11px] font-semibold",
                              isShared
                                ? "text-emerald-600"
                                : "text-indigo-600 hover:text-indigo-700",
                              (isSubmitting || !id) &&
                                "cursor-not-allowed opacity-60"
                            )}
                          >
                            {isSubmitting
                              ? "Sharing..."
                              : isShared
                              ? "Shared"
                              : "Share"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <p className="mt-2 text-[10px] text-slate-500">
                  A company subscription will be created based on this plan&apos;s
                  entitlements when you share.
                </p>
              </section>
            )}

            {/* ENTITLEMENTS – GIỐNG COMPANY SUBSCRIPTION, CÓ "USES LEFT" */}
            <section className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Entitlements
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {isAutoMonthly
                    ? "Remaining free uses this month"
                    : "Features granted by this subscription"}
                </span>
              </div>

              {detail.entitlements?.length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {detail.entitlements.map((e) => {
                    const featureName =
                      (e as any).featureName ??
                      (e as any).featureCode ??
                      (e as any).name ??
                      (e as any).code ??
                      e.featureId.toString().slice(0, 8);

                    const monthlyLimit = (e as any).monthlyLimit;
                    const hasMonthlyLimit =
                      isAutoMonthly && monthlyLimit !== undefined;
                    const remaining =
                      hasMonthlyLimit && monthlyLimit != null
                        ? monthlyLimit
                        : null;
                    const unlimited =
                      hasMonthlyLimit && monthlyLimit == null;

                    return (
                      <li
                        key={e.featureId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 hover:border-slate-200 hover:bg-slate-50"
                      >
                        {/* LEFT: Feature + mô tả */}
                        <div className="flex flex-1 items-start gap-2">
                          {e.enabled ? (
                            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                          ) : (
                            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-slate-300" />
                          )}

                          <div className="space-y-0.5">
                            <p className="text-[12px] font-semibold text-slate-900">
                              {featureName}
                            </p>

                            {hasMonthlyLimit && remaining != null && (
                              <p className="text-[11px] text-slate-500">
                                Remaining for this month.
                              </p>
                            )}

                            {hasMonthlyLimit && unlimited && (
                              <p className="text-[11px] text-slate-500">
                                Unlimited free uses this month.
                              </p>
                            )}

                            {!hasMonthlyLimit && (
                              <p className="text-[11px] text-slate-500">
                                Included in this plan.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: Uses left 4 this month */}
                        {hasMonthlyLimit && (remaining != null || unlimited) && (
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">
                              Uses left
                            </p>
                            <p className="text-xl font-semibold leading-none text-slate-900">
                              {unlimited
                                ? "∞"
                                : remaining?.toLocaleString("vi-VN")}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              this month
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-400">
                  No entitlements recorded for this subscription.
                </p>
              )}
            </section>
          </div>
        )}
      </Modal>

      {/* CONFIRM SHARE MODAL */}
      <Modal
        open={confirmVisible}
        onCancel={handleCancelConfirm}
        footer={null}
        centered
        width={420}
        destroyOnClose
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50">
              <Share2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Share subscription to company
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                This will create a company subscription based on your current
                plan entitlements.
              </p>
            </div>
          </div>

          {detail && confirmTargetCompany && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                You are sharing
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {detail.planName}
              </p>
              <p className="mt-1 text-[11px]">
                To company:&nbsp;
                <span className="font-medium">
                  {confirmTargetCompany.companyName || "(Unnamed company)"}
                </span>
              </p>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-slate-500">
              Are you sure you want to share this subscription to the selected
              company?
            </p>
            <div className="flex gap-2">
              <Button
                size="small"
                onClick={handleCancelConfirm}
                disabled={!!shareSubmittingId}
              >
                Cancel
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={handleConfirmShareNow}
                loading={!!shareSubmittingId}
              >
                Share now
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
