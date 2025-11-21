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
import { AlertTriangle } from "lucide-react";

import type {
  TransactionInstallmentAgingResponse,
} from "@/interfaces/Transaction/TransactionPayment";

type Props = {
  data: TransactionInstallmentAgingResponse | null;
  loading?: boolean;
};

type ChartPoint = {
  bucketKey: string;
  label: string;
  outstandingAmount: number;
  installmentCount: number;
};

const BUCKET_ORDER = ["NotDue", "1-7", "8-14", "15-30", "31-60", "60+"];

const BUCKET_META: Record<
  string,
  { label: string; color: string }
> = {
  NotDue: { label: "Not due", color: "#0ea5e9" },
  "1-7": { label: "1–7 days", color: "#22c55e" },
  "8-14": { label: "8–14 days", color: "#65a30d" },
  "15-30": { label: "15–30 days", color: "#f97316" },
  "31-60": { label: "31–60 days", color: "#fb923c" },
  "60+": { label: "> 60 days", color: "#ef4444" },
};

const cn = (...xs: Array<string | null | false | undefined>) =>
  xs.filter(Boolean).join(" ");

function formatCurrencyShort(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

const InstallmentAgingChart: React.FC<Props> = ({ data, loading }) => {
  const asOfLabel = data?.asOf
    ? new Date(data.asOf).toLocaleDateString("vi-VN")
    : "";

  const chartData: ChartPoint[] = useMemo(() => {
    if (!data?.items?.length) return [];

    const items = [...data.items];
    items.sort(
      (a, b) =>
        BUCKET_ORDER.indexOf(a.bucketKey) - BUCKET_ORDER.indexOf(b.bucketKey)
    );

    return items.map((it) => {
      const meta = BUCKET_META[it.bucketKey] ?? {
        label: it.bucketKey,
        color: "#64748b",
      };

      return {
        bucketKey: it.bucketKey,
        label: meta.label,
        outstandingAmount: it.outstandingAmount,
        installmentCount: it.installmentCount,
      };
    });
  }, [data]);

  const totalOutstanding = data?.totalOutstandingAmount ?? 0;
  const totalCount = data?.totalInstallments ?? 0;

  const overdueOutstanding =
    data?.items
      ?.filter((x) => x.bucketKey !== "NotDue")
      .reduce((s, x) => s + x.outstandingAmount, 0) ?? 0;

  const overdueCount =
    data?.items
      ?.filter((x) => x.bucketKey !== "NotDue")
      .reduce((s, x) => s + x.installmentCount, 0) ?? 0;

  const overdueRatio =
    totalOutstanding > 0 ? (overdueOutstanding / totalOutstanding) * 100 : 0;

  // Risk badge
  const riskLabel =
    overdueRatio >= 40
      ? "High risk"
      : overdueRatio >= 20
      ? "Medium risk"
      : "Low risk";

  const riskClass =
    overdueRatio >= 40
      ? "bg-rose-50 text-rose-600 border-rose-200"
      : overdueRatio >= 20
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100/70 text-amber-700 shadow-inner">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Installment aging / overdue
            </p>
            <p className="text-xs text-slate-500">
              Overdue tracking rate by day of group.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
          {asOfLabel && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px]">
              <span className="text-slate-500 mr-1">As of</span>
              <span className="font-medium text-slate-700">{asOfLabel}</span>
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
              riskClass
            )}
          >
            {riskLabel}
          </span>
        </div>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-white/80 border border-slate-100 px-3 py-2 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">
            Total outstanding
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {totalOutstanding.toLocaleString("vi-VN")}{" "}
            <span className="text-[11px] font-normal text-slate-500">VND</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {totalCount.toLocaleString("vi-VN")} installments
          </p>
        </div>
        <div className="rounded-xl bg-white/80 border border-slate-100 px-3 py-2 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">
            Overdue outstanding
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-700">
            {overdueOutstanding.toLocaleString("vi-VN")}{" "}
            <span className="text-[11px] font-normal text-slate-500">VND</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {overdueCount.toLocaleString("vi-VN")} overdue installments
          </p>
        </div>
        <div className="rounded-xl bg-white/80 border border-slate-100 px-3 py-2 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">
            Overdue ratio
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {overdueRatio.toFixed(1)}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Ratio to total outstanding
          </p>
        </div>
      </div>

      {/* Body: chart + legend */}
      <div className="flex flex-1 gap-4 min-h-[220px]">
        <div className="flex-1 h-60">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Spin />
            </div>
          ) : !hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
              <p className="font-medium text-slate-500">
                No installment data
              </p>
              <p>Please check your time filter or search conditions again.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
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
                    fontSize: 11,
                  }}
                  formatter={(value: any, _name: any, props: any) => {
                    const v = Number(value) || 0;
                    const p = props?.payload as ChartPoint | undefined;
                    const cnt = p?.installmentCount ?? 0;
                    return [
                      `${v.toLocaleString("vi-VN")} VND · ${cnt} installments`,
                      "Outstanding",
                    ];
                  }}
                  labelFormatter={(label: any) => `${label}`}
                />
                <Bar
                  dataKey="outstandingAmount"
                  name="Outstanding"
                  radius={[6, 6, 0, 0]}
                >
                  {chartData.map((entry, index) => {
                    const meta = BUCKET_META[entry.bucketKey] ?? {
                      color: "#64748b",
                    };
                    return (
                      <Cell
                        key={`cell-${entry.bucketKey}-${index}`}
                        fill={meta.color}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="w-40 shrink-0 border-l border-slate-100 pl-4">
          <p className="text-[11px] font-medium text-slate-500 mb-2">
            Buckets
          </p>
          <div className="space-y-2">
            {chartData.map((x) => {
              const meta = BUCKET_META[x.bucketKey] ?? {
                label: x.label,
                color: "#64748b",
              };
              return (
                <div
                  key={x.bucketKey}
                  className="flex flex-col gap-0.5 text-[11px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="font-medium text-slate-700">
                        {meta.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {x.installmentCount.toLocaleString("vi-VN")} pcs
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-4">
                    {x.outstandingAmount.toLocaleString("vi-VN")} VND
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallmentAgingChart;
