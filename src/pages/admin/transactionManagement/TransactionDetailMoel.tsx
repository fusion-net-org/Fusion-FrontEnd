// src/components/Admin/TransactionDetailModal.tsx

import React from "react";
import { Modal, Spin } from "antd";
import { Clock3, CheckCircle2, XCircle } from "lucide-react";
import type {
  TransactionPaymentDetailResponse,
  PaymentStatus,
} from "@/interfaces/Transaction/TransactionPayment";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
}

function statusTag(status: PaymentStatus) {
  const s = (status || "").toLowerCase();

  let colorClass =
    "bg-slate-100 text-slate-700 border border-slate-200";
  let icon: React.ReactNode = <Clock3 className="w-3.5 h-3.5" />;

  if (s.includes("success") || s.includes("succeed") || s.includes("completed")) {
    colorClass =
      "bg-emerald-50 text-emerald-700 border border-emerald-200";
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
  } else if (s.includes("pending")) {
    colorClass =
      "bg-amber-50 text-amber-700 border-amber-200";
    icon = <Clock3 className="w-3.5 h-3.5" />;
  } else if (s.includes("cancel") || s.includes("fail") || s.includes("refund")) {
    colorClass =
      "bg-rose-50 text-rose-700 border-rose-200";
    icon = <XCircle className="w-3.5 h-3.5" />;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        colorClass
      )}
    >
      {icon}
      <span>{status}</span>
    </span>
  );
}

type Props = {
  open: boolean;
  loading: boolean;
  data: TransactionPaymentDetailResponse | null;
  onClose: () => void;
};

export default function TransactionDetailModal({
  open,
  loading,
  data,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      title={
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Transaction detail
            </p>
            {data && (
              <p className="text-xs text-slate-500">
                Order code: {data.orderCode ?? "—"}
              </p>
            )}
          </div>

          {data && (
            <div className="flex flex-col items-end gap-1">
              {/* status + transaction date cùng “block” */}
              {statusTag(data.status)}
              <p className="text-[11px] text-slate-500">
                Transaction time: {formatDateTime(data.transactionDateTime)}
              </p>
            </div>
          )}
        </div>
      }
    >
      {loading && (
        <div className="py-8 flex items-center justify-center">
          <Spin />
        </div>
      )}

      {!loading && data && (
        <div className="space-y-5 py-2">
          {/* Main info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">
                User
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {data.userName ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                UserId: {data.userId}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">
                Plan
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {data.planName ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                PlanId: {data.planId}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">
                Amount
              </p>
              <p className="text-base font-semibold text-slate-900">
                {data.amount.toLocaleString("vi-VN")} {data.currency}
              </p>
              <p className="text-xs text-slate-500">
                {data.chargeUnitSnapshot} ·{" "}
                {data.billingPeriodSnapshot} x
                {data.periodCountSnapshot}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">
                Mode / installments
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {data.paymentModeSnapshot}
              </p>
              {data.paymentModeSnapshot === "Installments" && (
                <p className="text-xs text-slate-500">
                  Installment {data.installmentIndex ?? "-"} /{" "}
                  {data.installmentTotal ?? "-"}
                </p>
              )}
            </div>
          </div>

          {/* Gateway info */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Gateway
            </p>
            <p className="text-sm text-slate-800">
              Provider:{" "}
              <span className="font-medium">
                {data.provider ?? "—"}
              </span>
            </p>
            <p className="text-sm text-slate-800">
              Method:{" "}
              <span className="font-medium">
                {data.paymentMethod ?? "—"}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              PaymentLinkId: {data.paymentLinkId ?? "—"}
            </p>
            <p className="text-xs text-slate-500">
              OrderCode: {data.orderCode ?? "—"}
            </p>
          </div>

          {/* Timestamps & bank */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">
                Timestamps
              </p>
              <p className="text-xs text-slate-500">
                Created at: {formatDateTime(data.createdAt)}
              </p>
              <p className="text-xs text-slate-500">
                Paid at: {formatDateTime(data.paidAt)}
              </p>
              <p className="text-xs text-slate-500">
                Due at: {formatDateTime(data.dueAt)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">
                Bank / counter account
              </p>
              <p className="text-xs text-slate-500">
                Receiving account: {data.accountNumber ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                Counter bank:{" "}
                {data.counterAccountBankName ??
                  data.counterAccountBankId ??
                  "—"}
              </p>
              <p className="text-xs text-slate-500">
                Counter name: {data.counterAccountName ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                Counter account:{" "}
                {data.counterAccountNumber ?? "—"}
              </p>
            </div>
          </div>

          {/* Description */}
          {(data.description || data.reference) && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">
                Description / reference
              </p>
              {data.description && (
                <p className="text-sm text-slate-800">
                  {data.description}
                </p>
              )}
              {data.reference && (
                <p className="text-xs text-slate-500">
                  Ref: {data.reference}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
