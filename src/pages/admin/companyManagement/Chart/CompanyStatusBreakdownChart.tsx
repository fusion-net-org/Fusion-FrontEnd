/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { Spin } from "antd";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import type { CompanyGrowthAndStatusOverview } from "@/interfaces/Company/company";

type Props = {
  overview: CompanyGrowthAndStatusOverview | null;
  loading?: boolean;
};

const COLORS = ["#22C55E", "#F97373"]; // Active, Deleted

const CompanyStatusBreakdownChart: React.FC<Props> = ({ overview, loading }) => {
  const data = useMemo(() => {
    if (!overview) return [];

    return [
      {
        name: "Active",
        value: overview.activeCompanies ?? 0,
      },
      {
        name: "Deleted",
        value: overview.deletedCompanies ?? 0,
      },
    ];
  }, [overview]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Spin />
      </div>
    );
  }

  if (!overview || total === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-xs text-gray-400">
        No data
      </div>
    );
  }

  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
    const RADIAN = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (!value) return null;

    const percent = ((value / total) * 100).toFixed(0);

    return (
      <text
        x={x}
        y={y}
        fill="#111827"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
      >
        {percent}%
      </text>
    );
  };

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(value: any, name: any) => [
              value,
              name as string,
            ]}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={72}
            paddingAngle={2}
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[index] || "#CBD5F5"}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Legend custom nhỏ ở dưới */}
      <div className="mt-3 flex justify-center gap-4 text-[11px] text-gray-500">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
          <span>Deleted</span>
        </div>
      </div>
    </div>
  );
};

export default CompanyStatusBreakdownChart;
