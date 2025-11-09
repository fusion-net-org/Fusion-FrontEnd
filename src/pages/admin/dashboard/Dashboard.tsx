// import React, { useEffect, useState } from 'react';
// import { Line, PolarArea } from 'react-chartjs-2';
// import { Users, Building2, FolderKanban, DollarSign } from 'lucide-react';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   LineElement,
//   PointElement,
//   BarElement,
//   ArcElement,
//   Tooltip,
//   Legend,
//   Filler,
//   RadialLinearScale,
// } from 'chart.js';
// import {
//   overviewDashboard,
//   getRevenueMonthlyByYear,
//   getStatusPackage,
//   getCompaniesCreatedByMonth,
// } from '@/services/adminDashboardService.js';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   LineElement,
//   PointElement,
//   BarElement,
//   ArcElement,
//   RadialLinearScale,
//   Tooltip,
//   Legend,
//   Filler,
// );

// const StatCard = ({ title, value, icon: Icon, color, bgColor }: any) => {
//   return (
//     <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col justify-between min-w-[230px] flex-1 hover:shadow-md transition-all duration-200">
//       <div className="flex items-center gap-2 mb-3">
//         {Icon && (
//           <div
//             className={`${
//               bgColor ?? 'bg-gray-100'
//             } p-2.5 rounded-lg flex items-center justify-center`}
//           >
//             <Icon className={`${color ?? 'text-gray-600'} w-5 h-5`} />
//           </div>
//         )}
//         <p className="text-sm font-medium text-gray-600">{title}</p>
//       </div>
//       <p className="text-2xl font-bold text-gray-900">{value}</p>
//     </div>
//   );
// };

// // DASHBOARD
// export default function Dashboard() {
//   interface RevenueMonth {
//     month: number;
//     revenue: number;
//   }

//   const [dataOverview, setDataOverview] = useState({
//     userCount: 0,
//     companyCount: 0,
//     projectCount: 0,
//     revenueSum: 0,
//   });

//   const [revenueData, setRevenueData] = useState<RevenueMonth[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [packageStats, setPackageStats] = useState<{ labels: string[]; orders: number[] }>({
//     labels: [],
//     orders: [],
//   });
//   const [companyByMonth, setCompanyByMonth] = useState<number[]>([]);

//   // Fetch Overview
//   useEffect(() => {
//     const fetchOverview = async () => {
//       try {
//         const res = await overviewDashboard();
//         if (res?.succeeded && res.data) {
//           setDataOverview(res.data);
//         }
//       } catch (error) {
//         console.error('Failed to load dashboard overview:', error);
//       }
//     };
//     fetchOverview();
//   }, []);

//   // Fetch Revenue
//   useEffect(() => {
//     const fetchRevenue = async () => {
//       try {
//         setLoading(true);
//         const res = await getRevenueMonthlyByYear();
//         if (res?.succeeded && res.data?.months) {
//           setRevenueData(res.data.months);
//         } else {
//           setRevenueData([]);
//         }
//       } catch (error) {
//         console.error('Error fetching revenue data:', error);
//         setRevenueData([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchRevenue();
//   }, []);

//   // Fetch Subscription Packages
//   useEffect(() => {
//     const fetchPackageStats = async () => {
//       try {
//         const res = await getStatusPackage();
//         if (res?.succeeded && res.data?.items?.length) {
//           const labels = res.data.items.map((i: any) => i.packageName);
//           const orders = res.data.items.map((i: any) => i.orders);
//           setPackageStats({ labels, orders });
//         } else {
//           setPackageStats({ labels: [], orders: [] });
//         }
//       } catch (error) {
//         console.error('Error fetching package stats:', error);
//         setPackageStats({ labels: [], orders: [] });
//       }
//     };
//     fetchPackageStats();
//   }, []);

//   // Fetch Companies by Month
//   useEffect(() => {
//     const fetchCompanyStats = async () => {
//       try {
//         const res = await getCompaniesCreatedByMonth();
//         if (res?.succeeded && res.data?.monthlyCounts) {
//           setCompanyByMonth(res.data.monthlyCounts);
//         } else {
//           setCompanyByMonth([]);
//         }
//       } catch (error) {
//         console.error('Error fetching company stats:', error);
//         setCompanyByMonth([]);
//       }
//     };
//     fetchCompanyStats();
//   }, []);

//   const monthLabels = [
//     'Jan',
//     'Feb',
//     'Mar',
//     'Apr',
//     'May',
//     'Jun',
//     'Jul',
//     'Aug',
//     'Sep',
//     'Oct',
//     'Nov',
//     'Dec',
//   ];

//   const chartRevenueData = {
//     labels: revenueData.map((m) => monthLabels[m.month - 1]),
//     datasets: [
//       {
//         label: 'Revenue',
//         data: revenueData.map((m) => m.revenue),
//         borderColor: '#3b82f6',
//         backgroundColor: '#3b82f620',
//         fill: true,
//         tension: 0.4,
//       },
//     ],
//   };

//   const chartRevenueOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: { display: false },
//       tooltip: {
//         backgroundColor: '#1f2937',
//         titleColor: '#fff',
//         bodyColor: '#fff',
//         borderColor: '#3b82f6',
//         borderWidth: 1,
//         padding: 10,
//         displayColors: false,
//         callbacks: {
//           label: (context: any) => `VND ${context.parsed?.y?.toLocaleString('vi-VN') ?? 0}`,
//         },
//       },
//     },
//     scales: {
//       x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 12 } } },
//       y: {
//         grid: { color: '#f1f5f9' },
//         ticks: {
//           color: '#64748b',
//           callback: (value: number) => `${(value / 1_000_000).toFixed(1)}đ`,
//         },
//       },
//     },
//   };

//   return (
//     <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
//       {/* OVERVIEW */}
//       <div className="flex flex-wrap justify-between items-stretch gap-6">
//         <StatCard
//           title="Total Account"
//           value={dataOverview.userCount.toLocaleString()}
//           icon={Users}
//           color="text-blue-600"
//           bgColor="bg-blue-100"
//         />
//         <StatCard
//           title="Total Company"
//           value={dataOverview.companyCount.toLocaleString()}
//           icon={Building2}
//           color="text-emerald-600"
//           bgColor="bg-emerald-100"
//         />
//         <StatCard
//           title="Total Project"
//           value={dataOverview.projectCount.toLocaleString()}
//           icon={FolderKanban}
//           color="text-indigo-600"
//           bgColor="bg-indigo-100"
//         />
//         <StatCard
//           title="Total Revenue"
//           value={`VND ${dataOverview.revenueSum.toLocaleString()}`}
//           icon={DollarSign}
//           color="text-orange-600"
//           bgColor="bg-orange-100"
//         />
//       </div>

//       {/* CHARTS GRID */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Revenue Chart */}
//         <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
//           <h2 className="text-gray-700 font-semibold mb-3">Revenue by Month</h2>
//           <div className="h-72">
//             {loading ? (
//               <div className="flex justify-center items-center h-full text-gray-500">
//                 Loading...
//               </div>
//             ) : (
//               <Line data={chartRevenueData} options={chartRevenueOptions as any} />
//             )}
//           </div>
//         </div>

//         {/* Subscription Ratio */}
//         <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
//           <h2 className="text-gray-700 font-semibold mb-3">Subscription Ratio</h2>
//           <div className="h-72 flex items-center justify-center">
//             {packageStats.labels.length ? (
//               <PolarArea
//                 data={{
//                   labels: packageStats.labels,
//                   datasets: [
//                     {
//                       label: 'Orders',
//                       data: packageStats.orders,
//                       backgroundColor: ['#10b98190', '#3b82f690', '#f59e0b90', '#ef444490'],
//                       borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
//                       borderWidth: 2,
//                     },
//                   ],
//                 }}
//                 options={{
//                   plugins: { legend: { position: 'bottom' } },
//                   scales: { r: { ticks: { display: false }, grid: { color: '#e5e7eb' } } },
//                   responsive: true,
//                   maintainAspectRatio: false,
//                 }}
//               />
//             ) : (
//               <div className="text-gray-400">No data available</div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Companies Created by Month */}
//       <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
//         <h2 className="text-gray-700 font-semibold mb-3">Companies Created by Month</h2>
//         <div className="h-72">
//           {loading ? (
//             <div className="flex justify-center items-center h-full text-gray-500">Loading...</div>
//           ) : (
//             <Line
//               data={{
//                 labels: monthLabels.slice(0, companyByMonth.length),
//                 datasets: [
//                   {
//                     label: 'Companies',
//                     data: companyByMonth,
//                     borderColor: '#f59e0b',
//                     backgroundColor: '#f59e0b20',
//                     fill: true,
//                     tension: 0.4,
//                   },
//                 ],
//               }}
//               options={{
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                   legend: { display: false },
//                   tooltip: {
//                     backgroundColor: '#1f2937',
//                     titleColor: '#fff',
//                     bodyColor: '#fff',
//                     borderColor: '#f59e0b',
//                     borderWidth: 1,
//                     padding: 10,
//                     displayColors: false,
//                   },
//                 },
//                 scales: {
//                   x: {
//                     grid: { color: '#f1f5f9' },
//                     ticks: { color: '#64748b', font: { size: 12 } },
//                   },
//                   y: {
//                     grid: { color: '#f1f5f9' },
//                     ticks: {
//                       color: '#64748b',
//                       stepSize: 1,
//                       callback: (value) => `${value}`,
//                     },
//                   },
//                 },
//               }}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  Building2,
  FolderKanban,
  UserCheck,
  Package,
  MoreVertical,
  Plus,
} from 'lucide-react';
import icTotalAcc from '@/assets/admin/ic_total_acc.png';
import icTotalCompany from '@/assets/admin/ic_total_company.png';
import icTotalPj from '@/assets/admin/ic_total_pj.png';
import icTotalRevenue from '@/assets/admin/ic_total_revenue.png';
import icTotalUser from '@/assets/admin/ic_total_user.png';

const Dashboard = () => {
  const kpis = [
    { title: 'Total Account', value: '3,050', subtitle: 'active daily login', img: icTotalAcc },
    { title: 'Total Company', value: '150', subtitle: 'use services', img: icTotalCompany },
    { title: 'Total Projects', value: '17k', subtitle: 'created on platform', img: icTotalPj },
    { title: 'Total Users', value: '9,453', subtitle: 'activated', img: icTotalUser },
    { title: 'Total Revenue', value: '13,200', subtitle: 'units in stock', img: icTotalRevenue },
  ];

  // Revenue bar chart data
  const revenueData = [
    { month: 'Jan', User: 3500, Account: 4200, Revenue: 2800 },
    { month: 'Feb', User: 2800, Account: 5200, Revenue: 1800 },
    { month: 'Mar', User: 2400, Account: 3500, Revenue: 2200 },
    { month: 'Apr', User: 3800, Account: 5000, Revenue: 3200 },
    { month: 'May', User: 3200, Account: 4500, Revenue: 2600 },
    { month: 'Jun', User: 2600, Account: 3800, Revenue: 2400 },
    { month: 'Jul', User: 3400, Account: 4800, Revenue: 2800 },
  ];

  // Plan requests data
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

  // Subscription pie chart data
  const subscriptionData = [
    { name: 'Basic', value: 20, color: '#ff8a80', displayValue: '20%' },
    { name: 'Standard', value: 45, color: '#4fc3f7', displayValue: '45%' },
    { name: 'Premium', value: 35, color: '#b388ff', displayValue: '35%' },
  ];

  const getStatusStyle = (status: any) => {
    if (status === 'Accept') return 'border-green-500 text-green-600 bg-white';
    if (status === 'Reject') return 'border-red-500 text-red-600 bg-white';
    return 'border-amber-500 text-amber-600 bg-white';
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, displayValue }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#666"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="14"
      >
        {`${name} ${displayValue}`}
      </text>
    );
  };

  // Transaction table data (Row 3)
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

  const payBadge = (status: string) =>
    status === 'Paid'
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
      : 'bg-amber-50 text-amber-600 border border-amber-200';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Row 1: All KPI Cards + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Half: All KPI Cards in 2 rows of 3 */}
        <div className="grid grid-cols-3 gap-2 auto-rows-min">
          {/* 6 card */}
          {kpis.slice(0, 5).map((kpi, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-md p-10 flex flex-col justify-between text-left hover:shadow transition-shadow min-h-[140px]"
            >
              <div className="flex flex-col">
                <p className="text-xl text-[#48464C] font-medium m-0">{kpi.title}</p>
                <img src={kpi.img} alt={kpi.title} className="w-12 h-12" />
              </div>
              <div className="mt-0">
                <h3 className="text-3xl font-semibold text-[#48464C] leading-tight mb-1">
                  {kpi.value}
                </h3>
                <p className="text-sm text-gray-400 mt-1 mb-0">{kpi.subtitle}</p>
              </div>
            </div>
          ))}

          {/* Add New KPI */}
          <div className="bg-blue-50 border border-blue-100 rounded-md p-5 flex flex-col items-center justify-center min-h-[148px]">
            <button
              className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mb-3 hover:bg-blue-600 transition-colors"
              aria-label="Add New KPI"
            >
              <Plus className="w-5 h-5" />
            </button>
            <p className="text-sm text-blue-600 font-medium">Add New KPI</p>
          </div>
        </div>

        {/* Right Half: Revenue Chart */}
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
          <div className="flex items-end gap-4 justify-end mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
              <span className="text-xs text-gray-600">User</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-xs text-gray-600">Account</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-xs text-gray-600">Revenue</span>
            </div>
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
          <div className="text-right text-xs text-gray-500 mt-2">in $</div>
        </div>
      </div>

      {/* Row 2: Request Plan List and Subscription Ratio */}
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
                {planData.map((item, index) => (
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
        </div>

        {/* Subscription Ratio */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-800">Subscription Ratio</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">Ratio of generated leads</p>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={subscriptionData}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={(props) => <CustomLabel {...props} />}
              >
                {subscriptionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Transaction table */}
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
              {transactions.map((t) => (
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
      </div>
    </div>
  );
};

export default Dashboard;
