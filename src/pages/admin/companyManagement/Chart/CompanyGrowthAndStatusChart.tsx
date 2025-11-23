/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { Spin } from "antd";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import type { CompanyGrowthAndStatusOverview } from "@/interfaces/Company/company";

const brand = "#2E8BFF";

type Props = {
  overview: CompanyGrowthAndStatusOverview | null;
  loading?: boolean;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatLabel(year: number, month: number) {
  const idx = Math.max(0, Math.min(11, month - 1));
  return `${monthNames[idx]} ${year}`;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload.find((p: any) => p.dataKey === "newCompanies");
  const total = payload.find((p: any) => p.dataKey === "totalCompanies");

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-gray-900 mb-1">{label}</div>
      <div className="space-y-0.5">
        {point && (
          <div className="flex items-center gap-2 text-gray-600">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            <span>New companies:</span>
            <span className="font-semibold text-gray-900">
              {point.value}
            </span>
          </div>
        )}
        {total && (
          <div className="flex items-center gap-2 text-gray-600">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>Total companies:</span>
            <span className="font-semibold text-gray-900">
              {total.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const CompanyGrowthAndStatusChart: React.FC<Props> = ({ overview, loading }) => {
  const data = useMemo(() => {
    if (!overview || !overview.growth) return [];

    return overview.growth.map((p) => {
      const label = formatLabel(p.year, p.month);
      return {
        key: `${p.year}-${String(p.month).padStart(2, "0")}`,
        label,
        newCompanies: p.newCompanies,
        totalCompanies: p.cumulativeCompanies,
      };
    });
  }, [overview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin />
      </div>
    );
  }

  if (!overview || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-gray-400">
        No data
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Legend custom nhỏ gọn */}
      <div className="flex justify-end gap-4 text-[11px] text-gray-500">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          <span>New companies</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-[2px] w-4 rounded-full bg-emerald-500" />
          <span>Total companies</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickMargin={6}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280" }}
              allowDecimals={false}
              tickMargin={4}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Cột: new companies */}
            <Bar
              dataKey="newCompanies"
              barSize={24}
              radius={[6, 6, 0, 0]}
              fill="#BFDBFE"
            />

            {/* Line: tổng công ty */}
            <Line
              type="monotone"
              dataKey="totalCompanies"
              stroke="#10B981"
              strokeWidth={2.2}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompanyGrowthAndStatusChart;
