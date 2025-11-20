import React, { useMemo } from "react";
import { Spin } from "antd";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";

import type {
  TransactionDailyCashflowResponse,
} from "@/interfaces/Transaction/TransactionPayment";

type Props = {
  data: TransactionDailyCashflowResponse | null;
  loading?: boolean;
  days?: number;
};

type ChartPoint = {
  date: string;
  label: string;
  revenue: number;
  count: number;
};

function formatCurrencyShort(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

const DailyCashflowChart: React.FC<Props> = ({ data, loading, days = 30 }) => {
  const chartData: ChartPoint[] = useMemo(() => {
    const items = data?.items ?? [];
    if (!items.length) return [];

    return items.map((it) => {
      const d = new Date(it.date);
      const label = `${d.getDate().toString().padStart(2, "0")}/${
        (d.getMonth() + 1).toString().padStart(2, "0")
      }`;

      return {
        date: it.date,
        label,
        revenue: it.revenue,
        count: it.successCount,
      };
    });
  }, [data]);

  const totalRevenue =
    data?.items?.reduce((s, x) => s + x.revenue, 0) ?? 0;
  const totalTx =
    data?.items?.reduce((s, x) => s + x.successCount, 0) ?? 0;

  const fromLabel = data?.from
    ? new Date(data.from).toLocaleDateString("vi-VN")
    : "";
  const toLabel = data?.to
    ? new Date(data.to).toLocaleDateString("vi-VN")
    : "";

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
              Daily cashflow
            </p>
            <p className="text-xs text-slate-500">
              Successful payment volume per day.
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] text-slate-500 space-y-0.5">
          <p className="font-semibold text-slate-600 mb-1">
            Last {days} days
          </p>
          {fromLabel && toLabel && (
            <p className="text-[11px]">
              {fromLabel} – {toLabel}
            </p>
          )}
          <p>
            Revenue:{" "}
            <span className="font-medium text-slate-700">
              {totalRevenue.toLocaleString("vi-VN")} VND
            </span>
          </p>
          <p>
            Success:{" "}
            <span className="font-medium text-slate-700">
              {totalTx.toLocaleString("vi-VN")} tx
            </span>
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
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="cashflowArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="label"
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
                formatter={(value: any) => {
                  const v = Number(value) || 0;
                  return [`${v.toLocaleString("vi-VN")} VND`, "Revenue"];
                }}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload as ChartPoint | undefined;
                  const tx = item?.count ?? 0;
                  return `Date: ${item?.label ?? ""} · ${tx} tx`;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#cashflowArea)"
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default DailyCashflowChart;
