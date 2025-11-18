// src/pages/home/CompanySubscriptionsPage.tsx
import React from "react";
import { useParams } from "react-router-dom";
import { Search, Layers, Eye } from "lucide-react";
import { Spin } from "antd";

import {
  getCompanySubscriptionsByCompany,
  getCompanySubscriptionDetail,
} from "@/services/companysubscription.js";

import type {
  CompanySubscriptionListResponse,
  CompanySubscriptionPagedResult,
  CompanySubscriptionStatus,
  CompanySubscriptionDetailResponse,
} from "@/interfaces/CompanySubscription/CompanySubscription";

import CompanySubscriptionDetailModal from "@/pages/home/SubscriptionDetailModel";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function statusTagClass(status: CompanySubscriptionStatus | string) {
  const s = (status || "").toLowerCase();
  if (s.includes("active"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("pending"))
    return "bg-sky-50 text-sky-700 border-sky-200";
  if (s.includes("expired") || s.includes("cancel"))
    return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

const Chip: React.FC<
  React.ComponentProps<"button"> & { active?: boolean }
> = ({ active, className = "", ...rest }) => (
  <button
    {...rest}
    className={[
      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition",
      active
        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      className,
    ].join(" ")}
  />
);

type SortPreset = "newest" | "oldest" | "expiredSoon" | "status";

export default function CompanySubscriptionsPage() {
  const { companyId: routeCompanyId } = useParams<{ companyId: string }>();
  const companyId =
    routeCompanyId || localStorage.getItem("currentCompanyId") || undefined;

  const [items, setItems] = React.useState<CompanySubscriptionListResponse[]>(
    []
  );
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [filters, setFilters] = React.useState<{
    q: string;
    statuses: CompanySubscriptionStatus[];
  }>({ q: "", statuses: [] });
  const [applied, setApplied] = React.useState(filters);
  const [sort, setSort] = React.useState<SortPreset>("newest");
  const [loading, setLoading] = React.useState(false);

  // ===== DETAIL MODAL STATE =====
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detail, setDetail] =
    React.useState<CompanySubscriptionDetailResponse | null>(null);

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  // summary nhỏ giống Partner page
  const summary = React.useMemo(() => {
    const active = items.filter((x) =>
      (x.status || "").toLowerCase().includes("active")
    ).length;
    const pending = items.filter((x) =>
      (x.status || "").toLowerCase().includes("pending")
    ).length;
    const expired = items.filter((x) =>
      (x.status || "").toLowerCase().includes("expired")
    ).length;
    const cancelled = items.filter((x) =>
      (x.status || "").toLowerCase().includes("cancel")
    ).length;
    return {
      active,
      pending,
      expired,
      cancelled,
      total: total || items.length,
    };
  }, [items, total]);

  const fetchData = React.useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params = {
        keyword: applied.q || undefined,
        status:
          applied.statuses.length === 1 ? applied.statuses[0] : undefined,
        pageNumber: page,
        pageSize,
        sortColumn:
          sort === "status"
            ? "status"
            : sort === "expiredSoon"
            ? "expiredAt"
            : "createdAt",
        sortDescending: sort === "newest", // newest desc, oldest asc
      } as any;

      const res: CompanySubscriptionPagedResult | null =
        await getCompanySubscriptionsByCompany(companyId, params);

      const list = res?.items ?? [];
      setItems(list);
      setTotal(res?.totalCount ?? list.length);
    } catch (e) {
      console.error("[CompanySubscriptions] load error:", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [companyId, applied, page, pageSize, sort]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyFilters = () => {
    setApplied(filters);
    setPage(1);
  };

  const resetFilters = () => {
    const f = { q: "", statuses: [] as CompanySubscriptionStatus[] };
    setFilters(f);
    setApplied(f);
    setPage(1);
  };

  // ===== OPEN DETAIL (CALL API + SHOW MODAL) =====
  const openDetail = async (s: CompanySubscriptionListResponse) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await getCompanySubscriptionDetail(s.id);
      setDetail(res);
    } catch (e) {
      console.error("[CompanySubscriptions] load detail error:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
  };

  return (
    <>
      <div
        className="mx-auto w-full max-w-[1300px] px-6 pt-6 pb-16"
        style={{
          backgroundImage:
            "radial-gradient(900px 220px at 50% -70px, rgba(37,99,235,0.06), transparent 70%)",
        }}
      >
        {/* HEADER BANNER */}
        <div className="mb-5 flex items-center justify-between rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-500 px-7 py-5 text-white shadow-[0_18px_45px_rgba(37,99,235,0.35)]">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Company subscriptions
              </h1>
              <p className="text-sm text-blue-100">
                View and manage all subscriptions shared to this company.
              </p>
            </div>
          </div>
        </div>

        {/* SUMMARY CHIPS */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Active: {summary.active}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Pending: {summary.pending}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-xs font-medium text-rose-800">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Expired: {summary.expired}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Cancelled: {summary.cancelled}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium text-blue-800">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Total: {summary.total}
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="mb-4 rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 shadow-[0_12px_35px_-18px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex w-full flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={filters.q}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, q: e.target.value }))
                }
                placeholder="Search by plan or status..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={applyFilters}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                onClick={resetFilters}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            {/* Sort */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold text-slate-500">
                Sort:
              </span>
              <Chip
                active={sort === "newest"}
                onClick={() => setSort("newest")}
              >
                Newest
              </Chip>
              <Chip
                active={sort === "oldest"}
                onClick={() => setSort("oldest")}
              >
                Oldest
              </Chip>
              <Chip
                active={sort === "expiredSoon"}
                onClick={() => setSort("expiredSoon")}
              >
                Expired soon
              </Chip>
              <Chip
                active={sort === "status"}
                onClick={() => setSort("status")}
              >
                Status A–Z
              </Chip>
            </div>

            {/* Status */}
            <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
              <span className="mr-1 text-xs font-semibold text-slate-500">
                Status:
              </span>
              <Chip
                active={filters.statuses.length === 0}
                onClick={() =>
                  setFilters((f) => ({ ...f, statuses: [] as any }))
                }
              >
                All
              </Chip>
              {["Active", "Pending", "Expired", "Cancelled"].map((s) => {
                const active = filters.statuses.includes(
                  s as CompanySubscriptionStatus
                );
                return (
                  <Chip
                    key={s}
                    active={active}
                    onClick={() => {
                      setFilters((f) => {
                        const set = new Set(f.statuses);
                        if (set.has(s as CompanySubscriptionStatus))
                          set.delete(s as CompanySubscriptionStatus);
                        else set.add(s as CompanySubscriptionStatus);
                        return {
                          ...f,
                          statuses: Array.from(
                            set
                          ) as CompanySubscriptionStatus[],
                        };
                      });
                    }}
                  >
                    {s}
                  </Chip>
                );
              })}
            </div>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white/95 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.55)]">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Spin />
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-1 text-sm font-semibold text-slate-700">
                No subscriptions available.
              </div>
              <div className="text-xs text-slate-500">
                Try adjusting filters or share a subscription from your personal
                plan.
              </div>
            </div>
          ) : (
            <>
              <table className="min-w-full text-sm">
                <thead className="bg-[#F3F7FF] text-[11px] font-semibold uppercase tracking-wide text-[#175CD3]">
                  <tr>
                    <th className="w-10 px-5 py-3 text-left" />
                    <th className="px-5 py-3 text-left">Plan</th>
                    <th className="px-5 py-3 text-left">Company</th>
                    <th className="px-5 py-3 text-left">Shared by</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Shared on</th>
                    <th className="px-5 py-3 text-left">Expired at</th>
                    <th className="px-5 py-3 text-left">Seat limit</th>
                    <th className="px-5 py-3 pr-7 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {items.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3" />
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-slate-900">
                          {s.planName || "(Unnamed plan)"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-700">
                          {s.companyName || "(Unnamed company)"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-700">
                          {s.userName || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                            statusTagClass(s.status)
                          )}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-700">
                          {formatDate(s.sharedOn)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-700">
                          {formatDate(s.expiredAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {s.seatsLimitSnapshot != null ? (
                          <span className="text-xs text-slate-700">
                            {s.seatsLimitSnapshot} seats
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Unlimited
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 pr-7 text-right">
                        {/* Nút con mắt: nền trắng, viền xám nhạt, icon xám */}
                        <button
                          onClick={() => openDetail(s)}
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-full border text-slate-400",
                            "border-slate-200 bg-white hover:border-slate-300 hover:text-slate-600"
                          )}
                          aria-label="View detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination giống Members */}
              <div className="flex items-center justify-between px-6 pb-5 pt-3">
                <span className="text-[11px] text-slate-500">

                </span>

                <div className="flex items-center gap-2 text-[13px]">
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs",
                      "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-500",
                      page === 1 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {"|<"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => Math.max(1, p - 1))
                    }
                    disabled={page === 1}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs",
                      "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-500",
                      page === 1 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {"<"}
                  </button>
                  <div className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg border border-blue-300 bg-[#E5F0FF] px-3 text-xs font-semibold text-[#1D4ED8]">
                    {page}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(totalPages, p + 1)
                      )
                    }
                    disabled={page === totalPages}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs",
                      "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-500",
                      page === totalPages && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {">"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs",
                      "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-500",
                      page === totalPages && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {">|"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      <CompanySubscriptionDetailModal
        open={detailOpen}
        loading={detailLoading}
        data={detail}
        onClose={closeDetail}
      />
    </>
  );
}
