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
import { getCompanyStatusCounts, getUserStatusCounts } from '@/services/adminDashboardService.js';
ChartJS.register(ArcElement, ChartTooltip, Legend, RadialLinearScale);

const Dashboard = () => {
  const [planPage, setPlanPage] = useState(1);
  const [transPage, setTransPage] = useState(1);
  const itemsPerPage = 5;

  const [companyCounts, setCompanyCounts] = useState({ active: 0, inactive: 0, total: 0 });
  const [userCounts, setUserCounts] = useState({ countTrue: 0, countFalse: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyRes = await getCompanyStatusCounts();
        const userRes = await getUserStatusCounts();

        setCompanyCounts(companyRes.data);
        setUserCounts(userRes.data);
      } catch (error) {
        console.error('Dashboard API error:', error);
      }
    };

    fetchData();
  }, []);

  const kpis = [
    {
      title: 'Total Account',
      value: userCounts.countTrue + userCounts.countFalse,
      subtitle: 'active daily login',
      img: icTotalAcc,
    },
    {
      title: 'Total Company',
      value: companyCounts.total,
      subtitle: 'use services',
      img: icTotalCompany,
    },
    { title: 'Total Projects', value: '17k', subtitle: 'created on platform', img: icTotalPj },
    //{ title: 'Total Users', value: '9,453', subtitle: 'activated', img: icTotalUser },
    { title: 'Total Revenue', value: '13,200', subtitle: 'units in stock', img: icTotalRevenue },
  ];

  const revenueData = [
    { month: 'Jan', User: 3500, Account: 4200, Revenue: 2800 },
    { month: 'Feb', User: 2800, Account: 5200, Revenue: 1800 },
    { month: 'Mar', User: 2400, Account: 3500, Revenue: 2200 },
    { month: 'Apr', User: 3800, Account: 5000, Revenue: 3200 },
    { month: 'May', User: 3200, Account: 4500, Revenue: 2600 },
    { month: 'Jun', User: 2600, Account: 3800, Revenue: 2400 },
    { month: 'Jul', User: 3400, Account: 4800, Revenue: 2800 },
  ];

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

  const subscriptionData = [
    { name: 'Basic', value: 20, color: '#ff8a80' },
    { name: 'Standard', value: 45, color: '#4fc3f7' },
    { name: 'Premium', value: 35, color: '#b388ff' },
  ];

  const transactions = [
    {
      id: '1234232',
      orderCode: 'FDV342FV',
      amount: 15,
      status: 'Paid',
      time: '11/08/2025',
      user: 'cao_trung890',
      plan: 'Basic',
      planColor: 'text-blue-600',
    },
    {
      id: '3954323',
      orderCode: 'GHGF577G',
      amount: 30,
      status: 'Paid',
      time: '07/26/1998',
      user: 'tran_xuan639',
      plan: 'Standard',
      planColor: 'text-emerald-600',
    },
    {
      id: '1714802',
      orderCode: 'VNS121HD',
      amount: 50,
      status: 'Paid',
      time: '01/20/1951',
      user: 'hoang_thien916',
      plan: 'Premium',
      planColor: 'text-amber-600',
    },
    {
      id: '7907434',
      orderCode: 'MMBIGH42',
      amount: 15,
      status: 'Paid',
      time: '12/08/2025',
      user: 'trinh_van531',
      plan: 'Basic',
      planColor: 'text-blue-600',
    },
    {
      id: '9092637',
      orderCode: 'HG34FFDX',
      amount: 15,
      status: 'Paid',
      time: '09/17/2026',
      user: 'nguyentam381',
      plan: 'Basic',
      planColor: 'text-blue-600',
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

  // Chart.js dataset
  const chartData = {
    labels: subscriptionData.map((s) => s.name),
    datasets: [
      {
        data: subscriptionData.map((s) => s.value),
        backgroundColor: subscriptionData.map((s) => s.color),
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { position: 'bottom' as const },
    },
  };

  // Pagination slice
  const planStart = (planPage - 1) * itemsPerPage;
  const transStart = (transPage - 1) * itemsPerPage;

  const planSlice = planData.slice(planStart, planStart + itemsPerPage);
  const transSlice = transactions.slice(transStart, transStart + itemsPerPage);

  const totalPlanPages = Math.ceil(planData.length / itemsPerPage);
  const totalTransPages = Math.ceil(transactions.length / itemsPerPage);

  return (
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
            <BarChart data={revenueData}>
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
              <Bar dataKey="Account" fill="#4db6ac" radius={[4, 4, 0, 0]} />
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
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
            <h2 className="text-base font-semibold text-gray-800">Subscription Ratio</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">Ratio of generated leads</p>
          <div className="w-full h-[350px] flex items-center justify-center">
            <PolarArea data={chartData} options={chartOptions} />
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
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Plan name</th>
              </tr>
            </thead>
            <tbody>
              {transSlice.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-700">{t.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{t.orderCode}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{t.amount}$</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center h-7 px-3 text-xs font-medium rounded-full ${payBadge(
                        t.status,
                      )}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{t.time}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{t.user}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium ${t.planColor}`}>{t.plan}</span>
                  </td>
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
  );
};

export default Dashboard;
