import React, { useMemo } from "react";
import { Spin } from "antd";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { SplitSquareHorizontal } from "lucide-react";

import type {
  TransactionPaymentModeInsightResponse,
} from "@/interfaces/Transaction/TransactionPayment";

type Props = {
  data: TransactionPaymentModeInsightResponse | null;
  loading?: boolean;
};

type ChartPoint = {
  key: string;
  label: string;
  totalAmount: number;
  transactionCount: number;
  successRate: number; // 0..1
};

const COLORS: string[] = ["#0ea5e9", "#22c55e", "#6366f1", "#f97316"];

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

const PaymentModeInsightChart: React.FC<Props> = ({ data, loading }) => {
  const chartData: ChartPoint[] = useMemo(() => {
    if (!data?.items?.length) return [];

    return data.items.map((m, idx) => {
      const total = m.transactionCount || 0;
      const successRate = total > 0 ? m.successCount / total : 0;

      const label =
        m.paymentMode?.toLowerCase() === "prepaid"
          ? "Prepaid"
          : m.paymentMode?.toLowerCase() === "installments"
          ? "Installments"
          : m.paymentMode || `Mode ${idx + 1}`;

      return {
        key: label,
        label,
        totalAmount: m.totalAmount,
        transactionCount: total,
        successRate,
      };
    });
  }, [data]);

  const totalRevenue =
    data?.items?.reduce((s, x) => s + x.totalAmount, 0) ?? 0;

  const displayYear = data?.year ?? new Date().getFullYear();

  const hasData = chartData.length > 0;

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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50">
            <SplitSquareHorizontal className="w-5 h-5 text-sky-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Payment mode insight
            </p>
            <p className="text-xs text-slate-500">
              Revenue share &amp; performance by payment mode ({displayYear}).
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-[2px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-slate-600">
                {hasData
                  ? `${chartData.length} payment modes • ${
                      data?.items?.reduce(
                        (s, x) => s + x.transactionCount,
                        0
                      ) ?? 0
                    } transactions`
                  : "No payment data in this year"}
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

      {/* Body */}
      <div className="flex flex-col items-stretch gap-6 md:flex-row">
        {/* Left: donut + legend */}
        <div className="flex w-full flex-col items-center gap-4 md:w-[40%]">
          <div className="relative h-56 w-full max-w-[260px]">
            {loading && !hasData ? (
              <div className="flex h-full items-center justify-center">
                <Spin />
              </div>
            ) : hasData ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="totalAmount"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={64}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.key}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        borderColor: "#e2e8f0",
                        boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                      }}
                      formatter={(value: any, _name: any, props: any) => {
                        const p = props?.payload as ChartPoint;
                        const total =
                          totalRevenue > 0
                            ? (p.totalAmount / totalRevenue) * 100
                            : 0;
                        return [
                          `${Number(value).toLocaleString("vi-VN")} VND (${total.toFixed(
                            1
                          )}%)`,
                          p.label,
                        ];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center label */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Total
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrencyShort(totalRevenue)} VND
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {displayYear}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-slate-400">
                  No data to visualize.
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          {hasData && (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px]">
              {chartData.map((m, idx) => {
                const color = COLORS[idx % COLORS.length];
                const share =
                  totalRevenue > 0
                    ? (m.totalAmount / totalRevenue) * 100
                    : 0;
                return (
                  <div
                    key={`legend-${m.key}`}
                    className="inline-flex items-center gap-2"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-slate-600">{m.label}</span>
                    <span className="font-medium text-slate-900">
                      {share.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: detail per mode */}
        <div className="flex-1 space-y-2">
          {loading && !hasData && (
            <div className="flex h-full items-center justify-center">
              <Spin />
            </div>
          )}

          {!loading && !hasData && (
            <p className="text-xs text-slate-500">
              No payment data for this year.
            </p>
          )}

          {chartData.map((m, idx) => {
            const color = COLORS[idx % COLORS.length];
            const successRatePercent = m.successRate * 100;
            const revenueShare =
              totalRevenue > 0
                ? (m.totalAmount / totalRevenue) * 100
                : 0;

            return (
              <div
                key={m.key}
                className={[
                  "flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60",
                  "px-3 py-2.5 md:flex-row md:items-center md:justify-between",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {idx + 1}
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

export default PaymentModeInsightChart;
