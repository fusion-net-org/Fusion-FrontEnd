import React, { useEffect, useState } from 'react';
import { Line, PolarArea } from 'react-chartjs-2';
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

// ---------- COMPONENT: OVERVIEW CARD ----------
const StatCard = ({ title, value, data, color, trend }: any) => {
  const chartData = {
    labels: Array(data.length).fill(''),
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: `${color}20`,
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 p-5 flex flex-col justify-between">
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-semibold text-gray-800 truncate max-w-[160px]">{value}</p>
          <div className="h-10 w-24">
            <Line data={chartData} options={options} />
          </div>
        </div>
      </div>
      <p className={`text-sm mt-2 ${color === '#ef4444' ? 'text-red-500' : 'text-green-500'}`}>
        {trend}
      </p>
    </div>
  );
};

// ---------- DASHBOARD MAIN ----------
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

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [revenueData, setRevenueData] = useState<RevenueMonth[]>([]);
  const [loading, setLoading] = useState(true);

  const [packageStats, setPackageStats] = useState<{
    labels: string[];
    orders: number[];
  }>({ labels: [], orders: [] });

  const yearOptions = [currentYear - 2, currentYear - 1, currentYear];
  const [companyByMonth, setCompanyByMonth] = useState<number[]>([]);

  // ---------- Fetch Overview ----------
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await overviewDashboard();
        if (res?.succeeded && res.data) {
          setDataOverview(res.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  // ---------- Fetch Revenue ----------
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true);
        const res = await getRevenueMonthlyByYear(year);
        if (res?.succeeded && res.data?.months) {
          const months = res.data.months as RevenueMonth[];
          const now = new Date();
          const filteredMonths =
            year === currentYear ? months.filter((m) => m.month <= now.getMonth() + 1) : months;
          setRevenueData(filteredMonths);
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
  }, [year]);

  // ---------- Fetch Subscription Packages ----------
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

  // ---------- Line Chart Config ----------
  const labels = [
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

  const chartData = {
    labels: revenueData.map((m) => labels[m.month - 1]),
    datasets: [
      {
        label: `Revenue ${year}`,
        data: revenueData.map((m) => m.revenue),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
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
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 12 } },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          callback: (value: number) => `${(value / 1_000_000).toFixed(1)}đ`,
        },
      },
    },
  };

  // ----- Company Status -----
  useEffect(() => {
    const fetchCompanyStats = async () => {
      try {
        const res = await getCompaniesCreatedByMonth(year);
        if (res?.succeeded && res.data?.monthlyCounts) {
          const counts = res.data.monthlyCounts;
          const now = new Date();
          const filtered = year === currentYear ? counts.slice(0, now.getMonth() + 1) : counts;
          setCompanyByMonth(filtered);
        } else {
          setCompanyByMonth([]);
        }
      } catch (error) {
        console.error('Error fetching company stats:', error);
        setCompanyByMonth([]);
      }
    };
    fetchCompanyStats();
  }, [year]);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* OVERVIEW */}
      <div className="flex flex-wrap gap-6 justify-between items-stretch">
        <div className="flex-1 min-w-[220px]">
          <StatCard
            title="Total Account (Registered)"
            value={dataOverview.userCount.toLocaleString()}
            data={[30, 45, 50, 55, 60, 70, 80]}
            color="#10b981"
            trend="Increase last month"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <StatCard
            title="Total Company"
            value={dataOverview.companyCount.toLocaleString()}
            data={[20, 25, 30, 28, 35, 40, 45]}
            color="#10b981"
            trend="Increase last month"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <StatCard
            title="Total Project"
            value={dataOverview.projectCount.toLocaleString()}
            data={[40, 50, 55, 60, 62, 70, 75]}
            color="#10b981"
            trend="Increase last month"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <StatCard
            title="Total Revenue"
            value={`VND ${dataOverview.revenueSum.toLocaleString()}`}
            data={[65, 62, 68, 66, 64, 70, 72]}
            color="#ef4444"
            trend="Slight decrease last month"
          />
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-gray-700 font-semibold">Revenue by Month</h2>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md text-sm px-2 py-1"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                Loading...
              </div>
            ) : (
              <Line data={chartData} options={chartOptions as any} />
            )}
          </div>
        </div>

        {/* Subscription Ratio (Polar Area Chart) */}
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
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-gray-700 font-semibold">Companies Created by Month</h2>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md text-sm px-2 py-1"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="h-72">
          {loading ? (
            <div className="flex justify-center items-center h-full text-gray-500">Loading...</div>
          ) : (
            <Line
              data={{
                labels: labels.slice(0, companyByMonth.length),
                datasets: [
                  {
                    label: `Companies ${year}`,
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
