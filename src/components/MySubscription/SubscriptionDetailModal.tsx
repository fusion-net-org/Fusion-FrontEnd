// src/components/MySubscription/SubscriptionDetailModal.tsx
import React, { useEffect, useMemo, useState } from "react";
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

/* =================== Helpers =================== */

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

function statusTagClass(status: string) {
  const s = (status || "").toLowerCase();
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
    if (count > 0) return `${count} installments · billed every ${base}`;
    return `Installments · billed every ${base}`;
  }
  return "Prepaid (charged upfront)";
}

function pickNumber(...vals: any[]): number | null {
  for (const v of vals) {
    if (v === null || v === undefined || v === "") continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function pickText(...vals: any[]): string | null {
  for (const v of vals) {
    if (typeof v !== "string") continue;
    const s = v.trim();
    if (s) return s;
  }
  return null;
}

function getEntitlementFields(e: any) {
  const featureId =
    e?.featureId ?? e?.FeatureId ?? e?.id ?? e?.Id ?? e?.featureID ?? null;

  const name =
    pickText(
      e?.featureName,
      e?.FeatureName,
      e?.name,
      e?.Name,
      e?.featureCode,
      e?.FeatureCode,
      e?.code,
      e?.Code,
      e?.feature?.name,
      e?.feature?.Name,
      e?.feature?.code,
      e?.feature?.Code,
      e?.Feature?.name,
      e?.Feature?.Name,
      e?.Feature?.code,
      e?.Feature?.Code
    ) ?? (featureId ? String(featureId).slice(0, 8) : "Feature");

  const enabled = Boolean(
    e?.enabled ?? e?.Enabled ?? e?.isEnabled ?? e?.IsEnabled ?? true
  );

  const used =
    pickNumber(
      e?.used,
      e?.Used,
      e?.usedCount,
      e?.UsedCount,
      e?.consumed,
      e?.Consumed,
      e?.monthlyUsed,
      e?.MonthlyUsed
    ) ?? 0;

  const limit = pickNumber(
    e?.limit,
    e?.Limit,
    e?.total,
    e?.Total,
    e?.quota,
    e?.Quota,
    e?.max,
    e?.Max,
    e?.monthlyLimit,
    e?.MonthlyLimit
  );

  // ✅ remaining/usesLeft: ưu tiên field BE trả về trực tiếp
  const remainingRaw = pickNumber(
    e?.usesLeft,
    e?.UsesLeft,
    e?.remaining,
    e?.Remaining,
    e?.remainingCount,
    e?.RemainingCount,
    e?.remainingUses,
    e?.RemainingUses,
    e?.left,
    e?.Left,
    e?.monthlyRemaining,
    e?.MonthlyRemaining,
    e?.remainingThisMonth,
    e?.RemainingThisMonth
  );

  const remaining =
    remainingRaw !== null
      ? remainingRaw
      : limit === null
      ? null
      : Math.max(0, Number(limit) - Number(used));

  const unlimited = limit === null && remaining === null;

  return { featureId, name, enabled, used, limit, remaining, unlimited };
}

/* =================== Types =================== */

type Props = {
  open: boolean;
  loading?: boolean;
  data: UserSubscriptionDetailResponse | null;
  onClose: () => void;
};

/* =================== Component =================== */

export default function UserSubscriptionDetailModal({
  open,
  loading,
  data,
  onClose,
}: Props) {
  const detail = data;
  const isAutoMonthly = !!detail && detail.unitPrice === 0;

  // ✅ Local share remaining state (update realtime after share)
  const [shareRemaining, setShareRemaining] = useState<number | null>(null);

  // ===== SHARE STATE =====
  const [shareOpen, setShareOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyListResponse[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [shareLoaded, setShareLoaded] = useState(false);

  const [shareSubmittingId, setShareSubmittingId] = useState<string | null>(null);
  const [sharedMap, setSharedMap] = useState<Record<string, boolean>>({});

  // confirm modal
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTargetCompany, setConfirmTargetCompany] =
    useState<CompanyListResponse | null>(null);

  // sync shareRemaining from detail whenever open/detail changes
  useEffect(() => {
    if (!open || !detail) return;

    const raw =
      (detail as any)?.companyShareRemaining ??
      (detail as any)?.CompanyShareRemaining ??
      detail.companyShareLimit ??
      (detail as any)?.companyShareLimit ??
      null;

    if (raw === null || raw === undefined || raw === "") {
      setShareRemaining(null); // unlimited / unknown
    } else {
      const n = Number(raw);
      setShareRemaining(Number.isFinite(n) ? n : null);
    }
  }, [open, detail?.id]);

  // reset share state when closing the detail modal
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
      // shareRemaining will be re-synced next open
    }
  }, [open]);

  const canShareMore = useMemo(
    () => shareRemaining === null || shareRemaining > 0,
    [shareRemaining]
  );

  const shareRemainingTone = useMemo(() => {
    // null = unlimited/unknown => neutral
    if (shareRemaining === null) return "text-slate-900";
    if (shareRemaining === 0) return "text-rose-600";
    return "text-emerald-600"; // ✅ !=0 => xanh
  }, [shareRemaining]);

  const handleToggleShare = async () => {
    if (!canShareMore) return;

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
        setListError(err?.message || "Failed to load companies of current user.");
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

    if (!canShareMore) {
      message.warning("No company share left for this subscription.");
      return;
    }

    if (!company.id) {
      message.error("Company id is missing.");
      return;
    }

    const companyId = company.id;

    if (sharedMap[companyId]) {
      message.info("This subscription is already shared to that company.");
      return;
    }

    const payload: CompanySubscriptionCreateRequest = {
      userSubscriptionId: detail.id,
      companyId: companyId,
      ownerUserId: detail.userId,
    };

    try {
      setShareSubmittingId(companyId);

      const result = await createCompanySubscription(payload);
      if (!result) throw new Error("Create company subscription failed.");

      setSharedMap((prev) => ({ ...prev, [companyId]: true }));

      // ✅ decrement share remaining realtime (if not unlimited)
      setShareRemaining((prev) => {
        if (prev === null) return null;
        const next = Math.max(0, prev - 1);
        if (next === 0) setShareOpen(false); // optional: auto hide when hết lượt
        return next;
      });

      message.success(
        `Shared plan "${detail.planName}" to company "${company.companyName}" successfully.`
      );

      setConfirmVisible(false);
      setConfirmTargetCompany(null);
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "Failed to share subscription to this company.");
    } finally {
      setShareSubmittingId(null);
    }
  };

  const handleConfirmShareNow = async () => {
    if (!confirmTargetCompany) return;
    await doShareToCompany(confirmTargetCompany);
  };

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
                {!canShareMore ? "No share left" : shareOpen ? "Hide share" : "Share to company"}
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
              {/* Left */}
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
                      statusTagClass(detail.status)
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

              {/* Right */}
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
                  {isAutoMonthly ? "Free" : formatCurrency(detail.unitPrice, detail.currency)}
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
                      : formatBillingShort(detail.billingPeriod as BillingPeriod, detail.periodCount)}
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
                  {formatLicenseScope(detail.licenseScope as LicenseScope | string)}
                </p>

                <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  {/* Company share */}
                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <Building2 className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Company share
                      </p>

                      {shareRemaining !== null ? (
                        <>
                          <p className={cn("text-base font-semibold", shareRemainingTone)}>
                            {shareRemaining}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              companies left
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            You can still share this plan to{" "}
                            <span className={cn("font-medium", shareRemainingTone)}>
                              {shareRemaining}
                            </span>{" "}
                            more company(ies).
                          </p>
                        </>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          You can share this plan to multiple companies.
                        </p>
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
                    <span className="text-[11px] text-slate-500">Loading...</span>
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
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="truncate text-[11px] font-medium text-slate-800">
                              {c.companyName || "(Unnamed company)"}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={!id || isSubmitting || isShared || !canShareMore}
                            onClick={() => id && handleShareToCompany(c)}
                            className={cn(
                              "text-[11px] font-semibold",
                              isShared
                                ? "text-emerald-600"
                                : "text-indigo-600 hover:text-indigo-700",
                              (!canShareMore || isSubmitting || !id) &&
                                "cursor-not-allowed opacity-60"
                            )}
                          >
                            {isSubmitting ? "Sharing..." : isShared ? "Shared" : "Share"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <p className="mt-2 text-[10px] text-slate-500">
                  A company subscription will be created based on this plan&apos;s entitlements when
                  you share.
                </p>
              </section>
            )}

            {/* ENTITLEMENTS */}
            <section className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Entitlements
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {isAutoMonthly ? "Uses reset monthly on specific features" : "Included features"}
                </span>
              </div>

              {detail.entitlements?.length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {detail.entitlements.map((raw: any) => {
                    const e = raw;
                    const { featureId, name, enabled, remaining, unlimited, used, limit } =
                      getEntitlementFields(e);

                    const hasRemaining = unlimited || remaining !== null;
                    const remainText = unlimited
                      ? "∞"
                      : remaining === null
                      ? "—"
                      : Number(remaining).toLocaleString("vi-VN");

                    const isZero = !unlimited && remaining === 0;
                    const remainTone = unlimited
                      ? "text-slate-900"
                      : isZero
                      ? "text-rose-600"
                      : "text-emerald-600"; // ✅ != 0 => xanh

                    const subText =
                      hasRemaining && !unlimited
                        ? "Uses left"
                        : limit != null
                        ? `Used: ${used}/${limit}`
                        : "Included in this plan";

                    return (
                      <li
                        key={String(featureId ?? name)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 hover:border-slate-200 hover:bg-slate-50"
                      >
                        {/* LEFT */}
                        <div className="flex flex-1 items-start gap-2 min-w-0">
                          {enabled ? (
                            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                          ) : (
                            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-slate-300" />
                          )}

                          <div className="min-w-0 space-y-0.5">
                            <p className="truncate text-[12px] font-semibold text-slate-900">
                              {name}
                            </p>
                            <p className="text-[11px] text-slate-500">{subText}</p>
                          </div>
                        </div>

                        {/* RIGHT */}
                        {hasRemaining && (
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">
                              Remaining
                            </p>
                            <p className={cn("text-xl font-semibold leading-none", remainTone)}>
                              {remainText}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {isAutoMonthly ? "this month" : "left"}
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
                This will create a company subscription based on your current plan entitlements.
              </p>
            </div>
          </div>

          {detail && confirmTargetCompany && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                You are sharing
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{detail.planName}</p>
              <p className="mt-1 text-[11px]">
                To company:&nbsp;
                <span className="font-medium">
                  {confirmTargetCompany.companyName || "(Unnamed company)"}
                </span>
              </p>
              {shareRemaining !== null && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Shares left after this:{" "}
                  <span className={cn("font-semibold", shareRemaining === 0 ? "text-rose-600" : "text-emerald-600")}>
                    {Math.max(0, shareRemaining - 1)}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Are you sure you want to share this subscription to the selected company?
            </p>
            <div className="flex gap-2">
              <Button size="small" onClick={handleCancelConfirm} disabled={!!shareSubmittingId}>
                Cancel
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={handleConfirmShareNow}
                loading={!!shareSubmittingId}
                disabled={!canShareMore}
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
