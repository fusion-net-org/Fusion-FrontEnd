import React, { useMemo } from 'react';
import { Card } from 'antd';
import { Doughnut, Line } from 'react-chartjs-2';
import { Users, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
);

interface User {
  id: string;
  userName: string;
  status: boolean;
}

interface Props {
  items: User[];
}

const UserOverviewCharts: React.FC<Props> = ({ items }) => {
  const growthData = useMemo(
    () => Array.from({ length: 8 }, () => Math.floor(Math.random() * 50) + 20),
    [],
  );

  const activeCount = items.filter((u) => u.status).length;
  const inactiveCount = items.filter((u) => !u.status).length;

  const statusData = {
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [activeCount, inactiveCount],
        backgroundColor: ['#22c55e', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  const growthChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'New Users',
        data: growthData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.3)',
        fill: true,
        tension: 0,
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: { position: 'bottom' as const },
    },
    maintainAspectRatio: false,
  };

  const lineOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } },
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            <span>User Growth</span>
          </div>
        }
        bordered
        className="shadow-sm"
      >
        <div className="h-[220px]">
          <Line data={growthChartData} options={lineOptions} />
        </div>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Users size={18} />
            <span>User Status</span>
          </div>
        }
        bordered
        className="shadow-sm"
      >
        <div className="h-[220px]">
          <Doughnut data={statusData} options={doughnutOptions} />
        </div>
        <div className="text-center mt-3 text-sm text-gray-600">
          Total users: <b>{items.length}</b> | Active: {activeCount} | Inactive: {inactiveCount}
        </div>
      </Card>
    </div>
  );
};

export default UserOverviewCharts;
