// src/pages/company/subscription/SubscriptionPlan.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Sparkles, TriangleAlert } from "lucide-react";
import {
  GetAllForCustomer,
  getSubscriptionPlanById,
} from "@/services/subscriptionPlanService.js";
import CheckoutModal from "@/components/Subscription/CheckoutModal";
import {createTransaction } from "@/services/transactionService.js";
import { createPaymentLink } from '@/services/payosService.js';

/** ========= Types ========= */
type BillingPeriod = "Week" | "Month" | "Year";
type Feature = { key: string; limitValue: string | number | null };
type PlanCardVm = {
  id: string;
  code?: string;
  name: string;
  price: number;
  periodCount: number;
  billingPeriod: BillingPeriod;
  currency: string;
  refundWindowDays?: number;
  refundFeePercent?: number;
  features: Feature[];
  popular?: boolean;
};
type Plans = { week: PlanCardVm[]; month: PlanCardVm[] };

/** ========= Utils ========= */
const humanFeatureName = (key: string) => {
  const map: Record<string, string> = {
    company: "Company",
    project: "Project",
    share: "Share",
  };
  return map[key] ?? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    const opts: Intl.NumberFormatOptions = {
      style: "currency",
      currency,
      ...(currency?.toUpperCase() === "VND" ? { maximumFractionDigits: 0 } : {}),
    };
    return new Intl.NumberFormat("vi-VN", opts).format(amount);
  } catch {
    return `${amount?.toLocaleString("vi-VN")} ${currency}`;
  }
};

/** ========= Simple event emitter for analytics =========
 *  Listen anywhere:
 *  window.addEventListener('subscription:checkout_open', (e) => console.log(e.detail));
 *  window.addEventListener('subscription:checkout_close', ...)
 */
const fireEvent = (name: string, detail?: any) =>
  window.dispatchEvent(new CustomEvent(name, { detail }));

/** ========= Page ========= */
const SubscriptionPlan: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<"week" | "month">("month");
  const [plans, setPlans] = useState<Plans>({ week: [], month: [] });
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // checkout modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // fetch controller to cancel on unmount
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    const fetchPlans = async () => {
      try {
        setLoading(true);
        setLoadErr(null);
        const res = await GetAllForCustomer(); // GET all public plans
        const data = res?.data ?? [];

        const mapPlan = (p: any): PlanCardVm => ({
          id: p.id,
          code: p.code,
          name: p.name,
          price: p.price?.price ?? 0,
          periodCount: p.price?.periodCount ?? 1,
          billingPeriod: p.price?.billingPeriod ?? "Month",
          currency: p.price?.currency ?? "VND",
          refundWindowDays: p.price?.refundWindowDays,
          refundFeePercent: p.price?.refundFeePercent,
          // gộp & loại trùng tính năng
          features: (p.features ?? []).reduce((acc: Feature[], cur: any) => {
            const k = cur.featureKey;
            if (!acc.find((x) => x.key === k)) acc.push({ key: k, limitValue: cur.limitValue });
            return acc;
          }, []),
        });

        const weekPlans: PlanCardVm[] = data
          .filter((p: any) => p.price?.billingPeriod === "Week")
          .map(mapPlan);
        const monthPlans: PlanCardVm[] = data
          .filter((p: any) => p.price?.billingPeriod === "Month")
          .map(mapPlan);

        // đánh dấu popular gói đầu của tab tháng (có thể đổi logic)
        if (monthPlans.length > 0) monthPlans[0].popular = true;

        if (!signal.aborted) setPlans({ week: weekPlans, month: monthPlans });
      } catch (err: any) {
        if (!signal.aborted) setLoadErr(err?.message ?? "Failed to load plans");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchPlans();
    return () => controllerRef.current?.abort();
  }, []);

  const currentPlans = useMemo(
    () => (selectedTab === "week" ? plans.week : plans.month),
    [plans, selectedTab]
  );

const handleBuy = async (plan: PlanCardVm) => {
  // mở ngay pop-up với skeleton
  setCheckoutPlan(null);          // để modal hiểu là đang loading
  setCheckoutOpen(true);
  window.dispatchEvent(new CustomEvent("subscription:checkout_open", { detail: { planId: plan.id, planName: plan.name } }));

  try {
    setCheckoutLoading(true);
    const res = await getSubscriptionPlanById(plan.id);
    const payload = res?.data?.data ?? res?.data ?? res ?? null;
    setCheckoutPlan(payload);
  } catch (err) {
    alert("Failed to load plan details");
    console.error("Error fetching plan details:", err);
    setCheckoutOpen(false);
  } finally {
    setCheckoutLoading(false);
  }
};

  const closeCheckout = () => {
    setCheckoutOpen(false);
    fireEvent("subscription:checkout_close", { planId: checkoutPlan?.id });
  };

  /** ======= Render ======= */
  if (loading) {
    // skeleton shimmer
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mx-auto h-6 w-40 animate-pulse rounded-full bg-slate-200/70" />
            <div className="mx-auto mt-3 h-8 w-96 animate-pulse rounded bg-slate-200/70" />
          </div>
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6 items-stretch">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-72 rounded-2xl border border-slate-200 bg-white/70 p-6 shadow animate-pulse"
              >
                <div className="h-5 w-32 rounded bg-slate-200/80" />
                <div className="mt-4 h-9 w-40 rounded bg-slate-200/80" />
                <div className="mt-2 h-4 w-28 rounded bg-slate-200/80" />
                <div className="mt-6 h-28 rounded bg-slate-100" />
                <div className="mt-6 h-10 rounded bg-slate-200/90" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          <TriangleAlert className="h-5 w-5" />
          <span>{loadErr}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* header */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-600">
            <Sparkles className="h-3.5 w-3.5" /> Flexible billing
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            Choose Your Subscription Plan
          </h1>
          <p className="mt-2 text-slate-600">Simple pricing for teams and projects.</p>
        </div>

        {/* Tabs */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1.5 shadow-lg">
            <button
              onClick={() => setSelectedTab("week")}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                selectedTab === "week"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedTab("month")}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                selectedTab === "month"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

{/* Grid plans */}
<div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6 items-stretch">
  {currentPlans.length === 0 ? (
    <p className="text-slate-600">No plans available for this period.</p>
  ) : (
    currentPlans.map((plan) => (
      <div
        key={plan.id}
        className={`group w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white/80
                    shadow-[0_1px_1px_rgba(17,24,39,0.06),0_10px_22px_-12px_rgba(30,64,175,0.30)]
                    backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-2xl
                    ${plan.popular ? "ring-2 ring-blue-500" : ""} flex h-full`}
      >
        <div className="flex h-full w-full flex-col">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
          {/* content */}
          <div className="p-6 flex h-full flex-col min-h-[420px]"> {/* min-h để ổn định thẻ */}
            {/* header */}
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              {plan.popular && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">Popular</span>
              )}
            </div>

            {/* price */}
            <div className="mt-2">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                {formatCurrency(plan.price, plan.currency)}
              </div>
              <div className="text-sm text-slate-500">
                {plan.periodCount} {plan.billingPeriod}{plan.periodCount > 1 ? "s" : ""} • {plan.currency}
              </div>
            </div>

            {/* features */}
            <div className="mt-4 space-y-2">
              {plan.features.map((feature, idx) => (
                <div key={`${feature.key}-${idx}`} className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
                    <Check className="h-3.5 w-3.5 text-blue-700" />
                  </span>
                  <p className="m-0 text-sm text-slate-800">
                    {humanFeatureName(feature.key)}: <span className="text-slate-600">{feature.limitValue}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* actions: luôn ở đáy nhờ mt-auto */}
            <div className="mt-auto pt-6">
              <button
                onClick={() => handleBuy(plan)}
                disabled={checkoutLoading}
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600
                           px-4 py-3 text-sm font-semibold text-white shadow
                           hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50"
              >
                {checkoutLoading ? "Loading..." : "Buy Now"}
              </button>
              {(plan.refundWindowDays ?? plan.refundFeePercent) && (
                <p className="mt-2 text-xs text-slate-500">
                  Refund within <b>{plan.refundWindowDays ?? 0} days</b> (fee <b>{plan.refundFeePercent ?? 0}%</b>).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    ))
  )}
</div>
      </div>

      {/* Checkout Modal + pop-up events */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={closeCheckout}
        plan={checkoutPlan}
        processing={checkoutLoading}
        onConfirm={async (p) => {    
          try{
            setCheckoutLoading(true);

            // 1) Tạo transaction từ subscription plan (planId = p.id)
            const txRes = await createTransaction(p.id);
            const tx = txRes?.data?.data ?? txRes?.data ?? txRes;
            const transactionId = tx?.id;
            if (!transactionId) throw new Error('Missing transactionId');
            
            // 2) Tạo PayOS checkout link
            const linkRes = await createPaymentLink(transactionId);
            const checkoutUrl = linkRes?.data?.data; // {succeeded, statusCode, message, data: "https://..."}
            if (!checkoutUrl) throw new Error('Missing checkoutUrl');

            // 3) Điều hướng sang PayOS
            sessionStorage.setItem('fusion:lastTxId', transactionId);
            window.location.href = checkoutUrl;
          } catch (err) {
            console.error(err);
            // alert(err.message || 'Payment initialization failed!');
          } finally {
            setCheckoutLoading(false); 
          }
        }}
      />
    </div>
  );
};

export default SubscriptionPlan;
