import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Pencil,
  ArrowUp,
  ArrowDown as ArrowDownIcon,
  X,
  ToggleLeft,
  ToggleRight,
  Eye,
  Users,
  RefreshCw,
} from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import type { AdminUser, PagedResult } from '@/interfaces/User/User';
import { getAdminUsersPaged, putStatusByAdmin } from '@/services/userService.js';
import EditUserModal from './EditUserModal';
import ViewUserModal from './ViewUserModal';
import { Modal } from 'antd';
import { toast } from 'react-toastify';

type StatusFilter = 'All' | 'Active' | 'Inactive';
const STATUS: StatusFilter[] = ['All', 'Active', 'Inactive'];
const SORT_MAP: Record<string, string> = {
  CreateAt: 'CreateAt',
  Email: 'Email',
  UserName: 'UserName',
  Status: 'Status',
};
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/* ================================== */
export default function UserListPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const status = (params.get('status') as StatusFilter) || 'All';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const pageSize = Math.max(1, parseInt(params.get('pageSize') || '10', 10) || 10);
  const sort = (params.get('sort') as 'CreateAt' | 'Email' | 'UserName' | 'Status') || 'CreateAt';
  const dirDesc = (params.get('dir') || 'desc') !== 'asc';

  const patchParams = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next, { replace: true });
  };

  const SORT_OPTIONS = [
    { key: 'CreateAt', label: 'Created At' },
    { key: 'Email', label: 'Email' },
    { key: 'UserName', label: 'User Name' },
    { key: 'Status', label: 'Status' },
  ];

  const resetFilters = () => {
    patchParams({
      q: '',
      status: 'All',
      sort: 'CreateAt',
      dir: 'desc',
      page: 1,
      pageSize,
    });
  };

  // data state
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const navigate = useNavigate();

  const beStatus = useMemo(() => {
    if (status === 'All') return undefined;
    return status === 'Active';
  }, [status]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data: PagedResult<AdminUser> = await getAdminUsersPaged({
        Email: q || undefined,
        Stauts: beStatus,
        PageNumber: page,
        PageSize: pageSize,
        SortColumn: SORT_MAP[sort] || sort,
        SortDescending: dirDesc,
      });
      setItems(data?.items ?? []);
      setTotal(data?.totalCount ?? 0);
    } catch (e: any) {
      setErr(e?.message ?? 'Load users failed');
    } finally {
      setLoading(false);
    }
  }, [q, beStatus, page, pageSize, sort, dirDesc]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleToggleStatus = (u: AdminUser) => {
    const next = !u.status;
    const action = next ? 'activate' : 'deactivate';

    Modal.confirm({
      title: `${next ? 'Activate' : 'Deactivate'} user`,
      content: `Are you sure you want to ${action} "${u.userName}"?`,
      okText: next ? 'Activate' : 'Deactivate',
      okType: next ? 'primary' : 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        try {
          setBusyId(u.id);
          await putStatusByAdmin(u.id, next);
          await reload();
          toast.success(`User ${u.userName} ${action}d successfully.`);
        } catch (e: any) {
          console.error(e);
          toast.error(e?.message ?? `Failed to ${action} user.`);
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  // Modal state
  const [modal, setModal] = useState<
    { open: false } | { open: true; user: AdminUser; mode: 'view' | 'edit' }
  >({ open: false });

  const visibleItems = useMemo(() => {
    return items;
  }, [items]);

  // handele view user detail
  const handleView = (u: AdminUser) => {
    localStorage.setItem('userDetailEnabled', 'true');
    localStorage.setItem('userDetailId', u.id);
    navigate(`/admin/users/detail/${u.id}`);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 m-0">User Management</h1>
                  <p className="text-sm text-gray-500 m-0">Manage and monitor all users</p>
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-[250px] pl-10 pr-3 h-10 rounded-lg border border-gray-300 
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Search by email..."
                    value={q}
                    onChange={(e) => patchParams({ q: e.target.value, page: 1 })}
                  />
                </div>

                {/* Sort column */}
                <select
                  className="h-9 px-3 pr-8 rounded-lg border border-gray-300 
      focus:ring-2 focus:ring-blue-500 text-sm w-[180px]"
                  value={sort}
                  onChange={(e) => patchParams({ sort: e.target.value, page: 1 })}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>

                {/* Sort direction */}
                <button
                  className="h-9 px-4 rounded-lg border border-gray-300 bg-white 
      hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors"
                  onClick={() => patchParams({ dir: dirDesc ? 'asc' : 'desc', page: 1 })}
                  aria-label="Toggle sort direction"
                  title={dirDesc ? 'Descending' : 'Ascending'}
                >
                  {dirDesc ? (
                    <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ArrowUp className="w-4 h-4 text-gray-600" />
                  )}
                  {dirDesc ? 'Descending' : 'Ascending'}
                </button>

                {/* Status Filter */}
                <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                  {STATUS.map((s) => {
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => patchParams({ status: s, page: 1 })}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                {/* Reset */}
                <button
                  className="h-9 px-4 rounded-lg border border-gray-300 bg-white 
      hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors"
                  onClick={resetFilters}
                  title="Reset filters"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Address
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        <span className="text-sm text-gray-500">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && err && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">No users found</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  !err &&
                  visibleItems.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-2">
                        <div className="font-medium text-gray-900">
                          {u.userName || (
                            <span className="text-gray-400 text-sm italic">Not provided</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <span
                          className="text-sm text-gray-600 block max-w-[220px] truncate"
                          title={u.email ?? undefined}
                        >
                          {u.email || (
                            <span className="text-gray-400 text-sm italic">Not provided</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-2 hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {u.phone || (
                            <span className="text-gray-400 text-sm italic">Not provided</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-2 hidden lg:table-cell">
                        <span
                          className="text-sm text-gray-600 block max-w-[200px] truncate"
                          title={u.address ?? undefined}
                        >
                          {u.address || (
                            <span className="text-gray-400 text-sm italic">Not provided</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          {u.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-center hidden lg:table-cell">
                        <span className="text-sm text-gray-600">
                          {u.createAt ? new Date(u.createAt).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                            title="View"
                            onClick={() => handleView(u)}
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Edit"
                            onClick={() => setModal({ open: true, user: u, mode: 'edit' })}
                          >
                            <Pencil className="w-4 h-4 text-yellow-600" />
                          </button>
                          <button
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              u.status
                                ? 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                                : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                            }`}
                            title={u.status ? 'Deactivate' : 'Activate'}
                            onClick={() => handleToggleStatus(u)}
                            disabled={busyId === u.id}
                          >
                            {u.status ? (
                              <ToggleRight className="w-5 h-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && !err && visibleItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">No users found</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{visibleItems.length}</span>{' '}
                  of <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>{' '}
                  users
                </span>
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
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Stack spacing={2}>
                <Pagination
                  count={Math.max(1, Math.ceil(total / pageSize))}
                  page={page}
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

      {/* Modals */}
      {modal.open &&
        (modal.mode === 'edit' ? (
          <EditUserModal
            open
            selected={modal.user}
            onUpdated={async () => await reload()}
            onClose={() => setModal({ open: false })}
          />
        ) : (
          <ViewUserModal open selected={modal.user} onClose={() => setModal({ open: false })} />
        ))}
    </>
  );
}
