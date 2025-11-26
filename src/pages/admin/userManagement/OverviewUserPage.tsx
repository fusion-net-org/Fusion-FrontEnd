import React, { useEffect, useState } from 'react';
import { Card, Segmented } from 'antd';
import { Users as UsersIcon, TrendingUp } from 'lucide-react';

import UserGrowthAndStatusChart from '@/pages/admin/userManagement/Chart/UserGrowthAndStatusChart';
import UserCompanyDistributionChart from '@/pages/admin/userManagement/Chart/UserCompanyDistributionChart';
import UserPermissionLevelChart from '@/pages/admin/userManagement/Chart/UserPermissionLevelChart';

import {
  getUserGrowthAndStatusOverview,
  getTopCompanyUserDistribution,
  getUserPermissionLevelOverview,
} from '@/services/userService.js';

import type {
  ApiResponse,
  UserGrowthAndStatusOverview as OverviewModel,
  UserCompanyDistributionPoint,
  UserPermissionLevelOverview,
} from '@/interfaces/User/User';

const OverviewUserPage: React.FC = () => {
  /* ========= 1. Growth & active status ========= */
  const [overview, setOverview] = useState<OverviewModel | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [months, setMonths] = useState<number>(12);

  /* ========= 2. User distribution by company ========= */
  const [companyData, setCompanyData] = useState<UserCompanyDistributionPoint[] | null>(null);
  const [companyLoading, setCompanyLoading] = useState<boolean>(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [top, setTop] = useState<number>(10);

  /* ========= 3. Users by permission level ========= */
  const [permOverview, setPermOverview] = useState<UserPermissionLevelOverview | null>(null);
  const [permLoading, setPermLoading] = useState<boolean>(true);
  const [permError, setPermError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchOverview = async () => {
      try {
        setOverviewLoading(true);
        setOverviewError(null);

        const res = (await getUserGrowthAndStatusOverview(months)) as ApiResponse<OverviewModel>;

        if (!mounted) return;
        setOverview(res.data);
      } catch (err: any) {
        if (!mounted) return;
        console.error('OverviewUserPage (overview) error:', err);
        setOverviewError(err?.message || 'Error loading user overview data');
      } finally {
        if (mounted) setOverviewLoading(false);
      }
    };

    const fetchCompanyDistribution = async () => {
      try {
        setCompanyLoading(true);
        setCompanyError(null);

        const res = (await getTopCompanyUserDistribution(top)) as ApiResponse<
          UserCompanyDistributionPoint[]
        >;

        if (!mounted) return;
        setCompanyData(res.data);
      } catch (err: any) {
        if (!mounted) return;
        console.error('OverviewUserPage (company distribution) error:', err);
        setCompanyError(err?.message || 'Error loading company user distribution data');
      } finally {
        if (mounted) setCompanyLoading(false);
      }
    };

    const fetchPermissionOverview = async () => {
      try {
        setPermLoading(true);
        setPermError(null);

        const res =
          (await getUserPermissionLevelOverview()) as ApiResponse<UserPermissionLevelOverview>;

        if (!mounted) return;
        setPermOverview(res.data);
      } catch (err: any) {
        if (!mounted) return;
        console.error('OverviewUserPage (permission overview) error:', err);
        setPermError(err?.message || 'Error loading user permission level overview');
      } finally {
        if (mounted) setPermLoading(false);
      }
    };

    fetchOverview();
    fetchCompanyDistribution();
    fetchPermissionOverview();

    return () => {
      mounted = false;
    };
  }, [months, top]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50/80">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* ===== Header: User overview ===== */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] via-[#2E8BFF] to-[#22c55e] text-white">
              <UsersIcon size={20} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-slate-900 m-0">
                User overview
              </h2>
              <p className="mt-0.5 text-xs md:text-sm text-slate-500 m-0">
                High-level metrics and growth trends for your system users.
              </p>
            </div>
          </div>
        </div>

        {/* ===== Panel 1: User growth & status ===== */}
        <Card
          bordered={false}
          className="shadow-sm rounded-3xl border border-slate-100 bg-white/95"
          title={
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <TrendingUp size={18} className="text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">User growth & status</span>
                <span className="text-[11px] text-slate-500">
                  Monthly new users and active / inactive distribution.
                </span>
              </div>
            </div>
          }
          extra={
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Range</span>
              <Segmented
                size="small"
                value={months}
                onChange={(value) => setMonths(value as number)}
                options={[
                  { label: 'Last 3 months', value: 3 },
                  { label: 'Last 6 months', value: 6 },
                  { label: 'Last 12 months', value: 12 },
                ]}
              />
            </div>
          }
        >
          <UserGrowthAndStatusChart
            overview={overview}
            loading={overviewLoading}
            error={overviewError}
          />
        </Card>

        {/* ===== Panel 2: Companies & permission levels ===== */}
        <div className="grid gap-5 lg:grid-cols-2">
          <UserCompanyDistributionChart
            data={companyData}
            loading={companyLoading}
            error={companyError}
            top={top}
            onChangeTop={setTop}
          />

          <UserPermissionLevelChart
            overview={permOverview}
            loading={permLoading}
            error={permError}
          />
        </div>
      </div>
    </div>
  );
};

export default OverviewUserPage;
