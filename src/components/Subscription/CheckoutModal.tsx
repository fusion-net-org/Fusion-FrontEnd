// checkout modal for subscription plans
import React, { useEffect, useMemo, useState } from "react";
import { Modal, InputNumber } from "antd";
import { Check, Shield, Users } from "lucide-react";

import type {
  SubscriptionPlanCustomerResponse,
  SubscriptionPlanDetailResponse,
  PlanPricePreviewResponse,
  LicenseScope,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

// ===== Helpers =====
function formatCurrency(amount: number, currency: string) {
  try {
    return amount.toLocaleString("vi-VN") + " " + currency;
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatPriceShortUnit(p: PlanPricePreviewResponse) {
  const unit = p.billingPeriod.toLowerCase();
  if (p.periodCount === 1) return `/${unit}`;
  return `/${p.periodCount} ${unit}s`;
}

function formatPaymentNote(p: PlanPricePreviewResponse) {
  if (p.paymentMode === "Installments") {
    const count = p.installmentCount ?? 0;
    const interval = p.installmentInterval ?? p.billingPeriod;
    const unit = interval.toLowerCase();

    if (count > 0) {
      const times = count === 1 ? "1 installment" : `${count} installments`;
      return `${times} · paid every ${unit}`;
    }
    return `Installments · paid every ${unit}`;
  }
  return "One-time payment";
}

function formatSeatsLimit(scope: LicenseScope, seats?: number | null) {
  if (scope === "CompanyWide") return "All members in the company";
  if (!seats || seats <= 0) return "Unlimited seats per company";
  return `Up to ${seats} seats per company`;
}

function formatCompanyShareLimit(limit?: number | null) {
  if (!limit || limit <= 0) return "Unlimited companies";
  return `Up to ${limit} companies`;
}

function formatChargeUnit(
  _scope: LicenseScope,
  chargeUnit: PlanPricePreviewResponse["chargeUnit"]
) {
  if (chargeUnit === "PerSeat") return "Charged per seat";
  return "Charged per subscription";
}

type Props = {
  open: boolean;
  loadingDetail: boolean;
  planPublic: SubscriptionPlanCustomerResponse | null;
  planDetail: SubscriptionPlanDetailResponse | null;
  onClose: () => void;
  onConfirm: (plan: SubscriptionPlanCustomerResponse, quantity: number) => void;
};

export default function SubscriptionPlanCheckoutModal({
  open,
  loadingDetail,
  planPublic,
  planDetail,
  onClose,
  onConfirm,
}: Props) {
  const [quantity, setQuantity] = useState<number>(1);

  // reset quantity mỗi lần mở modal
  useEffect(() => {
    if (open) setQuantity(1);
  }, [open, planPublic?.id]);

  // ===== Effective data (ưu tiên detail, fallback public) =====
  const effectiveName = planDetail?.name ?? planPublic?.name ?? "";
  const effectiveDescription =
    planDetail?.description ?? planPublic?.description ?? "";

  const licenseScope: LicenseScope | undefined =
    planDetail?.licenseScope ?? planPublic?.licenseScope;

  const isFullPackage =
    planDetail?.isFullPackage ?? planPublic?.isFullPackage ?? false;

  const seatsPerCompanyLimit =
    planDetail?.seatsPerCompanyLimit ?? planPublic?.seatsPerCompanyLimit;

  const companyShareLimit =
    planDetail?.companyShareLimit ?? planPublic?.companyShareLimit;

  // Map price từ Detail (price) hoặc Preview (amount) về PlanPricePreviewResponse
  const price: PlanPricePreviewResponse | null = useMemo(() => {
    const raw: any =
      (planDetail?.price as any) ?? (planPublic?.price as any) ?? null;
    if (!raw) return null;

    // Detail: .price, Preview: .amount
    const amount =
      typeof raw.amount === "number"
        ? raw.amount
        : typeof raw.price === "number"
        ? raw.price
        : 0;

    return {
      amount,
      currency: raw.currency,
      billingPeriod: raw.billingPeriod,
      periodCount: raw.periodCount,
      chargeUnit: raw.chargeUnit,
      paymentMode: raw.paymentMode,
      installmentCount: raw.installmentCount ?? null,
      installmentInterval: raw.installmentInterval ?? null,
    };
  }, [planDetail, planPublic]);

  const featureNames: string[] = useMemo(() => {
    if (planDetail?.features?.length) {
      return planDetail.features
        .filter((f) => f.enabled)
        .map(
          (f) =>
            f.featureName ||
            f.featureCode ||
            `Feature ${f.featureId?.toString().slice(0, 6)}`
        );
    }
    if (planPublic?.featuresPreview?.length) {
      return planPublic.featuresPreview.map((f) => f.name);
    }
    return [];
  }, [planDetail, planPublic]);

  const totalAmount = useMemo(() => {
    if (!price) return 0;
    return price.amount * quantity;
  }, [price, quantity]);

  const handleOk = () => {
    if (planPublic) {
      onConfirm(planPublic, quantity);
    }
  };

  const disabled = !planPublic || !price;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Confirm & checkout"
      cancelText="Cancel"
      centered
      width={780}
      okButtonProps={{ disabled }}
    >
      {!planPublic ? (
        <div className="py-8 text-center text-sm text-slate-500">
          No plan selected.
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-6 md:flex-row">
          {/* LEFT: Plan detail */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {effectiveName}
              </h2>
              {effectiveDescription && (
                <p className="mt-1 text-sm text-slate-600">
                  {effectiveDescription}
                </p>
              )}
              {loadingDetail && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Loading detailed information...
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {isFullPackage ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  <Shield className="mr-1.5 h-3.5 w-3.5" />
                  Full feature package
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Custom feature set
                </span>
              )}

              {licenseScope && (
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
                  {licenseScope === "SeatBased"
                    ? "Seat-based license"
                    : "Company-wide license"}
                </span>
              )}
            </div>

            {/* Price detail */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              {price ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-semibold text-slate-900">
                      {formatCurrency(price.amount, price.currency)}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {formatPriceShortUnit(price)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatPaymentNote(price)}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-slate-800">
                  Contact sales for pricing.
                </p>
              )}
            </div>

            {/* Usage limits */}
            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Usage limits</p>
              {licenseScope && (
                <p className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {formatSeatsLimit(licenseScope, seatsPerCompanyLimit)}
                </p>
              )}
              {typeof companyShareLimit !== "undefined" && (
                <p>{formatCompanyShareLimit(companyShareLimit)}</p>
              )}
              {price && licenseScope && (
                <p>{formatChargeUnit(licenseScope, price.chargeUnit)}</p>
              )}
            </div>

            {/* Features list */}
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-800">
                Included features
              </p>
              {featureNames.length ? (
                <ul className="space-y-1 text-xs text-slate-700">
                  {featureNames.map((name) => (
                    <li key={name} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">
                  Feature list will be confirmed during onboarding.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: Order summary */}
          <aside className="w-full md:w-64 lg:w-72">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Order summary
              </h3>

              <div className="mt-3 space-y-3 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Selected plan</span>
                  <span className="font-medium text-slate-900">
                    {effectiveName || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Unit price</span>
                  <span className="font-medium text-slate-900">
                    {price
                      ? formatCurrency(price.amount, price.currency)
                      : "Contact sales"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Quantity</span>
                  <div className="flex items-center gap-2">
                    <InputNumber
                      min={1}
                      value={quantity}
                      onChange={(v) =>
                        setQuantity(typeof v === "number" ? v : 1)
                      }
                      size="small"
                      className="w-20"
                    />
                    <span className="text-[11px] text-slate-500">x</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      Total
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {price
                        ? formatCurrency(totalAmount, price.currency)
                        : "-"}
                    </span>
                  </div>
                  {price?.paymentMode === "Installments" && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Total contract value above will be split into installments.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </Modal>
  );
}
