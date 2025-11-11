/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend,
  Cell,
} from 'recharts';
import { Card, Spin } from 'antd';
import { GetTicketDashboard } from '@/services/TicketService.js';

interface TicketChartsProps {
  projectId: string;
  refreshKey?: number;
}

const COLORS = ['#3b82f6', '#facc15', '#22c55e', '#fb923c'];
const COLORS2 = ['#22c55e', '#ef4444'];

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

  return (
    <div className="mt-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Ticket Status Overview" variant="outlined">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={ticketStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {ticketStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Budget by Ticket Status" variant="outlined">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={budgetByPriority}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="budget" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Ticket Priority">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ticketPriorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#fb923c" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Resolved vs Closed Tickets">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ResolvedAndClosedData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              >
                {ResolvedAndClosedData.map((entry, index) => (
                  <Cell key={`cell2-${index}`} fill={COLORS2[index % COLORS2.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Resolved vs Closed Ticket Over Time">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={resolvedClosedTimeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="resolved" stroke="#22c55e" />
            <Line type="monotone" dataKey="closed" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default TicketCharts;
