/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Legend,
  ComposedChart,
} from 'recharts';
import { Card, Spin } from 'antd';
import { GetTicketDashboard } from '@/services/TicketService.js';
import Chart from 'react-apexcharts';

interface TicketChartsProps {
  projectId: string;
  refreshKey?: number;
}

const TicketCharts: React.FC<TicketChartsProps> = ({ projectId, refreshKey }) => {
  const [loading, setLoading] = useState(true);
  const [ticketStatusData, setTicketStatusData] = useState<any[]>([]);
  const [budgetByPriority, setBudgetByPriority] = useState<any[]>([]);
  const [ticketPriorityData, setTicketPriorityData] = useState<any[]>([]);
  const [ResolvedAndClosedData, setResolvedAndClosedData] = useState<any[]>([]);
  const [resolvedClosedTimeline, setResolvedClosedTimeline] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    GetTicketDashboard(projectId)
      .then(
        (res: {
          data: {
            ticketStatusData: any;
            budgetByPriority: any;
            ticketPriorityData: any;
            resolvedAndClosedData: any;
            resolvedClosedTimeline: any;
          };
        }) => {
          if (res?.data) {
            console.log(res.data);
            setTicketStatusData(res.data.ticketStatusData || []);
            setBudgetByPriority(res.data.budgetByPriority || []);
            setTicketPriorityData(res.data.ticketPriorityData || []);
            setResolvedAndClosedData(res.data.resolvedAndClosedData || []);
            setResolvedClosedTimeline(res.data.resolvedClosedTimeline || []);
          }
        },
      )
      .catch((err: any) => {
        console.error('Error fetching ticket dashboard:', err);
      })
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }
  const statusLabels = ticketStatusData.map((item) => item.name || item.status);
  const statusSeries = ticketStatusData.map((item) => item.value);

  const series = [
    {
      name: 'Budget',
      data: budgetByPriority.map((item) => item.budget),
    },
  ];

  const categories = budgetByPriority.map((item) => item.status);

  return (
    <div className="mt-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Ticket Status Overview">
          <Chart
            type="donut"
            series={statusSeries}
            options={{
              labels: statusLabels,
              colors: ['#3b82f6', '#facc15', '#22c55e', '#fb923c'],
              legend: { position: 'bottom' },
              tooltip: { y: { formatter: (val: number) => `${val} tickets` } },
            }}
            height={250}
          />
        </Card>

        <Card title="Budget by Ticket Status">
          <Chart
            type="bar"
            series={series}
            options={{
              chart: { stacked: false, toolbar: { show: true } },
              plotOptions: { bar: { horizontal: false, columnWidth: '50%' } },
              xaxis: { categories },
              colors: ['#14b8a6'],
              tooltip: { y: { formatter: (val: number) => `${val.toLocaleString('vi-VN')} VND` } },
              dataLabels: {
                enabled: true,
                formatter: (val: number) => `${val.toLocaleString('vi-VN')}`,
              },
            }}
            height={250}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Ticket Priority">
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={ticketPriorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" barSize={40} fill="#fb923c" name="Value" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Resolved vs Closed Tickets">
          {ResolvedAndClosedData && ResolvedAndClosedData.length > 0 ? (
            <Chart
              type="donut"
              series={ResolvedAndClosedData.map((item) => item.value)}
              options={{
                labels: ResolvedAndClosedData.map((item) => item.name),
                colors: ['#22c55e', '#ef4444'],
                legend: { position: 'bottom' },
                tooltip: { y: { formatter: (val: number) => `${val} tickets` } },
              }}
              height={250}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No data</div>
          )}
        </Card>
      </div>
      <Card title="Resolved vs Closed Ticket Over Time">
        <Chart
          type="line"
          series={[
            {
              name: 'Resolved',
              data: resolvedClosedTimeline.map((item) => item.resolved),
            },
            {
              name: 'Closed',
              data: resolvedClosedTimeline.map((item) => item.closed),
            },
          ]}
          options={{
            chart: { toolbar: { show: true } },
            xaxis: {
              categories: resolvedClosedTimeline.map((item) => item.date),
            },
            colors: ['#22c55e', '#3b82f6'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth' },
            tooltip: { shared: true, intersect: false },
            legend: { position: 'bottom' },
          }}
          height={280}
        />
      </Card>
    </div>
  );
};

export default TicketCharts;
