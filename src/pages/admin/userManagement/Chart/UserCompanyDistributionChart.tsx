import React from "react";
import { Card, Spin, Empty, Typography, Select, Progress } from "antd";
import { Building2 } from "lucide-react";

import type { UserCompanyDistributionPoint } from "@/interfaces/User/User";

const { Text } = Typography;

type Props = {
  data: UserCompanyDistributionPoint[] | null;
  loading?: boolean;
  error?: string | null;
  top: number;
  onChangeTop?: (value: number) => void;
};

const UserCompanyDistributionChart: React.FC<Props> = ({
  data,
  loading,
  error,
  top,
  onChangeTop,
}) => {
  /* ======= Loading / error / empty ======= */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spin tip="Loading company distribution..." />
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

  if (!data || data.length === 0) {
    return (
      <Card
        bordered={false}
        className="rounded-2xl border border-slate-100 bg-white"
      >
        <Empty description="No company distribution data" />
      </Card>
    );
  }

  /* ======= Ranking data ======= */
  const sorted = [...data].sort(
    (a, b) =>
      b.userCount - a.userCount ||
      a.companyName.localeCompare(b.companyName)
  );

  const limited = sorted.slice(0, top);
  const totalCompanies = sorted.length;
  const maxUserCount = limited[0]?.userCount || 1;

  return (
    <Card
      bordered={false}
      className="rounded-3xl border border-slate-100 bg-white shadow-sm"
      title={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
              <Building2 size={16} className="text-blue-500" />
            </div>
            <span className="text-sm font-semibold text-slate-900">
              Top companies by user count
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Focused ranking of companies based on distinct linked users.
          </span>
        </div>
      }
      extra={
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Top</span>
          <Select
            size="small"
            style={{ width: 90 }}
            value={top}
            onChange={(v) => onChangeTop?.(v)}
            options={[
              { label: "Top 5", value: 5 },
              { label: "Top 10", value: 10 },
              { label: "Top 20", value: 20 },
            ]}
          />
        </div>
      }
    >
      {/* ranking list only */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-semibold tracking-wide">
            TOP PERFORMERS
          </span>
          <span>
            Top {limited.length} of {totalCompanies}
          </span>
        </div>

        <div className="space-y-2">
          {limited.map((item, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const percent =
              maxUserCount > 0
                ? Math.round((item.userCount / maxUserCount) * 100)
                : 0;

            return (
              <div
                key={item.companyId ?? item.companyName ?? rank}
                className={`rounded-2xl px-3 py-2 flex flex-col gap-1 border ${
                  isTop3
                    ? "border-blue-100 bg-blue-50/70"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[11px] font-semibold ${
                        isTop3 ? "text-blue-500" : "text-slate-400"
                      }`}
                    >
                      #{rank}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-slate-900">
                        {item.companyName || "Unknown company"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.userCount} users
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {item.userCount}
                  </span>
                </div>

                {/* mini progress bar để nhìn tỷ lệ, không phải chart lớn */}
                <Progress
                  percent={percent}
                  showInfo={false}
                  size="small"
                  strokeColor={isTop3 ? "#2563eb" : "#9ca3af"}
                  trailColor="#e5e7eb"
                />
              </div>
            );
          })}
        </div>

        <div className="pt-1 text-[11px] text-slate-500">
          Ranking is based on the number of distinct users linked to each
          company.
        </div>
      </div>
    </Card>
  );
};

export default UserCompanyDistributionChart;
