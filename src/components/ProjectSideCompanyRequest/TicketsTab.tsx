/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { Input, DatePicker } from 'antd';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export interface Ticket {
  id: number;
  title: string;
  assignee: string;
  status: string;
  date: string;
}

interface TicketsTabProps {
  tickets: Ticket[];
  ticketSearch: string;
  setTicketSearch: (val: string) => void;
  ticketRange: any;
  setTicketRange: (val: any) => void;
  ticketPage: number;
  setTicketPage: (val: number) => void;
  rowsPerPage: number;
  onCreateTicket: () => void;
}

const TicketsTab: React.FC<TicketsTabProps> = ({
  tickets,
  ticketSearch,
  setTicketSearch,
  ticketRange,
  setTicketRange,
  ticketPage,
  setTicketPage,
  rowsPerPage,
  onCreateTicket,
}) => {
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchTitle = t.title.toLowerCase().includes(ticketSearch.toLowerCase());
      const matchDate =
        !ticketRange ||
        (ticketRange.length === 2 &&
          dayjs(t.date).isAfter(ticketRange[0], 'day') &&
          dayjs(t.date).isBefore(ticketRange[1], 'day'));
      return matchTitle && matchDate;
    });
  }, [tickets, ticketSearch, ticketRange]);

  const pagedTickets = useMemo(() => {
    const start = (ticketPage - 1) * rowsPerPage;
    return filteredTickets.slice(start, start + rowsPerPage);
  }, [filteredTickets, ticketPage, rowsPerPage]);

  return (
    <div>
      <div className="flex flex-col mb-3 gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700 mt-2">
          <MessageSquare className="text-indigo-500 w-5 h-5" />
          Project Tickets
        </h2>

        <div className="flex flex-wrap justify-between items-center gap-3">
          <Input
            prefix={<Search size={20} />}
            placeholder="Search by ticket title..."
            value={ticketSearch}
            onChange={(e) => {
              setTicketSearch(e.target.value);
              setTicketPage(1);
            }}
            className="flex-1 min-w-[280px] max-w-[400px]"
          />

          <div className="flex items-center gap-2">
            <RangePicker
              onChange={(val) => {
                setTicketRange(val);
                setTicketPage(1);
              }}
              placeholder={['Start date', 'End date']}
              className="min-w-[220px]"
            />
            <button
              onClick={onCreateTicket}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-full shadow-md transition"
            >
              <MessageSquare className="w-4 h-4" />
              Create Ticket
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Assignee</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {pagedTickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-3 font-medium text-gray-800">#{t.id}</td>
                <td className="px-6 py-3 text-gray-700">{t.title}</td>
                <td className="px-6 py-3 text-gray-600">{t.assignee}</td>
                <td className="px-6 py-3">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      t.status === 'Done'
                        ? 'bg-green-100 text-green-700'
                        : t.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-700'
                        : t.status === 'In Review'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <Stack spacing={2}>
          <Pagination
            count={Math.ceil(filteredTickets.length / rowsPerPage)}
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
