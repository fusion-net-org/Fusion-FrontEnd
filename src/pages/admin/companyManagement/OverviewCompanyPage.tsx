/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Card, Segmented, message } from 'antd';
import { Building2, CheckCircle2, Trash2, Sparkles, Layers3 } from 'lucide-react';

import CompanyGrowthAndStatusChart from '@/pages/admin/companyManagement/Chart/CompanyGrowthAndStatusChart';
import CompanyStatusBreakdownChart from '@/pages/admin/companyManagement/Chart/CompanyStatusBreakdownChart';
import CompanyProjectLoadChart from '@/pages/admin/companyManagement/Chart/CompanyProjectLoadChart';

import {
  getCompanyGrowthAndStatusOverview,
  getCompanyProjectLoadOverview,
} from '@/services/companyService.js';

import type {
  CompanyGrowthAndStatusOverview,
  CompanyProjectLoadOverview,
} from '@/interfaces/Company/company';

const brand = '#2E8BFF';

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

type RangeKey = '12m' | '24m' | 'all';

function toDateOnlyString(d: Date) {
  // .NET DateOnly binder expects "yyyy-MM-dd"
  return d.toISOString().slice(0, 10);
}

const OverviewCompanyPage: React.FC = () => {
  const [overview, setOverview] = useState<CompanyGrowthAndStatusOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const [projectLoadOverview, setProjectLoadOverview] = useState<CompanyProjectLoadOverview | null>(
    null,
  );
  const [loadingProjectLoad, setLoadingProjectLoad] = useState(false);

  const [rangeKey, setRangeKey] = useState<RangeKey>('12m');

  /* ===== Load growth & status (depends on range) ===== */
  useEffect(() => {
    let isMounted = true;

    async function fetchOverview() {
      setLoadingOverview(true);
      try {
        const params: any = {};
        const now = new Date();

        if (rangeKey !== 'all') {
          const from = new Date(now);
          if (rangeKey === '12m') {
            from.setMonth(from.getMonth() - 11); // last 12 months
          } else if (rangeKey === '24m') {
            from.setMonth(from.getMonth() - 23); // last 24 months
          }

          params.from = toDateOnlyString(from);
          params.to = toDateOnlyString(now);
        }

        const data = await getCompanyGrowthAndStatusOverview(params);
        if (isMounted) {
          setOverview(data);
        }
      } catch (error: any) {
        console.error('getCompanyGrowthAndStatusOverview error', error);
        message.error(error?.message || 'Failed to load company growth & status overview!');
      } finally {
        if (isMounted) setLoadingOverview(false);
      }
    }

    fetchOverview();
    return () => {
      isMounted = false;
    };
  }, [rangeKey]);

  /* ===== Load project load distribution (once) ===== */
  useEffect(() => {
    let isMounted = true;

    async function fetchProjectLoad() {
      setLoadingProjectLoad(true);
      try {
        const data = await getCompanyProjectLoadOverview();
        if (isMounted) {
          setProjectLoadOverview(data);
        }
      } catch (error: any) {
        console.error('getCompanyProjectLoadOverview error', error);
        message.error(error?.message || 'Failed to load company project load distribution!');
      } finally {
        if (isMounted) setLoadingProjectLoad(false);
      }
    }

    fetchProjectLoad();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalCompanies = overview?.totalCompanies ?? 0;
  const activeCompanies = overview?.activeCompanies ?? 0;
  const deletedCompanies = overview?.deletedCompanies ?? 0;
  const newCompaniesLast30Days = overview?.newCompaniesLast30Days ?? 0;

  return (
    <div className="space-y-4">
      {/* ===== Summary panel ===== */}
      <Card
        className="rounded-2xl border border-gray-100 bg-white shadow-sm"
        bodyStyle={{ padding: 18 }}
      >
        {/* Header: giống style Project overview */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            {/* Icon gradient capsule */}
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E8BFF] to-[#22C55E] text-white shadow-sm">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm md:text-lg font-semibold text-gray-900 m-0">
                Company overview
              </h2>
              <p className="max-w-xl text-xs text-gray-500 m-0">
                High-level overview of companies, activity status, growth trends, and project load
                distribution.
              </p>
            </div>
          </div>

          {/* Range filter */}
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-gray-400 md:inline">Range</span>
            <Segmented
              size="small"
              value={rangeKey}
              onChange={(val) => setRangeKey(val as RangeKey)}
              options={[
                { label: 'Last 12 months', value: '12m' },
                { label: 'Last 24 months', value: '24m' },
                { label: 'All time', value: 'all' },
              ]}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total companies */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <div className="text-[11px] font-medium text-gray-500">Total companies</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {totalCompanies.toLocaleString()}
              </div>
            </div>
            <div
              className={cn('flex h-9 w-9 items-center justify-center rounded-full', 'bg-blue-100')}
            >
              <Building2 size={18} strokeWidth={1.75} color={brand} />
            </div>
          </div>

          {/* Active companies */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <div className="text-[11px] font-medium text-gray-500">Active companies</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {activeCompanies.toLocaleString()}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={18} strokeWidth={1.75} className="text-emerald-500" />
            </div>
          </div>

          {/* Deleted companies */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <div className="text-[11px] font-medium text-gray-500">Deleted companies</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {deletedCompanies.toLocaleString()}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100">
              <Trash2 size={18} strokeWidth={1.75} className="text-rose-500" />
            </div>
          </div>

          {/* New companies last 30 days */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <div className="text-[11px] font-medium text-gray-500">
                New companies (last 30 days)
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-900">
                {newCompaniesLast30Days.toLocaleString()}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
              <Sparkles size={18} strokeWidth={1.75} className="text-indigo-500" />
            </div>
          </div>
        </div>
      </Card>

      {/* ===== Charts row 1: growth + status breakdown ===== */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        {/* Growth chart */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-gray-900">
                Company growth & status over time
              </span>
            </div>
          }
          className="rounded-2xl border border-gray-100 shadow-sm"
          bodyStyle={{ padding: 16 }}
        >
          <CompanyGrowthAndStatusChart overview={overview} loading={loadingOverview} />
        </Card>

        {/* Status breakdown */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-gray-900">Company status breakdown</span>
            </div>
          }
          className="rounded-2xl border border-gray-100 shadow-sm"
          bodyStyle={{ padding: 16 }}
        >
          <CompanyStatusBreakdownChart overview={overview} loading={loadingOverview} />
        </Card>
      </div>

      {/* ===== Charts row 2: project load distribution ===== */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            <span className="text-sm font-medium text-gray-900">
              Company project load distribution
            </span>
          </div>
        }
        extra={
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Layers3 className="h-3 w-3" />
            <span>Distribution of total projects per company, bucketed by project count.</span>
          </div>
        }
        className="rounded-2xl border border-gray-100 shadow-sm"
        bodyStyle={{ padding: 16 }}
      >
        <CompanyProjectLoadChart overview={projectLoadOverview} loading={loadingProjectLoad} />
      </Card>
    </div>
  );
};

export default OverviewCompanyPage;
