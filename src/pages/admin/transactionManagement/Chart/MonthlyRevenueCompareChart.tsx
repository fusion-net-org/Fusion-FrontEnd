// src/components/admin/transactionManagement/Chart/MonthlyRevenueCompareChart.tsx

import React, { useMemo } from "react";
import { Spin } from "antd";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Activity } from "lucide-react";

import type {
  TransactionMonthlyRevenueThreeYearsResponse,
} from "@/interfaces/Transaction/TransactionPayment";

type Props = {
  data: TransactionMonthlyRevenueThreeYearsResponse | null;
  loading?: boolean;
};

type ChartPoint = {
  month: number;
  monthLabel: string;
  yMinus2: number;
  yMinus1: number;
  yCurrent: number;
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

const MonthlyRevenueCompareChart: React.FC<Props> = ({ data, loading }) => {
  const chartData: ChartPoint[] = useMemo(() => {
    if (!data) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        monthLabel: MONTH_LABELS[i],
        yMinus2: 0,
        yMinus1: 0,
        yCurrent: 0,
      }));
    }

    const items = data.items ?? [];
    const map = new Map<number, (typeof items)[number]>();
    items.forEach((it) => map.set(it.month, it));

    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const v = map.get(m);
      return {
        month: m,
        monthLabel: MONTH_LABELS[i],
        yMinus2: v?.yearMinus2Amount ?? 0,
        yMinus1: v?.yearMinus1Amount ?? 0,
        yCurrent: v?.yearAmount ?? 0,
      };
    });
  }, [data]);

  const y0 = data?.year ?? new Date().getFullYear();
  const y1 = data?.yearMinus1 ?? y0 - 1;
  const y2 = data?.yearMinus2 ?? y0 - 2;

  const totalY0 =
    data?.items?.reduce((s, x) => s + x.yearAmount, 0) ?? 0;
  const totalY1 =
    data?.items?.reduce((s, x) => s + x.yearMinus1Amount, 0) ?? 0;
  const totalY2 =
    data?.items?.reduce((s, x) => s + x.yearMinus2Amount, 0) ?? 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
            <Activity className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              3-year monthly revenue comparison
            </p>
            <p className="text-xs text-slate-500">
              Compare monthly cash-in across the last 3 years.
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] text-slate-500 space-y-0.5">
          <p className="font-semibold text-slate-600 mb-1">
            Total revenue by year
          </p>
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400 mr-1" />
            <span className="font-medium text-slate-700">{y2}</span>:{" "}
            {totalY2.toLocaleString("vi-VN")} VND
          </p>
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-sky-500 mr-1" />
            <span className="font-medium text-slate-700">{y1}</span>:{" "}
            {totalY1.toLocaleString("vi-VN")} VND
          </p>
          <p>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-1" />
            <span className="font-medium text-slate-700">{y0}</span>:{" "}
            {totalY0.toLocaleString("vi-VN")} VND
          </p>
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
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                tickFormatter={formatCurrencyShort}
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
                formatter={(value: any, name: any) => [
                  `${Number(value).toLocaleString("vi-VN")} VND`,
                  name,
                ]}
                labelFormatter={(label: any) => `Month: ${label}`}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-600">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="yMinus2"
                name={y2.toString()}
                stroke="#9ca3af"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="yMinus1"
                name={y1.toString()}
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="yCurrent"
                name={y0.toString()}
                stroke="#22c55e"
                strokeWidth={2.2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default MonthlyRevenueCompareChart;
