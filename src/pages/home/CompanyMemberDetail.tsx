import React from 'react';
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Edit,
  Folder,
  Star,
  Clock,
  Search,
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Pagination } from 'antd';
import Stack from '@mui/material/Stack';

const data = [
  { name: 'Productivity', value: 75 },
  { name: 'Communication', value: 60 },
  { name: 'Teamwork', value: 85 },
  { name: 'Problem Solving', value: 65 },
];

export default function CompanyMemberDetail() {
  return (
    <div className="p-8 bg-white-50 min-h-screen text-gray-800">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Member Detail</h1>

      {/* Tabs */}
      <div className="flex space-x-6 border-b mb-6">
        {['Profile', 'Permissions', 'Reports', 'Feedback'].map((tab) => (
          <button
            key={tab}
            className={`pb-3 font-medium ${
              tab === 'Profile'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="col-span-1 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center text-white text-3xl font-bold shadow">
              QJ
            </div>
            <div>
              <h2 className="text-xl font-semibold">Quincy Jefferson</h2>
              <p className="text-gray-500 text-sm">Product Manager</p>
            </div>

            <div className="text-sm space-y-2 text-gray-600 mt-2">
              <p className="flex items-center gap-2 justify-center">
                <Mail size={16} /> quincy@techcomp.com
              </p>
              <p className="flex items-center gap-2 justify-center">
                <Phone size={16} /> 987-654-3210
              </p>
              <p className="flex items-center gap-2 justify-center">
                <Calendar size={16} /> Joined on Aug 1, 2023
              </p>
            </div>

            <div className="flex gap-3 w-full mt-4">
              <button className="flex-1 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm font-medium">
                <MessageSquare size={16} /> Message
              </button>
              <button className="flex-1 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm font-medium">
                <Edit size={16} /> Edit Info
              </button>
            </div>

            <div className="flex justify-around w-full py-4 mt-3 border-t border-gray-100">
              <div className="flex flex-col items-center">
                <Folder size={20} className="text-blue-500 mb-1" />
                <span className="text-sm font-semibold">8</span>
                <p className="text-xs text-gray-500">Projects</p>
              </div>
              <div className="flex flex-col items-center">
                <Star size={20} className="text-yellow-500 mb-1" />
                <span className="text-sm font-semibold">88</span>
                <p className="text-xs text-gray-500">Score</p>
              </div>
              <div className="flex flex-col items-center">
                <Clock size={20} className="text-purple-500 mb-1" />
                <span className="text-sm font-semibold">40</span>
                <p className="text-xs text-gray-500">hr/week</p>
              </div>
            </div>

            <button className="w-full py-2 mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition">
              Back to Members List
            </button>
          </div>
        </div>
        {/* Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="url(#colorUv)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6"></div>
          {/* Projects Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Projects</h3>

              {/* Search + Status Filter */}
              <div className="flex gap-3">
                {/* Search */}
                <div className="relative">
                  <Search size={18} className="absolute left-2 top-2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search project..."
                    className="pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                  />
                </div>

                {/* Filter Status */}
                <select className="px-3 py-2 border rounded-lg text-sm text-gray-700 cursor-pointer focus:ring-2 focus:ring-blue-300">
                  <option>Status: All</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-gray-600 border-b bg-gray-50">
                  <th className="p-3 font-medium">Project Name</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Progress</th>
                  <th className="p-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Project Alpha', status: 'In Progress', progress: 80 },
                  { name: 'Project Beta', status: 'Completed', progress: 100 },
                  { name: 'Project Gamma', status: 'Pending', progress: 45 },
                ].map((proj) => (
                  <tr key={proj.name} className="border-b hover:bg-blue-50 transition">
                    <td className="p-3 font-medium text-gray-800">{proj.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium
                ${
                  proj.status === 'Completed'
                    ? 'bg-green-100 text-green-600'
                    : proj.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
                      >
                        {proj.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">{proj.progress}%</td>
                    <td className="p-3 text-center">
                      <button className="text-blue-600 hover:underline text-sm">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-6 pr-3">
              <Stack spacing={2}>
                <Pagination
                  color="primary"
                  variant="outlined"
                  shape="rounded"
                  size="default"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
