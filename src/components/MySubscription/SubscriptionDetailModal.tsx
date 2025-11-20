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

  // ===== SHARE STATE =====
  const [shareOpen, setShareOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyListResponse[]>([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [shareLoaded, setShareLoaded] = useState(false);

  // trạng thái share từng company
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

  // mở confirm cho 1 company
  const handleShareToCompany = (company: CompanyListResponse) => {
    setConfirmTargetCompany(company);
    setConfirmVisible(true);
  };

  const handleCancelConfirm = () => {
    if (shareSubmittingId) return; // đang gọi BE thì không cho đóng
    setConfirmVisible(false);
    setConfirmTargetCompany(null);
  };

  // thực hiện gọi BE tạo CompanySubscription
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
      // chỉ toast, không set listError -> tránh kẹt panel share
      message.error(msg);
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
        width={760}
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
                  Review your current plan configuration, billing, and
                  entitlements.
                </div>
              </div>
            </div>

            {/* Nút Share nằm bên phải, chừa khoảng cho nút X của Modal */}
            <div className="flex-shrink-0">
              <Button
                size="small"
                type="default"
                onClick={handleToggleShare}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium",
                  shareOpen
                    ? "!border-indigo-500 !bg-indigo-600 !text-white hover:!bg-indigo-700"
                    : "!border-indigo-200 !bg-white !text-indigo-700 hover:!border-indigo-400"
                )}
                icon={<Share2 className="h-3.5 w-3.5" />}
              >
                {shareOpen ? "Hide share" : "Share to company"}
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
            {/* Top summary */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              {/* Left: plan info */}
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
                  {detail.nextPaymentDueAt && (
                    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-slate-600">
                      <Clock className="mr-1 h-3.5 w-3.5 text-amber-500" />
                      Next payment: {formatDate(detail.nextPaymentDueAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Created at + price */}
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
                <p className="mt-1 text-sm font-semibold text-indigo-600">
                  {formatCurrency(detail.unitPrice, detail.currency)}
                </p>
              </div>
            </div>

            {/* SHARE PANEL */}
            {shareOpen && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs text-slate-700">
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

                {listError ? (
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
                          className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-1 hover:bg-white"
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
                  Click <span className="font-semibold">Share</span> to assign
                  this subscription to the selected company. A company
                  subscription will be created after you confirm.
                </p>
              </div>
            )}

            {/* Billing & scope */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Billing card */}
              <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Billing & payment
                  </span>
                  <CreditCard className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatBillingShort(
                      detail.billingPeriod as BillingPeriod,
                      detail.periodCount
                    )}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {formatPaymentMode(
                      detail.paymentMode as PaymentMode,
                      detail.installmentCount,
                      detail.installmentInterval as BillingPeriod | null
                    )}
                  </p>
                </div>
                {detail.nextPaymentDueAt && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Next payment due on{" "}
                    <span className="font-medium text-slate-800">
                      {formatDate(detail.nextPaymentDueAt)}
                    </span>
                    .
                  </p>
                )}
              </div>

              {/* Scope card */}
              <div className="space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    License scope & limits
                  </span>
                  <Users className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatLicenseScope(
                    detail.licenseScope as LicenseScope | string
                  )}
                </p>
                <div className="mt-2 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <Building2 className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        Company share
                      </p>
                      <p>
                        {detail.companyShareLimit != null
                          ? `${detail.companyShareLimit} companies`
                          : "3 companies"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        Seats per company
                      </p>
                      <p>
                        {detail.seatsPerCompanyLimit != null
                          ? `${detail.seatsPerCompanyLimit} seats`
                          : "Unlimited seats per company"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Entitlements */}
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
              <p className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <span>Entitlements</span>
                <span className="text-[10px] font-medium text-slate-400">
                  Features granted by this subscription
                </span>
              </p>

              {detail.entitlements?.length ? (
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {detail.entitlements.map((e) => (
                    <li
                      key={e.featureId}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50"
                    >
                      {e.enabled ? (
                        <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                      ) : (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-slate-300" />
                      )}
                      <span className="text-[11px] font-medium text-slate-800">
                        {e.name || e.code || e.featureId.toString().slice(0, 8)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-400">
                  No entitlements recorded for this subscription.
                </p>
              )}
            </div>
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
