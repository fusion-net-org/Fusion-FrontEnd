/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, UserPlus, Send, Inbox } from 'lucide-react';
import { DatePicker } from 'antd';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { useNavigate, useParams } from 'react-router-dom';
import type {
  IProject,
  IProjectResponse,
  ITicketResponse,
  ITicketStatusCount,
  ITicketStatusCountResponse,
} from '@/interfaces/Ticket/Ticket';
import {
  GetTicketPaged,
  GetTicketCountStatus,
  GetProjectsByCompany,
} from '@/services/TicketService.js';
const { RangePicker } = DatePicker;

const TicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [ticketData, setTicketData] = useState<ITicketResponse | null>(null);
  const [countStatus, setCountStatus] = useState<ITicketStatusCount | null>(null);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);
  const [viewMode, setViewMode] = useState<'AsRequester' | 'AsExecutor'>('AsRequester');
  console.log('Selected Project request id:', selectedProject?.companyRequestId);
  console.log('Selected Project exe id:', selectedProject?.companyId);

  //state paging
  const [pageNumber, setPageNumber] = useState(1);
  //get status badge
  const getStatusBadge = (status: string) => {
    const styleMap: Record<string, string> = {
      Pending: 'bg-yellow-50 text-yellow-700',
      Accepted: 'bg-blue-50 text-blue-700',
      Finished: 'bg-green-50 text-green-700',
      Rejected: 'bg-red-50 text-red-700',
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

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const proj = projects.find((p) => p.id === projectId) || null;
    setSelectedProject(proj);
  };

  const fetchProjects = async () => {
    try {
      const res: IProjectResponse = await GetProjectsByCompany(
        companyId || '',
        '', // companyRequestId
        '', // executorCompanyId
      );
      setProjects(res.data);

      if (!isProjectLoaded && res.data.length > 0) {
        setSelectedProjectId(res.data[0].id);
        setIsProjectLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };

  const fetchTicketData = async () => {
    if (!selectedProject) return;

    try {
      const res: ITicketResponse = await GetTicketPaged(
        '', // search
        selectedProjectId, // projectId
        companyId,
        companyId,
        '', // status
        viewMode, // view mode
        pageNumber, // page number
        10, // page size
        null, // SortColumn
        null, // SortDescending
      );
      console.log('Ticket Data:', res.data);
      setTicketData(res);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    }
  };

  const fetchCountStatus = async () => {
    try {
      const res: ITicketStatusCountResponse = await GetTicketCountStatus(
        'F1AE1F42-1A88-4605-89D7-A51863BAE043',
        '',
        '',
      );
      console.log('Ticket Status Count:', res.data);
      setCountStatus(res.data);
    } catch (error) {
      console.error('Failed to fetch ticket status count', error);
    }
  };
  //use effect
  useEffect(() => {
    fetchProjects();
    fetchTicketData();
    fetchCountStatus();
  }, [viewMode, pageNumber, companyId, selectedProjectId]);

  return (
    <div className="px-5 py-5 font-inter bg-gray-50 min-h-screen">
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 rounded-2xl p-6 mb-8 text-white shadow-lg border border-blue-300/30">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Tickets</h1>
            <p className="text-blue-100 text-sm">Manage tickets for projects</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition text-sm">
            <UserPlus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </div>

      {/* STATUS SUMMARY */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="px-4 py-1.5 bg-blue-200 text-blue-700 font-medium rounded-full text-sm">
          Accepted: {countStatus?.statusCounts.Accepted || 0}
        </span>
        <span className="px-4 py-1.5 bg-red-200 text-red-700 font-medium rounded-full text-sm">
          Rejected: {countStatus?.statusCounts.Rejected || 0}
        </span>
        <span className="px-4 py-1.5 bg-yellow-200 text-yellow-700 font-medium rounded-full text-sm">
          Pending: {countStatus?.statusCounts.Pending || 0}
        </span>
        <span className="px-4 py-1.5 bg-green-200 text-green-700 font-medium rounded-full text-sm">
          Finished: {countStatus?.statusCounts.Finished || 0}
        </span>
        <span className="px-4 py-1.5 bg-gray-300 text-gray-600 font-medium rounded-full text-sm">
          Total: {countStatus?.total || 0}
        </span>
      </div>

      {/* VIEW MODE TABS - UI only */}
      <div className="flex items-center justify-start mb-2">
        <div className="flex bg-white/70 backdrop-blur-md border border-gray-200 rounded-full shadow-md overflow-hidden p-1 gap-1">
          {/* My Requests */}
          <button
            onClick={() => setViewMode('AsRequester')}
            className={`
                    relative flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full transition
                    ${
                      viewMode === 'AsRequester'
                        ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-500 shadow-lg scale-105'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                `}
          >
            <Send className="w-4 h-4" />
            My Requests
          </button>

          {/* Requests To Me */}
          <button
            onClick={() => setViewMode('AsExecutor')}
            className={`
                relative flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full transition
                ${
                  viewMode === 'AsExecutor'
                    ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-500 shadow-lg scale-105'
                    : 'text-gray-600 hover:bg-gray-100'
                }
            `}
          >
            <Inbox className="w-4 h-4" />
            Requests To Me
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap items-end justify-between gap-4 py-3 rounded-xl mb-2">
        <div className="flex flex-col w-full sm:w-60">
          <label className="font-semibold text-sm text-gray-600 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search tickets..."
            className="rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none !h-[37.6px] w-full"
          />
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {/* Project Dropdown */}
          <div className="flex flex-col w-full sm:w-40">
            <label className="font-semibold text-sm text-gray-600 mb-1">Project</label>
            <select
              className="rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none !h-[37.6px]"
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="flex flex-col w-full sm:w-80">
            <label className="font-semibold text-sm text-gray-600 mb-1">Created Date</label>
            <RangePicker
              format="DD/MM/YYYY"
              className="rounded-lg border border-gray-300 !h-[37.6px]"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col w-full sm:w-40">
            <label className="font-semibold text-sm text-gray-600 mb-1">Status</label>
            <select className="rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none !h-[37.6px]">
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Finished">Finished</option>
            </select>
          </div>

          {/* Deleted */}
          <div className="flex flex-col w-full sm:w-40">
            <label className="font-semibold text-sm text-gray-600 mb-1">Deleted</label>
            <select className="rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none !h-[37.6px]">
              <option value="All">All</option>
              <option value="Deleted">Deleted</option>
              <option value="NotDeleted">Not Deleted</option>
            </select>
          </div>

          <span className="text-sm text-gray-500 flex items-center h-[37.6px] mt-6 sm:mt-0">
            15 results
          </span>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-blue-50 text-blue-800 uppercase text-left font-semibold">
            <tr className="hover:bg-blue-100">
              <th className="px-4 py-3 font-medium text-center">Ticket Name</th>
              <th className="px-4 py-3 font-medium text-center">Project Name</th>
              <th className="px-4 py-3 font-medium text-center">Create Date</th>
              <th className="px-4 py-3 font-medium text-center">Priority</th>
              <th className="px-4 py-3 font-medium text-center">Urgent</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-center">Budget (VND)</th>
              <th className="px-4 py-3 font-medium text-center">Deleted</th>
              <th className="px-4 py-3 font-medium text-center">Detail</th>
            </tr>
          </thead>
          <tbody>
            {ticketData?.data.items.length ? (
              ticketData.data.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-blue-50 transition duration-200 cursor-pointer"
                  onClick={() => navigate(`/ticket/${item.id}`)}
                >
                  <td className="px-4 py-3 text-gray-800 text-center">{item.ticketName}</td>
                  <td className="px-4 py-3 text-gray-700 text-center">{item.projectName}</td>
                  <td className="px-4 py-3 text-gray-700 text-center">
                    {new Date(item.createdAt).toLocaleDateString('en-CA', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-center">{item.priority}</td>
                  <td className="px-4 py-3 text-center">
                    {item.isHighestUrgen ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-center">
                    {item.budget?.toLocaleString('vi-VN') ?? '-'}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {item.isDeleted ? (
                      <span className="text-red-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-green-600 font-medium">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Eye className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="text-center py-4 text-gray-500">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGING */}
      <div className="mt-6 flex justify-end">
        <Stack spacing={2}>
          <Pagination
            page={pageNumber}
            onChange={(_, page) => setPageNumber(page)}
            color="primary"
          />
        </Stack>
      </div>
    </div>
  );
};

export default TicketPage;
