// src/pages/home/CompanySubscriptionsPage.tsx
import React from "react";
import { useParams } from "react-router-dom";
import { Spin, Popover, Switch, message } from "antd";

import {
  getCompanySubscriptionsByCompany,
  getCompanySubscriptionDetail,
  updateCompanySubscriptionStatus,
} from "@/services/companysubscription.js";

import type {
  CompanySubscriptionListResponse,
  CompanySubscriptionPagedResult,
  CompanySubscriptionStatus,
  CompanySubscriptionDetailResponse,
  CompanySubscriptionUpdateStatusRequest,
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
  if (s.includes("paused"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (s.includes("pending"))
    return "bg-sky-50 text-sky-700 border-sky-200";
  if (s.includes("expired") || s.includes("cancel"))
    return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

const Chip: React.FC<React.ComponentProps<"button"> & { active?: boolean }> = ({
  active,
  className = "",
  ...rest
}) => (
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

function isAutoMonthly(sub: { expiredAt?: string | null }) {
  return !sub.expiredAt;
}

/* =================== Popover helpers =================== */
function pickEntitlements(detail: any): any[] {
  if (!detail) return [];
  const candidates = [
    detail.entitlements,
    detail.Entitlements,
    detail.entitlementSnapshots,
    detail.EntitlementSnapshots,
    detail.features,
    detail.Features,
    detail.items,
    detail.Items,
  ];
  const arr = candidates.find((x) => Array.isArray(x));
  return Array.isArray(arr) ? arr : [];
}

function pickNumber(...vals: any[]): number | null {
  for (const v of vals) {
    if (v === null || v === undefined || v === "") continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function pickText(...vals: any[]): string | null {
  for (const v of vals) {
    if (typeof v !== "string") continue;
    const s = v.trim();
    if (s) return s;
  }
  return null;
}

function getEntitlementFields(e: any) {
  const featureId =
    e?.featureId ??
    e?.FeatureId ??
    e?.featureID ??
    e?.FeatureID ??
    e?.id ??
    e?.Id ??
    null;

  const name =
    pickText(
      e?.featureName,
      e?.FeatureName,
      e?.name,
      e?.Name,
      e?.featureCode,
      e?.FeatureCode,
      e?.code,
      e?.Code,
      e?.feature?.name,
      e?.feature?.Name,
      e?.feature?.code,
      e?.feature?.Code,
      e?.Feature?.name,
      e?.Feature?.Name,
      e?.Feature?.code,
      e?.Feature?.Code
    ) ?? (featureId ? String(featureId).slice(0, 8) : "Feature");

  const usesLeft = pickNumber(
    e?.usesLeft,
    e?.UsesLeft,
    e?.usesLeftThisMonth,
    e?.UsesLeftThisMonth,
    e?.remainingUses,
    e?.RemainingUses,
    e?.remainingInMonth,
    e?.RemainingInMonth,
    e?.monthlyRemaining,
    e?.MonthlyRemaining,
    e?.remainingThisMonth,
    e?.RemainingThisMonth,
    e?.remaining,
    e?.Remaining,
    e?.left,
    e?.Left
  );

  const used =
    pickNumber(
      e?.used,
      e?.Used,
      e?.usedCount,
      e?.UsedCount,
      e?.consumed,
      e?.Consumed,
      e?.monthlyUsed,
      e?.MonthlyUsed
    ) ?? 0;

  const limit = pickNumber(
    e?.limit,
    e?.Limit,
    e?.total,
    e?.Total,
    e?.quota,
    e?.Quota,
    e?.max,
    e?.Max,
    e?.monthlyLimit,
    e?.MonthlyLimit
  );

  const derivedRemaining =
    usesLeft !== null ? usesLeft : limit == null ? null : Math.max(0, limit - used);

  const unlimited = limit == null && usesLeft == null;

  return { name, usesLeft, used, limit, derivedRemaining, unlimited };
}
/* ================================================================ */

export default function CompanySubscriptionsPage() {
  const { companyId: routeCompanyId } = useParams<{ companyId: string }>();
  const companyId =
    routeCompanyId || localStorage.getItem("currentCompanyId") || undefined;

  const [items, setItems] = React.useState<CompanySubscriptionListResponse[]>([]);
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

  // toggle loading per row
  const [toggleLoadingMap, setToggleLoadingMap] = React.useState<Record<string, boolean>>({});

  // detail modal
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detail, setDetail] = React.useState<CompanySubscriptionDetailResponse | null>(null);

  // banner
  const [usageNoteVisible, setUsageNoteVisible] = React.useState(true);

  // cache detail for tooltip & modal
  const [detailCache, setDetailCache] = React.useState<Record<string, CompanySubscriptionDetailResponse>>({});
  const [tipLoadingMap, setTipLoadingMap] = React.useState<Record<string, boolean>>({});

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const summary = React.useMemo(() => {
    const active = items.filter((x) => (x.status || "").toLowerCase().includes("active")).length;
    const paused = items.filter((x) => (x.status || "").toLowerCase().includes("paused")).length;
    const pending = items.filter((x) => (x.status || "").toLowerCase().includes("pending")).length;
    const expired = items.filter((x) => (x.status || "").toLowerCase().includes("expired")).length;
    const cancelled = items.filter((x) => (x.status || "").toLowerCase().includes("cancel")).length;

    return { active, paused, pending, expired, cancelled, total: total || items.length };
  }, [items, total]);

  const fetchData = React.useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const sortColumn =
        sort === "status" ? "status" : sort === "expiredSoon" ? "expiredAt" : "createdAt";

      const sortDescending = sort === "newest";

      const params = {
        keyword: applied.q || undefined,
        status: applied.statuses.length === 1 ? applied.statuses[0] : undefined,
        pageNumber: page,
        pageSize,
        sortColumn,
        sortDescending,
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
  }, [companyId, applied, page, sort]);

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

  const openDetail = async (s: CompanySubscriptionListResponse) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);

    const cached = detailCache[s.id];
    if (cached) {
      setDetail(cached);
      setDetailLoading(false);
      return;
    }

    try {
      const res = await getCompanySubscriptionDetail(s.id);
      setDetail(res);
      if (res) setDetailCache((prev) => ({ ...prev, [s.id]: res }));
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

  const ensureDetailForTip = React.useCallback(
    async (id: string) => {
      if (!id) return;
      if (detailCache[id]) return;
      if (tipLoadingMap[id]) return;

      setTipLoadingMap((prev) => ({ ...prev, [id]: true }));
      try {
        const res = await getCompanySubscriptionDetail(id);
        if (res) setDetailCache((prev) => ({ ...prev, [id]: res }));
      } catch (e) {
        console.error("[CompanySubscriptions] tip load detail error:", e);
      } finally {
        setTipLoadingMap((prev) => ({ ...prev, [id]: false }));
      }
    },
    [detailCache, tipLoadingMap]
  );

  const renderUsagePopover = React.useCallback(
    (id: string) => {
      const d: any = detailCache[id];
      const isLoading = !!tipLoadingMap[id] && !d;

      if (isLoading) {
        return (
          <div className="min-w-[320px] py-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Spin size="small" /> Loading features...
            </div>
          </div>
        );
      }

      if (!d) {
        return (
          <div className="min-w-[320px] py-2 text-xs text-slate-600">
            Hover to load feature usage.
          </div>
        );
      }

      const ents = pickEntitlements(d);
      if (!ents || ents.length === 0) {
        return (
          <div className="min-w-[320px] py-2 text-xs text-slate-500">
            No feature usage data.
          </div>
        );
      }

      return (
        <div className="min-w-[360px] space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Features remaining
          </div>

          <div className="max-h-[260px] space-y-1 overflow-auto pr-1">
            {ents.map((e: any, idx: number) => {
              const { name, usesLeft, used, limit, derivedRemaining, unlimited } =
                getEntitlementFields(e);

              const remainingValue =
                unlimited ? null : usesLeft != null ? usesLeft : derivedRemaining;

              const remainText = unlimited
                ? "∞"
                : remainingValue === null
                  ? "—"
                  : remainingValue.toLocaleString("vi-VN");

              const isShowingRemaining = unlimited || remainingValue !== null;
              const isZero = !unlimited && remainingValue === 0;
              const numberClass = isZero
                ? "text-rose-600"
                : isShowingRemaining
                  ? "text-emerald-600"
                  : "text-slate-800";

              const fallbackUsageText = limit == null ? `${used}/∞` : `${used}/${limit}`;
              const rightText = unlimited || remainingValue !== null ? remainText : fallbackUsageText;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-slate-800">
                      {name}
                    </div>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold">
                    <span className={numberClass}>{rightText}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500">
            Note: remaining is read from subscription detail.
          </div>
        </div>
      );
    },
    [detailCache, tipLoadingMap]
  );

  // ON => Active, OFF => Paused
  const onToggle = React.useCallback(
    async (row: CompanySubscriptionListResponse, checked: boolean) => {
      if (!companyId) return;

      const id = String(row.id);
      const nextStatus = checked ? "Active" : "Paused";

      setToggleLoadingMap((m) => ({ ...m, [id]: true }));
      try {
        const payload: CompanySubscriptionUpdateStatusRequest = { status: nextStatus as any };
        await updateCompanySubscriptionStatus(companyId, id, payload);

        message.success(`Updated status to ${nextStatus}`);
        await fetchData(); // refresh because BE may auto pause other subscriptions
      } catch (e: any) {
        //  theo yêu cầu: update failed -> in message này
        message.error(
          "Only the company that owns the current subscription package or plan can update the package status"
        );
        await fetchData(); // revert UI to server truth
      } finally {
        setToggleLoadingMap((m) => ({ ...m, [id]: false }));
      }
    },
    [companyId, fetchData]
  );

  return (
    <>
      <div
        className="mx-auto w-full max-w-[1300px] px-6 pt-6 pb-16"
        style={{
          backgroundImage:
            "radial-gradient(900px 220px at 50% -70px, rgba(37,99,235,0.06), transparent 70%)",
        }}
      >
        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-500 px-7 py-5 text-white shadow-[0_18px_45px_rgba(37,99,235,0.35)]">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Company subscriptions</h1>
            <p className="text-sm text-blue-100">
              View and manage all subscriptions shared to this company.
            </p>
          </div>
        </div>

        {/* NOTE BANNER */}
        {usageNoteVisible && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-800 shadow-sm">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                How company subscriptions are used
              </p>
              <p className="mt-1 text-[13px] leading-snug">
                For this company, subscriptions are consumed automatically from the oldest active
                share to the newest. When an older subscription is fully used or expires, the
                system will automatically switch to the next available subscription — no manual
                changes are required.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUsageNoteVisible(false)}
              className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200"
              aria-label="Dismiss"
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* SUMMARY */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-medium text-emerald-800">
            Active: {summary.active}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-800">
            Paused: {summary.paused}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-xs font-medium text-sky-800">
            Pending: {summary.pending}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-xs font-medium text-rose-800">
            Expired: {summary.expired}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-700">
            Cancelled: {summary.cancelled}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-medium text-blue-800">
            Total: {summary.total}
          </div>
        </div>

        {/* FILTER */}
        <div className="mb-4 rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 shadow-[0_12px_35px_-18px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex w-full flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <input
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                placeholder="Search by plan or status..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
              <span className="mr-1 text-xs font-semibold text-slate-500">Sort:</span>
              <Chip active={sort === "newest"} onClick={() => setSort("newest")}>
                Newest
              </Chip>
              <Chip active={sort === "oldest"} onClick={() => setSort("oldest")}>
                Oldest
              </Chip>
              <Chip active={sort === "expiredSoon"} onClick={() => setSort("expiredSoon")}>
                Expired soon
              </Chip>
              <Chip active={sort === "status"} onClick={() => setSort("status")}>
                Status A–Z
              </Chip>
            </div>

            {/* Status */}
            <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
              <span className="mr-1 text-xs font-semibold text-slate-500">Status:</span>

              <Chip
                active={filters.statuses.length === 0}
                onClick={() => setFilters((f) => ({ ...f, statuses: [] as any }))}
              >
                All
              </Chip>

              {["Active", "Paused", "Pending", "Expired", "Cancelled"].map((s) => {
                const active = filters.statuses.includes(s as CompanySubscriptionStatus);
                return (
                  <Chip
                    key={s}
                    active={active}
                    onClick={() => {
                      setFilters((f) => {
                        const set = new Set(f.statuses);
                        if (set.has(s as CompanySubscriptionStatus)) set.delete(s as CompanySubscriptionStatus);
                        else set.add(s as CompanySubscriptionStatus);
                        return { ...f, statuses: Array.from(set) as CompanySubscriptionStatus[] };
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

        {/* TABLE */}
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
                Try adjusting filters or share a subscription from your personal plan.
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

                    {/* Action trước */}
                    <th className="px-5 py-3 text-right">Action</th>

                    {/* Enabled sau Action */}
                    <th className="px-5 py-3 pr-7 text-right">Enabled</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {items.map((s) => {
                    const autoMonth = isAutoMonthly(s);
                    const statusLower = (s.status || "").toLowerCase();

                    const canToggle =
                      statusLower.includes("active") || statusLower.includes("paused");
                    const checked = statusLower.includes("active");
                    const toggling = !!toggleLoadingMap[String(s.id)];

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3" />

                        {/* Plan + usage popover */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {s.planName || "(Unnamed plan)"}
                            </span>

                            <Popover
                              trigger="hover"
                              placement="rightTop"
                              mouseEnterDelay={0.15}
                              destroyTooltipOnHide
                              content={renderUsagePopover(String(s.id))}
                              onOpenChange={(open) => {
                                if (open) ensureDetailForTip(String(s.id));
                              }}
                            >
                              <button
                                type="button"
                                className={cn(
                                  "inline-flex h-6 w-6 items-center justify-center rounded-full",
                                  "border border-slate-200 bg-white text-slate-600",
                                  "hover:border-blue-300 hover:text-blue-700"
                                )}
                                aria-label="Feature usage"
                                title="Feature usage"
                              >
                                i
                              </button>
                            </Popover>
                          </div>
                        </td>

                        <td className="px-5 py-3">
                          <span className="text-xs text-slate-700">
                            {s.companyName || "(Unnamed company)"}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <span className="text-xs text-slate-700">{s.userName || "—"}</span>
                        </td>

                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                              statusTagClass(s.status || "")
                            )}
                          >
                            {s.status || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <span className="text-xs text-slate-700">{formatDate(s.sharedOn)}</span>
                        </td>

                        <td className="px-5 py-3">
                          {autoMonth ? (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                              Auto-month
                            </span>
                          ) : (
                            <span className="text-xs text-slate-700">{formatDate(s.expiredAt)}</span>
                          )}
                        </td>

                        <td className="px-5 py-3">
                          {s.seatsLimitSnapshot != null ? (
                            <span className="text-xs text-slate-700">
                              {s.seatsLimitSnapshot} seats
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Unlimited</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => openDetail(s)}
                            className={cn(
                              "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                              "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            View
                          </button>
                        </td>

                        {/* Enabled (sau Action) */}
                        <td className="px-5 py-3 pr-7 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Switch
                              checked={checked}
                              disabled={!canToggle || toggling}
                              loading={toggling}
                              onChange={(val) => onToggle(s, val)}
                            />
                            <span
                              className={cn(
                                "text-[11px] font-medium",
                                checked ? "text-emerald-700" : "text-amber-700"
                              )}
                            >
                              {checked ? "Active" : "Paused"}
                            </span>
                          </div>

                          {!canToggle && (
                            <div className="mt-1 text-[10px] text-slate-400 text-right">
                              Only Active/Paused can be changed
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 pb-5 pt-3">
                <span className="text-[11px] text-slate-500" />

                <div className="flex items-center gap-2 text-[13px]">
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs",
                      "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      page === 1 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {"|<"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs",
                      "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs",
                      "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
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
                      "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
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

      {/* Detail Modal */}
      <CompanySubscriptionDetailModal
        open={detailOpen}
        loading={detailLoading}
        data={detail}
        onClose={closeDetail}
      />
    </>
  );
}
