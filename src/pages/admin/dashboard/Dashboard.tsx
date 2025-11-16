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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const totalsRes = await getTotalsDashboard();
        const monthlyRes = await getMonthlyStats();
        const res = await getPlanRate();

        setTotals(totalsRes.data);
        setMonthlyStats(monthlyRes.data);
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
    scales: {
      r: {
        ticks: {
          display: false,
        },
        grid: {
          display: true,
        },
      },
    },
    plugins: {
      legend: { position: 'bottom' as const },
      datalabels: {
        display: false,
      },
    },
  };

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
                <p className="text-gray-400 text-sm">Loading...</p>
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
                    onClick={async () => {
                      try {
                        setIsModalOpen(true); // mở modal ngay
                        const detail = await getTransactionById(t.id);
                        setSelectedTransaction({
                          ...t,
                          ...detail,
                        });
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to load transaction detail');
                      }
                    }}
                  >
                    <td className="py-3 px-4 text-sm text-gray-700">{t.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{t.orderCode}</td>
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
        title="Transaction Details"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={650}
      >
        {selectedTransaction ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Order Code">
              {selectedTransaction.orderCode}
            </Descriptions.Item>
            <Descriptions.Item label="User ID">
              {selectedTransaction.userId || selectedTransaction.userName}
            </Descriptions.Item>
            <Descriptions.Item label="Plan ID / Package Name">
              {selectedTransaction.planId} / {selectedTransaction.planName}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              {selectedTransaction.currency}{' '}
              {selectedTransaction.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Descriptions.Item>
            <Descriptions.Item label="Status">{selectedTransaction.status}</Descriptions.Item>
            <Descriptions.Item label="Transaction Date">
              {new Date(selectedTransaction.transactionDateTime).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedTransaction.description}
            </Descriptions.Item>
            <Descriptions.Item label="Account Number">
              {selectedTransaction.accountNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Reference">{selectedTransaction.reference}</Descriptions.Item>
            <Descriptions.Item label="Counter Account Name">
              {selectedTransaction.counterAccountName}
            </Descriptions.Item>
            <Descriptions.Item label="Counter Account Number">
              {selectedTransaction.counterAccountNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method">
              {selectedTransaction.paymentMethod}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <p className="text-center text-gray-400 py-4">No data available</p>
        )}
      </Modal>
    </>
  );
};

export default Dashboard;
