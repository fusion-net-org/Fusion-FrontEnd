import React, { useEffect, useState } from 'react';
import { Line, PolarArea } from 'react-chartjs-2';
import { Users, Building2, FolderKanban, DollarSign } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from 'chart.js';
import {
  overviewDashboard,
  getRevenueMonthlyByYear,
  getStatusPackage,
  getCompaniesCreatedByMonth,
} from '@/services/adminDashboardService.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
);

const StatCard = ({ title, value, icon: Icon, color, bgColor }: any) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col justify-between min-w-[230px] flex-1 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-3">
        {Icon && (
          <div
            className={`${
              bgColor ?? 'bg-gray-100'
            } p-2.5 rounded-lg flex items-center justify-center`}
          >
            <Icon className={`${color ?? 'text-gray-600'} w-5 h-5`} />
          </div>
        )}
        <p className="text-sm font-medium text-gray-600">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

// DASHBOARD
export default function Dashboard() {
  interface RevenueMonth {
    month: number;
    revenue: number;
  }

  const [dataOverview, setDataOverview] = useState({
    userCount: 0,
    companyCount: 0,
    projectCount: 0,
    revenueSum: 0,
  });

  const [revenueData, setRevenueData] = useState<RevenueMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [packageStats, setPackageStats] = useState<{ labels: string[]; orders: number[] }>({
    labels: [],
    orders: [],
  });
  const [companyByMonth, setCompanyByMonth] = useState<number[]>([]);

  // Fetch Overview
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await overviewDashboard();
        if (res?.succeeded && res.data) {
          setDataOverview(res.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard overview:', error);
      }
    };
    fetchOverview();
  }, []);

  // Fetch Revenue
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true);
        const res = await getRevenueMonthlyByYear();
        if (res?.succeeded && res.data?.months) {
          setRevenueData(res.data.months);
        } else {
          setRevenueData([]);
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        setRevenueData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  // Fetch Subscription Packages
  useEffect(() => {
    const fetchPackageStats = async () => {
      try {
        const res = await getStatusPackage();
        if (res?.succeeded && res.data?.items?.length) {
          const labels = res.data.items.map((i: any) => i.packageName);
          const orders = res.data.items.map((i: any) => i.orders);
          setPackageStats({ labels, orders });
        } else {
          setPackageStats({ labels: [], orders: [] });
        }
      } catch (error) {
        console.error('Error fetching package stats:', error);
        setPackageStats({ labels: [], orders: [] });
      }
    };
    fetchPackageStats();
  }, []);

  // Fetch Companies by Month
  useEffect(() => {
    const fetchCompanyStats = async () => {
      try {
        const res = await getCompaniesCreatedByMonth();
        if (res?.succeeded && res.data?.monthlyCounts) {
          setCompanyByMonth(res.data.monthlyCounts);
        } else {
          setCompanyByMonth([]);
        }
      } catch (error) {
        console.error('Error fetching company stats:', error);
        setCompanyByMonth([]);
      }
    };
    fetchCompanyStats();
  }, []);

  const monthLabels = [
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

  const chartRevenueData = {
    labels: revenueData.map((m) => monthLabels[m.month - 1]),
    datasets: [
      {
        label: 'Revenue',
        data: revenueData.map((m) => m.revenue),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartRevenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => `VND ${context.parsed?.y?.toLocaleString('vi-VN') ?? 0}`,
        },
      },
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 12 } } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          callback: (value: number) => `${(value / 1_000_000).toFixed(1)}đ`,
        },
      },
    },
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* OVERVIEW */}
      <div className="flex flex-wrap justify-between items-stretch gap-6">
        <StatCard
          title="Total Account"
          value={dataOverview.userCount.toLocaleString()}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Total Company"
          value={dataOverview.companyCount.toLocaleString()}
          icon={Building2}
          color="text-emerald-600"
          bgColor="bg-emerald-100"
        />
        <StatCard
          title="Total Project"
          value={dataOverview.projectCount.toLocaleString()}
          icon={FolderKanban}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <StatCard
          title="Total Revenue"
          value={`VND ${dataOverview.revenueSum.toLocaleString()}`}
          icon={DollarSign}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-gray-700 font-semibold mb-3">Revenue by Month</h2>
          <div className="h-72">
            {loading ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                Loading...
              </div>
            ) : (
              <Line data={chartRevenueData} options={chartRevenueOptions as any} />
            )}
          </div>
        </div>

        {/* Subscription Ratio */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-gray-700 font-semibold mb-3">Subscription Ratio</h2>
          <div className="h-72 flex items-center justify-center">
            {packageStats.labels.length ? (
              <PolarArea
                data={{
                  labels: packageStats.labels,
                  datasets: [
                    {
                      label: 'Orders',
                      data: packageStats.orders,
                      backgroundColor: ['#10b98190', '#3b82f690', '#f59e0b90', '#ef444490'],
                      borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  plugins: { legend: { position: 'bottom' } },
                  scales: { r: { ticks: { display: false }, grid: { color: '#e5e7eb' } } },
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            ) : (
              <div className="text-gray-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Companies Created by Month */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-gray-700 font-semibold mb-3">Companies Created by Month</h2>
        <div className="h-72">
          {loading ? (
            <div className="flex justify-center items-center h-full text-gray-500">Loading...</div>
          ) : (
            <Line
              data={{
                labels: monthLabels.slice(0, companyByMonth.length),
                datasets: [
                  {
                    label: 'Companies',
                    data: companyByMonth,
                    borderColor: '#f59e0b',
                    backgroundColor: '#f59e0b20',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#f59e0b',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                  },
                },
                scales: {
                  x: {
                    grid: { color: '#f1f5f9' },
                    ticks: { color: '#64748b', font: { size: 12 } },
                  },
                  y: {
                    grid: { color: '#f1f5f9' },
                    ticks: {
                      color: '#64748b',
                      stepSize: 1,
                      callback: (value) => `${value}`,
                    },
                  },
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
