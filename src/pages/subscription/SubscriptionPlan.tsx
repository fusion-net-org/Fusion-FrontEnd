import React, { useEffect, useMemo, useState } from "react";
import { Spin, Modal } from "antd";
import { Check, Star, ArrowRight, Shield, Users, Info } from "lucide-react";

import {
  getPublicPlans,
  getPlanById,
} from "@/services/subscriptionPlanService.js";
import { createTransactionPayment } from "@/services/transactionService.js";
import { createPaymentLink } from "@/services/payOSService.js";

import type {
  SubscriptionPlanCustomerResponse,
  SubscriptionPlanDetailResponse,
  PlanPricePreviewResponse,
  LicenseScope,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

/* =========================================================
 * Helpers
 * =======================================================*/
function formatCurrency(amount: number, currency: string) {
  try {
    return amount.toLocaleString("vi-VN") + " " + currency;
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatBillingPeriod(p: PlanPricePreviewResponse) {
  const unit = p.billingPeriod.toLowerCase(); // week/month/year
  if (p.periodCount === 1) return `Billed per ${unit}`;
  return `${p.periodCount}-${unit} shelf life`;
}

function formatPriceShortUnit(p: PlanPricePreviewResponse) {
  const unit = p.billingPeriod.toLowerCase();
  if (p.periodCount === 1) return `/${unit}`;
  return `/${p.periodCount} ${unit}s`;
}

/** Note hiển thị dưới giá, xử lý cả installments và prepaid */
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

  // Prepaid
  return "One-time payment";
}

function formatChargeUnit(
  _scope: LicenseScope,
  chargeUnit: PlanPricePreviewResponse["chargeUnit"]
) {
  if (chargeUnit === "PerSeat") return "Charged per seat";
  return "Charged per subscription";
}

function formatSeatsLimit(scope: LicenseScope, seats?: number | null) {
  if (scope === "EntireCompany") {
    return "All members in the company";
  }
  if (!seats || seats <= 0) return "Unlimited seats per company";
  return `Up to ${seats} seats per company`;
}

function formatCompanyShareLimit(limit?: number | null) {
  if (!limit || limit <= 0) return "Unlimited companies";
  return `Up to ${limit} companies`;
}

function buildPriceLabel(price?: PlanPricePreviewResponse | null) {
  if (!price) return "Contact sales";
  const main = formatCurrency(price.amount, price.currency);
  const period = formatBillingPeriod(price);
  return `${main} · ${period}`;
}

/* =========================================================
 * Page component
 * =======================================================*/

export default function SubscriptionPlan() {
  const [plans, setPlans] = useState<SubscriptionPlanCustomerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeBillingTab, setActiveBillingTab] = useState<"Month" | "Year">(
    "Month"
  );

  // ===== Checkout state =====
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] =
    useState<SubscriptionPlanCustomerResponse | null>(null);
  const [checkoutDetail, setCheckoutDetail] =
    useState<SubscriptionPlanDetailResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  /* ----------------- Load public plans ----------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getPublicPlans();
        if (mounted && Array.isArray(data)) {
          setPlans(data);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------- Sort plans ----------------- */
  const sortedPlans = useMemo(() => {
    const copy = [...plans];
    copy.sort((a, b) => {
      const pa = a.price?.amount ?? Number.MAX_SAFE_INTEGER;
      const pb = b.price?.amount ?? Number.MAX_SAFE_INTEGER;
      return pa - pb;
    });
    return copy;
  }, [plans]);

  const monthlyPlansSorted = useMemo(() => {
    const list = sortedPlans.filter(
      (p) => p.price?.billingPeriod === "Month" && p.price
    );
    return list.slice().sort((a, b) => {
      const pa = a.price as PlanPricePreviewResponse;
      const pb = b.price as PlanPricePreviewResponse;
      if (pa.periodCount !== pb.periodCount) return pa.periodCount - pb.periodCount;
      return pa.amount - pb.amount;
    });
  }, [sortedPlans]);

  const yearlyPlansSorted = useMemo(() => {
    const list = sortedPlans.filter(
      (p) => p.price?.billingPeriod === "Year" && p.price
    );
    return list.slice().sort((a, b) => {
      const pa = a.price as PlanPricePreviewResponse;
      const pb = b.price as PlanPricePreviewResponse;
      if (pa.periodCount !== pb.periodCount) return pa.periodCount - pb.periodCount;
      return pa.amount - pb.amount;
    });
  }, [sortedPlans]);

  const visiblePlans = useMemo(
    () => (activeBillingTab === "Month" ? monthlyPlansSorted : yearlyPlansSorted),
    [activeBillingTab, monthlyPlansSorted, yearlyPlansSorted]
  );

  const highlightedId = useMemo(() => {
    if (!visiblePlans.length) return null;
    if (visiblePlans.length >= 3) return visiblePlans[1].id;
    return visiblePlans[0].id;
  }, [visiblePlans]);

  /* ----------------- Checkout derived data ----------------- */

  const effectivePlan = checkoutDetail || checkoutTarget || null;

  const checkoutPrice: PlanPricePreviewResponse | null = useMemo(() => {
    const raw: any =
      (checkoutDetail as any)?.price ?? (checkoutTarget as any)?.price ?? null;
    if (!raw) return null;

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
  }, [checkoutDetail, checkoutTarget]);

  // số tiền phải trả mỗi lần thanh toán
  const perChargeAmount = useMemo(() => {
    if (!checkoutPrice) return 0;
    if (
      checkoutPrice.paymentMode === "Installments" &&
      (checkoutPrice.installmentCount ?? 0) > 0
    ) {
      return checkoutPrice.amount / (checkoutPrice.installmentCount as number);
    }
    return checkoutPrice.amount;
  }, [checkoutPrice]);

  const isInstallments =
    !!checkoutPrice &&
    checkoutPrice.paymentMode === "Installments" &&
    (checkoutPrice.installmentCount ?? 0) > 0;

  const checkoutFeatures: string[] = useMemo(() => {
    if (checkoutDetail?.features?.length) {
      return checkoutDetail.features
        .filter((f) => f.enabled)
        .map(
          (f) =>
            f.featureName ||
            f.featureCode ||
            `Feature ${f.featureId?.toString().slice(0, 6)}`
        );
    }
    if (checkoutTarget?.featuresPreview?.length) {
      return checkoutTarget.featuresPreview.map((f) => f.name);
    }
    return [];
  }, [checkoutDetail, checkoutTarget]);

  /* ----------------- Handlers ----------------- */

  const handleSelectPlan = (plan: SubscriptionPlanCustomerResponse) => {
    setCheckoutTarget(plan);
    setCheckoutDetail(null);
    setCheckoutOpen(true);

    (async () => {
      try {
        setCheckoutLoading(true);
        const detail = (await getPlanById(
          plan.id
        )) as SubscriptionPlanDetailResponse | null;
        if (detail) setCheckoutDetail(detail);
      } finally {
        setCheckoutLoading(false);
      }
    })();
  };

  const handleCheckoutConfirm = async () => {
    if (!checkoutTarget) return;

    try {
      setCheckoutLoading(true);

      // 1) Create transaction from subscription plan
      const tx = await createTransactionPayment({ planId: checkoutTarget.id });
      const transactionId = tx?.id;
      if (!transactionId) {
        throw new Error("Missing transactionId");
      }

      // 2) Create PayOS checkout link
      const linkRes = await createPaymentLink(transactionId);
      // service createPaymentLink trả về nguyên axios response
      const checkoutUrl =
        linkRes?.data?.data ?? linkRes?.data ?? linkRes ?? null;

      if (!checkoutUrl || typeof checkoutUrl !== "string") {
        throw new Error("Missing checkoutUrl");
      }

      // 3) Redirect to PayOS
      sessionStorage.setItem("fusion:lastTxId", transactionId);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error(err);
      // TODO: dùng notification/toast của bạn
      // message.error(err?.message || "Payment initialization failed!");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderCompareTable = (items: SubscriptionPlanCustomerResponse[]) => {
    if (!items.length) {
      return (
        <div className="py-6 text-center text-xs text-slate-500">
          No plans available for this period.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">
                Plan
              </th>
              <th className="py-2 px-4 text-xs font-semibold text-slate-600">
                Full feature
              </th>
              <th className="py-2 px-4 text-xs font-semibold text-slate-600">
                License scope
              </th>
              <th className="py-2 px-4 text-xs font-semibold text-slate-600">
                Seats / company
              </th>
              <th className="py-2 px-4 text-xs font-semibold text-slate-600">
                Companies
              </th>
              <th className="py-2 px-4 text-xs font-semibold text-slate-600">
                Payment
              </th>
             <th className="py-2 px-4 text-xs font-semibold text-slate-600">
                Number Of times
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((plan) => {
              const price = plan.price ?? null;
              return (
                <tr
                  key={plan.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="py-2 pr-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {plan.name}
                      </span>
                      {price && (
                        <span className="text-xs text-slate-500">
                          {buildPriceLabel(price)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    {plan.isFullPackage ? "Yes" : "No"}
                  </td>
                  <td className="py-2 px-4">
                    {plan.licenseScope === "Userlimits"
                      ? "User-limits"
                      : "Company-wide"}
                  </td>
                  <td className="py-2 px-4">
                    {formatSeatsLimit(
                      plan.licenseScope,
                      plan.seatsPerCompanyLimit
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {formatCompanyShareLimit(plan.companyShareLimit)}
                  </td>
                  <td className="py-2 px-4">
                    {price ? price.paymentMode : "—"}
                  </td>
                  <td className="py-2 px-4">
                     {price
                         ? price.paymentMode === "Installments"
                         ? price.installmentCount
                            : 1
                            : "—"}
                   </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /* =========================================================
   * JSX
   * =======================================================*/

  return (
    <div className="min-h-[calc(100vh-96px)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Hero header */}
        <header className="flex flex-col gap-6 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 px-5 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
              <Shield className="h-4 w-4" />
              Flexible subscription for FUSION
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Choose the right plan for your company
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Compare billing cycles and limits, then pick the plan that fits
              your company today and can grow with you tomorrow.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 text-xs text-slate-600 sm:items-end">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm">
              <Users className="h-4 w-4 text-indigo-500" />
              Optimized for multi-company IT teams
            </div>
          </div>
        </header>

        {/* Loading / empty */}
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spin />
          </div>
        ) : !sortedPlans.length ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <Info className="mb-3 h-6 w-6 text-slate-400" />
            <p className="text-sm font-medium text-slate-800">
              No subscription plans are available yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Please contact your administrator to configure plans.
            </p>
          </div>
        ) : (
          <>
            {/* Tabs: Monthly / Yearly */}
            <div className="flex justify-center">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-1 py-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveBillingTab("Month")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition",
                    activeBillingTab === "Month"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-700 hover:text-slate-900"
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBillingTab("Year")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition",
                    activeBillingTab === "Year"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-700 hover:text-slate-900"
                  )}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Pricing cards */}
            {visiblePlans.length === 0 ? (
              <div className="mt-6 text-center text-xs text-slate-500">
                No plans available for this period.
              </div>
            ) : (
              <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visiblePlans.map((plan) => {
                  const price = plan.price ?? null;
                  const isHighlight = plan.id === highlightedId;
                  const featureNames = plan.featuresPreview?.map((f) => f.name) ?? [];
                  const maxChips = 4;
                  const visibleChips = featureNames.slice(0, maxChips);
                  const remaining = featureNames.length - visibleChips.length;

                  return (
                    <article
                      key={plan.id}
                      className={cn(
                        "relative h-full rounded-2xl border border-slate-200 bg-white/95 p-[1px] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
                        isHighlight &&
                          "border-transparent bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_18px_40px_rgba(79,70,229,0.35)]"
                      )}
                    >
                      <div className="flex h-full flex-col rounded-2xl bg-white p-5">
                        {isHighlight && (
                          <div className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            Most popular
                          </div>
                        )}

                        {/* Header */}
                        <div className="flex flex-col gap-1">
                          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                            {plan.name}
                          </h2>
                          {plan.description && (
                            <p className="text-xs text-slate-600">
                              {plan.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {plan.isFullPackage ? (
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

                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
                              {plan.licenseScope === "Userlimits"
                                ? "Seat-based license"
                                : "Company-wide license"}
                            </span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="my-4 h-px w-full bg-slate-100" />

                        {/* Price */}
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-semibold text-slate-900">
                              {price
                                ? formatCurrency(price.amount, price.currency)
                                : "Contact sales"}
                            </span>
                            {price && (
                              <span className="text-xs font-medium text-slate-500">
                                {formatPriceShortUnit(price)}
                              </span>
                            )}
                          </div>

                          {price && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              {formatPaymentNote(price)}
                            </p>
                          )}

                          {price && (
                            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                                <Users className="mr-1.5 h-3.5 w-3.5" />
                                {formatSeatsLimit(
                                  plan.licenseScope,
                                  plan.seatsPerCompanyLimit
                                )}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                                {formatChargeUnit(
                                  plan.licenseScope,
                                  price.chargeUnit
                                )}
                              </span>
                              {typeof plan.companyShareLimit !== "undefined" && (
                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                                  {formatCompanyShareLimit(
                                    plan.companyShareLimit
                                  )}
                                </span>
                              )}
                              {price.paymentMode === "Installments" && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                                  Installments available
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="my-4 h-px w-full bg-slate-100" />

                        {/* Features + CTA */}
                        <div className="flex flex-1 flex-col">
                          <div className="mb-3">
                            <p className="mb-1 text-[11px] font-semibold tracking-wide text-slate-700">
                              Key features
                            </p>
                            {visibleChips.length ? (
                              <ul className="space-y-1.5 text-xs text-slate-700">
                                {visibleChips.map((name) => (
                                  <li
                                    key={name}
                                    className="flex items-start gap-2"
                                  >
                                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                                    <span>{name}</span>
                                  </li>
                                ))}
                                {remaining > 0 && (
                                  <li className="text-[11px] text-slate-500">
                                    +{remaining} more features
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <p className="text-[11px] text-slate-400">
                                Detailed feature list will be provided during
                                onboarding.
                              </p>
                            )}
                          </div>

                          <div className="mt-auto pt-2">
                            <button
                              type="button"
                              onClick={() => handleSelectPlan(plan)}
                              className={cn(
                                "inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                                isHighlight
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                  : "bg-slate-900 text-white hover:bg-slate-800"
                              )}
                            >
                              Buy now
                              <ArrowRight className="ml-1.5 h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}

            {/* Comparison table */}
            <section className="mt-10 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-xs text-slate-700 lg:block">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Compare plans
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Currently viewing{" "}
                    <span className="font-semibold">
                      {activeBillingTab === "Month" ? "monthly" : "yearly"}
                    </span>{" "}
                    billing period.
                  </p>
                </div>
              </div>

              {activeBillingTab === "Month"
                ? renderCompareTable(monthlyPlansSorted)
                : renderCompareTable(yearlyPlansSorted)}
            </section>
          </>
        )}

        {/* =============== Checkout Modal =============== */}
        <Modal
          open={checkoutOpen}
          onCancel={() => setCheckoutOpen(false)}
          onOk={handleCheckoutConfirm}
          okText="Confirm & checkout"
          cancelText="Cancel"
          centered
          width={780}
          confirmLoading={checkoutLoading}
        >
          {!effectivePlan ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No plan selected.
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-6 md:flex-row">
              {/* LEFT: plan info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {effectivePlan.name}
                  </h2>
                  {effectivePlan.description && (
                    <p className="mt-1 text-sm text-slate-600">
                      {effectivePlan.description}
                    </p>
                  )}
                  {checkoutLoading && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Loading detailed information...
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(checkoutDetail?.isFullPackage ??
                    checkoutTarget?.isFullPackage ??
                    false) ? (
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

                  {(() => {
                    const scope: LicenseScope | undefined =
                      checkoutDetail?.licenseScope ??
                      checkoutTarget?.licenseScope;
                    if (!scope) return null;
                    return (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
                        {scope === "Userlimits"
                          ? "Seat-based license"
                          : "Company-wide license"}
                      </span>
                    );
                  })()}
                </div>

                {/* Price detail (contract value) */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  {checkoutPrice ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-semibold text-slate-900">
                          {formatCurrency(
                            checkoutPrice.amount,
                            checkoutPrice.currency
                          )}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {formatPriceShortUnit(checkoutPrice)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatPaymentNote(checkoutPrice)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-medium text-slate-800">
                      Contact sales for pricing.
                    </p>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Usage limits</p>
                  {(() => {
                    const scope: LicenseScope | undefined =
                      checkoutDetail?.licenseScope ??
                      checkoutTarget?.licenseScope;
                    const seats =
                      checkoutDetail?.seatsPerCompanyLimit ??
                      checkoutTarget?.seatsPerCompanyLimit;
                    const companies =
                      checkoutDetail?.companyShareLimit ??
                      checkoutTarget?.companyShareLimit;

                    return (
                      <>
                        {scope && (
                          <p className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {formatSeatsLimit(scope, seats)}
                          </p>
                        )}
                        {typeof companies !== "undefined" && (
                          <p>{formatCompanyShareLimit(companies)}</p>
                        )}
                        {checkoutPrice && scope && (
                          <p>
                            {formatChargeUnit(scope, checkoutPrice.chargeUnit)}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Features */}
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-800">
                    Included features
                  </p>
                  {checkoutFeatures.length ? (
                    <ul className="space-y-1 text-xs text-slate-700">
                      {checkoutFeatures.map((name) => (
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
                        {effectivePlan.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>
                        Unit price
                        {isInstallments && " (per installment)"}
                      </span>
                      <span className="font-medium text-slate-900">
                        {checkoutPrice
                          ? formatCurrency(
                              perChargeAmount,
                              checkoutPrice.currency
                            )
                          : "Contact sales"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Quantity</span>
                      <span className="font-medium text-slate-900">1</span>
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">
                          Total this payment
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {checkoutPrice
                            ? formatCurrency(
                                perChargeAmount,
                                checkoutPrice.currency
                              )
                            : "-"}
                        </span>
                      </div>
                      {isInstallments && checkoutPrice && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Contract value{" "}
                          {formatCurrency(
                            checkoutPrice.amount,
                            checkoutPrice.currency
                          )}{" "}
                          over {checkoutPrice.installmentCount} installments.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
