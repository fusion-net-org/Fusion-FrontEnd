import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Pencil, ArrowUp, ArrowDown, X, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import type { AdminUser, PagedResult } from '@/interfaces/User/User';
import { getAdminUsersPaged, putStatusByAdmin } from '@/services/userService.js';
import EditUserModal from './EditUserModal';
import ViewUserModal from './ViewUserModal';
import { Modal } from 'antd';
import { toast } from 'react-toastify';
import UserOverviewCharts from './UserOverviewCharts';

/* ---------- Helpers ---------- */
type StatusFilter = 'All' | 'Active' | 'Inactive';
const STATUS: StatusFilter[] = ['All', 'Active', 'Inactive'];
const SORT_MAP: Record<string, string> = {
  CreateAt: 'CreateAt',
  Email: 'Email',
  UserName: 'UserName',
  Status: 'Status',
};

/* ================================== */
export default function AdminUsersPage() {
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

  // data state
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // convert UI status -> BE
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

  const handleReset = () =>
    patchParams({ q: undefined, status: 'All', sort: 'CreateAt', dir: 'desc', page: 1 });

  return (
    <div className="space-y-6">
      {/* Chart */}
      <UserOverviewCharts items={items} />

      {/* Filters & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            className="w-full pl-10 pr-9 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="Search by email…"
            value={q}
            onChange={(e) => patchParams({ q: e.target.value, page: 1 })}
          />
          {q && (
            <button
              className="absolute right-2 top-2.5 p-1 rounded hover:bg-gray-100"
              onClick={() => patchParams({ q: undefined, page: 1 })}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring focus:ring-blue-500"
            value={sort}
            onChange={(e) => patchParams({ sort: e.target.value, page: 1 })}
          >
            <option value="CreateAt">Created At</option>
            <option value="Email">Email</option>
            <option value="UserName">User Name</option>
            <option value="Status">Status</option>
          </select>
          <button
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            onClick={() => patchParams({ dir: dirDesc ? 'asc' : 'desc', page: 1 })}
          >
            {dirDesc ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        {/* Status Tabs */}
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          {STATUS.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                className={`px-4 py-1.5 text-sm transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => patchParams({ status: s, page: 1 })}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {['User Name', 'Email', 'Phone', 'Address', 'Status', 'Created', 'Action'].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}

            {!loading &&
              items.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.userName}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.phone ?? '-'}</td>
                  <td className="px-4 py-3">{u.address ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        u.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {u.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {u.createAt ? new Date(u.createAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button
                      className="p-2 rounded hover:bg-blue-50"
                      onClick={() => setModal({ open: true, user: u, mode: 'view' })}
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-yellow-50"
                      onClick={() => setModal({ open: true, user: u, mode: 'edit' })}
                    >
                      <Pencil className="w-4 h-4 text-yellow-600" />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => handleToggleStatus(u)}
                      disabled={busyId === u.id || !u.status}
                    >
                      {u.status ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  {err ?? 'No users found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Total:</span>
          <span className="font-semibold">{total.toLocaleString()}</span>
          <span className="ml-3">Rows per page</span>
          <select
            className="px-2 py-1 rounded border border-gray-300"
            value={pageSize}
            onChange={(e) => patchParams({ pageSize: Number(e.target.value), page: 1 })}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
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
    </div>
  );
}
