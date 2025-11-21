/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import Chart from 'react-apexcharts';
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

  if (loading) return <Spin className="my-8" size="large" />;

  if (!chartsData) return <div className="text-center py-8 text-gray-500">No chart data</div>;

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Chart 1: Joined over time → Area Chart */}
      <Card title="Members Joined Over Time" className="shadow-inner border rounded-2xl">
        <Chart
          type="area"
          series={[
            {
              name: 'Members',
              data: chartsData.joinedOverTime.map((item: any) => item.members),
            },
          ]}
          options={{
            chart: { toolbar: { show: true }, zoom: { enabled: false } },
            xaxis: { categories: chartsData.joinedOverTime.map((item: any) => item.month) },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth' },
            colors: ['#6366f1'],
            tooltip: { shared: true, intersect: false },
            yaxis: { title: { text: 'Members' } },
          }}
          height={250}
        />
      </Card>

      {/* Chart 2: Gender Distribution → Pie Chart */}
      <Card title="Gender Distribution" className="shadow-inner border rounded-2xl">
        <Chart
          type="donut"
          series={chartsData.genderDistribution.map((item: any) => item.count)}
          options={{
            labels: chartsData.genderDistribution.map((item: any) => item.gender),
            colors: COLORS,
            legend: { position: 'bottom' },
            tooltip: { y: { formatter: (val: number) => `${val} members` } },
          }}
          height={250}
        />
      </Card>

      {/* Chart 3: Status Distribution → Horizontal Bar */}
      <Card title="Status Distribution" className="shadow-inner border rounded-2xl">
        <Chart
          type="bar"
          series={[
            {
              name: 'Count',
              data: chartsData.statusDistribution.map((item: any) => item.count),
            },
          ]}
          options={{
            chart: { stacked: false, toolbar: { show: true } },
            plotOptions: { bar: { horizontal: true, barHeight: '50%' } },
            xaxis: { categories: chartsData.statusDistribution.map((item: any) => item.status) },
            colors: ['#10b981'],
            dataLabels: { enabled: true },
            tooltip: { y: { formatter: (val: number) => `${val} members` } },
          }}
          height={250}
        />
      </Card>

      {/* Chart 4: Partner Distribution → Column Chart */}
      <Card title="Partner Distribution" className="shadow-inner border rounded-2xl">
        <Chart
          type="bar"
          series={[
            {
              name: 'Count',
              data: chartsData.partnerDistribution.map((item: any) => item.count),
            },
          ]}
          options={{
            chart: { stacked: false, toolbar: { show: true } },
            plotOptions: { bar: { horizontal: false, columnWidth: '50%' } },
            xaxis: { categories: chartsData.partnerDistribution.map((item: any) => item.type) },
            colors: ['#f472b6'],
            dataLabels: { enabled: true },
            tooltip: { y: { formatter: (val: number) => `${val} partners` } },
          }}
          height={250}
        />
      </Card>
    </div>
  );
};

export default MemberCharts;
