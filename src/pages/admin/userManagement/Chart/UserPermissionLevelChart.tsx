import React from "react";
import { Card, Spin, Empty, Typography } from "antd";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ShieldCheck } from "lucide-react";


import type { UserPermissionLevelOverview } from "@/interfaces/User/User";

const { Text } = Typography;

const COLORS = ["#0ea5e9", "#22c55e", "#6366f1", "#f97316"];

type Props = {
  overview: UserPermissionLevelOverview | null;
  loading?: boolean;
  error?: string | null;
};

const UserPermissionLevelChart: React.FC<Props> = ({
  overview,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spin tip="Loading permission overview..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card
        bordered={false}
        className="rounded-2xl border border-red-100 bg-red-50/60"
      >
        <Text type="danger" className="font-medium">
          {error}
        </Text>
      </Card>
    );
  }

  if (!overview || !overview.levels || overview.levels.length === 0) {
    return (
      <Card
        bordered={false}
        className="rounded-2xl border border-slate-100 bg-white"
      >
        <Empty description="No permission level data" />
      </Card>
    );
  }

  const chartData = overview.levels.map((x) => ({
    level: x.level,
    userCount: x.count,
  }));

  return (
    <Card
      bordered={false}
      className="rounded-3xl border border-slate-100 bg-white shadow-sm"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <ShieldCheck size={18} className="text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              Users by permission level
            </span>
            <span className="text-[11px] text-slate-500">
              Highest effective access level for each user.
            </span>
          </div>
        </div>
      }
    >
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              allowDecimals={false}
            />
            <YAxis
              dataKey="level"
              type="category"
              tick={{ fontSize: 12, fill: "#374151" }}
              width={120}
            />
            <Tooltip
              formatter={(value: any) =>
                `${Number(value).toLocaleString("vi-VN")} users`
              }
              labelFormatter={(label) => `Level: ${label}`}
            />
            <Bar dataKey="userCount" radius={[0, 6, 6, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-[11px] text-slate-500">
        Each user is counted once based on their highest level:
        <span className="font-medium text-slate-700">
          {" "}
          System admin → Company owner → Company member → Registered only.
        </span>
      </div>
    </Card>
  );
};

export default UserPermissionLevelChart;
