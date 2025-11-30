/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { SubscriptionPlanPurchaseStatItem } from '@/interfaces/Transaction/TransactionPayment';

type Props = {
  data: SubscriptionPlanPurchaseStatItem[] | null;
  loading?: boolean;
};

const formatCurrency = (v: number | null | undefined) => {
  if (!v) return '₫0';
  try {
    return new Intl.NumberFormat('vi-VN').format(v) + '₫';
  } catch {
    return `${v}₫`;
  }
};

const formatRatio = (v: number | null | undefined) => {
  if (v == null || Number.isNaN(v)) return '—';
  return `${v.toFixed(1)}%`;
};

const PlanPurchaseStatsTable: React.FC<Props> = ({ data, loading }) => {
  const rows = data ?? [];

  const totalPurchase = rows.reduce(
    (sum, r) => sum + (r.purchaseCount ?? 0),
    0
  );
  const totalAmount = rows.reduce(
    (sum, r) => sum + (r.totalAmount ?? 0),
    0
  );

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {/* Header + summary */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-sm font-semibold text-slate-900">
            Plan purchase table
          </h2>
          <p className="m-0 text-xs text-slate-500">
            Historical purchase count and total amount per subscription plan.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className="rounded-full bg-slate-50 px-3 py-1">
            <span className="text-slate-500">Total purchases:</span>{' '}
            <span className="font-semibold text-slate-900">
              {totalPurchase}
            </span>
          </div>
          <div className="rounded-full bg-slate-50 px-3 py-1">
            <span className="text-slate-500">Total amount:</span>{' '}
            <span className="font-semibold text-slate-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-8 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-slate-400">
          No plan purchase data yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  #
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Plan
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">
                  Purchases
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">
                  Total amount
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">
                  Ratio
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                // hỗ trợ cả percentage (mới) và ratioPercent (cũ) để khỏi lỗi runtime
                const ratio =
                  (r as any).percentage ??
                  (r as any).ratioPercent ??
                  0;

                const ratioClamped = Math.max(
                  0,
                  Math.min(100, Number(ratio) || 0)
                );

                return (
                  <tr
                    key={r.planId ?? `${idx}-${r.planName}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-3 py-2 text-slate-500">
                      {idx + 1}
                      {r.isOther && (
                        <span className="ml-1 rounded bg-slate-200 px-1.5 py-[1px] text-[10px] font-medium text-slate-600">
                          Other
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-medium text-slate-900">
                        {r.isOther ? 'Other plans' : r.planName}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900">
                      {r.purchaseCount}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900">
                      {formatCurrency(r.totalAmount)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${ratioClamped}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-900">
                          {formatRatio(Number(ratio))}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-2 text-[11px] text-slate-500">
        Only active subscriptions of this company are listed here.
      </p>
    </div>
  );
};

export default PlanPurchaseStatsTable;
