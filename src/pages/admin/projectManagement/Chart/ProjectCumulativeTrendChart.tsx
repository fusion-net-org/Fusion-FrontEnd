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
  label: string;
  cumulativeProjects: number;
};

const COLOR = "#2E8BFF";
const GRID_COLOR = "#E5E7EB";
const AXIS_COLOR = "#6B7280";

const formatMonthLabel = (year: number, month: number) => {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
};

const ProjectCumulativeTrendChart: React.FC<Props> = ({ overview, loading }) => {
  const chartData: ChartPoint[] = useMemo(() => {
    if (!overview || !overview.growth) return [];

    return overview.growth.map((p: ProjectGrowthPoint) => ({
      label: formatMonthLabel(p.year, p.month),
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
        <div className="flex justify-between gap-4 text-gray-600">
          <span>Cumulative projects</span>
          <span className="font-semibold text-gray-900">
            {point.cumulativeProjects}
          </span>
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">
          Cumulative project count over time
        </div>
        <div className="text-[11px] text-gray-500">
          Total number of projects created up to each month.
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id="projectCumFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLOR} stopOpacity={0.03} />
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

            <Area
              type="monotone"
              dataKey="cumulativeProjects"
              stroke={COLOR}
              strokeWidth={2}
              fill="url(#projectCumFill)"
              name="Cumulative projects"
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectCumulativeTrendChart;
