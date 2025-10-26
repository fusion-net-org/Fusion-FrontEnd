/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Eye, Search } from 'lucide-react';
import { DatePicker } from 'antd';
import LoadingOverlay from '@/common/LoadingOverlay';

const { RangePicker } = DatePicker;

interface ProjectRequest {
  id: number;
  projectName: string;
  requester: string;
  executor: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  status: string;
}

const mockData: ProjectRequest[] = [
  {
    id: 1,
    projectName: 'E-Commerce Platform',
    requester: 'Fusion Tech',
    executor: 'Nova Digital',
    createdAt: '2025-10-01',
    startDate: '2025-10-05',
    endDate: '2025-11-30',
    status: 'Accepted',
  },
  {
    id: 2,
    projectName: 'Cloud Migration',
    requester: 'Fusion Tech',
    executor: 'CloudX',
    createdAt: '2025-09-12',
    startDate: '2025-09-15',
    endDate: '2025-12-10',
    status: 'Pending',
  },
  {
    id: 3,
    projectName: 'Mobile App Redesign',
    requester: 'Fusion Tech',
    executor: 'NextDev',
    createdAt: '2025-07-10',
    startDate: '2025-07-15',
    endDate: '2025-09-20',
    status: 'Finished',
  },
];

const ProjectRequestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(mockData);
  const [statusFilter, setStatusFilter] = useState('All');

  // debounce search
  useEffect(() => {
    const delay = setTimeout(() => {
      const lower = searchTerm.toLowerCase();
      const data = mockData.filter(
        (p) =>
          p.projectName.toLowerCase().includes(lower) ||
          p.requester.toLowerCase().includes(lower) ||
          p.executor.toLowerCase().includes(lower),
      );
      setFilteredData(data);
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // status filter
  useEffect(() => {
    if (statusFilter === 'All') {
      setFilteredData(mockData);
    } else {
      setFilteredData(mockData.filter((p) => p.status === statusFilter));
    }
  }, [statusFilter]);

  const countStatus = (status: string) => mockData.filter((p) => p.status === status).length;

  const getStatusBadge = (status: string) => {
    const styleMap: Record<string, string> = {
      Pending: 'bg-yellow-50 text-yellow-700',
      Accepted: 'bg-blue-50 text-blue-700',
      Finished: 'bg-green-50 text-green-700',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          styleMap[status] || 'bg-gray-50 text-gray-600'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <LoadingOverlay loading={loading} message="Loading project requests..." />

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl p-6 mb-6 shadow-md flex items-center justify-between text-white">
        <div>
          <h1 className="text-2xl font-bold">Project Requests</h1>
          <p className="text-sm text-blue-100">Manage requests for inter-company collaborations</p>
        </div>
        <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition">
          + New Request
        </button>
      </div>

      {/* STATUS SUMMARY */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="px-4 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-full text-sm">
          Accepted: {countStatus('Accepted')}
        </span>
        <span className="px-4 py-1.5 bg-yellow-50 text-yellow-700 font-medium rounded-full text-sm">
          Pending: {countStatus('Pending')}
        </span>
        <span className="px-4 py-1.5 bg-green-50 text-green-700 font-medium rounded-full text-sm">
          Finished: {countStatus('Finished')}
        </span>
        <span className="px-4 py-1.5 bg-gray-50 text-gray-600 font-medium rounded-full text-sm">
          Total: {mockData.length}
        </span>
      </div>

      {/* FILTER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Project/Requester/Executor..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Create Date:</span>
            <RangePicker format="DD/MM/YYYY" className="border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Finished">Finished</option>
          </select>
          <span className="text-sm text-gray-500">{filteredData.length} results</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Requester</th>
              <th className="px-4 py-3 font-medium">Executor</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50 transition-all duration-150">
                <td className="px-4 py-3 text-gray-800 font-medium">{item.projectName}</td>
                <td className="px-4 py-3 text-gray-700">{item.requester}</td>
                <td className="px-4 py-3 text-gray-700">{item.executor}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(item.startDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(item.endDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                <td className="px-4 py-3 text-center">
                  <Eye className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION MOCK */}
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <button className="p-2 border rounded-lg hover:bg-gray-100">{'<<'}</button>
          <button className="p-2 border rounded-lg hover:bg-gray-100 bg-blue-50 text-blue-600">
            1
          </button>
          <button className="p-2 border rounded-lg hover:bg-gray-100">{'>>'}</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectRequestPage;
