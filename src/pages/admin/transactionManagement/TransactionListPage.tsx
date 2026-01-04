// src/pages/admin/TransactionListPage.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCcw,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  DollarSign,
  CalendarDays,
  Eye,
  ArrowUpDown,
  User2,
  Package,
  Landmark,
} from "lucide-react";
import { Button, DatePicker, Input, Select, Spin, Table, Tag, Tooltip, message } from "antd";

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
    return `${Number(v).toLocaleString("vi-VN")} ${currency}`;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
}

function shortId(id?: string | null) {
  if (!id) return "—";
  return `${id.slice(0, 8)}…`;
}

function statusMeta(status: PaymentStatus) {
  const s = String(status || "").toLowerCase();

  // default
  let tagColor: any = "default";
  let pillClass =
    "bg-slate-100 text-slate-700 border border-slate-200";
  let icon: React.ReactNode = <Clock3 className="w-3.5 h-3.5" />;

  if (s.includes("success") || s.includes("succeed") || s.includes("completed")) {
    tagColor = "success";
    pillClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
  } else if (s.includes("pending")) {
    tagColor = "warning";
    pillClass = "bg-amber-50 text-amber-700 border border-amber-200";
    icon = <Clock3 className="w-3.5 h-3.5" />;
  } else if (s.includes("cancel") || s.includes("fail") || s.includes("refund")) {
    tagColor = "error";
    pillClass = "bg-rose-50 text-rose-700 border border-rose-200";
    icon = <XCircle className="w-3.5 h-3.5" />;
  }

  return { tagColor, pillClass, icon };
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const m = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        m.pillClass
      )}
    >
      {m.icon}
      <span>{status}</span>
    </span>
  );
}

function termLabel(row: any) {
  const bp = row?.billingPeriodSnapshot;
  const pc = row?.periodCountSnapshot;

  if (!bp || pc == null) return "—";

  const unit =
    String(bp).toLowerCase().includes("year")
      ? pc === 1
        ? "year"
        : "years"
      : pc === 1
      ? "month"
      : "months";

  return `${pc} ${unit}`;
}

function mapSortField(field?: string) {
  // map field -> BE sortColumn
  if (!field) return undefined;

  switch (field) {
    case "transactionDateTime":
      return "TransactionDateTime";
    case "amount":
      return "Amount";
    case "status":
      return "Status";
    default:
      return "TransactionDateTime";
  }
}

export default function TransactionListPage() {
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TransactionPaymentPagedSummaryResponse | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<TransactionPaymentDetailResponse | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAllTransactionForAdmin(filters);
      setData(res || null);
    } catch (e: any) {
      message.error(e?.message || "Failed to load transactions");
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

  const handleResetFilters = () => setFilters(defaultFilters);

  const handleOpenDetail = async (row: TransactionPaymentListItem) => {
    setDetailId(row.id as unknown as string);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await getTransactionById(row.id);
      setDetail(res);
    } catch (e: any) {
      message.error(e?.message || "Cannot load transaction detail");
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  const stats = useMemo(() => {
    if (!data) {
      return { revenue: 0, total: 0, success: 0, pending: 0, failed: 0 };
    }
    return {
      revenue: data.totalRevenue ?? 0,
      total: data.totalTransactions ?? data.totalCount ?? 0,
      success: data.totalSuccess ?? 0,
      pending: data.totalPending ?? 0,
      failed: (data as any).totalFailed ?? data.totalCancelled ?? 0,
    };
  }, [data]);

  const columns = useMemo(() => {
    const sortOrder = (col: string) => {
      if (filters.sortColumn !== col) return undefined;
      return filters.sortDescending ? "descend" : "ascend";
    };

    return [
      {
        title: (
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            Time
          </span>
        ),
        dataIndex: "transactionDateTime",
        key: "transactionDateTime",
        sorter: true,
        sortOrder: sortOrder("TransactionDateTime"),
        width: 220,
        render: (_: any, row: any) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">
              {formatDateTime(row.transactionDateTime || row.createdAt)}
            </span>
            {row.dueAt ? (
              <span className="text-[11px] text-slate-500">
                Due: {formatDateTime(row.dueAt)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">—</span>
            )}
          </div>
        ),
      },
      {
        title: (
          <span className="inline-flex items-center gap-2">
            <User2 className="w-4 h-4 text-slate-400" />
            Customer
          </span>
        ),
        key: "customer",
        width: 240,
        render: (_: any, row: any) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">
              {row.userName ?? "—"}
            </span>
          </div>
        ),
      },
      {
        title: (
          <span className="inline-flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            Subscription
          </span>
        ),
        key: "subscription",
        render: (_: any, row: any) => {
          const isInstallments = String(row.paymentModeSnapshot || "").toLowerCase().includes("install");
          const term = termLabel(row);

          return (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">
                  {row.planName ?? "—"}
                </span>

                {row.paymentModeSnapshot && (
                  <Tag className="m-0" color={isInstallments ? "geekblue" : "blue"}>
                    {row.paymentModeSnapshot}
                  </Tag>
                )}

                <Tag className="m-0" color="cyan">
                  {term}
                </Tag>

                {row.chargeUnitSnapshot && (
                  <Tag className="m-0" color="default">
                    {row.chargeUnitSnapshot}
                  </Tag>
                )}
              </div>

              {isInstallments ? (
                <div className="text-[11px] text-slate-500">
                  Installment{" "}
                  <span className="font-medium text-slate-700">
                    {row.installmentIndex ?? "—"}
                  </span>{" "}
                  /{" "}
                  <span className="font-medium text-slate-700">
                    {row.installmentTotal ?? "—"}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">—</div>
              )}
            </div>
          );
        },
      },
      {
        title: (
          <span className="inline-flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            Amount
          </span>
        ),
        dataIndex: "amount",
        key: "amount",
        sorter: true,
        sortOrder: sortOrder("Amount"),
        width: 200,
        render: (_: any, row: any) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">
              {formatCurrency(row.amount, row.currency)}
            </span>
            <span className="text-[11px] text-slate-500">
              {row.billingPeriodSnapshot ? (
                <>
                  {row.billingPeriodSnapshot} × {row.periodCountSnapshot}
                </>
              ) : (
                "—"
              )}
            </span>
          </div>
        ),
      },
      {
        title: (
          <span className="inline-flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            Status
          </span>
        ),
        dataIndex: "status",
        key: "status",
        sorter: true,
        sortOrder: sortOrder("Status"),
        width: 170,
        render: (v: PaymentStatus) => <StatusPill status={v} />,
      },
      {
        title: (
          <span className="inline-flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-400" />
            Gateway / Order
          </span>
        ),
        key: "gateway",
        width: 240,
        render: (_: any, row: any) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                {row.provider ?? "—"}
              </span>
              {row.paymentMethod && (
                <Tag className="m-0" color="default">
                  {row.paymentMethod}
                </Tag>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              Order: <span className="font-mono text-slate-700">{row.orderCode ?? "—"}</span>
            </span>
          </div>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 70,
        render: (_: any, row: any) => (
          <Tooltip title="View detail">
            <Button
              type="text"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail(row);
              }}
              icon={<Eye size={16} />}
            />
          </Tooltip>
        ),
      },
    ];
  }, [filters.sortColumn, filters.sortDescending]);

  return (
    <div className="space-y-6">
      {/* ===== Hero Header ===== */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-sky-600 px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="m-0 text-xl font-semibold text-white">
                  Transaction Payments
                </h1>
                <p className="m-0 text-[12px] text-white/80">
                  Monitor revenue, subscription snapshots, and payment status.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="border-white/30 bg-white/10 text-white hover:!bg-white/15 hover:!text-white"
                icon={<RefreshCcw size={16} />}
                onClick={loadData}
              >
                Refresh
              </Button>
              <Button
                className="bg-white text-indigo-700 hover:!bg-white hover:!text-indigo-700"
                onClick={handleResetFilters}
              >
                Reset filters
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <div className="text-[11px] text-white/70">Total revenue</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(stats.revenue)}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <div className="text-[11px] text-white/70">Transactions</div>
              <div className="text-lg font-semibold text-white">
                {stats.total.toLocaleString("vi-VN")}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <div className="text-[11px] text-white/70">Success</div>
              <div className="text-lg font-semibold text-white">
                {stats.success.toLocaleString("vi-VN")}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <div className="text-[11px] text-white/70">Pending</div>
              <div className="text-lg font-semibold text-white">
                {stats.pending.toLocaleString("vi-VN")}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <div className="text-[11px] text-white/70">Failed</div>
              <div className="text-lg font-semibold text-white">
                {stats.failed.toLocaleString("vi-VN")}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Filters ===== */}
        <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Keyword</span>
              <Input
                prefix={<Search className="w-4 h-4 text-slate-400" />}
                placeholder="Reference / description / order code..."
                value={filters.keyword}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, keyword: e.target.value, pageNumber: 1 }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">User</span>
              <Input
                prefix={<User2 className="w-4 h-4 text-slate-400" />}
                placeholder="User name"
                value={filters.userName}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, userName: e.target.value, pageNumber: 1 }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Plan</span>
              <Input
                prefix={<Package className="w-4 h-4 text-slate-400" />}
                placeholder="Plan name"
                value={filters.planName}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, planName: e.target.value, pageNumber: 1 }))
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Status</span>
              <Select
                allowClear
                placeholder="All"
                value={filters.status || undefined}
                onChange={(value) =>
                  setFilters((p) => ({ ...p, status: (value as PaymentStatus) || "", pageNumber: 1 }))
                }
              >
                <Option value="Pending">Pending</Option>
                <Option value="Success">Success</Option>
                <Option value="Failed">Failed</Option>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Date range</span>
              <RangePicker
                allowEmpty={[true, true]}
                onChange={(values) => {
                  if (!values) {
                    setFilters((p) => ({
                      ...p,
                      paymentDateFrom: undefined,
                      paymentDateTo: undefined,
                      pageNumber: 1,
                    }));
                    return;
                  }
                  const [from, to] = values as any; // dayjs
                  setFilters((p) => ({
                    ...p,
                    paymentDateFrom: from ? from.startOf("day").toISOString() : undefined,
                    paymentDateTo: to ? to.endOf("day").toISOString() : undefined,
                    pageNumber: 1,
                  }));
                }}
                placeholder={["From", "To"]}
              />
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            Tip: Click a row (or the eye icon) to view transaction detail.
          </div>
        </div>

        {/* ===== Table ===== */}
        <div className="px-3 pb-4 pt-3">
          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns as any}
              dataSource={data?.items ?? []}
              size="middle"
              pagination={{
                current: filters.pageNumber,
                pageSize: filters.pageSize,
                total: data?.totalCount ?? 0,
                showSizeChanger: true,
                onChange: (page, pageSize) =>
                  setFilters((p) => ({ ...p, pageNumber: page, pageSize })),
              }}
              onRow={(row: any) => ({
                onClick: () => handleOpenDetail(row),
              })}
              onChange={(pagination: any, _f: any, sorter: any) => {
                const s = Array.isArray(sorter) ? sorter[0] : sorter;
                const order = s?.order; // "ascend" | "descend" | undefined
                const field = s?.field || s?.columnKey;

                // pagination first
                const nextPage = pagination?.current ?? 1;
                const nextSize = pagination?.pageSize ?? filters.pageSize;

                if (!order) {
                  setFilters((p) => ({
                    ...p,
                    pageNumber: nextPage,
                    pageSize: nextSize,
                  }));
                  return;
                }

                setFilters((p) => ({
                  ...p,
                  pageNumber: nextPage,
                  pageSize: nextSize,
                  sortColumn: mapSortField(field),
                  sortDescending: order === "descend",
                }));
              }}
            />
          </Spin>
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
