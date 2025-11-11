import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowUp,
  ArrowDown as ArrowDownIcon,
  RefreshCw,
  FolderKanban,
  Eye,
  Edit,
} from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { Input, Select, Button, Modal, Descriptions } from 'antd';
import { toast } from 'react-toastify';
import { getAllProjectByAdmin } from '@/services/projectService.js';

type Project = {
  id: string;
  name: string;
  projectType: string;
  companyId: string;
  companyName: string;
  companyHiredId: string;
  companyHiredName: string;
  workflowId: string;
  workflowName: string;
  ownerId: string;
  ownerName: string;
  members: {
    memberId: string;
    memberName: string;
    avatar: string;
  }[];
  sprintCount: number;
  totalTask: number;
  totalPoint: number;
  progress: number;
  sprints: {
    id: string;
    name: string;
    taskCount: number;
    totalPoint: number;
    tasks: {
      id: string;
      title: string;
      point: number;
      status: string;
    }[];
  }[];
  createAt?: string;
  updateAt?: string;
};

type PagedResult = {
  items: Project[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

type SortKey = 'Id' | 'name';

const SORT_OPTIONS = [
  { key: 'Id', label: 'Id' },
  { key: 'name', label: 'Project Name' },
];

export default function ProjectListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const q = params.get('q') ?? '';
  const sort = (params.get('sort') as SortKey) || 'Id';
  const dirDesc = (params.get('dir') || 'desc') !== 'asc';
  const pageNumber = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const pageSize = Math.max(1, parseInt(params.get('pageSize') || '10', 10) || 10);

  const [items, setItems] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      sort: 'Id',
      dir: 'desc',
      page: 1,
      pageSize,
    });
  };

  const reload = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data: PagedResult = await getAllProjectByAdmin({
        CompanyName: q || '',
        PageNumber: pageNumber,
        PageSize: pageSize,
        SortColumn: sort,
        SortDescending: dirDesc,
      });

      setItems(data?.items ?? []);
      setTotal(data?.totalCount ?? 0);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load projects');
      toast.error(e?.message ?? 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [q, pageNumber, pageSize, sort, dirDesc]);

  useEffect(() => {
    reload();
  }, [reload]);

  // handele view project detail
  const handleView = (p: any) => {
    localStorage.setItem('projectDetailEnabled', 'true');
    localStorage.setItem('projectDetailId', p.id);
    navigate(`/admin/projects/detail/${p.id}`);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 m-0">Project Management</h1>
                  <p className="text-sm text-gray-500 m-0">
                    View and manage projects created by companies
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  placeholder="Search by company name..."
                  allowClear
                  prefix={<Search size={16} className="text-gray-400" />}
                  value={q}
                  onChange={(e) => patchParams({ q: e.target.value, page: 1 })}
                  style={{ width: 250 }}
                />
                <Select
                  value={sort}
                  onChange={(val) => patchParams({ sort: val, page: 1 })}
                  style={{ width: 180 }}
                  placeholder="Sort by"
                  options={SORT_OPTIONS.map((o) => ({
                    label: o.label,
                    value: o.key,
                  }))}
                />
                <Button
                  icon={dirDesc ? <ArrowDownIcon size={16} /> : <ArrowUp size={16} />}
                  onClick={() => patchParams({ dir: dirDesc ? 'asc' : 'desc', page: 1 })}
                >
                  {dirDesc ? 'Descending' : 'Ascending'}
                </Button>
                <Button
                  icon={<RefreshCw size={16} />}
                  onClick={resetFilters}
                  className="flex items-center"
                >
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
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Progress
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
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {p.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.companyName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.ownerName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.totalTask ?? 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.progress ?? 0}%</td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          type="link"
                          icon={<Edit size={16} />}
                          className="flex items-center justify-center gap-1 text-xs"
                          //   onClick={() => {
                          //     setSelectedProject(p);
                          //     setIsModalOpen(true);
                          //   }}
                          onClick={() => handleView(p)}
                        >
                          View detail
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-6">
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              {/* Left side: summary + rows per page */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{items.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>{' '}
                  projects
                </span>

                {/* Rows per page selector */}
                <label className="inline-flex items-center gap-2">
                  <span className="text-gray-600">Rows per page:</span>
                  <select
                    className="px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                    value={pageSize}
                    onChange={(e) => {
                      const size = Math.max(1, parseInt(e.target.value || '10', 10));
                      patchParams({ pageSize: size, page: 1 });
                    }}
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Right side: pagination */}
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

      {/* Modal */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Project Details</h2>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedProject ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="ID">{selectedProject.id}</Descriptions.Item>
            <Descriptions.Item label="Project Name">{selectedProject.name}</Descriptions.Item>
            <Descriptions.Item label="Company Name">
              {selectedProject.companyName}
            </Descriptions.Item>
            <Descriptions.Item label="Owner Name">{selectedProject.ownerName}</Descriptions.Item>
            <Descriptions.Item label="Workflow">{selectedProject.workflowName}</Descriptions.Item>
            <Descriptions.Item label="Total Tasks">{selectedProject.totalTask}</Descriptions.Item>
            <Descriptions.Item label="Progress">{selectedProject.progress}%</Descriptions.Item>
            <Descriptions.Item label="Created At">
              {selectedProject.createAt || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {selectedProject.updateAt || '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <p className="text-center text-gray-400 py-4">No data available</p>
        )}
      </Modal>
    </>
  );
}
