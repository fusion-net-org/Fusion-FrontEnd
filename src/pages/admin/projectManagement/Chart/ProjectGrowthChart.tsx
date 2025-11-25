/* src/pages/admin/projectManagement/Chart/ProjectGrowthChart.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import type {
  ProjectGrowthOverview,
  ProjectGrowthPoint,
} from "@/interfaces/Project/project";

type Props = {
  overview: ProjectGrowthOverview | null;
  loading?: boolean;
};

type ChartPoint = {
  year: number;
  month: number;
  label: string;
  newProjects: number;
  completedProjects: number;
  cumulativeProjects: number;
};

const COLOR_NEW = "#2E8BFF"; // brand
const COLOR_COMPLETED = "#22C55E";
const GRID_COLOR = "#E5E7EB";
const AXIS_COLOR = "#6B7280";

const formatMonthLabel = (year: number, month: number) => {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
};

const ProjectGrowthChart: React.FC<Props> = ({ overview, loading }) => {
  const chartData: ChartPoint[] = useMemo(() => {
    if (!overview || !overview.growth) return [];

    return overview.growth.map((p: ProjectGrowthPoint) => ({
      year: p.year,
      month: p.month,
      label: formatMonthLabel(p.year, p.month),
      newProjects: p.newProjects,
      completedProjects: p.completedProjects,
      cumulativeProjects: p.cumulativeProjects,
    }));
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
            <span>New projects</span>
            <span className="font-semibold text-gray-900">
              {point.newProjects}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Completed projects</span>
            <span className="font-semibold text-gray-900">
              {point.completedProjects}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Cumulative total</span>
            <span className="font-semibold text-gray-900">
              {point.cumulativeProjects}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center text-xs text-gray-400">
        Loading...
      </div>
    );
  }

  if (!overview || chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-xs text-gray-400">
        No data
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header + legend custom */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-sm font-medium text-gray-900">
            New vs completed projects over time
          </div>
          <div className="text-[11px] text-gray-500">
         The area chart emphasizes the trend of new creations and completions by month.
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-gray-600">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLOR_NEW }}
            />
            <span>New</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLOR_COMPLETED }}
            />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
          >
            {/* Gradients cho area */}
            <defs>
              <linearGradient id="newProjectsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_NEW} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLOR_NEW} stopOpacity={0.03} />
              </linearGradient>
              <linearGradient
                id="completedProjectsFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={COLOR_COMPLETED}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={COLOR_COMPLETED}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

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
              tick={{ fontSize: 11, fill: AXIS_COLOR }}
              axisLine={{ stroke: "#D1D5DB" }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* New projects */}
            <Area
              type="monotone"
              dataKey="newProjects"
              stroke={COLOR_NEW}
              strokeWidth={2}
              fill="url(#newProjectsFill)"
              name="New projects"
              activeDot={{ r: 3 }}
            />

            {/* Completed projects */}
            <Area
              type="monotone"
              dataKey="completedProjects"
              stroke={COLOR_COMPLETED}
              strokeWidth={2}
              fill="url(#completedProjectsFill)"
              name="Completed projects"
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectGrowthChart;
