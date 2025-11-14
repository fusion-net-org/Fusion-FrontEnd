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
} from 'recharts';
import { Card } from 'antd';
import { BarChart3 } from 'lucide-react';

interface SprintChartsProps {
  sprintData: { name: string; total: number; done: number }[];
  sprintProgressData?: { sprint: string; completed: number; pending: number }[];
  taskDistribution?: { name: string; value: number }[];
}

const SprintCharts: React.FC<SprintChartsProps> = ({
  sprintData,
  sprintProgressData = [
    { sprint: 'Sprint 1', completed: 8, pending: 2 },
    { sprint: 'Sprint 2', completed: 6, pending: 4 },
    { sprint: 'Sprint 3', completed: 10, pending: 0 },
  ],
  taskDistribution = [
    { name: 'To Do', value: 12 },
    { name: 'In Progress', value: 8 },
    { name: 'Done', value: 15 },
  ],
}) => {
  return (
    <div className="mt-8 space-y-8">
      {/* Sprint Task Overview */}
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
              <Bar dataKey="total" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Total Tasks" />
              <Bar dataKey="done" fill="#6366F1" radius={[4, 4, 0, 0]} name="Completed Tasks" />
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

      {/* Sprint Progress per Sprint */}
      <Card title="Sprint Progress" variant="outlined">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sprintProgressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completed" fill="#4F46E5" name="Completed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="#93C5FD" name="Pending" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Task Distribution */}
      <Card title="Task Distribution" variant="outlined">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={taskDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default SprintCharts;
