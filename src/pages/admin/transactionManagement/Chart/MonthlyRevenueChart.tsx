// src/components/admin/transactions/MonthlyRevenueChart.tsx

import React, { useMemo } from "react";
import { Spin } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, ArrowUpRight } from "lucide-react";

import type { TransactionMonthlyRevenueResponse } from "@/interfaces/Transaction/TransactionPayment";

type MonthlyRevenueChartProps = {
  data: TransactionMonthlyRevenueResponse | null;
  loading?: boolean;
};

type ChartPoint = {
  monthLabel: string;
  month: number;
  totalAmount: number;
  transactionCount: number;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({
  data,
  loading,
}) => {
  const chartData: ChartPoint[] = useMemo(() => {
    if (!data) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        monthLabel: MONTH_LABELS[i],
        totalAmount: 0,
        transactionCount: 0,
      }));
    }

    const items = data.items ?? [];
    const byMonth = new Map<number, { totalAmount: number; transactionCount: number }>();
    items.forEach((it) => {
      byMonth.set(it.month, {
        totalAmount: it.totalAmount,
        transactionCount: it.transactionCount,
      });
    });

    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const v = byMonth.get(m) ?? { totalAmount: 0, transactionCount: 0 };
      return {
        month: m,
        monthLabel: MONTH_LABELS[i],
        totalAmount: v.totalAmount,
        transactionCount: v.transactionCount,
      };
    });
  }, [data]);

  const totalRevenue = data?.items?.reduce(
    (sum, x) => sum + x.totalAmount,
    0
  ) ?? 0;

  const totalTx = data?.items?.reduce(
    (sum, x) => sum + x.transactionCount,
    0
  ) ?? 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Monthly cash-in
            </p>
            <p className="text-xs text-slate-500">
              Successful payment volume by month ·{" "}
              <span className="font-medium">
                {data?.year ?? new Date().getFullYear()}
              </span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1 justify-end">
            Total revenue
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {totalRevenue.toLocaleString("vi-VN")} VND
          </p>
          <p className="text-[11px] text-slate-500">
            {totalTx.toLocaleString("vi-VN")} transactions
          </p>
        </div>
      </div>

      {/* Legend pills (custom, nhìn finance hơn) */}
      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 border border-emerald-100">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-emerald-700">
            Revenue (VND)
          </span>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 border border-teal-100">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
          <span className="font-medium text-teal-700">
            Transactions (count)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Spin />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#bbf7d0" stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatCurrencyShort}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#e2e8f0",
                  boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                }}
                formatter={(value: any, name: any) => {
                  if (name === "Revenue") {
                    return [
                      `${Number(value).toLocaleString("vi-VN")} VND`,
                      "Revenue",
                    ];
                  }
                  return [value, "Transactions"];
                }}
                labelFormatter={(label: any) => `Month: ${label}`}
              />
              <Legend
                verticalAlign="top"
                height={0} // ẩn Legend default, dùng pills custom phía trên
              />
              <Bar
                yAxisId="left"
                dataKey="totalAmount"
                name="Revenue"
                radius={[6, 6, 0, 0]}
                fill="url(#revenueGradient)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="transactionCount"
                name="Transactions"
                stroke="#0f766e"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1, stroke: "#0f766e", fill: "#ecfeff" }}
                activeDot={{ r: 4 }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default MonthlyRevenueChart;
