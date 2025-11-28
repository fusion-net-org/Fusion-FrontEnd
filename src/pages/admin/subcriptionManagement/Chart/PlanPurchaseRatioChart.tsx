/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import type { SubscriptionPlanPurchaseStatItem } from '@/interfaces/Transaction/TransactionPayment';

type Props = {
  data: SubscriptionPlanPurchaseStatItem[] | null;
  loading?: boolean;
};

const COLORS = ['#2563EB', '#F97316', '#22C55E', '#A855F7'];

const formatPercent = (v: number | undefined | null) => {
  if (!v) return '0%';
  return `${v.toFixed(1)}%`;
};

const formatCurrency = (v: number | null | undefined) => {
  if (!v) return '₫0';
  try {
    return new Intl.NumberFormat('vi-VN').format(v) + '₫';
  } catch {
    return `${v}₫`;
  }
};

const PlanPurchaseRatioChart: React.FC<Props> = ({ data, loading }) => {
  const rows = data ?? [];

  const chartData =
    rows.map((item, idx) => ({
      name: item.planName,
      value: item.percentage ?? 0,      // <<< dùng percentage
      raw: item,
      color: COLORS[idx % COLORS.length],
    })) ?? [];

  const totalPurchases = rows.reduce(
    (sum, x) => sum + (x.purchaseCount ?? 0),
    0
  );
  const totalRatio = chartData.reduce((sum, x) => sum + x.value, 0);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="m-0 text-sm font-semibold text-slate-900">
            Plan purchase ratio
          </h2>
        </div>

        {rows.length > 0 && (
          <div className="rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
            Total purchases:{' '}
            <span className="font-semibold text-slate-900">
              {totalPurchases}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
          Loading…
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
          No plan purchase data yet.
        </div>
      ) : (
        <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Donut chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any, _name, entry: any) => {
                    const v = Number(value || 0);
                    const raw: SubscriptionPlanPurchaseStatItem =
                      entry?.payload?.raw;
                    return [
                      `${formatPercent(v)} | ${raw.purchaseCount} orders | ${formatCurrency(
                        raw.totalAmount
                      )}`,
                      raw.planName,
                    ];
                  }}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  label={({ value }: any) =>
                    value > 0 ? `${value.toFixed(1)}%` : ''
                  }
                  labelLine={false}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* List summary bên phải */}
          <div className="space-y-1.5">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-800">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.raw.purchaseCount} purchases ·{' '}
                      {formatCurrency(item.raw.totalAmount)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-900">
                  {formatPercent(item.value)}
                </span>
              </div>
            ))}

            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              Total coverage:{' '}
              <span className="font-semibold text-slate-900">
                {formatPercent(totalRatio)}
              </span>
              <div>Sum of all ratio values from backend (should be 100%).</div>
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              Only active subscriptions of this company are listed here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanPurchaseRatioChart;
