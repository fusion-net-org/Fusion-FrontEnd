/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Eye, MessageSquare, Search } from 'lucide-react';
import { Input, Select, DatePicker } from 'antd';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';
import { GetTicketByProjectId } from '@/services/TicketService.js';
import type { ITicketResponse, ITicket } from '@/interfaces/Ticket/Ticket';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hook/Debounce';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface TicketsTabProps {
  projectId: string;
  rowsPerPage: number;
  onCreateTicket: () => void;
  onTicketsDataChange?: (data: { items: ITicket[]; totalCount: number }) => void;
}

const TicketsTab: React.FC<TicketsTabProps> = ({
  projectId,
  rowsPerPage,
  onCreateTicket,
  onTicketsDataChange,
}) => {
  const navigate = useNavigate();

  const [ticketsResponse, setTicketsResponse] = useState<ITicketResponse | null>(null);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketPriority, setTicketPriority] = useState('');
  const [ticketRange, setTicketRange] = useState<any>(null);
  const [ticketPage, setTicketPage] = useState(1);

  const debouncedSearch = useDebounce(ticketSearch, 500);

  const fetchTickets = async () => {
    try {
      const res: ITicketResponse = await GetTicketByProjectId(
        projectId,
        debouncedSearch,
        ticketPriority, // priority filter
        '', // minBudget
        '', // maxBudget
        '', // resolvedFrom
        '', // resolvedTo
        '', // closedFrom
        '', // closedTo
        ticketRange?.[0] ? dayjs(ticketRange[0]).startOf('day').format('YYYY-MM-DD') : '',
        ticketRange?.[1] ? dayjs(ticketRange[1]).endOf('day').format('YYYY-MM-DD') : '',
        ticketPage,
        rowsPerPage,
        '', // sortColumn
        null,
      );
      if (res?.succeeded) {
        setTicketsResponse(res);
        onTicketsDataChange?.({ items: res.data.items, totalCount: res.data.totalCount });
      }
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    }
  };

  useEffect(() => {
    if (projectId) fetchTickets();
  }, [projectId, debouncedSearch, ticketPriority, ticketRange, ticketPage]);

  const tickets: ITicket[] = ticketsResponse?.data?.items || [];

  const handleGoToDetail = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  return (
    <div>
      {/* SEARCH & FILTER */}
      <div className="flex flex-col mb-3 gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mt-2">
          <MessageSquare className="text-indigo-500 w-5 h-5" /> Project Tickets
        </h2>

        <div className="flex flex-wrap justify-between items-center gap-3">
          {/* SEARCH LEFT */}
          <Input
            prefix={<Search size={20} />}
            placeholder="Search by ticket title..."
            value={ticketSearch}
            onChange={(e) => {
              setTicketSearch(e.target.value);
              setTicketPage(1);
            }}
            className="flex-1 min-w-[200px] max-w-[300px]"
          />

          {/* FILTER RIGHT */}
          <div className="flex items-center gap-2">
            {/* Priority filter */}
            <Select
              value={ticketPriority || 'All'}
              onChange={(val) => {
                setTicketPriority(val === 'All' ? '' : val);
                setTicketPage(1);
              }}
              placeholder="Select priority"
              className="min-w-[120px]"
            >
              <Option value="All">All</Option>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>

            {/* Create Date filter */}
            <RangePicker
              onChange={(val) => {
                setTicketRange(val);
                setTicketPage(1);
              }}
              placeholder={['Create From', 'Create To']}
              className="min-w-[220px]"
            />

            {/* Create Ticket button */}
            <button
              onClick={onCreateTicket}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-full shadow-md transition"
            >
              <MessageSquare className="w-4 h-4" /> Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Assignee</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Budget</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {tickets.map((t, index) => (
              <tr
                key={t.id}
                className="hover:bg-gray-50 transition cursor-pointer"
                onClick={() => handleGoToDetail(t.id)}
              >
                <td className="px-6 py-3 font-medium text-gray-800">{index + 1}</td>
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
                <td className="px-6 py-3 text-gray-700">{t.budget ?? '-'}</td>
                <td className="px-6 py-3 text-gray-500">
                  {t.createdAt ? dayjs(t.createdAt).format('DD/MM/YYYY') : '-'}
                </td>
                <td className="px-6 py-3 text-center">
                  <Eye
                    className="w-5 h-5 text-indigo-500 hover:text-indigo-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToDetail(t.id);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="mt-4 flex justify-end">
        <Stack spacing={2}>
          <Pagination
            count={Math.ceil((ticketsResponse?.data?.totalCount || 0) / rowsPerPage)}
            page={ticketPage}
            onChange={(_, value) => setTicketPage(value)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      </div>
    </div>
  );
};

export default TicketsTab;
