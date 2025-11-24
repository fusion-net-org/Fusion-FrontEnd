// src/pages/admin/transactionManagement/TransactionOverviewPage.tsx

import React, { useEffect, useState } from 'react';
import { BarChart3, CalendarDays } from 'lucide-react';
import { Select } from 'antd';

import {
  getMonthlyRevenueForAdmin,
  getMonthlyRevenueThreeYearsForAdmin,
  getMonthlyStatusForAdmin,
  getDailyCashflowForAdmin,
  getInstallmentAgingForAdmin,
  getTopCustomersForAdmin,
} from '@/services/transactionService.js';

import type {
  TransactionMonthlyRevenueResponse,
  TransactionMonthlyRevenueThreeYearsResponse,
  TransactionMonthlyStatusResponse,
  TransactionDailyCashflowResponse,
  TransactionInstallmentAgingResponse,
  TransactionTopCustomersResponse,
} from '@/interfaces/Transaction/TransactionPayment';

import MonthlyRevenueChart from '@/pages/admin/transactionManagement/Chart/MonthlyRevenueChart';
import MonthlyRevenueCompareChart from '@/pages/admin/transactionManagement/Chart/MonthlyRevenueCompareChart';
import PaymentHealthChart from '@/pages/admin/transactionManagement/Chart/PaymentHealthChart';
import DailyCashflowChart from '@/pages/admin/transactionManagement/Chart/DailyCashflowChart';
import InstallmentAgingChart from '@/pages/admin/transactionManagement/Chart/InstallmentAgingChart';
import TopCustomersChart from '@/pages/admin/transactionManagement/Chart/TopCustomersChart';

const { Option } = Select;
const CURRENT_YEAR = new Date().getFullYear();

const TransactionOverviewPage: React.FC = () => {
  const [year, setYear] = useState<number>(CURRENT_YEAR);

  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlyData, setMonthlyData] = useState<TransactionMonthlyRevenueResponse | null>(null);

  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareData, setCompareData] =
    useState<TransactionMonthlyRevenueThreeYearsResponse | null>(null);

  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthData, setHealthData] = useState<TransactionMonthlyStatusResponse | null>(null);

  const [loadingDaily, setLoadingDaily] = useState(false);
  const [dailyData, setDailyData] = useState<TransactionDailyCashflowResponse | null>(null);

  const [loadingAging, setLoadingAging] = useState(false);
  const [agingData, setAgingData] = useState<TransactionInstallmentAgingResponse | null>(null);

  const [loadingTop, setLoadingTop] = useState(false);
  const [topData, setTopData] = useState<TransactionTopCustomersResponse | null>(null);

  // Top N users cho chart "Top customers"
  const [topN, setTopN] = useState<number>(5);

  const loadMonthlyRevenue = async (y: number) => {
    setLoadingMonthly(true);
    try {
      const res = await getMonthlyRevenueForAdmin(y);
      setMonthlyData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const loadThreeYearRevenue = async (y: number) => {
    setLoadingCompare(true);
    try {
      const res = await getMonthlyRevenueThreeYearsForAdmin(y);
      setCompareData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCompare(false);
    }
  };

  const loadMonthlyStatus = async (y: number) => {
    setLoadingHealth(true);
    try {
      const res = await getMonthlyStatusForAdmin(y);
      setHealthData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadDailyCashflow = async () => {
    setLoadingDaily(true);
    try {
      const res = await getDailyCashflowForAdmin(30); // last 30 days
      setDailyData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDaily(false);
    }
  };

  const loadInstallmentAging = async () => {
    setLoadingAging(true);
    try {
      const res = await getInstallmentAgingForAdmin();
      setAgingData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAging(false);
    }
  };

  const loadTopCustomers = async (y: number, n: number) => {
    setLoadingTop(true);
    try {
      const res = await getTopCustomersForAdmin(y, n);
      setTopData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTop(false);
    }
  };

  useEffect(() => {
    loadMonthlyRevenue(year);
    loadThreeYearRevenue(year);
    loadMonthlyStatus(year);
    loadDailyCashflow();
    loadInstallmentAging();
    loadTopCustomers(year, topN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, topN]);

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
              Transaction overview
            </h1>
            <p className="text-xs md:text-sm text-slate-500 m-0">
              High-level metrics and revenue trends for your subscription payments.
            </p>
          </div>
        </div>

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

      {/* Row 1: revenue charts */}
      <div className="grid gap-5 md:grid-cols-2">
        <MonthlyRevenueChart data={monthlyData} loading={loadingMonthly} />
        <MonthlyRevenueCompareChart data={compareData} loading={loadingCompare} />
      </div>

      {/* Row 2: payment health + daily cashflow */}
      <div className="grid gap-5 md:grid-cols-2">
        <PaymentHealthChart data={healthData} loading={loadingHealth} />
        <DailyCashflowChart data={dailyData} loading={loadingDaily} days={30} />
      </div>

      {/* Row 3: installment aging + top customers */}
      <div className="grid gap-5 md:grid-cols-2">
        <InstallmentAgingChart data={agingData} loading={loadingAging} />
        <TopCustomersChart data={topData} loading={loadingTop} topN={topN} onTopNChange={setTopN} />
      </div>
    </div>
  );
};

export default TransactionOverviewPage;
