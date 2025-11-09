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
import { BarChart3, ClipboardList } from 'lucide-react';

interface TicketChartsProps {
  sprintData: { name: string; total: number; done: number }[];
  ticketsPerSprintData: { name: string; created: number; done: number }[];
  taskStatusData?: { name: string; value: number }[];
  taskPriorityData?: { priority: string; count: number }[];
  tasksPerSprint?: { sprint: string; tasks: number }[];
  ticketStatusData?: { name: string; value: number }[];
  budgetByStatus?: { status: string; budget: number }[];
  taskCompletionOverTime?: { week: string; done: number }[];
}

const TicketCharts: React.FC<TicketChartsProps> = ({
  sprintData,
  ticketsPerSprintData,
  taskStatusData = [
    { name: 'To Do', value: 10 },
    { name: 'In Progress', value: 7 },
    { name: 'In Review', value: 5 },
    { name: 'Done', value: 20 },
  ],
  taskPriorityData = [
    { priority: 'Low', count: 5 },
    { priority: 'Medium', count: 12 },
    { priority: 'High', count: 8 },
    { priority: 'Critical', count: 3 },
  ],
  tasksPerSprint = [
    { sprint: 'Sprint 1', tasks: 10 },
    { sprint: 'Sprint 2', tasks: 15 },
    { sprint: 'Sprint 3', tasks: 8 },
  ],
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
  taskCompletionOverTime = [
    { week: 'Week 1', done: 3 },
    { week: 'Week 2', done: 5 },
    { week: 'Week 3', done: 7 },
    { week: 'Week 4', done: 9 },
  ],
}) => {
  return (
    <div className="mt-8 space-y-8">
      {/* CHART 1: Sprint Task Overview */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-3">
          <BarChart3 className="text-indigo-500 w-5 h-5" />
          Sprint Task Overview
        </h2>
        <div className="bg-white border rounded-2xl shadow-inner p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sprintData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#CBD5E1" name="Total Tasks" radius={[4, 4, 0, 0]} />
              <Bar dataKey="done" fill="#6366F1" name="Completed Tasks" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <span>
              🟦 <strong>{sprintData.reduce((a, b) => a + b.done, 0)}</strong> done tasks
            </span>
            <span>
              📊 Total: <strong>{sprintData.reduce((a, b) => a + b.total, 0)}</strong> tasks
            </span>
          </div>
        </div>
      </div>

      {/* CHART 2: Tickets per Sprint */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mb-3">
          <ClipboardList className="text-indigo-500 w-5 h-5" />
          Tickets per Sprint
        </h2>
        <div className="bg-white border rounded-2xl shadow-inner p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ticketsPerSprintData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) =>
                  name === 'created'
                    ? [`${value}`, 'Created Tickets']
                    : name === 'done'
                    ? [`${value}`, 'Processed Tickets']
                    : [value, name]
                }
              />
              <Bar dataKey="created" fill="#93C5FD" name="Created Tickets" radius={[4, 4, 0, 0]} />
              <Bar dataKey="done" fill="#4F46E5" name="Processed Tickets" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <span>
              🟦 Created: <strong>{ticketsPerSprintData.reduce((a, b) => a + b.created, 0)}</strong>
            </span>
            <span>
              ✅ Processed: <strong>{ticketsPerSprintData.reduce((a, b) => a + b.done, 0)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 6 small charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1️⃣ Task Status Distribution */}
        <Card title="Task Status Distribution" variant="outlined">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={taskStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* 2️⃣ Task Priority Breakdown */}
        <Card title="Task Priority Breakdown" variant="outlined">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taskPriorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 3️⃣ Tasks per Sprint */}
        <Card title="Tasks per Sprint" variant="outlined">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tasksPerSprint}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tasks" stroke="#2563eb" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

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

        {/* 6️⃣ Task Completion Over Time */}
        <Card title="Task Completion Over Time" variant="outlined">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={taskCompletionOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="done" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default TicketCharts;
