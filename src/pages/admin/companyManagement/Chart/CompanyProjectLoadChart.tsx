/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { Spin } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import type { CompanyProjectLoadOverview } from "@/interfaces/Company/company";

type Props = {
  overview: CompanyProjectLoadOverview | null;
  loading?: boolean;
};

const COLORS = ["#2E8BFF", "#A855F7", "#0EA5E9", "#22C55E", "#F97316", "#EF4444"];

type SeriesMeta = {
  dataKey: string;
  color: string;
  label: string;
  companyCount: number;
  avgProjectsPerCompany: number;
  sharePercent: number;
};

const CompanyProjectLoadChart: React.FC<Props> = ({ overview, loading }) => {
  const stacked = useMemo(() => {
    if (!overview || !overview.buckets || overview.totalCompanies === 0) {
      return null;
    }

    const totalCompanies = overview.totalCompanies;

    const series: SeriesMeta[] = overview.buckets.map((b, idx) => {
      const avg =
        b.companyCount > 0
          ? Number((b.totalProjects / b.companyCount).toFixed(1))
          : 0;

      return {
        dataKey: `bucket_${idx}`,
        color: COLORS[idx % COLORS.length],
        label: b.label,
        companyCount: b.companyCount,
        avgProjectsPerCompany: avg,
        sharePercent: Number(
          ((b.companyCount / totalCompanies) * 100).toFixed(1)
        ),
      };
    });

    // single row for stacked bar
    const row: Record<string, number | string> = { name: "Companies" };
    series.forEach((s) => {
      row[s.dataKey] = s.companyCount;
    });

    const seriesMap: Record<string, SeriesMeta> = {};
    series.forEach((s) => {
      seriesMap[s.dataKey] = s;
    });

    return {
      data: [row],
      series,
      seriesMap,
      totalCompanies,
    };
  }, [overview]);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (!overview || !stacked) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-gray-400">
        No data
      </div>
    );
  }

  const { data, series, seriesMap } = stacked;

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;

    const p = payload[0];
    const meta = seriesMap[p.dataKey as string];
    if (!meta) return null;

    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
        <div className="mb-1 font-medium text-gray-900">{meta.label}</div>
        <div className="space-y-0.5 text-gray-600">
          <div className="flex justify-between gap-4">
            <span>Companies</span>
            <span className="font-semibold text-gray-900">
              {meta.companyCount}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Share</span>
            <span className="font-semibold text-gray-900">
              {meta.sharePercent}%
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Avg projects / company</span>
            <span className="font-semibold text-gray-900">
              {meta.avgProjectsPerCompany}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-end justify-between">
        <div className="text-xs text-gray-500">
          Total companies:{" "}
          <span className="font-semibold text-gray-900">
            {overview.totalCompanies.toLocaleString()}
          </span>
          {" · "}
          Total projects:{" "}
          <span className="font-semibold text-gray-900">
            {overview.totalProjects.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stacked bar + ranked list */}
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        {/* Stacked bar (100% companies) */}
        <div className="h-48 w-full md:h-52 md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              {series.map((s, idx) => (
                <Bar
                  key={s.dataKey}
                  dataKey={s.dataKey}
                  stackId="total"
                  fill={s.color}
                  maxBarSize={40}
                  radius={
                    idx === series.length - 1
                      ? [0, 8, 8, 0] // round right end of the whole stack
                      : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranked legend */}
        <div className="w-full md:w-1/2">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Buckets by project load
          </div>
          <ul className="space-y-1.5 text-xs text-gray-600">
            {series.map((item) => (
              <li
                key={item.dataKey}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span>
                    {item.companyCount}{" "}
                    {item.companyCount === 1 ? "company" : "companies"}
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span>{item.sharePercent}%</span>
                  <span className="hidden sm:inline">·</span>
                  <span>avg {item.avgProjectsPerCompany} projects</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompanyProjectLoadChart;
