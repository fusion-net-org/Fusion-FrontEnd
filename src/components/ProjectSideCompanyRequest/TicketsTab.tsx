/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { Eye, MessageSquare, Search } from 'lucide-react';
import { Input, Select, DatePicker, Spin } from 'antd';
import dayjs from 'dayjs';
import { GetTicketByProjectId } from '@/services/TicketService.js';
import type { ITicketResponseTab, ITicketTab } from '@/interfaces/Ticket/Ticket';
import { useDebounce } from '@/hook/Debounce';
import CreateTicketPopup from './CreateTicket';
import { Paging } from '@/components/Paging/Paging';
import { useParams, useNavigate } from 'react-router-dom';
import { GetProjectByProjectId } from '@/services/projectService.js';
import type { IProject } from '@/interfaces/ProjectMember/projectMember';
const { RangePicker } = DatePicker;
const { Option } = Select;

interface TicketsTabProps {
  isClose: boolean;
  projectId: string;
  onTicketCreated?: () => void;
}

const TicketsTab: React.FC<TicketsTabProps> = ({ isClose, projectId, onTicketCreated }) => {
  const navigate = useNavigate();
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const { companyId } = useParams();
  const [ticketsResponse, setTicketsResponse] = useState<ITicketResponseTab | null>(null);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketPriority, setTicketPriority] = useState('');
  const [ticketRange, setTicketRange] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<IProject[]>([]);
  const debouncedSearch = useDebounce(ticketSearch, 500);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
  });
  const fetchProjects = async () => {
    try {
      const response = await GetProjectByProjectId(projectId);
      console.log('Fetched projects:', response.data);
      setProjects([response.data]);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res: ITicketResponseTab = await GetTicketByProjectId(
        projectId,
        debouncedSearch,
        ticketPriority,
        '',
        '',
        '',
        '',
        '',
        '',

        ticketRange?.[0] ? dayjs(ticketRange[0]).startOf('day').format('YYYY-MM-DD') : '',
        ticketRange?.[1] ? dayjs(ticketRange[1]).endOf('day').format('YYYY-MM-DD') : '',
        pagination.pageNumber,
        pagination.pageSize,
        '',
        null,
      );
      if (res?.succeeded) {
        setTicketsResponse(res);
        setPagination((prev) => ({
          ...prev,
          totalCount: res.data.totalCount || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  }, [
    projectId,
    debouncedSearch,
    ticketPriority,
    ticketRange,
    pagination.pageNumber,
    pagination.pageSize,
  ]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageNumber: 1 }));
  }, [debouncedSearch, ticketPriority, ticketRange]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchProjects();
  }, []);
  const tickets: ITicketTab[] = ticketsResponse?.data?.items || [];

  const handleGoToDetail = (ticket: ITicketTab) => {
    navigate(`/companies/${companyId}/project/${projectId}/tickets/${ticket.id}`, {
      state: {
        isDeleted: ticket.isDeleted,
        viewMode: 'AsRequester',
      },
    });
  };

  const getPriorityBadge = (priority?: string) => {
    const styleMap: Record<string, string> = {
      Urgent: 'bg-red-100 text-red-700',
      High: 'bg-orange-100 text-orange-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      Low: 'bg-green-100 text-green-700',
      Unknown: 'bg-gray-50 text-gray-600',
    };

    const display = priority || 'Unknown';
    const style = styleMap[display] || styleMap['Unknown'];

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${style}`}>{display}</span>
    );
  };

  return (
    <div>
      {/* SEARCH & FILTER */}
      <div className="flex flex-col mb-3 gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mt-2">
          <MessageSquare className="text-indigo-500 w-5 h-5" /> Project Tickets
        </h2>

        <div className="flex flex-wrap justify-between items-end gap-3">
          {/* LEFT — Search */}
          <div className="flex flex-col flex-1 max-w-[300px]">
            <label className="text-sm font-semibold text-gray-600 mb-1">Search</label>
            <Input
              prefix={<Search size={20} />}
              placeholder="Search by ticket title..."
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* RIGHT — Filters */}
          <div className="flex flex-wrap items-end gap-2">
            {/* Priority */}
            <div className="flex flex-col min-w-[120px]">
              <label className="text-sm font-semibold text-gray-600 mb-1">Priority</label>
              <Select
                value={ticketPriority || 'All'}
                onChange={(val) => setTicketPriority(val === 'All' ? '' : val)}
                placeholder="Select priority"
                className="w-full"
              >
                <Option value="All">All</Option>
                <Option value="Urgent">Urgent</Option>
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex flex-col min-w-[220px]">
              <label className="text-sm font-semibold text-gray-600 mb-1">Created Date</label>
              <RangePicker
                onChange={(val) => setTicketRange(val)}
                placeholder={['Create From', 'Create To']}
                className="w-full"
              />
            </div>

            {/* Create Ticket Button */}
            <button
              onClick={() => {
                if (!isClose) setShowCreatePopup(true);
              }}
              disabled={isClose}
              title={isClose ? 'Project close cannot create ticket' : 'Create Ticket'}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full shadow-md transition
              ${
                isClose
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
              }
            `}
            >
              <MessageSquare className="w-4 h-4" />
              Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="flex justify-center p-4">
            <Spin />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Budget (VND)
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Deleted</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {tickets.length > 0 ? (
                tickets.map((t, index) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => handleGoToDetail(t)}
                  >
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {(pagination.pageNumber - 1) * pagination.pageSize + index + 1}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{t.ticketName}</td>
                    <td className="px-6 py-3 text-gray-600">{t.submittedByName}</td>
                    <td className="px-6 py-3">{getPriorityBadge(t.priority)}</td>

                    <td className="px-6 py-3 text-gray-700">
                      {t.budget != null ? t.budget.toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {t.createdAt ? dayjs(t.createdAt).format('DD/MM/YYYY') : '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={
                          t.isDeleted
                            ? 'text-red-500 font-semibold'
                            : 'text-green-600 font-semibold'
                        }
                      >
                        {t.isDeleted ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full
                      ${
                        t.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : t.status === 'Accepted'
                          ? 'bg-green-100 text-green-700'
                          : t.status === 'Rejected'
                          ? 'bg-red-100 text-red-700'
                          : t.status === 'Finished'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Eye
                        className="w-5 h-5 text-indigo-500 hover:text-indigo-700 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoToDetail(t);
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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

      <CreateTicketPopup
        visible={showCreatePopup}
        onClose={() => setShowCreatePopup(false)}
        defaultProjectId={projectId}
        projects={projects}
        onSuccess={() => {
          fetchTickets();
          onTicketCreated?.();
        }}
      />
    </div>
  );
};

export default TicketsTab;
