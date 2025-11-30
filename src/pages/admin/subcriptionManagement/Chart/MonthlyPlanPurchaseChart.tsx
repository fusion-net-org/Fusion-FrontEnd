/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Select, Spin } from "antd";
import { BarChart3, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { getPlanMonthlyPurchasesForAdmin } from "@/services/transactionService.js";
import type {
  SubscriptionPlanMonthlyPurchaseResponse,
  SubscriptionPlanMonthlyPurchaseItem,
} from "@/interfaces/Transaction/TransactionPayment";

const { Option } = Select;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Mỗi row là 1 tháng, mỗi key planName là 1 series
type ChartRow = {
  month: number;
  monthLabel: string;
  [planName: string]: string | number;
};

const COLORS = ["#2563EB", "#10B981", "#F97316", "#EC4899", "#8B5CF6", "#22C55E", "#0EA5E9", "#F59E0B"];

// ===== helper build data theo danh sách planId đã chọn =====
function buildChartData(
  resp: SubscriptionPlanMonthlyPurchaseResponse,
  selectedPlanIds: string[]
): { data: ChartRow[]; planMetas: { planId: string; planName: string }[] } {
  const items = resp.items ?? [];

  // map PlanId -> PlanName
  const nameByPlan = new Map<string, string>();
  items.forEach((it) => {
    if (!nameByPlan.has(it.planId)) {
      nameByPlan.set(it.planId, it.planName);
    }
  });

  // Nếu chưa chọn gì thì hiển thị tất cả
  const planIdsToUse =
    selectedPlanIds && selectedPlanIds.length > 0
      ? selectedPlanIds
      : Array.from(nameByPlan.keys());

  const planMetas = planIdsToUse.map((id) => ({
    planId: id,
    planName: nameByPlan.get(id) || id,
  }));

  const data: ChartRow[] = [];
  for (let m = 1; m <= 12; m++) {
    const row: ChartRow = {
      month: m,
      monthLabel: MONTH_LABELS[m - 1],
    };

    for (const meta of planMetas) {
      const found = items.find(
        (x: SubscriptionPlanMonthlyPurchaseItem) =>
          x.planId === meta.planId && x.month === m
      );
      row[meta.planName] = found?.purchaseCount ?? 0;
    }

    data.push(row);
  }

  return { data, planMetas };
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow">
      <div className="mb-1 text-[11px] font-semibold text-slate-500">{label}</div>
      {payload.map((p: any) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-slate-700">{p.dataKey}</span>
          </span>
          <span className="font-semibold text-slate-900">
            {p.value ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
};

const PlanMonthlyPurchaseChart: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<SubscriptionPlanMonthlyPurchaseResponse | null>(
    null
  );

  // Tất cả plan + tổng purchase trong năm → dùng cho filter + Top 5
  const allPlans = useMemo(() => {
    if (!resp) return [] as { planId: string; planName: string; total: number }[];
    const map = new Map<string, { planId: string; planName: string; total: number }>();

    for (const it of resp.items ?? []) {
      const exist =
        map.get(it.planId) || {
          planId: it.planId,
          planName: it.planName,
          total: 0,
        };
      exist.total += it.purchaseCount;
      exist.planName = it.planName || exist.planName;
      map.set(it.planId, exist);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [resp]);

  // Danh sách planId đang được chọn để hiển thị
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getPlanMonthlyPurchasesForAdmin(year);
        if (!mounted) return;
        setResp(data ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [year]);

  // Khi resp / allPlans đổi, nếu chưa chọn gì thì auto chọn Top 5
  useEffect(() => {
    if (!resp || allPlans.length === 0) {
      setSelectedPlanIds([]);
      return;
    }

    setSelectedPlanIds((prev) => {
      // Giữ lại các selection vẫn còn tồn tại
      const validPrev = prev.filter((id) =>
        allPlans.some((p) => p.planId === id)
      );
      if (validPrev.length > 0) return validPrev;

      // Mặc định: top 5
      return allPlans.slice(0, 5).map((p) => p.planId);
    });
  }, [resp, allPlans]);

  const { data, planMetas } = useMemo(() => {
    if (!resp) return { data: [] as ChartRow[], planMetas: [] as { planId: string; planName: string }[] };
    return buildChartData(resp, selectedPlanIds);
  }, [resp, selectedPlanIds]);

  const hasData = data.some((row) =>
    planMetas.some((meta) => (row[meta.planName] as number) > 0)
  );

  const yearOptions = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
  ];

  const handleSelectTop5 = () => {
    setSelectedPlanIds(allPlans.slice(0, 5).map((p) => p.planId));
  };

  const handleSelectAll = () => {
    setSelectedPlanIds(allPlans.map((p) => p.planId));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Plan Monthly Purchase Chart
            </h2>
            <p className="text-[11px] text-slate-500">
              Number of successful purchases per plan in each month of {year}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Select
              size="small"
              value={year}
              onChange={(v) => setYear(Number(v))}
              style={{ width: 110 }}
            >
              {yearOptions.map((y) => (
                <Option key={y} value={y}>
                  {y}
                </Option>
              ))}
            </Select>
          </div>

          {/* Chọn plan hiển thị */}
          <Select
            mode="multiple"
            size="small"
            value={selectedPlanIds}
            onChange={(ids) => setSelectedPlanIds(ids as string[])}
            placeholder="Select plans"
            maxTagCount="responsive"
            style={{ minWidth: 200, maxWidth: 320 }}
          >
            {allPlans.map((p) => (
              <Option key={p.planId} value={p.planId}>
                {p.planName} ({p.total})
              </Option>
            ))}
          </Select>

          <button
            type="button"
            onClick={handleSelectTop5}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Top 5
          </button>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:underline"
          >
            All plans
          </button>
        </div>
      </div>

      {/* Chart body */}
      {loading ? (
        <div className="flex h-[260px] items-center justify-center">
          <Spin />
        </div>
      ) : !resp || planMetas.length === 0 || !hasData ? (
        <div className="flex h-[260px] flex-col items-center justify-center text-center text-xs text-slate-500">
          <p className="font-medium text-slate-700">
            No purchases found for the selected year.
          </p>
          <p className="mt-1">
            Once customers start buying plans, monthly statistics will be shown here.
          </p>
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5f5" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5f5" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                verticalAlign="top"
                align="right"
              />

              {/* STACKED BARS: mỗi tháng 1 cột, chia nhiều màu */}
              {planMetas.map((meta, idx) => (
                <Bar
                  key={meta.planId}
                  dataKey={meta.planName}
                  barSize={selectedPlanIds.length > 6 ? 10 : 14}
                  radius={[4, 4, 0, 0]}
                  stackId="stack" // stack theo tháng
                  fill={COLORS[idx % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-2 text-[11px] text-slate-400">
        You can select which plans to display. When many plans are selected, bars are
        stacked by month to keep the chart readable.
      </p>
    </div>
  );
};

export default PlanMonthlyPurchaseChart;
