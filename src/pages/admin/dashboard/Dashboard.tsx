import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  Bar,
  ComposedChart,
} from 'recharts';

import { MoreVertical, Plus } from 'lucide-react';
import { PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  RadialLinearScale,
} from 'chart.js';
import icTotalAcc from '@/assets/admin/ic_total_acc.png';
import icTotalCompany from '@/assets/admin/ic_total_company.png';
import icTotalPj from '@/assets/admin/ic_total_pj.png';
import icTotalRevenue from '@/assets/admin/ic_total_revenue.png';
import {
  getTotalsDashboard,
  getMonthlyStats,
  getPlanRate,
} from '@/services/adminDashboardService.js';
import { getAllTransactionForAdmin, getTransactionById } from '@/services/transactionService.js';
import { Modal } from 'antd';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import PlanPurchaseRatioChart from '@/pages/admin/subcriptionManagement/Chart/PlanPurchaseRatioChart';
import type { SubscriptionPlanPurchaseStatItem } from '@/interfaces/Transaction/TransactionPayment';
import { getPlanPurchaseRatioForAdmin } from '@/services/transactionService.js';

ChartJS.register(ArcElement, ChartTooltip, Legend, RadialLinearScale);

type MonthlyStat = {
  month: number;
  users: number;
  companies: number;
  revenue: number;
};

type MonthlyApiData = {
  month: number;
  newUsers: number;
  newCompanies: number;
  totalTransactionAmount: number;
};

type Transaction = {
  id: string;
  orderCode: number;
  paymentLinkId?: string;
  amount: number;
  currency: string;
  transactionDateTime: string;
  status: string;
  userName: string;
  planName: string;
  userId?: string;
  planId?: string;
  description?: string;
  accountNumber?: string;
  reference?: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  type?: string;
  paymentMethod?: string;
};

const Dashboard = () => {
  const [planPage] = useState(1);
  const [transPage, setTransPage] = useState(1);
  const itemsPerPage = 5;

  const [totals, setTotals] = useState({
    userCount: 0,
    companyCount: 0,
    projectCount: 0,
    revenueSum: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [planRate, setPlanRate] = useState<{ planName: string; percentage: number }[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTrans, setTotalTrans] = useState(0);
  const navigate = useNavigate();

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [loadingPurchaseRatio, setLoadingPurchaseRatio] = useState(false);
  const [purchaseRatioData, setPurchaseRatioData] = useState<
    SubscriptionPlanPurchaseStatItem[] | null
  >(null);

  const fetchData = async () => {
    try {
      const totalsRes = await getTotalsDashboard();
      const monthlyRes = await getMonthlyStats();
      const res = await getPlanRate();

      setTotals(totalsRes.data);
      setMonthlyStats(
        monthlyRes.data.months.map((m: MonthlyApiData) => ({
          month: m.month,
          users: m.newUsers ?? 0,
          companies: m.newCompanies ?? 0,
          revenue: m.totalTransactionAmount,
        })),
      );
      if (res?.data) setPlanRate(res.data);

      const transRes = await getAllTransactionForAdmin({
        pageNumber: transPage,
        pageSize: itemsPerPage,
      });

      setTransactions(transRes.items);
      setTotalTrans(transRes.totalCount);
    } catch (error) {
      console.error('Dashboard API error:', error);
    }
  };

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
  useEffect(() => {
    loadPlanPurchaseRatio();
  }, []);

  const handleTransactionClick = async (transaction: Transaction) => {
    try {
      setIsModalOpen(true);
      const detail = await getTransactionById(transaction.id);
      setSelectedTransaction({
        ...transaction,
        ...detail,
      });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load transaction detail');
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transPage]);

  const kpis = [
    {
      title: 'Total Account',
      value: totals.userCount,
      subtitle: 'Active daily login',
      img: icTotalAcc,
      color: 'from-sky-500 to-sky-400',
      iconBg: 'bg-sky-100',
      badge: '+ Users',
    },
    {
      title: 'Total Company',
      value: totals.companyCount,
      subtitle: 'Using services',
      img: icTotalCompany,
      color: 'from-emerald-500 to-teal-400',
      iconBg: 'bg-emerald-100',
      badge: '+ Organizations',
    },
    {
      title: 'Total Projects',
      value: totals.projectCount,
      subtitle: 'Created on platform',
      img: icTotalPj,
      color: 'from-violet-500 to-indigo-400',
      iconBg: 'bg-violet-100',
      badge: '+ Projects',
    },
    {
      title: 'Total Revenue (VND)',
      value: totals.revenueSum.toLocaleString(),
      subtitle: 'All-time subscription revenue',
      img: icTotalRevenue,
      color: 'from-rose-500 to-pink-400',
      iconBg: 'bg-rose-100',
      badge: 'Revenue',
    },
  ];

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const revenueChartData = monthlyStats.map((m) => ({
    month: monthNames[m.month - 1],
    User: m.users,
    Company: m.companies,
    Revenue: m.revenue,
  }));

  const generateColors = (count: number) =>
    Array.from({ length: count }).map((_, i) => `hsl(${(i * 60) % 360}, 70%, 60%)`);

  const subscriptionLabels = planRate.map((p) => p.planName);
  const subscriptionValues = planRate.map((p) => p.percentage);
  const subscriptionColors = generateColors(planRate.length);

  const chartPlanData = {
    labels: subscriptionLabels,
    datasets: [
      {
        data: subscriptionValues,
        backgroundColor: subscriptionColors,
        borderWidth: 2,
      },
    ],
  };

  const payBadge = (status: string) =>
    status === 'Success'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold'
      : 'bg-amber-50 text-amber-700 border border-amber-300 font-semibold';

  const chartOptions = {
    layout: {
      padding: {
        bottom: 40,
      },
    },
    scales: {
      r: {
        ticks: { display: false },
        grid: { display: true },
      },
    },
    cutout: '40%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
        },
      },
      datalabels: { display: false },
    },
  } as const;

  const totalTransPages = Math.ceil(totalTrans / itemsPerPage);

  const handleUserClick = (uId: any) => {
    localStorage.setItem('userDetailEnabled', 'true');
    localStorage.setItem('userDetailId', uId);
    navigate(`/admin/users/detail/${uId}`);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-6 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-600">
                Admin Overview
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
                Fusion Platform Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Monitor key metrics, subscription performance and the latest transactions in
                real-time.
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
              >
                {/* Gradient strip */}
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${kpi.color}`}
                />
                {/* Soft glow */}
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${kpi.color} opacity-10 group-hover:opacity-20`}
                />

                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500 mb-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      {kpi.badge}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {kpi.title}
                    </p>
                    <h3 className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900">
                      {kpi.value}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">{kpi.subtitle}</p>
                  </div>
                  <div className={`${kpi.iconBg} rounded-xl p-3 shadow-inner`}>
                    <img src={kpi.img} alt={kpi.title} className="h-9 w-9 object-contain" />
                  </div>
                </div>

                {/* Progress bar (visual only) */}
                <div className="relative mt-4 h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-1.5 rounded-full bg-gradient-to-r ${kpi.color}`}
                    style={{ width: '50%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Area Chart */}
            <div className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Revenue by Month</h2>
                  <p className="text-xs text-slate-500">
                    New users, companies and subscription revenue by month.
                  </p>
                </div>
                <button className="inline-flex items-center rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <div className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  <span>New User</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>New Company</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span>Revenue</span>
                </div>
              </div>

              <div className="mt-2 h-[300px]">
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart
                    data={revenueChartData}
                    margin={{ top: 20, right: 5, left: 5, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.85} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke="#e5e7eb" vertical={false} strokeDasharray="3 3" />

                    <XAxis
                      dataKey="month"
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                      padding={{ left: 1, right: 1 }}
                      tick={{
                        fontSize: 12,
                        fill: '#6b7280',
                        fontWeight: 500,
                      }}
                    />

                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, 'auto']}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />

                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 'auto']}
                      tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        boxShadow: '0 18px 35px rgba(15,23,42,0.15)',
                        padding: 10,
                      }}
                      labelStyle={{ color: '#0f172a', fontSize: 12 }}
                      itemStyle={{ color: '#4b5563', fontSize: 11 }}
                    />

                    {/* New User */}
                    <Bar
                      yAxisId="left"
                      dataKey="User"
                      barSize={20}
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    />

                    {/* New Company */}
                    <Bar
                      yAxisId="left"
                      dataKey="Company"
                      barSize={20}
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />

                    {/* Revenue */}
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="Revenue"
                      stroke="#6366f1"
                      strokeWidth={2.2}
                      fill="url(#colorRevenue)"
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subscription Plan Ratio */}
            {/* <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Subscription Plan Purchase Ratio
                  </h2>
                  <p className="text-xs text-slate-500">
                    Percentage of successful transactions by subscription plan.
                  </p>
                </div>
                <button className="inline-flex items-center rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="flex h-[300px] items-center justify-center">
                {planRate.length > 0 ? (
                  <PolarArea data={chartPlanData} options={chartOptions} />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-sm text-slate-400">
                    <span className="mb-1 text-base">No data available</span>
                    <span>There are no successful plan transactions yet.</span>
                  </div>
                )}
              </div>
            </div> */}
            <div className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Subscription plan</h2>
                  <p className="text-xs text-slate-500">
                    Percentage of successful transactions by subscription plan.
                  </p>
                </div>
                <button className="inline-flex items-center rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 h-[300px]">
                <PlanPurchaseRatioChart data={purchaseRatioData} loading={loadingPurchaseRatio} />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
                <p className="text-xs text-slate-500">Latest subscription payment activities.</p>
              </div>
              <button className="inline-flex items-center rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-[11px] uppercase tracking-wide text-slate-100">
                    <th className="px-4 py-3 text-left font-semibold">Order Code</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Payment Time</th>
                    <th className="px-4 py-3 text-left font-semibold">User Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Plan Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Payment Method</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                        No transaction data found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr
                        key={t.id}
                        className="cursor-pointer bg-white/0 transition-colors hover:bg-slate-50"
                        onClick={() => handleTransactionClick(t)}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                          {t.orderCode || (
                            <span className="italic text-slate-400">Not provided</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] ${payBadge(
                              t.status,
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {t.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {new Date(t.transactionDateTime).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {t.userName || (
                            <span className="italic text-slate-400">Not provided</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {t.planName || (
                            <span className="italic text-slate-400">Not provided</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {t.type || <span className="italic text-slate-400">Not provided</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {t.paymentMethod || (
                            <span className="italic text-slate-400">Not provided</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                          {t.amount || '0'} {t.currency || 'vnd'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing{' '}
                <span className="font-semibold">
                  {totalTrans === 0 ? 0 : (transPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold">
                  {Math.min(transPage * itemsPerPage, totalTrans)}
                </span>{' '}
                of <span className="font-semibold">{totalTrans}</span> entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={transPage === 1}
                  onClick={() => setTransPage(transPage - 1)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 text-xs font-medium text-slate-700">
                  Page <span className="font-semibold">{transPage}</span> of{' '}
                  <span className="font-semibold">{totalTransPages || 1}</span>
                </span>
                <button
                  disabled={transPage === totalTransPages || totalTransPages === 0}
                  onClick={() => setTransPage(transPage + 1)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">Transaction Details</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        className="transaction-modal"
      >
        {selectedTransaction ? (
          <div className="space-y-5">
            <div className="mb-2 flex justify-end">
              <span
                className={`rounded-full px-4 py-1.5 text-xs font-bold border-2 ${
                  selectedTransaction.status === 'Paid' || selectedTransaction.status === 'Success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : selectedTransaction.status === 'Pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : selectedTransaction.status === 'Cancelled'
                    ? 'bg-red-50 text-red-700 border-red-300'
                    : 'bg-gray-50 text-gray-700 border-gray-300'
                }`}
              >
                {selectedTransaction.status}
              </span>
            </div>

            {/* Order Information */}
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Order Code
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {selectedTransaction.orderCode || (
                      <span className="italic text-slate-400">Not provided</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Transaction Date
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(selectedTransaction.transactionDateTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Section */}
            <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Total Amount
              </p>
              <p className="text-3xl font-black text-emerald-700">
                {selectedTransaction.currency}{' '}
                {selectedTransaction.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* User & Plan Information */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">
                User & Package Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      User Name
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        selectedTransaction.userId
                          ? 'cursor-pointer text-sky-600 hover:text-sky-800 hover:underline'
                          : 'text-slate-900'
                      }`}
                      onClick={() =>
                        selectedTransaction.userId && handleUserClick(selectedTransaction.userId)
                      }
                    >
                      {selectedTransaction.userName || (
                        <span className="italic text-slate-400">Not provided</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Payment Method
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedTransaction.paymentMethod || (
                        <span className="italic text-slate-400">Not provided</span>
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Package Name
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedTransaction.planName || (
                      <span className="italic text-slate-400">Not provided</span>
                    )}
                  </p>
                </div>
                {selectedTransaction.description && (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Description
                    </p>
                    <p className="text-sm text-slate-700">{selectedTransaction.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Information */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">
                Transaction Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between border-b border-slate-200 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Account Number
                  </span>
                  <span className="font-medium text-slate-900">
                    {selectedTransaction.accountNumber || (
                      <span className="italic text-slate-400">Not provided</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Reference
                  </span>
                  <span className="font-medium text-slate-900">
                    {selectedTransaction.reference || (
                      <span className="italic text-slate-400">Not provided</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Counter Account Name
                  </span>
                  <span className="font-medium text-slate-900">
                    {selectedTransaction.counterAccountName || (
                      <span className="italic text-slate-400">Not provided</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Counter Account Number
                  </span>
                  <span className="font-medium text-slate-900">
                    {selectedTransaction.counterAccountNumber || (
                      <span className="italic text-slate-400">Not provided</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-700">No data available</p>
            <p className="mt-1 text-sm text-slate-400">Transaction details could not be loaded.</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Dashboard;
