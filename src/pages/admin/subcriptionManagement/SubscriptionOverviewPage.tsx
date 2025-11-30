// src/pages/admin/subcriptionManagement/SubscriptionOverviewPage.tsx

import React, { useEffect, useState } from 'react';
import { BarChart3, CalendarDays } from 'lucide-react';
import { Select } from 'antd';

import {
  getPaymentModeInsightForAdmin,
  getPlanRevenueInsightForAdmin,
  getPlanPurchaseTableForAdmin,
  getPlanPurchaseRatioForAdmin,
  getPlanMonthlyPurchasesForAdmin,
} from '@/services/transactionService.js';

import type {
  TransactionPaymentModeInsightResponse,
  TransactionPlanRevenueInsightResponse,
  SubscriptionPlanPurchaseStatItem,
    SubscriptionPlanMonthlyPurchaseResponse,
} from '@/interfaces/Transaction/TransactionPayment';

import PaymentModeInsightChart from '@/pages/admin/subcriptionManagement/Chart/PaymentModeInsightChart';
import PlanRevenueInsightChart from '@/pages/admin/subcriptionManagement/Chart/PlanRevenueInsightChart';
import PlanPurchaseRatioChart from '@/pages/admin/subcriptionManagement/Chart/PlanPurchaseRatioChart';
import PlanPurchaseStatsTable from '@/pages/admin/subcriptionManagement/Chart/PlanPurchaseStatsTable';
import MonthlyPlanPurchaseChart from '@/pages/admin/subcriptionManagement/Chart/MonthlyPlanPurchaseChart'; 

const { Option } = Select;
const CURRENT_YEAR = new Date().getFullYear();

const SubscriptionOverviewPage: React.FC = () => {
  const [year, setYear] = useState<number>(CURRENT_YEAR);

  // Payment mode
  const [loadingMode, setLoadingMode] = useState(false);
  const [modeData, setModeData] =
    useState<TransactionPaymentModeInsightResponse | null>(null);

  // Plan revenue (by year)
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planData, setPlanData] =
    useState<TransactionPlanRevenueInsightResponse | null>(null);

  const [loadingPurchaseTable, setLoadingPurchaseTable] = useState(false);
  const [purchaseTableData, setPurchaseTableData] =
    useState<SubscriptionPlanPurchaseStatItem[] | null>(null);

  // NEW: plan purchase ratio (top + other)
  const [loadingPurchaseRatio, setLoadingPurchaseRatio] = useState(false);
  const [purchaseRatioData, setPurchaseRatioData] =
    useState<SubscriptionPlanPurchaseStatItem[] | null>(null);

  // NEW: monthly plan purchases (per plan per month in year)
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlyData, setMonthlyData] =
    useState<SubscriptionPlanMonthlyPurchaseResponse | null>(null);

  const loadPaymentModeInsight = async (y: number) => {
    setLoadingMode(true);
    try {
      const res = await getPaymentModeInsightForAdmin(y);
      setModeData(res ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMode(false);
    }
  };

  const loadPlanRevenueInsight = async (y: number) => {
    setLoadingPlan(true);
    try {
      const res = await getPlanRevenueInsightForAdmin(y);
      setPlanData(res ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlan(false);
    }
  };

  // NEW: load table (all-time stats)
  const loadPlanPurchaseTable = async () => {
    setLoadingPurchaseTable(true);
    try {
      const res = await getPlanPurchaseTableForAdmin();
      setPurchaseTableData(res ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPurchaseTable(false);
    }
  };

  // NEW: load ratio (top 3 + other, all-time)
  const loadPlanPurchaseRatio = async () => {
    setLoadingPurchaseRatio(true);
    try {
      const res = await getPlanPurchaseRatioForAdmin(3);
      setPurchaseRatioData(res ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPurchaseRatio(false);
    }
  };

   const loadPlanMonthlyPurchases = async (y: number) => {
    setLoadingMonthly(true);
    try {
      const res = await getPlanMonthlyPurchasesForAdmin(y);
      setMonthlyData(res ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMonthly(false);
    }
  };

  // theo năm
  useEffect(() => {
    loadPaymentModeInsight(year);
    loadPlanRevenueInsight(year);
      loadPlanMonthlyPurchases(year); 
  }, [year]);

  // all-time stats: load một lần
  useEffect(() => {
    loadPlanPurchaseTable();
    loadPlanPurchaseRatio();
  }, []);

  // danh sách năm để chọn
  const yearOptions: number[] = [];
  for (let y = CURRENT_YEAR - 3; y <= CURRENT_YEAR + 1; y += 1) {
    yearOptions.push(y);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-slate-900 m-0">
              Subscription overview
            </h1>
            <p className="text-xs md:text-sm text-slate-500 m-0">
              Insight by plan purchases, payment mode &amp; plan revenue.
            </p>
          </div>
        </div>

        {/* Year filter */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">Year</span>
          <Select
            size="small"
            value={year}
            onChange={(value) => setYear(Number(value))}
            style={{ width: 96 }}
          >
            {yearOptions.map((y) => (
              <Option key={y} value={y}>
                {y}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* NEW: Plan purchase ratio + table (đưa lên đầu) */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PlanPurchaseRatioChart
          data={purchaseRatioData}
          loading={loadingPurchaseRatio}
        />
        <PlanPurchaseStatsTable
          data={purchaseTableData}
          loading={loadingPurchaseTable}
        />
      </div>
      {/* NEW: Monthly plan purchases (stacked by plan) */}
      <MonthlyPlanPurchaseChart data={monthlyData} loading={loadingMonthly} />
      {/* Chart: Payment mode insight */}
      <PaymentModeInsightChart data={modeData} loading={loadingMode} />

      {/* Chart: Revenue by plan */}
      <PlanRevenueInsightChart data={planData} loading={loadingPlan} />

    </div>
  );
};

export default SubscriptionOverviewPage;
