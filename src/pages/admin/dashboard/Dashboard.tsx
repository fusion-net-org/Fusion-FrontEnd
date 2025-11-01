import React from 'react';
import { Line, Bar, Doughnut, PolarArea, Radar } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
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
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
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
  // Fake data
  const monthlyRevenue = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 15000, 13000, 17000, 21000, 19000, 25000, 23000, 26000],
        backgroundColor: '#3b82f6',
        borderRadius: 8,
      },
    ],
  };

  const subscriptionRatio = {
    labels: ['Basic', 'Standard', 'Premium'],
    datasets: [
      {
        data: [40, 35, 25],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
        borderWidth: 2,
      },
    ],
  };

  const companyStatus = {
    labels: ['Active', 'Inactive', 'Waiting'],
    datasets: [
      {
        data: [60, 25, 15],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
      },
    ],
  };

  const transactionSuccess = {
    labels: ['Success', 'Failed'],
    datasets: [
      {
        data: [85, 15],
        backgroundColor: ['#10b981', '#ef4444'],
      },
    ],
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* ========== OVERVIEW ========== */}
      <div className="flex flex-wrap gap-6 justify-between">
        <div className="flex-1 min-w-[220px]">
          <StatCard
            title="Total Account (Registered)"
            value="48,725"
            data={[30, 45, 50, 55, 60, 70, 80]}
            color="#10b981"
            trend="Increase last month"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <StatCard
            title="Total Company"
            value="7,340"
            data={[20, 25, 30, 28, 35, 40, 45]}
            color="#10b981"
            trend="Increase last month"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <StatCard
            title="Total Project"
            value="15,982"
            data={[40, 50, 55, 60, 62, 70, 75]}
            color="#10b981"
            trend="Increase last month"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <StatCard
            title="Total Revenue"
            value="$1.24M"
            data={[65, 62, 68, 66, 64, 70, 72]}
            color="#ef4444"
            trend="Slight decrease last month"
          />
        </div>
      </div>

      {/* ========== CHARTS GRID ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-gray-700 font-semibold mb-3">Revenue by Month</h2>
          <div className="h-72">
            <Line
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [
                  {
                    label: 'Revenue',
                    data: [12000, 15000, 13000, 17000, 21000, 19000, 25000, 23000],
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f620',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `$${context.parsed?.y?.toLocaleString() ?? ''}`,
                    },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } },
                },
              }}
            />
          </div>
        </div>

        {/* Subscription Ratio (Polar Area Chart) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-gray-700 font-semibold mb-3">Subscription Ratio</h2>
          <div className="h-72 flex items-center justify-center">
            <PolarArea
              data={{
                labels: ['Basic', 'Standard', 'Premium'],
                datasets: [
                  {
                    label: 'Active',
                    data: [40, 35, 25],
                    backgroundColor: ['#10b98190', '#3b82f690', '#f59e0b90'],
                    borderColor: ['#10b981', '#3b82f6', '#f59e0b'],
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
          </div>
        </div>
      </div>

      {/* ========== COMPANY & PROJECT STATUS ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Status (Bar Chart) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-gray-700 font-semibold mb-3 text-center">Company Status</h2>
          <div className="flex-1">
            <Bar
              data={{
                labels: ['Active', 'Inactive', 'Waiting'],
                datasets: [
                  {
                    label: 'Companies',
                    data: [45, 25, 10],
                    backgroundColor: ['#10b981aa', '#f87171aa', '#fbbf24aa'],
                    borderColor: ['#10b981', '#f87171', '#fbbf24'],
                    borderWidth: 2,
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                indexAxis: 'y',
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.x} Companies` } },
                },
                scales: {
                  x: { grid: { color: '#f1f5f9' } },
                  y: { grid: { display: false } },
                },
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>

        {/* Transaction Status (Radar Chart) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-gray-700 font-semibold mb-3 text-center">Transaction Status</h2>
          <div className="flex-1 flex items-center justify-center">
            <Radar
              data={{
                labels: ['Success', 'Fail', 'Pending'],
                datasets: [
                  {
                    label: 'Transactions',
                    data: [85, 10, 5],
                    backgroundColor: '#3b82f640',
                    borderColor: '#3b82f6',
                    pointBackgroundColor: '#3b82f6',
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: { position: 'bottom' },
                },
                scales: {
                  r: {
                    angleLines: { color: '#e5e7eb' },
                    grid: { color: '#f1f5f9' },
                    pointLabels: { color: '#475569', font: { size: 13 } },
                    ticks: { display: false },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center">
          <h2 className="text-gray-700 font-semibold mb-3">Summary</h2>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li>
              • Total Companies waiting approval:{' '}
              <span className="font-semibold text-gray-800">12</span>
            </li>
            <li>
              • Active Subscriptions: <span className="font-semibold text-gray-800">56</span>
            </li>
            <li>
              • Projects Completed: <span className="font-semibold text-gray-800">32</span>
            </li>
            <li>
              • Ongoing Projects: <span className="font-semibold text-gray-800">14</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
