import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronRight as ArrowRight,
} from "lucide-react";
import StatusBadge from "@/components/MySubscription/StatusBadge";
import {
  type CompanySubscriptionListItem,
  type CompanySubscriptionPaged,
  type CompanySubscriptionQuery,
  type SubscriptionStatus,
} from "@/interfaces/CompanySubscription/CompanySubscription";
import { getCompanySubscriptionsByCompany } from "@/services/companySubscription.js";
import CompanySubscriptionDetailModal from "@/components/CompanySubscription/CompanySubscriptionDetailModal";

/* ===== Helpers ===== */
const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "--";

const CompanySubscriptionsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();

  /* Filters */
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus | "">("");
  const [sortColumn, setSortColumn] =
    useState<NonNullable<CompanySubscriptionQuery["SortColumn"]>>("expiredAt");
  const [sortDesc, setSortDesc] = useState(true);

  /* Paging */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* Data */
  const [items, setItems] = useState<CompanySubscriptionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  /* Detail modal */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  /* Fetch */
  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    const q: CompanySubscriptionQuery = {
      status: status || undefined,
      Keyword: keyword || undefined,
      PageNumber: page,
      PageSize: pageSize,
      SortColumn: sortColumn,
      SortDescending: sortDesc,
    };
    try {
      const data: CompanySubscriptionPaged = await getCompanySubscriptionsByCompany(
        companyId,
        q
      );
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(data?.totalCount ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, page, pageSize, sortColumn, sortDesc]);

  /* Handlers */
  const applyFilters = () => {
    setPage(1);
    fetchData();
  };
  const clearFilters = () => {
    setKeyword("");
    setStatus("");
    setSortColumn("expiredAt");
    setSortDesc(true);
    setPage(1);
    fetchData();
  };
  const handleSort = (
    key: NonNullable<CompanySubscriptionQuery["SortColumn"]>
  ) => {
    if (sortColumn === key) setSortDesc(!sortDesc);
    else {
      setSortColumn(key);
      setSortDesc(false);
    }
  };

  const SortMark: React.FC<{ active: boolean; desc: boolean }> = ({
    active,
    desc,
  }) => (
    <span
      className={`ml-1 inline-block text-xs ${
        active ? "text-slate-500" : "text-transparent"
      }`}
      aria-hidden
    >
      {desc ? "▼" : "▲"}
    </span>
  );

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">
          Company Subscriptions
        </h1>

        {/* Toolbar */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Keyword */}
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-600">
                Keyword
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                <Search className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo tên subscription..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                    if (e.key === "Escape") clearFilters();
                  }}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Status
                </label>
                <select
                  className="mt-1 h-9 w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="InActive">InActive</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex gap-2 md:ml-2">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Sort by
                  </label>
                  <select
                    className="mt-1 h-9 w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    value={sortColumn}
                    onChange={(e) => setSortColumn(e.target.value as any)}
                  >
                    <option value="expiredAt">ExpiredAt</option>
                    <option value="status">Status</option>
                    <option value="createdAt">CreatedAt</option>
                    <option value="nameSubscription">Name</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Order
                  </label>
                  <select
                    className="mt-1 h-9 w-28 rounded-lg border border-slate-300 bg-white px-2 text-sm"
                    value={String(sortDesc)}
                    onChange={(e) => setSortDesc(e.target.value === "true")}
                  >
                    <option value="false">Asc</option>
                    <option value="true">Desc</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 md:ml-2">
                <button
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={clearFilters}
                  title="Xóa bộ lọc (Esc)"
                >
                  Clear
                </button>
                <button
                  className="h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-sm font-semibold text-white shadow hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={applyFilters}
                  title="Áp dụng (Enter)"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {[
                  { key: "nameSubscription", label: "Name" },
                  { key: "status", label: "Status" },
                  { key: "createdAt", label: "Created at" },
                  { key: "expiredAt", label: "Expired at" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    <button
                      className="inline-flex items-center gap-1 hover:text-slate-800"
                    >
                      {col.label}
                      <SortMark
                        active={sortColumn === col.key}
                        desc={!!sortDesc}
                      />
                    </button>
                  </th>
                ))}
                <th className="w-40 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 w-28 rounded bg-slate-200/70" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Không có subscription nào.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {r.nameSubscription ?? "--"}
                      </div>
                      <div className="text-xs text-slate-500">
                        ID: {r.id.slice(0, 8)}…
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={r.status} />
                    </td>
                    <td className="px-4 py-3">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">{formatDate(r.expiredAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openDetail(r.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        title="View detail"
                      >
                        View detail
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page <b>{page}</b> / {totalPages} — {total} items
          </div>
          <div className="flex items-center gap-3">
            <select
              className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Prev page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <CompanySubscriptionDetailModal
        open={detailOpen}
        id={detailId}
        onClose={() => {
          setDetailOpen(false);
          setDetailId(null);
        }}
      />
    </div>
  );
};

export default CompanySubscriptionsPage;
