/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Tag, Input, Select, DatePicker, Spin } from 'antd';
import { Check, Eye, X, Search } from 'lucide-react';
import { GetTicketByProjectId, AcceptTicket } from '@/services/TicketService.js';
import type { ITicketResponseTab, ITicketTab } from '@/interfaces/Ticket/Ticket';
import { useDebounce } from '@/hook/Debounce';
import { Paging } from '../Paging/Paging';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
const { RangePicker } = DatePicker;
const { Option } = Select;
import { useNavigate, useParams } from 'react-router-dom';
import RejectTicketModal from '../Ticket/RejectTicketModal';
import { Can } from '@/permission/PermissionProvider';

interface PopupTicketDetailProps {
  visible: boolean;
  projectId?: string;
  onClose: () => void;
}

const TicketPopup: React.FC<PopupTicketDetailProps> = ({ visible, projectId, onClose }) => {
  const navigate = useNavigate();
  const { companyId } = useParams<{
    companyId: string;
  }>();
  console.log('companyId', companyId);
  console.log('projectId', projectId);
  const [ticketsResponse, setTicketsResponse] = useState<ITicketResponseTab | null>(null);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketPriority, setTicketPriority] = useState('');
  const [ticketRange, setTicketRange] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(ticketSearch, 500);

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
  });

  const fetchTickets = useCallback(async () => {
    if (!projectId) return;
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
      console.error('Error fetching tickets:', error);
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

  useEffect(
    () => setPagination((prev) => ({ ...prev, pageNumber: 1 })),
    [debouncedSearch, ticketPriority, ticketRange],
  );
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const priorityColor: any = { High: 'red', Medium: 'gold', Low: 'blue', Urgent: 'volcano' };
  const statusColor: any = {
    Pending: 'gold',
    Accepted: 'green',
    Rejected: 'red',
    Finished: 'blue',
  };

  const handleAccept = async (ticketId: string) => {
    try {
      setActionLoading(true);
      const res = await AcceptTicket(ticketId);
      if (res?.succeeded) {
        toast.success(res.message);
        fetchTickets();
      } else {
        toast.error(res.message || 'Failed to accept ticket');
      }
    } catch (error: any) {
      console.error('Accept ticket error:', error);
      toast.error(error?.response?.data?.message || 'Failed to accept ticket');
    } finally {
      setActionLoading(false);
    }
  };

  // const handleReject = async (ticketId: string) => {
  //   try {
  //     setActionLoading(true);
  //     const res = await RejectTicket(ticketId);
  //     if (res?.succeeded) {
  //       toast.success(res.message);
  //       fetchTickets();
  //     } else {
  //       toast.error(res.message || 'Failed to reject ticket');
  //     }
  //   } catch (error: any) {
  //     console.error('Reject ticket error:', error);
  //     toast.error(error?.response?.data?.message || 'Failed to reject ticket');
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

  const tickets: ITicketTab[] = ticketsResponse?.data?.items || [];

  const columns = [
    { title: '#', width: 60, render: (_: any, __: any, index: number) => index + 1 },
    { title: 'Title', dataIndex: 'ticketName' },
    { title: 'Assignee', dataIndex: 'submittedByName' },
    {
      title: 'Priority',
      dataIndex: 'priority',
      render: (t: string) => <Tag color={priorityColor[t]}>{t}</Tag>,
    },
    {
      title: 'Budget (VND)',
      dataIndex: 'budget',
      render: (value: number) => value?.toLocaleString('vi-VN'),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Deleted',
      dataIndex: 'isDeleted',
      render: (d: boolean) => (
        <span className={d ? 'text-red-500' : 'text-green-600'}>{d ? 'Yes' : 'No'}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 200,
      render: (_: any, record: any) => {
        const status = record.status;
        if (record.status === 'Pending') {
          return (
            <div className="flex justify-center items-center gap-3">
              <Can code='TICKET_ACCEPT'>
              <button
                disabled={actionLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAccept(record.id);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-green-400 text-green-600 bg-green-50 hover:bg-green-100 transition"
              >
                <Check size={16} strokeWidth={2.5} /> Accept
              </button>
</Can>
<Can code='TICKET_REJECT'>
              <button
                disabled={actionLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTicketId(record.id);
                  setRejectModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-red-400 text-red-600 bg-red-50 hover:bg-red-100 transition"
              >
                <X size={16} strokeWidth={2.5} /> Reject
              </button>
              </Can>
            </div>
          );
        }
        if (status === 'Accepted') {
          return (
            <div className="flex justify-center">
              {' '}
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-green-400 text-green-600 bg-green-50">
                {' '}
                <Check size={16} strokeWidth={2.5} /> Accepted{' '}
              </span>{' '}
            </div>
          );
        }
        if (status === 'Rejected') {
          return (
            <div className="flex justify-center">
              {' '}
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-red-400 text-red-600 bg-red-50">
                {' '}
                <X size={16} strokeWidth={2.5} /> Rejected{' '}
              </span>{' '}
            </div>
          );
        }
        if (status === 'Finished') {
          return (
            <div className="flex justify-center">
              {' '}
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-blue-400 text-blue-600 bg-blue-50">
                {' '}
                <Check size={16} strokeWidth={2.5} /> Finished{' '}
              </span>{' '}
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={1350}
      footer={null}
      title={
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Eye className="text-indigo-600" /> Ticket For Project
        </div>
      }
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
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
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col min-w-[140px]">
            <label className="text-sm font-semibold text-gray-600 mb-1">Priority</label>
            <Select
              value={ticketPriority || 'All'}
              onChange={(val) => setTicketPriority(val === 'All' ? '' : val)}
              className="w-full"
            >
              <Option value="All">All</Option>
              <Option value="Urgent">Urgent</Option>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </div>
          <div className="flex flex-col min-w-[240px]">
            <label className="text-sm font-semibold text-gray-600 mb-1">Created Date</label>
            <RangePicker
              value={ticketRange}
              onChange={(val) => setTicketRange(val)}
              placeholder={['Create From', 'Create To']}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-4">
          <Spin />
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {tickets.length > 0 ? (
              tickets.map((t, index) => (
                <tr
                  key={t.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (!companyId || !projectId) return;
                    navigate(`/companies/${companyId}/project/${projectId}/tickets/${t.id}`, {
                      state: { viewMode: 'AsExecutor' },
                    });
                  }}
                >
                  <td className="px-6 py-3">
                    {(pagination.pageNumber - 1) * pagination.pageSize + index + 1}
                  </td>
                  <td className="px-6 py-3">{t.ticketName}</td>
                  <td className="px-6 py-3">{t.submittedByName}</td>
                  <td className="px-6 py-3">
                    <Tag color={t.priority ? priorityColor[t.priority] : 'gray'}>
                      {t.priority || '-'}
                    </Tag>
                  </td>
                  <td className="px-6 py-3">{t.budget?.toLocaleString('vi-VN')}</td>
                  <td className="px-6 py-3">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-6 py-3">{t.isDeleted ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-3">
                    <Tag color={statusColor[t.status]}>{t.status}</Tag>
                  </td>
                  <td className="px-6 py-3">
                    {columns[8]?.render ? columns[8].render(undefined, t, index) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  No tickets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

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
      <RejectTicketModal
        open={rejectModalOpen}
        ticketId={selectedTicketId}
        onClose={() => setRejectModalOpen(false)}
        onSuccess={() => {
          setRejectModalOpen(false);
          fetchTickets();
        }}
      />
    </Modal>
  );
};

export default TicketPopup;
