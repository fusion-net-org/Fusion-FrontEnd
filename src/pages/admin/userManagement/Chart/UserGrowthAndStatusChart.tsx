import React from "react";
import { Card, Row, Col, Typography, Spin, Empty } from "antd";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, UserCheck, UserX } from "lucide-react";

import type {
  UserGrowthAndStatusOverview,
  UserGrowthPoint,
} from "@/interfaces/User/User";

const { Text } = Typography;

const BRAND = "#2E8BFF";
const ACTIVE_COLOR = "#22c55e";
const INACTIVE_COLOR = "#ef4444";

type Props = {
  overview: UserGrowthAndStatusOverview | null;
  loading?: boolean;
  error?: string | null;
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "default" | "active" | "inactive";
}> = ({ label, value, icon, accent }) => {
  const color =
    accent === "active"
      ? ACTIVE_COLOR
      : accent === "inactive"
      ? INACTIVE_COLOR
      : "#0f172a";

  const bgClass =
    accent === "active"
      ? "bg-emerald-50"
      : accent === "inactive"
      ? "bg-rose-50"
      : "bg-blue-50";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <div>
        <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold" style={{ color }}>
          {value.toLocaleString("vi-VN")}
        </div>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgClass}`}>
        {icon}
      </div>
    </div>
  );
};

const UserGrowthAndStatusChart: React.FC<Props> = ({
  overview,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin tip="Loading user data..." />
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

  if (!overview) {
    return (
      <Card
        bordered={false}
        className="rounded-2xl border border-slate-100"
      >
        <Empty description="No user data available" />
      </Card>
    );
  }

  const growthData: UserGrowthPoint[] = overview.growth ?? [];
  const statusData = [
    { name: "Active", value: overview.activeUsers },
    { name: "Inactive", value: overview.inactiveUsers },
  ];

  const total = overview.totalUsers || 1;
  const activePercent = Math.round((overview.activeUsers / total) * 100);
  const inactivePercent = 100 - activePercent;

  return (
    <div className="space-y-6">
      {/* Row 1: stats + line chart */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        {/* Stats column */}
        <div className="flex flex-col gap-3">
          <StatCard
            label="Total users"
            value={overview.totalUsers}
            icon={<Users size={20} color={BRAND} />}
            accent="default"
          />
          <StatCard
            label="Active users"
            value={overview.activeUsers}
            icon={<UserCheck size={20} color={ACTIVE_COLOR} />}
            accent="active"
          />
          <StatCard
            label="Inactive users"
            value={overview.inactiveUsers}
            icon={<UserX size={20} color={INACTIVE_COLOR} />}
            accent="inactive"
          />
        </div>

        {/* Line chart column */}
        <Card
          bordered={false}
          className="rounded-2xl border border-slate-100 bg-white"
          title={
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">
                Monthly new users
              </span>
              <span className="text-[11px] text-slate-500">
                Growth over selected period
              </span>
            </div>
          }
        >
          {growthData.length === 0 ? (
            <Empty description="No growth data" />
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    allowDecimals={false}
                    minTickGap={1}
                  />
                  <Tooltip
                    formatter={(value: any) =>
                      `${Number(value).toLocaleString("vi-VN")} users`
                    }
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    stroke={BRAND}
                    strokeWidth={2.2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Row 2: donut chart + breakdown */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="rounded-2xl border border-slate-100 bg-white"
            title={
              <span className="text-sm font-semibold text-slate-800">
                Active vs inactive
              </span>
            }
          >
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? ACTIVE_COLOR : INACTIVE_COLOR}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      Number(value).toLocaleString("vi-VN"),
                      name === "Active" ? "Active users" : "Inactive users",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="rounded-2xl border border-slate-100 bg-slate-50/60"
          >
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Status breakdown
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Active users</span>
                </div>
                <span className="font-medium text-slate-900">
                  {overview.activeUsers.toLocaleString("vi-VN")}{" "}
                  <span className="ml-1 text-xs text-slate-500">
                    ({activePercent}%)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-slate-600">Inactive users</span>
                </div>
                <span className="font-medium text-slate-900">
                  {overview.inactiveUsers.toLocaleString("vi-VN")}{" "}
                  <span className="ml-1 text-xs text-slate-500">
                    ({inactivePercent}%)
                  </span>
                </span>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Active users are calculated based on the current account{" "}
                <span className="font-medium text-slate-700">status flag</span>{" "}
                in your user records.
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserGrowthAndStatusChart;
