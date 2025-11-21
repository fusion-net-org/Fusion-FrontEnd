/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { Eye, MessageSquare, Search } from 'lucide-react';
import { Input, Select, DatePicker, Spin } from 'antd';
import dayjs from 'dayjs';
import { GetTicketByProjectId } from '@/services/TicketService.js';
import type { ITicketResponse, ITicket } from '@/interfaces/Ticket/Ticket';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hook/Debounce';
import CreateTicketPopup from './CreateTicket';
import { Paging } from '@/components/Paging/Paging';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface TicketsTabProps {
  projectId: string;
  onTicketCreated?: () => void;
}

const TicketsTab: React.FC<TicketsTabProps> = ({ projectId, onTicketCreated }) => {
  const navigate = useNavigate();
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  const [ticketsResponse, setTicketsResponse] = useState<ITicketResponse | null>(null);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketPriority, setTicketPriority] = useState('');
  const [ticketRange, setTicketRange] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(ticketSearch, 500);

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res: ITicketResponse = await GetTicketByProjectId(
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

  const tickets: ITicket[] = ticketsResponse?.data?.items || [];

  const handleGoToDetail = (ticket: ITicket) => {
    navigate(`/project/${projectId}/tickets/${ticket.id}`, {
      state: { isDeleted: ticket.isDeleted },
    });
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
              onClick={() => setShowCreatePopup(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-full shadow-md transition"
            >
              <MessageSquare className="w-4 h-4" /> Create Ticket
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
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          t.priority === 'High'
                            ? 'bg-red-100 text-red-700'
                            : t.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {t.priority || '-'}
                      </span>
                    </td>
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
        projectId={projectId}
        onSuccess={() => {
          fetchTickets();
          onTicketCreated?.();
        }}
      />
    </div>
  );
};

export default TicketsTab;
