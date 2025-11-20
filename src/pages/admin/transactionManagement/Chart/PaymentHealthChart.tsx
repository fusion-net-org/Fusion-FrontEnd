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
} from "recharts";
import { ShieldCheck } from "lucide-react";

import type {
  TransactionMonthlyStatusResponse,
} from "@/interfaces/Transaction/TransactionPayment";

type Props = {
  data: TransactionMonthlyStatusResponse | null;
  loading?: boolean;
};

type ChartPoint = {
  month: number;
  monthLabel: string;
  success: number;
  pending: number;
  failed: number;
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const successColor = "#16a34a"; // emerald-600
const pendingColor = "#f59e0b"; // amber-500
const failedColor = "#ef4444";  // red-500

const PaymentHealthChart: React.FC<Props> = ({ data, loading }) => {
  const chartData: ChartPoint[] = useMemo(() => {
    const items = data?.items ?? [];
    const map = new Map<number, (typeof items)[number]>();
    items.forEach((it) => map.set(it.month, it));

    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const v = map.get(m);
      return {
        month: m,
        monthLabel: MONTH_LABELS[i],
        success: v?.successCount ?? 0,
        pending: v?.pendingCount ?? 0,
        failed: v?.failedCount ?? 0,
      };
    });
  }, [data]);

  const totalSuccess =
    data?.items?.reduce((s, x) => s + x.successCount, 0) ?? 0;
  const totalPending =
    data?.items?.reduce((s, x) => s + x.pendingCount, 0) ?? 0;
  const totalFailed =
    data?.items?.reduce((s, x) => s + x.failedCount, 0) ?? 0;

  const totalAll = totalSuccess + totalPending + totalFailed;
  const successRate =
    totalAll > 0 ? (totalSuccess / totalAll) * 100 : 0;

  const fmtCount = (v: number) => v.toLocaleString("vi-VN");

  const CustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (!active || !payload || !payload.length) return null;

    const getVal = (key: string) =>
      payload.find((p: any) => p.dataKey === key)?.value ?? 0;

    const s = getVal("success");
    const p = getVal("pending");
    const f = getVal("failed");
    const sum = s + p + f;
    const sr = sum > 0 ? (s / sum) * 100 : 0;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl text-xs space-y-1">
        <p className="text-[11px] font-semibold text-slate-800 mb-1">
          Month: {label}
        </p>
        <p className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-500">Total</span>
          <span className="font-semibold text-slate-900">
            {fmtCount(sum)} tx
          </span>
        </p>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: successColor }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: successColor }} />
          <span className="flex-1">Success</span>
          <span className="font-semibold text-slate-900">
            {fmtCount(s)}
          </span>
        </p>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: pendingColor }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: pendingColor }} />
          <span className="flex-1">Pending</span>
          <span className="font-semibold text-slate-900">
            {fmtCount(p)}
          </span>
        </p>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: failedColor }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: failedColor }} />
          <span className="flex-1">Failed</span>
          <span className="font-semibold text-slate-900">
            {fmtCount(f)}
          </span>
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          Success rate:{" "}
          <span className="font-semibold text-emerald-600">
            {sr.toFixed(1)}%
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Payment health
            </p>
            <p className="text-xs text-slate-500">
              Monthly count of successful, pending and failed payments.
            </p>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: successColor }}
            />
            <span className="uppercase tracking-wide text-[10px] text-emerald-700">
              Success
            </span>
            <span className="font-semibold text-slate-900">
              {fmtCount(totalSuccess)}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: pendingColor }}
            />
            <span className="uppercase tracking-wide text-[10px] text-amber-700">
              Pending
            </span>
            <span className="font-semibold text-slate-900">
              {fmtCount(totalPending)}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: failedColor }}
            />
            <span className="uppercase tracking-wide text-[10px] text-rose-700">
              Failed
            </span>
            <span className="font-semibold text-slate-900">
              {fmtCount(totalFailed)}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
            <span className="uppercase tracking-wide text-[10px] text-slate-600">
              Success rate
            </span>
            <span className="font-semibold text-emerald-600">
              {successRate.toFixed(1)}%
            </span>
          </div>
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
              barCategoryGap="24%"
              barGap={6}
              maxBarSize={26}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.10)" }}
                content={<CustomTooltip />}
              />

              {/* 3 cột / 1 tháng, nhóm lại nhưng vẫn rất “liền mạch” */}
              <Bar
                dataKey="success"
                name="Success"
                fill={successColor}
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="pending"
                name="Pending"
                fill={pendingColor}
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="failed"
                name="Failed"
                fill={failedColor}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PaymentHealthChart;
