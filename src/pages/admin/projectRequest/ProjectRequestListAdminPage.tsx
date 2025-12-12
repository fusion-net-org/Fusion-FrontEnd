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
import { Input, Select, Button, Modal, Descriptions, Tag } from 'antd';
import { toast } from 'react-toastify';
import { GetAllProjectRequestByAdmin } from '@/services/projectRequest.js';

type ProjectRequest = {
  id: string;
  requesterCompanyId: string;
  requesterCompanyName: string;
  requesterCompanyLogoUrl: string;
  executorCompanyId: string;
  executorCompanyName: string;
  executorCompanyLogoUrl: string;
  createdBy: string;
  createdName: string;
  code: string;
  projectName: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  createAt: string;
  updateAt: string;
  isDeleted: boolean;
  isHaveProject: boolean;
  convertedProjectId: string;
};

type PagedResult = {
  items: ProjectRequest[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

type SortKey = 'code' | 'name';

const SORT_OPTIONS = [
  { key: 'code', label: 'Request Code' },
  { key: 'name', label: 'Project Name' },
];

const STATUS_COLOR: Record<string, string> = {
  // Status
  Pending: 'gold',
  Accepted: 'blue',
  Rejected: 'red',
  Finished: 'green',
};

export default function ProjectRequestListAdminPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const q = params.get('q') ?? '';
  const sort = (params.get('sort') as SortKey) || 'code';
  const dirDesc = (params.get('dir') || 'desc') !== 'asc';
  const status = params.get('status') ?? '';
  const pageNumber = Math.max(1, parseInt(params.get('page') || '1', 10));
  const pageSize = Math.max(1, parseInt(params.get('pageSize') || '10', 10));

  const [items, setItems] = useState<ProjectRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProjectRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const patchParams = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next, { replace: true });
  };

  const resetFilters = () => {
    patchParams({
      q: '',
      sort: 'code',
      dir: 'desc',
      page: 1,
      pageSize,
    });
  };

  const reload = React.useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      const data: PagedResult = await GetAllProjectRequestByAdmin(
        null, // companyId
        q || '', // Keyword
        status || null, // Status
        false, // Deleted
        null, // IsHaveProject
        null, // ViewMode
        'StartEndDate', // DateFilterType
        null, // DateRangeFrom
        null, // DateRangeTo
        pageNumber,
        pageSize,
        sort,
        dirDesc,
      );

      setItems(data?.items ?? []);
      setTotal(data?.totalCount ?? 0);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load project requests');
      toast.error(e?.message ?? 'Failed to load project requests');
    } finally {
      setLoading(false);
    }
  }, [q, status, pageNumber, pageSize, sort, dirDesc]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleView = (p: ProjectRequest) => {
    localStorage.setItem('projectRequestDetailEnabled', 'true');
    localStorage.setItem('projectRequestId', p.id);
    navigate(`/admin/project-request/detail/${p.id}`);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <FilePlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 m-0">
                  Project Request Management
                </h1>
                <p className="text-sm text-gray-500 m-0">
                  View and manage project requests submitted by companies
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <Input
                  placeholder="Search by project name or code..."
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
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Executor
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
                  items.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{p.projectName}</td>

                      <td className="px-6 py-4 text-sm text-gray-600">{p.requesterCompanyName}</td>

                      <td className="px-6 py-4 text-sm text-gray-600">{p.executorCompanyName}</td>

                      <td className="px-6 py-4">
                        <Tag color={STATUS_COLOR[p.status] || 'default'} style={{ fontSize: 13 }}>
                          {p.status}
                        </Tag>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <Button
                          type="link"
                          icon={<Edit size={16} />}
                          className="flex items-center justify-center gap-1 text-xs"
                          onClick={() => handleView(p)}
                        >
                          View Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-6">
                      No project requests found
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
                Showing <b>{items.length}</b> of <b>{total}</b> requests
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

      {/* Modal Detail */}
      <Modal
        title="Project Request Details"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedItem ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Code">{selectedItem.code}</Descriptions.Item>
            <Descriptions.Item label="Project Name">{selectedItem.projectName}</Descriptions.Item>
            <Descriptions.Item label="Requester">
              {selectedItem.requesterCompanyName}
            </Descriptions.Item>
            <Descriptions.Item label="Executor">
              {selectedItem.executorCompanyName}
            </Descriptions.Item>
            <Descriptions.Item label="Status">{selectedItem.status}</Descriptions.Item>
            <Descriptions.Item label="Start Date">{selectedItem.startDate}</Descriptions.Item>
            <Descriptions.Item label="End Date">{selectedItem.endDate}</Descriptions.Item>
            <Descriptions.Item label="Created At">{selectedItem.createAt}</Descriptions.Item>
            <Descriptions.Item label="Updated At">{selectedItem.updateAt}</Descriptions.Item>
          </Descriptions>
        ) : (
          <p className="text-center text-gray-400 py-4">No data available</p>
        )}
      </Modal>
    </>
  );
}
