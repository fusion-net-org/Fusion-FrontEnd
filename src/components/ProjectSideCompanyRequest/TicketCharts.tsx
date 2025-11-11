/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
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
} from 'recharts';
import { Card } from 'antd';

interface TicketChartsProps {
  sprintData?: { name: string; done: number; total: number }[];
  ticketsPerSprintData?: { name: string; created: number; done: number }[];

  ticketStatusData?: { name: string; value: number }[];
  budgetByStatus?: { status: string; budget: number }[];

  ticketPriorityData?: { priority: string; value: number }[];
  ticketUrgencyData?: { urgency: string; value: number }[];
  billableData?: { name: string; value: number }[];
  deleteStateData?: { name: string; value: number }[];
  resolvedClosedTimeline?: { date: string; resolved: number; closed: number }[];
}

const TicketCharts: React.FC<TicketChartsProps> = ({
  ticketStatusData = [
    { name: 'Open', value: 6 },
    { name: 'In Progress', value: 4 },
    { name: 'Resolved', value: 10 },
    { name: 'Closed', value: 7 },
  ],

  budgetByStatus = [
    { status: 'Open', budget: 1200 },
    { status: 'In Progress', budget: 3000 },
    { status: 'Resolved', budget: 4500 },
    { status: 'Closed', budget: 2000 },
  ],

  ticketPriorityData = [
    { priority: 'Low', value: 3 },
    { priority: 'Medium', value: 6 },
    { priority: 'High', value: 10 },
    { priority: 'Urgent', value: 8 },
  ],

  ticketUrgencyData = [
    { urgency: 'Low', value: 5 },
    { urgency: 'Medium', value: 7 },
    { urgency: 'High', value: 6 },
    { urgency: 'Critical', value: 4 },
  ],

  billableData = [
    { name: 'Billable', value: 12 },
    { name: 'Non-Billable', value: 7 },
  ],

  deleteStateData = [
    { name: 'Active', value: 16 },
    { name: 'Deleted', value: 3 },
  ],

  resolvedClosedTimeline = [
    { date: 'Week 1', resolved: 2, closed: 1 },
    { date: 'Week 2', resolved: 3, closed: 2 },
    { date: 'Week 3', resolved: 4, closed: 2 },
    { date: 'Week 4', resolved: 1, closed: 3 },
  ],
}) => {
  return (
    <div className="mt-8 space-y-8">
      {/* 2 main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 4️⃣ Ticket Status Overview */}
        <Card title="Ticket Status Overview" variant="outlined">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ticketStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* 5️⃣ Budget by Ticket Status */}
        <Card title="Budget by Ticket Status" variant="outlined">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={budgetByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="budget" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 🔥 NEW CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Priority */}
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

        {/* Urgency */}
        <Card title="Ticket Urgency">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ticketUrgencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="urgency" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Billable vs Non-Billable & Deleted */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Billable Ticket Ratio">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={billableData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Active vs Deleted Tickets">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deleteStateData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Timeline */}
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
