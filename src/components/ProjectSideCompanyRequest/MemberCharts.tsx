/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { getProjectMemberCharts } from '@/services/projectMember.js';

const COLORS = ['#6366f1', '#10b981', '#facc15', '#f472b6'];

interface MemberChartsProps {
  projectId: string;
}

const MemberCharts: React.FC<MemberChartsProps> = ({ projectId }) => {
  const [chartsData, setChartsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      try {
        const data = await getProjectMemberCharts(projectId);
        setChartsData(data);
      } catch (error) {
        console.error('Error fetching charts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, [projectId]);

  if (loading) return <Spin className="my-8" />;

  if (!chartsData) return <div className="text-center py-8 text-gray-500">No chart data</div>;

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Chart 1: Joined over time */}
      <Card title="Members Joined Over Time" className="shadow-inner border rounded-2xl">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartsData.joinedOverTime}>
            <defs>
              <linearGradient id="colorMember" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="members" stroke="#6366f1" fill="url(#colorMember)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Chart 2: Gender → PieChart */}
      <Card title="Gender Distribution" className="shadow-inner border rounded-2xl">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartsData.genderDistribution}
              dataKey="count"
              nameKey="gender"
              outerRadius={80}
              label
            >
              {chartsData.genderDistribution.map((_: any, index: number) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Chart 3: Status → Horizontal Bar */}
      <Card title="Status Distribution" className="shadow-inner border rounded-2xl">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart layout="vertical" data={chartsData.statusDistribution}>
            <XAxis type="number" />
            <YAxis dataKey="status" type="category" />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Chart 4: Partner → Column Chart */}
      <Card title="Partner Distribution" className="shadow-inner border rounded-2xl">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartsData.partnerDistribution}>
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#f472b6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default MemberCharts;
