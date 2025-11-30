import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowUp,
  ArrowDown as ArrowDownIcon,
  RefreshCw,
  FilePlus,
  Edit,
} from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { Input, Select, Button, DatePicker, Tag } from 'antd';
import { toast } from 'react-toastify';
import { GetTicketPagedByAdmin } from '@/services/ticketService.js';

const { RangePicker } = DatePicker;

type Ticket = {
  id: string;
  projectId: string;
  projectName: string;
  priority: string;
  isHighestUrgen: boolean;
  ticketName: string;
  description: string;
  status: string;
  submittedBy: string;
  submittedByName: string;
  isBillable: boolean;
  budget: number;
  isDeleted: boolean;
  reason: string;
  resolvedAt: string;
  closedAt: string;
  createdAt: string;
  updatedAt: string;
};

type PagedResult = {
  items: Ticket[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

type SortKey = 'ticketName' | 'priority';

const SORT_OPTIONS = [
  { key: 'ticketName', label: 'Ticket Name' },
  { key: 'priority', label: 'Priority' },
];

const STATUS_COLOR: Record<string, string> = {
  // Status
  Pending: 'gold',
  Accepted: 'blue',
  Rejected: 'red',
  Finished: 'green',

  // Priority
  Urgent: 'volcano',
  High: 'orange',
  Medium: 'geekblue',
  Low: 'cyan',
};

export default function TicketListAdminPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const q = params.get('q') ?? '';
  const sort = (params.get('sort') as SortKey) || 'ticketName';
  const dirDesc = (params.get('dir') || 'desc') !== 'asc';
  const status = params.get('status') ?? '';
  const dateFrom = params.get('from') ?? '';
  const dateTo = params.get('to') ?? '';
  const pageNumber = Math.max(1, parseInt(params.get('page') || '1', 10));
  const pageSize = Math.max(1, parseInt(params.get('pageSize') || '10', 10));

  const [items, setItems] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* Patch URL Params */
  const patchParams = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next, { replace: true });
  };

  /* Reset filters */
  const resetFilters = () => {
    patchParams({
      q: '',
      status: '',
      from: '',
      to: '',
      sort: 'ticketName',
      dir: 'desc',
      page: 1,
      pageSize,
    });
  };

  /* Reload Tickets */
  const reload = React.useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      const res = await GetTicketPagedByAdmin(
        q || null, // Keyword
        null, // Project
        null, // CompanyRequest
        null, // CompanyExecutor
        status || null, // Status
        null, // ViewMode
        dateFrom || null, // From
        dateTo || null, // To
        false, // Deleted
        pageNumber,
        pageSize,
        sort,
        dirDesc,
      );

      const pageData = res?.data?.pageData;

      setItems(pageData?.items ?? []);
      setTotal(pageData?.totalCount ?? 0);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load tickets');
      toast.error(e?.message ?? 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [q, status, dateFrom, dateTo, pageNumber, pageSize, sort, dirDesc]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleView = (t: Ticket) => {
    localStorage.setItem('ticketDetailEnabled', 'true');
    localStorage.setItem('ticketId', t.id);
    navigate(`/admin/tickets/detail/${t.id}`);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <FilePlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 m-0">Ticket Management</h1>
                <p className="text-sm text-gray-500 m-0">
                  View and manage tickets submitted by users
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <Input
                  placeholder="Search ticket by name..."
                  allowClear
                  prefix={<Search size={16} className="text-gray-400" />}
                  value={q}
                  onChange={(e) => patchParams({ q: e.target.value, page: 1 })}
                  style={{ width: 250 }}
                />

                {/* Sort */}
                <Select
                  value={sort}
                  onChange={(val) => patchParams({ sort: val, page: 1 })}
                  style={{ width: 200 }}
                  options={SORT_OPTIONS.map((o) => ({
                    label: o.label,
                    value: o.key,
                  }))}
                />

                {/* Direction */}
                <Button
                  icon={dirDesc ? <ArrowDownIcon size={16} /> : <ArrowUp size={16} />}
                  onClick={() => patchParams({ dir: dirDesc ? 'asc' : 'desc', page: 1 })}
                >
                  {dirDesc ? 'Descending' : 'Ascending'}
                </Button>

                {/* Status Filter */}
                <Select
                  placeholder="Status"
                  value={status}
                  style={{ width: 160 }}
                  onChange={(val) => patchParams({ status: val, page: 1 })}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Accepted', label: 'Accepted' },
                    { value: 'Rejected', label: 'Rejected' },
                    { value: 'Finished', label: 'Finished' },
                  ]}
                />

                {/* Date Range */}
                {/* <RangePicker
                  onChange={(val) => {
                    const from = val?.[0]?.toISOString() ?? '';
                    const to = val?.[1]?.toISOString() ?? '';
                    patchParams({ from, to, page: 1 });
                  }}
                /> */}

                {/* Reset */}
                <Button icon={<RefreshCw size={16} />} onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {items.length > 0 ? (
                  items.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {t.ticketName}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">{t.projectName}</td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <Tag color={STATUS_COLOR[t.priority] || 'default'} style={{ fontSize: 13 }}>
                          {t.priority}
                        </Tag>
                      </td>

                      <td className="px-6 py-4">
                        <Tag color={STATUS_COLOR[t.status] || 'default'} style={{ fontSize: 13 }}>
                          {t.status}
                        </Tag>
                      </td>

                      <td className="px-6 py-4 text-center flex justify-center">
                        <Button
                          type="link"
                          icon={<Edit size={16} />}
                          className="flex items-center justify-center gap-1 text-xs"
                          onClick={() => handleView(t)}
                        >
                          View Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-6">
                      No tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <b>{items.length}</b> of <b>{total}</b> tickets
              </div>

              <Stack spacing={2}>
                <Pagination
                  count={Math.max(1, Math.ceil(total / pageSize))}
                  page={pageNumber}
                  onChange={(_, p) => patchParams({ page: p })}
                  color="primary"
                  variant="outlined"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
