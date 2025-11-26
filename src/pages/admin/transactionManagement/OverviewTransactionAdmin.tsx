import React, { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const OverviewTransactionAdmin = () => {
  const [timeFilter, setTimeFilter] = useState('month');

  // Revenue data for line chart
  const revenueData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 61 },
    { month: 'May', value: 55 },
    { month: 'Jun', value: 67 },
    { month: 'Jul', value: 63 },
    { month: 'Aug', value: 70 },
    { month: 'Sep', value: 65 },
  ];

  // Expenses data for line chart
  const expenseData = [
    { month: 'Jan', value: 55 },
    { month: 'Feb', value: 48 },
    { month: 'Mar', value: 52 },
    { month: 'Apr', value: 45 },
    { month: 'May', value: 50 },
    { month: 'Jun', value: 58 },
    { month: 'Jul', value: 54 },
    { month: 'Aug', value: 51 },
    { month: 'Sep', value: 49 },
  ];

  // Profit data for line chart
  const profitData = [
    { month: 'Jan', value: 35 },
    { month: 'Feb', value: 38 },
    { month: 'Mar', value: 40 },
    { month: 'Apr', value: 42 },
    { month: 'May', value: 45 },
    { month: 'Jun', value: 47 },
    { month: 'Jul', value: 48 },
    { month: 'Aug', value: 51 },
    { month: 'Sep', value: 50 },
  ];

  // Combined bar chart data
  const barChartData = [
    { month: 'M1', revenue: 1280, expense: 690, profit: 730 },
    { month: 'M2', revenue: 950, expense: 720, profit: 650 },
    { month: 'M3', revenue: 1100, expense: 680, profit: 780 },
    { month: 'M4', revenue: 1150, expense: 650, profit: 820 },
    { month: 'M5', revenue: 1050, expense: 700, profit: 750 },
    { month: 'M6', revenue: 850, expense: 780, profit: 620 },
    { month: 'M7', revenue: 1200, expense: 650, profit: 850 },
    { month: 'M8', revenue: 950, expense: 720, profit: 680 },
    { month: 'M9', revenue: 1050, expense: 680, profit: 750 },
    { month: 'M10', revenue: 950, expense: 750, profit: 650 },
    { month: 'M11', revenue: 850, expense: 700, profit: 600 },
    { month: 'M12', revenue: 1000, expense: 650, profit: 780 },
  ];

  // Cash flow data
  const cashFlowData = [
    { month: 'M1', income: 150, expense: -180, net: 80 },
    { month: 'M2', income: 280, expense: -220, net: 150 },
    { month: 'M3', income: 150, expense: -180, net: 100 },
    { month: 'M4', income: 150, expense: -280, net: 80 },
    { month: 'M5', income: 380, expense: -320, net: 150 },
    { month: 'M6', income: 300, expense: -280, net: 210 },
    { month: 'M7', income: 210, expense: -250, net: 100 },
    { month: 'M8', income: 280, expense: -320, net: 120 },
    { month: 'M9', income: 320, expense: -280, net: 180 },
    { month: 'M10', income: 280, expense: -250, net: 150 },
    { month: 'M11', income: 150, expense: -200, net: 80 },
    { month: 'M12', income: 420, expense: -350, net: 280 },
  ];

  const MetricCard = ({ title, value, change, isPositive, data, color }: any) => {
    const gradientId = `gradient-${title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-gray-500 text-sm mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold">{value}</h2>
              <span className="text-sm text-gray-500">Million VND</span>
            </div>
            <div
              className={`flex items-center gap-1 mt-1 ${
                isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-medium">{change}%</span>
            </div>
          </div>

          {/* Filter & Refresh */}
          <div className="flex gap-2 items-center">
            <select className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-100">
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
            <button className="p-1 hover:bg-gray-100 rounded">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={true}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Data calculated until <span className="font-medium text-gray-500">6:22 PM</span> today.{' '}
          <span className="text-blue-500 hover:underline cursor-pointer">Download</span>
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div className="flex-1 min-w-[200px] sm:min-w-[250px] md:min-w-[300px] lg:min-w-[350px]">
          <MetricCard
            title="Total Revenue"
            value="65.338"
            change="15"
            isPositive={true}
            data={revenueData}
            color="#10b981"
          />
        </div>

        <div className="flex-1 min-w-[200px] sm:min-w-[250px] md:min-w-[300px] lg:min-w-[350px]">
          <MetricCard
            title="Total Expenses"
            value="51.212"
            change="6"
            isPositive={false}
            data={expenseData}
            color="#ef4444"
          />
        </div>

        <div className="flex-1 min-w-[200px] sm:min-w-[250px] md:min-w-[300px] lg:min-w-[350px]">
          <MetricCard
            title="Net Profit"
            value="5.126"
            change="10"
            isPositive={true}
            data={profitData}
            color="#3b82f6"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Revenue, Expenses, Profit</h3>
            <div className="flex gap-2">
              <select className="text-sm border rounded px-2 py-1">
                <option>This Year</option>
                <option>Last Year</option>
              </select>
              <button className="p-1 hover:bg-gray-100 rounded">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-semibold">4.800</span>
                <span className="text-gray-500 ml-1">Million VND</span>
                <p className="text-xs text-gray-400">REVENUE</p>
              </div>
              <div>
                <span className="font-semibold">2.120</span>
                <span className="text-gray-500 ml-1">Million VND</span>
                <p className="text-xs text-gray-400">EXPENSES</p>
              </div>
              <div>
                <span className="font-semibold">2.680</span>
                <span className="text-gray-500 ml-1">Million VND</span>
                <p className="text-xs text-gray-400">PROFIT</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
              <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">
            Data calculated until 6:22 PM today.{' '}
            <span className="text-blue-500 cursor-pointer">Download</span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Cash Flow</h3>
            <div className="flex gap-2">
              <select className="text-sm border rounded px-2 py-1">
                <option>This Year</option>
                <option>Last Year</option>
              </select>
              <button className="p-1 hover:bg-gray-100 rounded">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-semibold">4.800</span>
                <span className="text-gray-500 ml-1">Million VND</span>
                <p className="text-xs text-gray-400">INCOME</p>
              </div>
              <div>
                <span className="font-semibold">2.120</span>
                <span className="text-gray-500 ml-1">Million VND</span>
                <p className="text-xs text-gray-400">EXPENSES</p>
              </div>
              <div>
                <span className="font-semibold">2.680</span>
                <span className="text-gray-500 ml-1">Million VND</span>
                <p className="text-xs text-gray-400">NET</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
              <Bar dataKey="net" fill="#6b7280" name="Net" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">
            Data calculated until 6:22 PM today.{' '}
            <span className="text-blue-500 cursor-pointer">Download</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverviewTransactionAdmin;
