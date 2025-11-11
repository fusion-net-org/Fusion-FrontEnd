// src/pages/admin/CompanyOverviewChart.tsx
import React, { useEffect, useState } from 'react';
import { Card } from 'antd';
import { Line, Pie } from 'react-chartjs-2';
import { Building2, PieChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import {
  getCompaniesCreatedByMonth,
  getCompanyStatusCounts,
} from '@/services/adminDashboardService.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
);

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

export default function CompanyOverviewChart() {
  const [companyByMonth, setCompanyByMonth] = useState<number[]>([]);
  const [statusCounts, setStatusCounts] = useState<{ active: number; inactive: number }>({
    active: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [resMonth, resStatus] = await Promise.all([
          getCompaniesCreatedByMonth(),
          getCompanyStatusCounts(),
        ]);

        if (resMonth?.succeeded && resMonth.data?.monthlyCounts)
          setCompanyByMonth(resMonth.data.monthlyCounts);
        else setCompanyByMonth([]);

        if (resStatus?.succeeded && resStatus.data) setStatusCounts(resStatus.data);
        else setStatusCounts({ active: 0, inactive: 0 });
      } catch (error) {
        console.error('Error fetching company charts:', error);
        setCompanyByMonth([]);
        setStatusCounts({ active: 0, inactive: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Chart 1 - Companies Created (Line)
  const chartCompanyData = {
    labels: monthLabels.slice(0, companyByMonth.length),
    datasets: [
      {
        label: 'Companies',
        data: companyByMonth,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.25)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartCompanyOptions = {
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
      },
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 12 } } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', stepSize: 1, callback: (value: number) => `${value}` },
      },
    },
  };

  // Chart 2 - Company Status (Pie)
  const statusData = {
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [statusCounts.active, statusCounts.inactive],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    radius: '100%',
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 8,
        displayColors: false,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Chart 1 - Companies Created */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            <span>Companies Created by Month</span>
          </div>
        }
        bordered
        className="shadow-sm"
      >
        <div className="h-[220px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
          ) : (
            <Line data={chartCompanyData} options={chartCompanyOptions as any} />
          )}
        </div>
      </Card>

      {/* Chart 2 - Company Status */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <PieChart size={18} />
            <span>Company Status Ratio</span>
          </div>
        }
        bordered
        className="shadow-sm"
      >
        <div className="h-[220px] flex items-center justify-center">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <Pie data={statusData} options={statusOptions as any} />
          )}
        </div>
        <div className="text-center mt-3 text-sm text-gray-600">
          Total companies: <b>{statusCounts.active + statusCounts.inactive}</b> | Active:{' '}
          {statusCounts.active} | Inactive: {statusCounts.inactive}
        </div>
      </Card>
    </div>
  );
}
