/* src/pages/admin/projectManagement/Chart/ProjectTaskFlowChart.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ListChecks } from "lucide-react";

import type {
  ProjectExecutionOverview,
  TaskFlowPoint,
} from "@/interfaces/Project/project";

type Props = {
  overview: ProjectExecutionOverview | null;
  loading?: boolean;
};

type ChartPoint = {
  label: string;
  createdTasks: number;
  completedTasks: number;
  completionRate: number; // %
};

const COLOR_CREATED = "#2E8BFF";
const COLOR_COMPLETED = "#22C55E";
const COLOR_RATE = "#6B7280";
const GRID_COLOR = "#E5E7EB";
const AXIS_COLOR = "#6B7280";

const formatMonthLabel = (year: number, month: number) => {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
};

const ProjectTaskFlowChart: React.FC<Props> = ({ overview, loading }) => {
  const { chartData, hasAnyValue } = useMemo(() => {
    if (!overview || !overview.taskFlow) {
      return { chartData: [] as ChartPoint[], hasAnyValue: false };
    }

    const data: ChartPoint[] = overview.taskFlow.map((p: TaskFlowPoint) => {
      const created = p.createdTasks || 0;
      const completed = p.completedTasks || 0;
      const rate = created > 0 ? (completed / created) * 100 : 0;

      return {
        label: formatMonthLabel(p.year, p.month),
        createdTasks: created,
        completedTasks: completed,
        completionRate: Number(rate.toFixed(1)),
      };
    });

    const anyValue = data.some(
      (x) => x.createdTasks > 0 || x.completedTasks > 0,
    );

    return { chartData: data, hasAnyValue: anyValue };
  }, [overview]);

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const point: ChartPoint | undefined = payload[0]?.payload;
    if (!point) return null;

    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
        <div className="mb-1 text-[11px] font-semibold text-gray-900">
          {label}
        </div>
        <div className="space-y-0.5 text-gray-600">
          <div className="flex justify-between gap-4">
            <span>Tasks created</span>
            <span className="font-semibold text-gray-900">
              {point.createdTasks}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Tasks completed</span>
            <span className="font-semibold text-gray-900">
              {point.completedTasks}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Completion rate</span>
            <span className="font-semibold text-gray-900">
              {point.completionRate}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-gray-400">
        Loading...
      </div>
    );
  }

  if (!overview || chartData.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-gray-400">
        No data
      </div>
    );
  }

  // Có dữ liệu nhưng toàn 0 → show empty state rõ ràng
  if (!hasAnyValue) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-2 text-xs text-gray-400">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
          <ListChecks className="h-4 w-4" />
        </div>
        <div className="text-[11px] font-medium text-gray-500">
          No tasks have been created or completed in this period yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">
          Task flow: created vs completed
        </div>
        <div className="text-[11px] text-gray-500">
          Monthly throughput and completion rate.
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID_COLOR}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: AXIS_COLOR }}
              tickMargin={8}
              axisLine={{ stroke: "#D1D5DB" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: AXIS_COLOR }}
              axisLine={{ stroke: "#D1D5DB" }}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
              allowDecimals={false}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />

            <Bar
              yAxisId="left"
              dataKey="createdTasks"
              name="Created"
              fill={COLOR_CREATED}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />

            <Bar
              yAxisId="left"
              dataKey="completedTasks"
              name="Completed"
              fill={COLOR_COMPLETED}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="completionRate"
              name="Completion rate"
              stroke={COLOR_RATE}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectTaskFlowChart;
