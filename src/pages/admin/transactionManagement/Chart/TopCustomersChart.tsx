// src/pages/admin/transactionManagement/Chart/TopCustomersChart.tsx

import React, { useMemo } from "react";
import { Spin, InputNumber } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Crown } from "lucide-react";

import type {
  TransactionTopCustomersResponse,
} from "@/interfaces/Transaction/TransactionPayment";

type Props = {
  data: TransactionTopCustomersResponse | null;
  loading?: boolean;

  /** số lượng top user đang hiển thị (để bind với API) */
  topN?: number;
  /** callback cho parent đổi topN và reload data */
  onTopNChange?: (value: number) => void;
};

type ChartPoint = {
  rank: number;
  label: string;
  totalAmount: number;
  successCount: number;
  userId: string;
  userName?: string | null;
  email?: string | null;
  maxPayment?: number | null;
  lastPaymentAt?: string | null;
};

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
}

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as ChartPoint;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg max-w-xs">
      <p className="text-[11px] font-semibold text-slate-500 mb-1">
        Rank #{p.rank}
      </p>
      <p className="text-xs font-semibold text-slate-900 truncate">
        {p.userName || p.email || p.userId}
      </p>
      {p.email && (
        <p className="text-[11px] text-slate-500 truncate">{p.email}</p>
      )}
      <div className="mt-2 space-y-1 text-[11px] text-slate-600">
        <p>
          <span className="text-slate-500">UserId:</span>{" "}
          <span className="font-mono">{p.userId}</span>
        </p>
        <p>
          <span className="text-slate-500">Total revenue:</span>{" "}
          <span className="font-semibold text-emerald-600">
            {p.totalAmount.toLocaleString("vi-VN")} VND
          </span>
        </p>
        <p>
          <span className="text-slate-500">Successful tx:</span>{" "}
          <span className="font-medium">{p.successCount}</span>
        </p>
        {p.maxPayment != null && (
          <p>
            <span className="text-slate-500">Max single payment:</span>{" "}
            <span className="font-medium">
              {p.maxPayment.toLocaleString("vi-VN")} VND
            </span>
          </p>
        )}
        <p>
          <span className="text-slate-500">Last payment at:</span>{" "}
          <span className="font-medium">{formatDateTime(p.lastPaymentAt)}</span>
        </p>
      </div>
    </div>
  );
};

const TopCustomersChart: React.FC<Props> = ({
  data,
  loading,
  topN,
  onTopNChange,
}) => {
  const chartData: ChartPoint[] = useMemo(() => {
    if (!data?.items?.length) return [];
    return data.items.map((item, idx) => ({
      rank: idx + 1,
      label: `#${idx + 1} ${item.userName || item.email || "Unnamed user"}`,
      totalAmount: item.totalAmount,
      successCount: item.successCount,
      userId: item.userId,
      userName: item.userName,
      email: item.email,
      maxPayment: item.maxPayment,
      lastPaymentAt: item.lastPaymentAt,
    }));
  }, [data]);

  const top1 = data?.items?.[0];
  const effectiveTopN = topN ?? data?.items?.length ?? 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col gap-3 min-w-0">
      {/* Header + controls */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Top customers
            </p>
            <p className="text-xs text-slate-500">
              Highest revenue users in{" "}
              {data?.year ?? new Date().getFullYear()}.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* input top N */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Top N users</span>
            <InputNumber
              size="small"
              min={1}
              max={50}
              value={effectiveTopN || undefined}
              onChange={(v) =>
                onTopNChange && v != null
                  ? onTopNChange(Number(v))
                  : undefined
              }
              disabled={!onTopNChange}
              className="w-20"
            />
          </div>

          {top1 && (
            <div className="text-right text-[11px] text-slate-500 mt-1 max-w-[220px]">
              <p className="font-semibold text-slate-600 mb-0.5">
                #1 high-value payer
              </p>
              <p className="text-xs text-slate-800 font-medium truncate">
                {top1.userName || top1.email || top1.userId}
              </p>
              <p>
                Revenue:{" "}
                <span className="font-semibold text-emerald-600">
                  {top1.totalAmount.toLocaleString("vi-VN")} VND
                </span>
              </p>
              <p>{top1.successCount} successful tx</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-60 min-w-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Spin />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                horizontal
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />
              <XAxis
                type="number"
                tickFormatter={formatCurrencyShort}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={150}
                tick={{ fontSize: 11, fill: "#475569" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="totalAmount"
                name="Revenue"
                radius={[0, 6, 6, 0]}
                fill="#4f46e5"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TopCustomersChart;
