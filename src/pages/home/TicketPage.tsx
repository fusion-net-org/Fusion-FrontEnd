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
  ITicketResponseData,
} from '@/interfaces/Ticket/Ticket';
import { GetTicketPaged, GetProjectsByCompany } from '@/services/TicketService.js';
const { RangePicker } = DatePicker;
import { useDebounce } from '@/hook/Debounce';
import type { Dayjs } from 'dayjs';
import { Paging } from '@/components/Paging/Paging';
import LoadingOverlay from '@/common/LoadingOverlay';
import { AcceptTicket, RejectTicket } from '@/services/TicketService.js';
import RejectTicketModal from '@/components/Ticket/RejectTicketModal';
import CreateTicketPopup from '@/components/ProjectSideCompanyRequest/CreateTicket';

const TicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [ticketData, setTicketData] = useState<ITicketResponseData | null>(null);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);
  const [viewMode, setViewMode] = useState<'AsRequester' | 'AsExecutor'>('AsRequester');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const debouncedSearch = useDebounce(searchKeyword, 500);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filterDeleted, setFilterDeleted] = useState<'All' | 'Deleted' | 'NotDeleted'>('All');
  const [loading, setLoading] = useState(false);
  const [rejectTicketId, setRejectTicketId] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  console.log('ticketPage', viewMode);
  const handleAcceptTicket = async (ticketId: string) => {
    try {
      setLoading(true);
      await AcceptTicket(ticketId);
      await fetchTicketData();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Accept ticket failed');
    } finally {
      setLoading(false);
    }
  };
  const openRejectModal = (ticketId: string) => {
    setRejectTicketId(ticketId);
    setIsRejectModalOpen(true);
  };

  const handleRejectTicket = async (ticketId: string) => {
    const reason = prompt('Enter reject reason:', '');
    if (reason === null) return;

    try {
      setLoading(true);
      await RejectTicket(ticketId, reason);
      await fetchTicketData();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Reject ticket failed');
    } finally {
      setLoading(false);
    }
  };

  //state paging
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
  });
  //get status badge
  const getStatusBadge = (status: string) => {
    const styleMap: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-700',
      Accepted: 'bg-green-100 text-green-700',
      Finished: 'bg-blue-100 text-blue-700',
      Rejected: 'bg-red-100 text-red-700',
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
  console.log('project', projects);
  const fetchProjects = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketData = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const statusParam = filterStatus === 'All' ? '' : filterStatus;
      const isDeletedParam =
        filterDeleted === 'All' ? undefined : filterDeleted === 'Deleted' ? 'true' : 'false';
      const createdFrom = dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined;
      const createdTo = dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined;

      const res: ITicketResponse = await GetTicketPaged(
        debouncedSearch, // Keyword
        selectedProjectId, // ProjectId
        companyId, // CompanyRequestId
        companyId, // CompanyExecutorId
        statusParam, // Status
        viewMode, // ViewMode
        createdFrom, // CreatedFrom
        createdTo, // CreatedTo
        isDeletedParam, // IsDeleted
        pagination.pageNumber,
        pagination.pageSize,
        null, // SortColumn
        null, // SortDescending
      );
      setTicketData(res.data);
      setPagination((prev) => ({
        ...prev,
        totalCount: res.data.pageData.totalCount,
      }));
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  //use effect
  useEffect(() => {
    fetchProjects();
  }, [companyId]);

  useEffect(() => {
    fetchProjects();
    fetchTicketData();
  }, [
    viewMode,
    pagination.pageNumber,
    pagination.pageSize,
    selectedProjectId,
    debouncedSearch,
    filterStatus,
    filterDeleted,
    dateRange,
  ]);

  return (
    <>
      <LoadingOverlay loading={loading} />
      <div className="px-5 py-5 font-inter bg-gray-50 min-h-screen">
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 rounded-2xl p-6 mb-8 text-white shadow-lg border border-blue-300/30">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Tickets</h1>
              <p className="text-blue-100 text-sm">Manage tickets for projects</p>
            </div>
            <button
              disabled={!selectedProjectId}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition text-sm ${
                !selectedProjectId
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
              onClick={() => setIsCreateTicketOpen(true)}
            >
              <UserPlus className="w-4 h-4" /> New Ticket
            </button>
          </div>
        </div>

        {/* STATUS SUMMARY */}
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="px-4 py-1.5 bg-blue-200 text-blue-700 font-medium rounded-full text-sm">
            Accepted: {ticketData?.statusCounts?.Accepted ?? 0}
          </span>
          <span className="px-4 py-1.5 bg-red-200 text-red-700 font-medium rounded-full text-sm">
            Rejected: {ticketData?.statusCounts?.Rejected ?? 0}
          </span>
          <span className="px-4 py-1.5 bg-yellow-200 text-yellow-700 font-medium rounded-full text-sm">
            Pending: {ticketData?.statusCounts?.Pending ?? 0}
          </span>
          <span className="px-4 py-1.5 bg-green-200 text-green-700 font-medium rounded-full text-sm">
            Finished: {ticketData?.statusCounts?.Finished ?? 0}
          </span>
          <span className="px-4 py-1.5 bg-gray-300 text-gray-600 font-medium rounded-full text-sm">
            Total: {ticketData?.total ?? 0}
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
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {/* Project Dropdown */}
            <div className="flex flex-col w-full sm:w-60">
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
            <div className="flex flex-col w-full sm:w-56">
              <label className="font-semibold text-sm text-gray-600 mb-1">Created Date</label>
              <RangePicker
                format="DD/MM/YYYY"
                className="rounded-lg border border-gray-300 !h-[37.6px]"
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
              />
            </div>

            {/* Status */}
            <div className="flex flex-col w-full sm:w-40">
              <label className="font-semibold text-sm text-gray-600 mb-1">Status</label>
              <select
                className="rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none !h-[37.6px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
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
              <select
                className="rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none !h-[37.6px]"
                value={filterDeleted}
                onChange={(e) =>
                  setFilterDeleted(e.target.value as 'All' | 'Deleted' | 'NotDeleted')
                }
              >
                <option value="All">All</option>
                <option value="Deleted">Deleted</option>
                <option value="NotDeleted">NotDeleted</option>
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
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-center">Budget (VND)</th>
                <th className="px-4 py-3 font-medium text-center">Deleted</th>
                {viewMode === 'AsExecutor' && (
                  <th className="px-4 py-3 font-medium text-center">Action</th>
                )}
                <th className="px-4 py-3 font-medium text-center">Detail</th>
              </tr>
            </thead>
            <tbody>
              {ticketData?.pageData.items.length ? (
                ticketData?.pageData.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-blue-50 transition duration-200 cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/companies/${companyId}/project/${selectedProjectId}/tickets/${item.id}`,
                        { state: { viewMode } },
                      )
                    }
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
                    {viewMode === 'AsExecutor' && (
                      <td className="px-4 py-3 text-center">
                        {item.status === 'Pending' && (
                          <div className="flex items-center justify-center gap-2">
                            {/* Accept */}
                            <button
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-full text-sm font-medium
        hover:bg-green-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptTicket(item.id);
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Accept
                            </button>

                            {/* Reject */}
                            <button
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-sm font-medium hover:bg-red-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRejectModal(item.id);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}

                        {item.status === 'Accepted' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Accepted
                          </span>
                        )}

                        {item.status === 'Rejected' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-medium">
                            <XCircle className="w-4 h-4" />
                            Rejected
                          </span>
                        )}

                        {item.status === 'Finished' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Finished
                          </span>
                        )}
                      </td>
                    )}

                    <td className="px-4 py-3 text-center">
                      <Eye
                        className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/companies/${companyId}/project/${selectedProjectId}/tickets/${item.id}`,
                            { state: { viewMode } },
                          );
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-10">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Inbox className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500 text-sm font-medium">No tickets found.</p>
                      <p className="text-gray-400 text-xs">
                        Please choose project different or adjust your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGING */}
        <div className="mt-4">
          <Paging
            page={pagination.pageNumber}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, pageNumber: page }))}
            onPageSizeChange={(size) =>
              setPagination((prev) => ({ ...prev, pageSize: size, pageNumber: 1 }))
            }
          />
        </div>
      </div>
      <RejectTicketModal
        open={isRejectModalOpen}
        ticketId={rejectTicketId}
        onClose={() => setIsRejectModalOpen(false)}
        onSuccess={fetchTicketData}
      />
      <CreateTicketPopup
        visible={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        onSuccess={fetchTicketData}
        projects={projects}
      />
    </>
  );
};

export default TicketPage;
