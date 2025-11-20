import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { Card, Spin } from 'antd';
import { getSprintChartsByProjectId } from '@/services/sprintService.js';
interface StatusDistribution {
  status: string;
  count: number;
}

interface SprintWorkload {
  sprintName: string;
  estimatedHours: number;
  remainingHours: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  review: number;
}

const SprintEntityCharts: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [sprintWorkload, setSprintWorkload] = useState<SprintWorkload[]>([]);
  const statusLabels = ['Planning', 'Active', 'Completed', 'Closed'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getSprintChartsByProjectId(projectId);
        setStatusDistribution(data.statusDistribution || []);
        setSprintWorkload(data.sprintWorkload || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  if (loading) return <Spin tip="Loading charts..." />;

  return (
    <div className="space-y-8 mt-8">
      {/* Chart 1 - Doughnut */}
      <Card title="Sprint Status Distribution">
        <Chart
          type="donut"
          series={statusLabels.map(
            (label) => statusDistribution.find((s) => s.status === label)?.count || 0,
          )}
          options={{
            labels: statusLabels,
            colors: ['#F87171', '#FBBF24', '#34D399', '#A78BFA'],
            legend: { position: 'bottom' },
            tooltip: { y: { formatter: (val: number) => `${val} sprints` } },
          }}
          height={300}
        />
      </Card>

      <div className="flex flex-wrap gap-4">
        {/* Chart 2 - Column Chart (Estimated vs Remaining) */}
        <Card title="Sprint Workload (Estimate vs Remaining)" className="flex-1 min-w-[300px]">
          <Chart
            type="bar"
            series={[
              { name: 'Estimated', data: sprintWorkload.map((s) => s.estimatedHours) },
              { name: 'Remaining', data: sprintWorkload.map((s) => s.remainingHours) },
            ]}
            options={{
              chart: { stacked: false },
              plotOptions: { bar: { horizontal: false, columnWidth: '50%' } },
              xaxis: { categories: sprintWorkload.map((s) => s.sprintName) },
              colors: ['#93C5FD', '#4F46E5'],
              tooltip: { y: { formatter: (val: number) => `${val} hrs` } },
              dataLabels: { enabled: true, formatter: (val: number) => `${val}` },
            }}
            height={300}
          />
        </Card>

        {/* Chart 3 - Stacked AreaChart (Task Progress) */}
        <Card title="Task Progress per Sprint" className="flex-1 min-w-[300px]">
          <Chart
            type="area"
            series={[
              { name: 'To Do', data: sprintWorkload.map((s) => s.todoCount) },
              { name: 'In Progress', data: sprintWorkload.map((s) => s.inProgressCount) },
              { name: 'Done', data: sprintWorkload.map((s) => s.doneCount) },
              { name: 'Review', data: sprintWorkload.map((s) => s.review) },
            ]}
            options={{
              chart: { stacked: true, toolbar: { show: true } },
              xaxis: { categories: sprintWorkload.map((s) => s.sprintName) },
              colors: ['#F87171', '#FBBF24', '#34D399', '#60A5FA'],
              tooltip: { y: { formatter: (val: number) => `${val} tasks` } },
              fill: {
                type: 'gradient',
                gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.6,
                  opacityTo: 0.1,
                  stops: [0, 90, 100],
                },
              },
            }}
            height={300}
          />
        </Card>
      </div>
    </div>
  );
};

export default SprintEntityCharts;
