// src/pages/my-subscription/UserSubscriptionsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Table, Tag, Button, Input, Select, Spin, Modal } from "antd";
import { Info, CreditCard, Layers, CalendarDays, X } from "lucide-react";
import {
  getUserSubscriptionsPaged,
  getUserSubscriptionDetail,
} from "@/services/userSubscription.js";
import UserSubscriptionDetailModal from "@/components/MySubscription/SubscriptionDetailModal";

import { getNextPendingInstallment } from "@/services/transactionService.js";
import { createPaymentLink } from "@/services/payosService.js";

import type {
  UserSubscriptionResponse,
  UserSubscriptionPagedResult,
  UserSubscriptionDetailResponse,
} from "@/interfaces/UserSubscription/UserSubscription";
import type { TransactionPaymentDetailResponse } from "@/interfaces/Transaction/TransactionPayment";

const { Search } = Input;
const { Option } = Select;


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

function statusTagColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active")) return "green";
  if (s.includes("pending")) return "blue";
  if (s.includes("expired") || s.includes("cancel")) return "red";
  return "default";
}

function formatInstallmentLabel(tx: TransactionPaymentDetailResponse | null) {
  if (!tx) return "";
  const idx = tx.installmentIndex ?? undefined;
  const total = tx.installmentTotal ?? undefined;
  if (idx && total) return `Installment ${idx} of ${total}`;
  if (idx) return `Installment ${idx}`;
  if (total) return `${total} installments`;
  return "Installment payment";
}

/* =================== Component =================== */

export default function UserSubscriptionsPage() {
  const [rows, setRows] = useState<UserSubscriptionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
 const [usageNoteVisible, setUsageNoteVisible] = useState(true);
  // Cache detail cho modal subscription detail
  const [detailCache, setDetailCache] = useState<
    Record<string, UserSubscriptionDetailResponse>
  >({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const activeDetail: UserSubscriptionDetailResponse | null = useMemo(() => {
    if (!detailTargetId) return null;
    return detailCache[detailTargetId] ?? null;
  }, [detailTargetId, detailCache]);

  // Đếm active + installment dựa trên nextPaymentDueAt
  const activeCount = useMemo(
    () =>
      rows.filter((r) => r.status.toLowerCase().includes("active")).length,
    [rows]
  );

  const installmentSubsCount = useMemo(
    () => rows.filter((r) => !!r.nextPaymentDueAt && r.unitPrice !== 0).length,
    [rows]
  );

  // Đếm các gói auto-month (unitPrice === 0)
  const autoMonthlyCount = useMemo(
    () => rows.filter((r) => r.unitPrice === 0).length,
    [rows]
  );

  // ================== PAYMENT CHECKOUT MODAL STATE ==================
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentTx, setPaymentTx] =
    useState<TransactionPaymentDetailResponse | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSubscription, setPaymentSubscription] =
    useState<UserSubscriptionResponse | null>(null);

  /* ---------- Load paged list ---------- */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const page: UserSubscriptionPagedResult | null =
          await getUserSubscriptionsPaged({
            keyword: keyword || undefined,
            status: statusFilter || undefined,
            pageNumber,
            pageSize,
          });

        if (!mounted) return;

        const items = page?.items ?? [];
        setRows(items);
        setTotal(page?.totalCount ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [keyword, statusFilter, pageNumber, pageSize]);

  /* ---------- Handlers ---------- */

  const handleSearch = (value: string) => {
    setKeyword(value.trim());
    setPageNumber(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value || undefined);
    setPageNumber(1);
  };

  const openDetail = async (id: string) => {
    setDetailTargetId(id);
    setDetailOpen(true);

    if (!detailCache[id]) {
      try {
        setDetailLoading(true);
        const d = await getUserSubscriptionDetail(id);
        if (d) {
          setDetailCache((prev) => ({ ...prev, [id]: d }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  // ====== EVENT PAYMENT: mở modal + load transaction installment ======
  const handlePaymentClick = async (sub: UserSubscriptionResponse) => {
    setPaymentSubscription(sub);
    setPaymentOpen(true);
    setPaymentError(null);
    setPaymentTx(null);
    setPaymentLoading(true);

    try {
      const tx = await getNextPendingInstallment({
        planId: sub.planId,
        userSubscriptionId: sub.id,
      });

      if (!tx) {
        setPaymentError("No pending installment found for this subscription.");
      } else {
        setPaymentTx(tx);
      }
    } catch (err: any) {
      console.error(err);
      setPaymentError(
        err?.message || "Failed to load next installment transaction."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleClosePayment = () => {
    if (checkoutLoading) return;
    setPaymentOpen(false);
    setPaymentTx(null);
    setPaymentError(null);
    setPaymentSubscription(null);
  };

  const handleConfirmCheckout = async () => {
    if (!paymentTx?.id) return;

    try {
      setCheckoutLoading(true);

      // 1) Gọi PayOS tạo link từ transaction installment
      const linkRes = await createPaymentLink(paymentTx.id);
      const checkoutUrl = linkRes?.data?.data;

      if (!checkoutUrl || typeof checkoutUrl !== "string") {
        throw new Error("Missing checkout URL");
      }

      // 2) Optional: lưu lại transactionId
      sessionStorage.setItem("fusion:lastTxId", paymentTx.id);

      // 3) Redirect sang PayOS
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Payment initialization failed!");
    } finally {
      setCheckoutLoading(false);
    }
  };

  /* ---------- Columns ---------- */

  // Title có màu + box xanh bao quanh
  const headerTitle = (label: string) => (
    <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
      {label}
    </span>
  );

  const columns = [
    {
      title: headerTitle("Plan"),
      dataIndex: "planName",
      key: "planName",
      render: (_: string, record: UserSubscriptionResponse) => {
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              {record.planName}
            </span>
          </div>
        );
      },
    },
    {
      title: headerTitle("Status"),
      dataIndex: "status",
      key: "status",
      render: (value: string) => (
        <Tag
          color={statusTagColor(value)}
          className="rounded-full px-3 py-0.5 text-xs"
        >
          {value}
        </Tag>
      ),
    },
    {
      title: headerTitle("Term"),
      key: "term",
      render: (_: unknown, record: UserSubscriptionResponse) => (
        <div className="flex flex-col text-xs text-slate-700">
          <span className="font-medium text-slate-800">
            {formatDate(record.termStart)} - {formatDate(record.termEnd)}
          </span>
          {record.nextPaymentDueAt && (
            <span className="mt-0.5 text-[11px] text-slate-500">
              Next payment: {formatDate(record.nextPaymentDueAt)}
            </span>
          )}
        </div>
      ),
    },
    {
      title: headerTitle("Unit price"),
      key: "unitPrice",
      render: (_: unknown, record: UserSubscriptionResponse) => {
        const isAutoMonthly = record.unitPrice === 0;
        if (isAutoMonthly) {
          return (
            <span className="text-xs font-semibold text-emerald-600">
              Free monthly quota
            </span>
          );
        }
        return (
          <span className="text-sm font-semibold text-indigo-600">
            {formatCurrency(record.unitPrice, record.currency)}
          </span>
        );
      },
    },
    {
      title: headerTitle("Created at"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => (
        <span className="text-xs font-medium text-slate-600">
          {formatDate(value)}
        </span>
      ),
    },
    {
      title: headerTitle("Actions"),
      key: "actions",
      align: "center" as const,
      render: (_: unknown, record: UserSubscriptionResponse) => {
        const isAutoMonthly = record.unitPrice === 0;
        const showPayment = !!record.nextPaymentDueAt && !isAutoMonthly;

        return (
          <div
            className={cn(
              "inline-flex min-w-[140px] flex-col items-stretch gap-1",
              "rounded-2xl border border-slate-100 bg-slate-50 px-2 py-1.5",
              "shadow-sm"
            )}
          >
            {/* Detail */}
            <Button
              size="small"
              type="default"
              onClick={() => openDetail(record.id)}
              className={cn(
                "flex w-full items-center justify-center rounded-xl px-3 py-1",
                "text-xs font-medium",
                "!border-slate-200 !bg-white !text-slate-700",
                "hover:!border-indigo-400 hover:!text-indigo-600"
              )}
              icon={<Info className="mr-1 h-3.5 w-3.5" />}
            >
              View detail
            </Button>

            {/* Payment (nếu có nextPaymentDueAt và không phải auto-month) */}
            {showPayment && (
              <Button
                size="small"
                type="primary"
                onClick={() => handlePaymentClick(record)}
                className={cn(
                  "flex w-full items-center justify-center rounded-xl px-3 py-1",
                  "text-xs font-semibold"
                )}
                icon={<CreditCard className="mr-1 h-3.5 w-3.5" />}
              >
                Payment
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  /* ---------- JSX ---------- */

  return (
    <div className="min-h-[calc(100vh-96px)] bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-sky-50 to-purple-50 px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-indigo-700 sm:text-2xl">
                My subscriptions
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                View all your active and past subscription plans, including
                billing periods and upcoming payments.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-slate-700 shadow-sm">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">{activeCount}</span>
                  &nbsp;active subscriptions
                </span>
                <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-slate-700 shadow-sm">
                  <CreditCard className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-medium">{installmentSubsCount}</span>
                  &nbsp;installment plans
                </span>
                {autoMonthlyCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-slate-700 shadow-sm">
                    <Layers className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-medium">{autoMonthlyCount}</span>
                    &nbsp;auto monthly quotas
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Search
              allowClear
              placeholder="Search by plan name..."
              onSearch={handleSearch}
              className="w-60"
              size="middle"
            />
            <Select
              allowClear
              placeholder="Status"
              size="middle"
              className="w-36"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <Option value="Active">Active</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Expired">Expired</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </div>
        </header>
          {/* Usage order note */}
      {usageNoteVisible && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-800 shadow-sm">
          <div className="mt-0.5">
            <Info className="h-4 w-4 text-amber-500" />
          </div>

          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
              Usage order
            </p>
            <p className="mt-1 text-[13px] leading-snug">
              Your subscriptions are consumed automatically from your oldest
              active plan to your newest. When an older plan is fully used or
              expires, the system will automatically switch to the next
              available plan — you don&apos;t need to do anything.
            </p>
          </div>

          <button
            type="button"
            aria-label="Dismiss usage order note"
            onClick={() => setUsageNoteVisible(false)}
            className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-500 hover:bg-amber-200 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
        {/* List */}
        <section className="rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center py-16">
              <Spin />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <Info className="mb-2 h-7 w-7 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">
                You don&apos;t have any subscriptions yet.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Once you purchase a plan, your subscriptions will appear here.
              </p>
            </div>
          ) : (
            <Table<UserSubscriptionResponse>
              rowKey={(r) => r.id}
              columns={columns}
              dataSource={rows}
              pagination={{
                current: pageNumber,
                pageSize,
                total,
                showSizeChanger: true,
                onChange: (page, size) => {
                  setPageNumber(page);
                  setPageSize(size || 10);
                },
              }}
              size="large"
            />
          )}
        </section>

        {/* Detail modal */}
        <UserSubscriptionDetailModal
          open={detailOpen}
          loading={detailLoading && !activeDetail}
          data={activeDetail}
          onClose={() => setDetailOpen(false)}
        />

        {/* PAYMENT CHECKOUT MODAL */}
        <Modal
          open={paymentOpen}
          onCancel={handleClosePayment}
          footer={null}
          centered
          width={720}
          title={
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50">
                <CreditCard className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Installment checkout
                </div>
                <div className="text-[11px] text-slate-500">
                  Review the next installment before redirecting to the payment
                  gateway.
                </div>
              </div>
            </div>
          }
        >
          {paymentLoading && !paymentTx && !paymentError ? (
            <div className="flex min-h-[160px] items-center justify-center">
              <Spin />
            </div>
          ) : paymentError ? (
            <div className="space-y-3 py-4 text-sm text-slate-700">
              <p className="font-medium text-rose-600">{paymentError}</p>
              <p className="text-xs text-slate-500">
                It might be that all installments have already been paid.
              </p>
              <div className="mt-2 flex justify-end">
                <Button onClick={handleClosePayment}>Close</Button>
              </div>
            </div>
          ) : !paymentTx ? (
            <div className="py-4 text-center text-sm text-slate-500">
              No installment transaction to display.
            </div>
          ) : (
            <div className="space-y-5 pb-2">
              {/* Summary card */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Plan
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {paymentTx.planName ||
                      paymentSubscription?.planName ||
                      "Subscription plan"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5">
                      {formatInstallmentLabel(paymentTx)}
                    </span>
                    {paymentTx.dueAt && (
                      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5">
                        <CalendarDays className="mr-1 h-3.5 w-3.5 text-slate-500" />
                        Due: {formatDate(paymentTx.dueAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-right text-xs text-slate-600 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Installment amount
                  </p>
                  <p className="mt-1 text-lg font-semibold text-emerald-600">
                    {formatCurrency(paymentTx.amount, paymentTx.currency)}
                  </p>
                </div>
              </div>

              {/* Order summary */}
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Order summary
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {paymentTx.planName ||
                        paymentSubscription?.planName ||
                        "Subscription plan"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Quantity: <span className="font-medium">1</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">Unit price</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatCurrency(paymentTx.amount, paymentTx.currency)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">
                      Total this payment
                    </span>
                    <span className="text-base font-semibold text-emerald-600">
                      {formatCurrency(paymentTx.amount, paymentTx.currency)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    This payment covers{" "}
                    {formatInstallmentLabel(paymentTx).toLowerCase()} for your
                    subscription.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500">
                  After confirming, you will be redirected to the payment
                  gateway (PayOS) to complete this installment.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleClosePayment}
                    disabled={checkoutLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleConfirmCheckout}
                    loading={checkoutLoading}
                  >
                    Confirm & Checkout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
