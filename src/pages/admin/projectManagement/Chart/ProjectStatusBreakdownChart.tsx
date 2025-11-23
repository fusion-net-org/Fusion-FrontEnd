/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import type { ProjectGrowthOverview } from "@/interfaces/Project/project";

type Props = {
  overview: ProjectGrowthOverview | null;
  loading?: boolean;
};

type StatusPoint = {
  key: string;
  label: string;
  value: number;
  color: string;
};

const COLORS: Record<string, string> = {
  Active: "#2E8BFF",
  Completed: "#22C55E",
  Other: "#E5E7EB",
};

const ProjectStatusBreakdownChart: React.FC<Props> = ({
  overview,
  loading,
}) => {
  const { data, total } = useMemo(() => {
    if (!overview) {
      return { data: [] as StatusPoint[], total: 0 };
    }

    const total = overview.totalProjects ?? 0;
    const active = overview.activeProjects ?? 0;
    const completed = overview.completedProjects ?? 0;
    const otherRaw = total - active - completed;
    const other = otherRaw > 0 ? otherRaw : 0;

    const items: StatusPoint[] = [
      {
        key: "Active",
        label: "Active",
        value: active,
        color: COLORS.Active,
      },
      {
        key: "Completed",
        label: "Completed",
        value: completed,
        color: COLORS.Completed,
      },
      {
        key: "Other",
        label: "Other",
        value: other,
        color: COLORS.Other,
      },
    ].filter((x) => x.value > 0);

    return { data: items, total: total };
  }, [overview]);

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0 || total <= 0) return null;
    const item: StatusPoint | undefined = payload[0]?.payload;
    if (!item) return null;

    const share = ((item.value / total) * 100).toFixed(1);

    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
        <div className="mb-1 text-[11px] font-semibold text-gray-900">
          {item.label}
        </div>
        <div className="space-y-0.5 text-gray-600">
          <div className="flex justify-between gap-4">
            <span>Projects</span>
            <span className="font-semibold text-gray-900">
              {item.value.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Share</span>
            <span className="font-semibold text-gray-900">{share}%</span>
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

  if (!overview || !total || data.length === 0) {
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
          Project status breakdown
        </div>
        <div className="text-[11px] text-gray-500">
          Distribution of active and completed projects.
        </div>
      </div>

      <div className="flex h-60 w-full items-center">
        <ResponsiveContainer width="50%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend + summary */}
        <div className="flex-1 space-y-2 text-xs text-gray-600">
          <div className="text-[11px] uppercase tracking-wide text-gray-400">
            Current portfolio
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {total.toLocaleString()} projects
          </div>

          <ul className="mt-2 space-y-1.5">
            {data.map((item) => {
              const share = ((item.value / total) * 100).toFixed(1);
              return (
                <li
                  key={item.key}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-800">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>{item.value}</span>
                    <span>•</span>
                    <span>{share}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatusBreakdownChart;
