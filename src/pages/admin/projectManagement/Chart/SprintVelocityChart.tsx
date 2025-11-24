/* src/pages/admin/projectManagement/Chart/SprintVelocityChart.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { KanbanSquare } from "lucide-react";

import type {
  ProjectExecutionOverview,
  SprintVelocityPoint,
} from "@/interfaces/Project/project";

type Props = {
  overview: ProjectExecutionOverview | null;
  loading?: boolean;
};

type ChartPoint = {
  sprintId: string;
  sprintName: string;
  committedPoints: number;
  completedPoints: number;
  completionRate: number;
};

const COLOR_COMMITTED = "#A5B4FC";
const COLOR_COMPLETED = "#4F46E5";
const GRID_COLOR = "#E5E7EB";
const AXIS_COLOR = "#6B7280";

const SprintVelocityChart: React.FC<Props> = ({ overview, loading }) => {
  const { chartData, hasAnyValue } = useMemo(() => {
    if (!overview || !overview.sprintVelocity) {
      return { chartData: [] as ChartPoint[], hasAnyValue: false };
    }

    const data: ChartPoint[] = overview.sprintVelocity.map(
      (s: SprintVelocityPoint) => {
        const committed = s.committedPoints || 0;
        const completed = s.completedPoints || 0;
        const rate =
          committed > 0 ? Math.round((completed / committed) * 100) : 0;

        return {
          sprintId: s.sprintId,
          sprintName: s.sprintName,
          committedPoints: committed,
          completedPoints: completed,
          completionRate: rate,
        };
      }
    );

    const anyValue = data.some(
      (x) => x.committedPoints > 0 || x.completedPoints > 0
    );

    return { chartData: data, hasAnyValue: anyValue };
  }, [overview]);

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const point: ChartPoint | undefined = payload[0]?.payload;
    if (!point) return null;

    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
        <div className="mb-1 text-[11px] font-semibold text-gray-900">
          {point.sprintName}
        </div>
        <div className="space-y-0.5 text-gray-600">
          <div className="flex justify-between gap-4">
            <span>Committed points</span>
            <span className="font-semibold text-gray-900">
              {point.committedPoints}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Completed points</span>
            <span className="font-semibold text-gray-900">
              {point.completedPoints}
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

  // Có sprint nhưng tất cả point = 0 → empty state
  if (!hasAnyValue) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-2 text-xs text-gray-400">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
          <KanbanSquare className="h-4 w-4" />
        </div>
        <div className="text-[11px] font-medium text-gray-500">
          No velocity data yet. Assign story points and complete tasks in
          upcoming sprints.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">
          Sprint velocity (story points)
        </div>
        <div className="text-[11px] text-gray-500">
          Committed vs completed per sprint.
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 0, bottom: 40 }}
            barCategoryGap={18}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID_COLOR}
              vertical={false}
            />
            <XAxis
              dataKey="sprintName"
              tick={{ fontSize: 11, fill: AXIS_COLOR }}
              tickMargin={12}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 11, fill: AXIS_COLOR }}
              axisLine={{ stroke: "#D1D5DB" }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />

            <Bar
              dataKey="committedPoints"
              name="Committed"
              fill={COLOR_COMMITTED}
              radius={[4, 4, 0, 0]}
              maxBarSize={26}
            />
            <Bar
              dataKey="completedPoints"
              name="Completed"
              fill={COLOR_COMPLETED}
              radius={[4, 4, 0, 0]}
              maxBarSize={26}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SprintVelocityChart;
