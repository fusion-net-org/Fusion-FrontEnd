// components/Subscription/CheckoutModal.tsx
import React, { useEffect, useRef } from "react";
import { Check, Shield, X, Info } from "lucide-react";

type BillingPeriod = "Week" | "Month" | "Year";

type ApiFeature = {
  featureKey: string;
  limitValue: number | string | null;
};

type ApiPrice = {
  billingPeriod: BillingPeriod;
  periodCount: number;
  price: number;
  currency: string;
  refundWindowDays?: number;
  refundFeePercent?: number;
};

type ApiPlan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price: ApiPrice;
  features: ApiFeature[];
};

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  plan: any;                     // có thể là ApiPlan hoặc {data:{data:ApiPlan}}
  processing?: boolean;
  onConfirm?: (plan: ApiPlan) => void;
}

const humanFeatureName = (key: string) => {
  const map: Record<string, string> = {
    company: "Company",
    project: "Project",
    share: "Share",
    member: "Member",
    user: "User",
    storage: "Storage (GB)",
  };
  // fallback: Capitalize
  return map[key] ?? key.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    // Với VND hiển thị rõ ràng, không có phần thập phân
    const opts: Intl.NumberFormatOptions = {
      style: "currency",
      currency,
      ...(currency.toUpperCase() === "VND" ? { maximumFractionDigits: 0 } : {})
    };
    return new Intl.NumberFormat("vi-VN", opts).format(amount);
  } catch {
    return `${amount.toLocaleString("vi-VN")} ${currency}`;
  }
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  onClose,
  plan,
  processing,
  onConfirm,
}) => {
  // normalize từ response: plan có thể là ApiPlan hoặc { data: { data: ApiPlan } }
  const normalized: ApiPlan | null = plan?.data?.data ?? plan ?? null;

  const dialogRef = useRef<HTMLDivElement>(null);

  // đóng bằng ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !normalized) return null;

  const { name, description, price, features, code } = normalized;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* card */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl
                   bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
                   ring-1 ring-slate-200/70 dark:ring-slate-700/60
                   animate-[fadeIn_120ms_ease-out]"
      >
        {/* header */}
        <div className="relative overflow-hidden rounded-t-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center
                       rounded-full bg-white/80 text-slate-600 shadow hover:bg-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                {code}
              </span>
              <span className="text-xs text-slate-500">Subscription plan</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-slate-900">
              {name}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            )}
          </div>
        </div>

        {/* body: 2 cột */}
        <div className="grid gap-6 px-6 pb-4 pt-2 md:grid-cols-2">
          {/* left: giá + refund */}
          <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="mb-3">
              <div className="text-sm font-medium text-slate-600">Price</div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {formatCurrency(price.price, price.currency)}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {price.periodCount} {price.billingPeriod}
                {price.periodCount > 1 ? "s" : ""} • {price.currency}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-slate-500" />
                <div className="text-sm text-slate-600">
                  Refund within{" "}
                  <b>{price.refundWindowDays ?? 0} days</b> (fee{" "}
                  <b>{price.refundFeePercent ?? 0}%</b>).
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-4 w-4" />
              Secure checkout • Encrypted payment
            </div>
          </div>

          {/* right: features */}
          <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-600">Features</div>
            <ul className="mt-2 max-h-44 space-y-2 overflow-auto pr-1">
              {features?.map((f, idx) => (
                <li
                  key={`${f.featureKey}-${idx}`}
                  className="flex items-center gap-2"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
                    <Check className="h-3.5 w-3.5 text-blue-700" />
                  </span>
                  <span className="text-sm text-slate-700">
                    {humanFeatureName(f.featureKey)}:{" "}
                    <b className="font-semibold">{f.limitValue}</b>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* footer */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Total due now:{" "}
            <b className="text-slate-900">
              {formatCurrency(price.price, price.currency)}
            </b>
            {"  "}
            <span className="text-slate-400">
              / {price.periodCount} {price.billingPeriod}
              {price.periodCount > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300
                         bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              disabled={processing}
              onClick={() => onConfirm?.(normalized)}
              className="inline-flex items-center justify-center rounded-lg
                         bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white
                         shadow hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60"
            >
              {processing ? "Processing..." : "Confirm Purchase"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
