import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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
import icTotalUser from '@/assets/admin/ic_total_user.png';
import {
  getTotalsDashboard,
  getMonthlyStats,
  getPlanRate,
} from '@/services/adminDashboardService.js';
import { getAllTransactionForAdmin, getTransactionById } from '@/services/transactionService.js';
import { Modal, Descriptions } from 'antd';
import { toast } from 'react-toastify';
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
  paymentMethod?: string;
};

const Dashboard = () => {
  const [planPage, setPlanPage] = useState(1);
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

  //Modal detail transaction
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const totalsRes = await getTotalsDashboard();
      const monthlyRes = await getMonthlyStats();
      const res = await getPlanRate();

      setTotals(totalsRes.data);
      setMonthlyStats(
        monthlyRes.data.months.map((m: MonthlyApiData) => ({
          month: m.month,
          users: m.newUsers,
          companies: m.newCompanies,
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
  }, [transPage]);

  const kpis = [
    {
      title: 'Total Account',
      value: totals.userCount,
      subtitle: 'active daily login',
      img: icTotalAcc,
    },
    {
      title: 'Total Company',
      value: totals.companyCount,
      subtitle: 'use services',
      img: icTotalCompany,
    },
    {
      title: 'Total Projects',
      value: totals.projectCount,
      subtitle: 'created on platform',
      img: icTotalPj,
    },
    //{ title: 'Total Users', value: '9,453', subtitle: 'activated', img: icTotalUser },
    {
      title: 'Total Revenue (vnd)',
      value: totals.revenueSum.toLocaleString(),
      subtitle: 'units in stock',
      img: icTotalRevenue,
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

  const planData = [
    {
      userName: 'cao_trung890',
      plan: 'Basic',
      planColor: 'text-blue-600',
      status: 'Accept',
      update: '12/13/2024',
    },
    {
      userName: 'tran_xuan639',
      plan: 'Standard',
      planColor: 'text-emerald-600',
      status: 'Reject',
      update: '11/11/2024',
    },
    {
      userName: 'hoang_thien916',
      plan: 'Premium',
      planColor: 'text-amber-600',
      status: 'Accept',
      update: '06/15/2025',
    },
    {
      userName: 'trinh_van531',
      plan: 'Basic',
      planColor: 'text-blue-600',
      status: 'Accept',
      update: '11/07/2025',
    },
    {
      userName: 'nguyentam381',
      plan: 'Basic',
      planColor: 'text-blue-600',
      status: 'Pending',
      update: '06/08/2025',
    },
  ];

  const getStatusStyle = (status: string) => {
    if (status === 'Accept') return 'border-green-500 text-green-600 bg-white';
    if (status === 'Reject') return 'border-red-500 text-red-600 bg-white';
    return 'border-amber-500 text-amber-600 bg-white';
  };

  const payBadge = (status: string) =>
    status === 'Paid'
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
      : 'bg-amber-50 text-amber-600 border border-amber-200';

  const chartOptions = {
    layout: {
      padding: {
        bottom: 50,
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
      },
      datalabels: { display: false },
    },
  } as const;

  // Pagination slice
  const planStart = (planPage - 1) * itemsPerPage;
  const transStart = (transPage - 1) * itemsPerPage;

  const planSlice = planData.slice(planStart, planStart + itemsPerPage);
  const transSlice = transactions.slice(transStart, transStart + itemsPerPage);

  const totalPlanPages = Math.ceil(planData.length / itemsPerPage);
  const totalTransPages = Math.ceil(totalTrans / itemsPerPage);

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* KPI Cards + Revenue Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-2 auto-rows-min">
            {kpis.map((kpi, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-md p-10 flex flex-col justify-between text-left hover:shadow transition-shadow min-h-[140px]"
              >
                <div className="flex flex-col">
                  <p className="text-xl text-[#48464C] font-medium m-0">{kpi.title}</p>
                  <img src={kpi.img} alt={kpi.title} className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-3xl font-semibold text-[#48464C] leading-tight mb-1">
                    {kpi.value}
                  </h3>
                  <p className="text-sm text-gray-400">{kpi.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-1">Revenue by Month</h2>
                <p className="text-xs text-gray-500">Amount of revenue in this month</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip />
                <Bar dataKey="User" fill="#f48fb1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Company" fill="#4db6ac" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Revenue" fill="#64b5f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Request Plan + Subscription Ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Plan List */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Request Plan List</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      User name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Plan name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Update at
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {planSlice.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm text-gray-700">{item.userName}</td>
                      <td className="py-4 px-4">
                        <span className={`text-sm font-medium ${item.planColor}`}>{item.plan}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">{item.update}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex justify-end items-center mt-4 gap-2 text-sm">
              <button
                disabled={planPage === 1}
                onClick={() => setPlanPage(planPage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {planPage} / {totalPlanPages}
              </span>
              <button
                disabled={planPage === totalPlanPages}
                onClick={() => setPlanPage(planPage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Subscription Ratio (Chart.js) */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-gray-800">Subscription Plan Ratio</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Ratio of generated leads</p>

            <div className="w-full h-[350px] flex items-center justify-center">
              {planRate.length > 0 ? (
                <PolarArea data={chartPlanData} options={chartOptions} />
              ) : (
                <p className="text-gray-400 text-sm">No data...</p>
              )}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Transaction</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Order Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Payment time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    User name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Plan name
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleTransactionClick(t)}
                  >
                    <td className="py-3 px-4 text-sm text-gray-700">{t.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{t.orderCode || '---'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {t.amount} {t.currency}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center h-7 px-3 text-xs font-medium rounded-full ${payBadge(
                          t.status,
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {new Date(t.transactionDateTime).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{t.userName}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{t.planName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-end items-center mt-4 gap-2 text-sm">
            <button
              disabled={transPage === 1}
              onClick={() => setTransPage(transPage - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {transPage} / {totalTransPages}
            </span>
            <button
              disabled={transPage === totalTransPages}
              onClick={() => setTransPage(transPage + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Transaction Details</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        className="transaction-modal"
      >
        {selectedTransaction ? (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  selectedTransaction.status == 'Paid' || selectedTransaction.status == 'Success'
                    ? 'bg-green-100 text-green-700'
                    : selectedTransaction.status == 'Pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : selectedTransaction.status == 'Cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {selectedTransaction.status}
              </span>
            </div>

            {/* Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-semibold text-gray-800">
                    {selectedTransaction.id || (
                      <span className="text-gray-400 text-sm italic">Not provided</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order Code</p>
                  <p className="font-semibold text-gray-800">
                    {selectedTransaction.orderCode || (
                      <span className="text-gray-400 text-sm italic">Not provided</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transaction Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(selectedTransaction.transactionDateTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Section */}
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Amount</p>
              <p className="text-2xl font-bold text-blue-600">
                {selectedTransaction.currency}{' '}
                {selectedTransaction.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* User & Plan Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                User & Package Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">User ID</p>
                  <p className="text-sm text-gray-800">
                    {selectedTransaction.userId || (
                      <span className="text-gray-400 text-sm italic">Not provided</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">User Name</p>
                  <p className="text-sm text-gray-800">
                    {selectedTransaction.userName || (
                      <span className="text-gray-400 text-sm italic">Not provided</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                  <p className="text-sm text-gray-800">
                    {selectedTransaction.paymentMethod || (
                      <span className="text-gray-400 text-sm italic">Not provided</span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Plan ID / Package Name</p>
                <p className="text-sm text-gray-800">
                  {selectedTransaction.planId} / {selectedTransaction.planName}
                </p>
              </div>
              {selectedTransaction.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-800">{selectedTransaction.description}</p>
                </div>
              )}
            </div>

            {/* Banking Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                Banking Information
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-xs text-gray-500">Account Number</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedTransaction.accountNumber || (
                      <span className="text-gray-400 text-sm italic">Not provided</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-xs text-gray-500">Reference</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedTransaction.reference || (
                      <span className="text-gray-400 text-sm italic">Not provided</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-xs text-gray-500">Counter Account Name</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedTransaction.counterAccountName || (
                      <span className="text-gray-400 text-sm italic">Not provided</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-gray-500">Counter Account Number</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedTransaction.counterAccountNumber || (
                      <span className="text-gray-400 text-sm italic">Not provided</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <p className="text-gray-500 font-medium">No data available</p>
            <p className="text-gray-400 text-sm mt-1">Transaction details could not be loaded</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Dashboard;
