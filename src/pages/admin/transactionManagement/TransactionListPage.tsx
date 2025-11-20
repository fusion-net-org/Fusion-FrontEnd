// src/pages/admin/TransactionListPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCcw,
  CalendarDays,
  ArrowUpDown,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  DollarSign,
} from "lucide-react";
import { DatePicker, Select, Input, Spin } from "antd";

import {
  getAllTransactionForAdmin,
  getTransactionById,
} from "@/services/transactionService.js";

import type {
  TransactionPaymentPagedSummaryResponse,
  TransactionPaymentListItem,
  TransactionPaymentDetailResponse,
  PaymentStatus,
} from "@/interfaces/Transaction/TransactionPayment";

import TransactionDetailModal from "@/pages/admin/transactionManagement/TransactionDetailMoel";

const { RangePicker } = DatePicker;
const { Option } = Select;

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

type FiltersState = {
  userName: string;
  planName: string;
  status?: PaymentStatus | "";
  keyword: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  pageNumber: number;
  pageSize: number;
  sortColumn?: string;
  sortDescending?: boolean;
};

const defaultFilters: FiltersState = {
  userName: "",
  planName: "",
  status: "",
  keyword: "",
  paymentDateFrom: undefined,
  paymentDateTo: undefined,
  pageNumber: 1,
  pageSize: 10,
  sortColumn: "TransactionDateTime",
  sortDescending: true,
};

function formatCurrency(v: number | undefined | null, currency = "VND") {
  if (!v && v !== 0) return "—";
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${v.toLocaleString("vi-VN")} ${currency}`;
  }
}

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
      "bg-emerald-50 text-emerald-700 border-emerald-200";
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

function sortLabel(col: string, active: string | undefined, desc: boolean | undefined) {
  const isActive = active === col;
  return (
    <span className="inline-flex items-center gap-1 cursor-pointer select-none">
      <ArrowUpDown
        className={cn(
          "w-3.5 h-3.5",
          isActive ? "text-brand-500" : "text-slate-400"
        )}
      />
    </span>
  );
}

export default function TransactionListPage() {
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TransactionPaymentPagedSummaryResponse | null>(
    null
  );

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] =
    useState<TransactionPaymentDetailResponse | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAllTransactionForAdmin(filters);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.pageNumber,
    filters.pageSize,
    filters.status,
    filters.userName,
    filters.planName,
    filters.keyword,
    filters.paymentDateFrom,
    filters.paymentDateTo,
    filters.sortColumn,
    filters.sortDescending,
  ]);

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleSort = (col: string) => {
    setFilters((prev) => {
      const isSame = prev.sortColumn === col;
      return {
        ...prev,
        sortColumn: col,
        sortDescending: isSame ? !prev.sortDescending : true,
        pageNumber: 1,
      };
    });
  };

  const handleOpenDetail = async (row: TransactionPaymentListItem) => {
    setDetailId(row.id as unknown as string);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await getTransactionById(row.id);
      setDetail(res);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setFilters((prev) => ({
      ...prev,
      pageNumber: page,
      pageSize: pageSize ?? prev.pageSize,
    }));
  };

  const stats = useMemo(() => {
    if (!data) {
      return {
        revenue: 0,
        total: 0,
        success: 0,
        pending: 0,
        failed: 0,
      };
    }
    return {
      revenue: data.totalRevenue ?? 0,
      total: data.totalTransactions ?? data.totalCount ?? 0,
      success: data.totalSuccess ?? 0,
      pending: data.totalPending ?? 0,
      failed: (data as any).totalFailed ?? data.totalCancelled ?? 0,
    };
  }, [data]);

  return (
    <div className="space-y-5">
      {/* Header with icon */}
      <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-slate-900">
            Transaction Payments
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Monitor payment transactions, revenue and status over time.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          {/* Left: search / plan / status */}
          <div className="grid gap-3 md:grid-cols-3 flex-1">
            {/* Keyword */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">
                Search
              </span>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <Input
                  size="middle"
                  placeholder="Reference, description, order code..."
                  className="pl-7"
                  value={filters.keyword}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      keyword: e.target.value,
                      pageNumber: 1,
                    }))
                  }
                />
              </div>
            </div>

            {/* Plan name */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">
                Plan
              </span>
              <Input
                size="middle"
                placeholder="Plan name"
                value={filters.planName}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    planName: e.target.value,
                    pageNumber: 1,
                  }))
                }
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">
                Status
              </span>
              <div className="w-full md:max-w-[160px]">
                <Select
                  size="middle"
                  allowClear
                  placeholder="All"
                  value={filters.status || undefined}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value || "",
                      pageNumber: 1,
                    }))
                  }
                  className="w-full"
                >
                  <Option value="Pending">Pending</Option>
                  <Option value="Success">Success</Option>
                  <Option value="Failed">Failed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                  <Option value="Refunded">Refunded</Option>
                </Select>
              </div>
            </div>
          </div>

          {/* Right: date range + reset */}
          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">
                  Transaction date range
                </span>
                <RangePicker
                  allowEmpty={[true, true]}
                  showTime={false}
                  onChange={(values) => {
                    if (!values) {
                      setFilters((prev) => ({
                        ...prev,
                        paymentDateFrom: undefined,
                        paymentDateTo: undefined,
                        pageNumber: 1,
                      }));
                      return;
                    }
                    const [from, to] = values;
                    setFilters((prev) => ({
                      ...prev,
                      paymentDateFrom: from
                        ? from.startOf("day").toISOString()
                        : undefined,
                      paymentDateTo: to
                        ? to.endOf("day").toISOString()
                        : undefined,
                      pageNumber: 1,
                    }));
                  }}
                  placeholder={["From", "To"]}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Reset filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats: 2 totals (row 1) + 3 statuses (row 2) */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 space-y-3">
        {/* Row 1: totals */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Total revenue */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total revenue
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(stats.revenue)}
              </span>
            </div>
          </div>

          {/* Total transactions */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50">
              <CreditCard className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total transactions
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {stats.total.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: statuses (3 item thẳng hàng) */}
        <div className="flex flex-wrap gap-4 md:flex-nowrap">
          {/* Success */}
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Success
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {stats.success.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Pending */}
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
              <Clock3 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Pending
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {stats.pending.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Failed */}
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50">
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Failed
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {stats.failed.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays className="w-4 h-4" />
            <span>
              Result:{" "}
              <span className="font-medium text-slate-700">
                {data?.totalCount ?? 0}
              </span>{" "}
              transactions
            </span>
          </div>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
              <Spin />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr className="text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("TransactionDateTime")}
                      className="inline-flex items-center gap-1 hover:text-slate-700"
                    >
                      <span>Time</span>
                      {sortLabel(
                        "TransactionDateTime",
                        filters.sortColumn,
                        filters.sortDescending
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Plan</th>
                  <th className="px-4 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("Amount")}
                      className="inline-flex items-center gap-1 hover:text-slate-700"
                    >
                      <span>Amount</span>
                      {sortLabel(
                        "Amount",
                        filters.sortColumn,
                        filters.sortDescending
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left">Mode</th>
                  <th className="px-4 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("Status")}
                      className="inline-flex items-center gap-1 hover:text-slate-700"
                    >
                      <span>Status</span>
                      {sortLabel(
                        "Status",
                        filters.sortColumn,
                        filters.sortDescending
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left">Gateway</th>
                  <th className="px-4 py-2 text-left">Order code</th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.length ? (
                  data.items.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 cursor-pointer transition-colors"
                      onClick={() => handleOpenDetail(row)}
                    >
                      <td className="px-4 py-2 align-top whitespace-nowrap text-slate-700">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatDateTime(
                              row.transactionDateTime || row.createdAt
                            )}
                          </span>
                          {row.dueAt && (
                            <span className="text-[11px] text-slate-500">
                              Due: {formatDateTime(row.dueAt)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {row.userName ?? "—"}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            UserId: {row.userId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {row.planName ?? "—"}
                          </span>
                          {row.paymentModeSnapshot === "Installments" && (
                            <span className="text-[11px] text-slate-500">
                              Inst. {row.installmentIndex ?? "-"} /{" "}
                              {row.installmentTotal ?? "-"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(row.amount, row.currency)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {row.chargeUnitSnapshot} · {row.billingPeriodSnapshot}{" "}
                            x{row.periodCountSnapshot}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top">
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 border border-slate-100">
                          {row.paymentModeSnapshot}
                        </span>
                      </td>
                      <td className="px-4 py-2 align-top">
                        {statusTag(row.status)}
                      </td>
                      <td className="px-4 py-2 align-top">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-700">
                            {row.provider ?? "—"}
                          </span>
                          {row.paymentMethod && (
                            <span className="text-[11px] text-slate-500">
                              {row.paymentMethod}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top whitespace-nowrap">
                        <span className="text-xs font-mono text-slate-700">
                          {row.orderCode ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No transactions match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Page {filters.pageNumber} /{" "}
              {data?.pageSize && data?.totalCount
                ? Math.max(
                    1,
                    Math.ceil(data.totalCount / data.pageSize)
                  )
                : 1}
            </span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select
                size="small"
                value={filters.pageSize}
                onChange={(v) =>
                  handlePageChange(1, Number(v as number))
                }
                style={{ width: 80 }}
              >
                <Option value={10}>10</Option>
                <Option value={20}>20</Option>
                <Option value={50}>50</Option>
              </Select>
              <div className="flex items-center gap-1 ml-4">
                <button
                  type="button"
                  className="px-2 py-1 rounded-md border border-slate-200 text-xs disabled:opacity-50"
                  disabled={filters.pageNumber <= 1}
                  onClick={() =>
                    handlePageChange(filters.pageNumber - 1)
                  }
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-md border border-slate-200 text-xs disabled:opacity-50"
                  disabled={
                    !data ||
                    filters.pageNumber >=
                      Math.ceil(
                        (data.totalCount || 0) / filters.pageSize
                      )
                  }
                  onClick={() =>
                    handlePageChange(filters.pageNumber + 1)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <TransactionDetailModal
        open={!!detailId}
        loading={detailLoading}
        data={detail}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
