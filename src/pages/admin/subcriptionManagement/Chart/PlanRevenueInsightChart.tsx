/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { Spin } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Crown } from "lucide-react";

import type {
  TransactionPlanRevenueInsightResponse,
} from "@/interfaces/Transaction/TransactionPayment";

type Props = {
  data: TransactionPlanRevenueInsightResponse | null;
  loading?: boolean;
};

type ChartPoint = {
  planId: string;
  label: string;
  totalAmount: number;
  transactionCount: number;
  successCount: number;
  successRate: number; // 0..1
  rank: number;
};

const COLORS: string[] = ["#0ea5e9", "#22c55e", "#6366f1", "#f97316"];

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

const PlanRevenueInsightChart: React.FC<Props> = ({ data, loading }) => {
  const sortedItems = useMemo(() => {
    const items = data?.items ?? [];
    return [...items].sort((a, b) => b.totalAmount - a.totalAmount);
  }, [data]);

  const chartData: ChartPoint[] = useMemo(() => {
    if (!sortedItems.length) return [];

    return sortedItems.map((m, idx) => {
      const total = m.transactionCount || 0;
      const successRate = total > 0 ? m.successCount / total : 0;

      return {
        planId: m.planId,
        label: m.planName || `Plan ${idx + 1}`,
        totalAmount: m.totalAmount,
        transactionCount: total,
        successCount: m.successCount,
        successRate,
        rank: idx + 1,
      };
    });
  }, [sortedItems]);

  const totalRevenue =
    data?.items?.reduce((s, x) => s + x.totalAmount, 0) ?? 0;
  const totalTx =
    data?.items?.reduce((s, x) => s + x.transactionCount, 0) ?? 0;
  const totalSuccess =
    data?.items?.reduce((s, x) => s + x.successCount, 0) ?? 0;

  const overallSuccessRate = totalTx > 0 ? totalSuccess / totalTx : 0;
  const avgRevenuePerPlan =
    chartData.length > 0 ? totalRevenue / chartData.length : 0;

  const displayYear = data?.year ?? new Date().getFullYear();
  const hasData = chartData.length > 0;
  const topPlan = chartData[0];

  // Chỉ vẽ tối đa 6 plan trên chart cho gọn
  const chartTop = chartData.slice(0, 6);

  return (
    <div
      className={[
        "rounded-2xl border border-slate-100 bg-white",
        "shadow-[0_1px_1px_rgba(15,23,42,0.06),0_14px_40px_-18px_rgba(15,23,42,0.35)]",
        "p-4 md:p-6 flex flex-col gap-4 md:gap-6",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Revenue by plan
            </p>
            <p className="text-xs text-slate-500">
              Which plan brings in the most revenue during the year {displayYear}.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-[2px]">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span className="text-[11px] font-medium text-slate-600">
                {hasData
                  ? `${chartData.length} plans • ${totalTx} transactions`
                  : "No plan revenue data for this year"}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right text-[11px]">
          <p className="mb-1 text-xs font-semibold text-slate-600">
            Total revenue
          </p>
          <p className="text-xs font-semibold text-emerald-600">
            {totalRevenue.toLocaleString("vi-VN")} VND
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            ≈ {formatCurrencyShort(totalRevenue)} VND
          </p>
        </div>
      </div>

      {/* Overview stats row */}
      {hasData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Plans
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {chartData.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Transactions
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {totalTx}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Avg / plan
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {avgRevenuePerPlan.toLocaleString("vi-VN")} VND
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Success rate
            </p>
            <p className="text-sm font-semibold text-emerald-600">
              {(overallSuccessRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Top plan highlight */}
      {hasData && topPlan && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold text-white shadow-sm">
              #1
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900">
                Top earning plan: {topPlan.label}
              </span>
              <span className="text-[11px] text-slate-600">
                {topPlan.totalAmount.toLocaleString("vi-VN")} VND •{" "}
                {totalRevenue > 0
                  ? ((topPlan.totalAmount / totalRevenue) * 100).toFixed(1)
                  : "0.0"}
                % of total revenue
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 text-right">
            <p>
              {topPlan.transactionCount} tx •{" "}
              {(topPlan.successRate * 100).toFixed(1)}% success
            </p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-col items-stretch gap-6 md:flex-row">
        {/* Left: bar chart */}
        <div className="w-full md:w-[48%] h-64">
          {loading && !hasData ? (
            <div className="flex h-full items-center justify-center">
              <Spin />
            </div>
          ) : hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartTop}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 8, left: 88 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => formatCurrencyShort(Number(v))}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={88}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#e2e8f0",
                    boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                  }}
                  formatter={(value: any, _name: any, props: any) => {
                    const p = props?.payload as ChartPoint;
                    const share =
                      totalRevenue > 0
                        ? (p.totalAmount / totalRevenue) * 100
                        : 0;
                    return [
                      `${Number(value).toLocaleString(
                        "vi-VN"
                      )} VND (${share.toFixed(1)}%)`,
                      p.label,
                    ];
                  }}
                />
                <Bar
                  dataKey="totalAmount"
                  radius={6}
                  barSize={18}
                  // label nhỏ ở cuối bar
                  label={{
                    position: "right",
                    formatter: (v: any) =>
                      formatCurrencyShort(Number(v)),
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                >
                  {chartTop.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.planId}`}
                      fill={COLORS[(index % COLORS.length)]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-slate-400">
                No data to visualize.
              </p>
            </div>
          )}
        </div>

        {/* Right: ranking list */}
        <div className="flex-1 space-y-2">
          {loading && !hasData && (
            <div className="flex h-full items-center justify-center">
              <Spin />
            </div>
          )}

          {!loading && !hasData && (
            <p className="text-xs text-slate-500">
              No plan revenue data for this year.
            </p>
          )}

          {chartData.map((m) => {
            const color = COLORS[(m.rank - 1) % COLORS.length];
            const successRatePercent = m.successRate * 100;
            const revenueShare =
              totalRevenue > 0
                ? (m.totalAmount / totalRevenue) * 100
                : 0;
            const isTop3 = m.rank <= 3;

            return (
              <div
                key={m.planId}
                className={[
                  "flex flex-col gap-2 rounded-xl border px-3 py-2.5 md:flex-row md:items-center md:justify-between",
                  isTop3
                    ? "border-sky-100 bg-sky-50/70"
                    : "border-slate-100 bg-slate-50/60",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {m.rank}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900">
                      {m.label}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.transactionCount} tx •{" "}
                      {successRatePercent.toFixed(1)}% success
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex flex-1 flex-col gap-1 md:mt-0 md:items-end">
                  <div className="flex w-full items-center justify-between text-[11px] text-slate-500 md:w-auto md:justify-end md:gap-4">
                    <span>Revenue</span>
                    <span className="font-semibold text-slate-900">
                      {m.totalAmount.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between text-[11px] text-slate-500 md:w-auto md:justify-end md:gap-4">
                    <span>Share</span>
                    <span className="font-medium text-slate-900">
                      {revenueShare.toFixed(1)}%
                    </span>
                  </div>

                  {/* Success rate bar */}
                  <div className="mt-1 h-1.5 w-full max-w-[220px] rounded-full bg-slate-100 md:mt-1.5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(
                          4,
                          Math.min(successRatePercent, 100)
                        )}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlanRevenueInsightChart;
