import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown as ArrowDownIcon,
  Eye,
  X,
  Building2,
  RefreshCw,
} from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import EditCompanyModal from './EditCompanyModal';
import CompanyDetailDrawer from './CompanyDetailDrawer';
import {
  getAllCompanies,
  getCompanyById,
  updateCompanyByAdmin,
  deleteCompanyByAdmin,
} from '@/services/companyService.js';
import { Modal } from 'antd';
import { toast } from 'react-toastify';

type Row = {
  id: string;
  name: string;
  ownerUserId?: string | null;
  ownerUserName?: string | null;
  taxCode?: string | null;
  email?: string | null;
  detail?: string | null;
  imageCompany?: string | null;
  avatarCompany?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;

  totalMember?: number | null;
  totalProject?: number | null;
  totalPartners?: number | null;
  totalApproved?: number | null;

  listMembers?: any[] | null;
  listProjects?: any[] | null;
};

type SortKey = 'CreatedAt' | 'UpdatedAt' | 'Name' | 'Email' | 'TaxCode' | 'IsDeleted';
type StatusFilter = 'All' | 'Active' | 'Deleted';
const STATUS: StatusFilter[] = ['All', 'Active', 'Deleted'];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/* ---------- Helpers ---------- */
function unwrap<T = any>(res: any): T {
  if (res?.data?.data !== undefined) return res.data.data as T;
  if (res?.data !== undefined) return res.data as T;
  return res as T;
}

function mapCompanyToRow(c: any): Row {
  const created = c?.createdAt || c?.createAt || c?.CreateAt || new Date().toISOString();
  const updated = c?.updatedAt || c?.updateAt || c?.UpdateAt || created;
  return {
    id: c?.id,
    name: c?.name,
    ownerUserId: c?.ownerUserId,
    ownerUserName: c?.ownerUserName,
    taxCode: c?.taxCode,
    email: c?.email,
    detail: c?.detail,
    imageCompany: c?.imageCompany,
    avatarCompany: c?.avatarCompany,
    address: c?.address,
    phoneNumber: c?.phoneNumber,
    website: c?.website,
    createdAt: String(created),
    updatedAt: String(updated),
    isDeleted: Boolean(c?.isDeleted),

    totalMember: c?.totalMember ?? 0,
    totalProject: c?.totalProject ?? 0,
    totalPartners: c?.totalPartners ?? 0,
    totalApproved: c?.totalApproved ?? 0,

    listMembers: c?.listMembers ?? null,
    listProjects: c?.listProjects ?? null,
  };
}

const fmtDate = (d?: any) => (d ? new Date(d).toLocaleString() : '-');

export default function CompanyListPage() {
  const [params, setParams] = useSearchParams();

  // URL params
  const q = params.get('q') ?? '';
  const status = (params.get('status') as StatusFilter) || 'All';
  const sort = (params.get('sort') as SortKey) || 'CreatedAt';
  const dirDesc = (params.get('dir') || 'desc') !== 'asc';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const pageSize = Math.max(1, parseInt(params.get('pageSize') || '10', 10) || 10);

  const patchParams = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next, { replace: true });
  };

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'CreatedAt', label: 'Created At' },
    { key: 'UpdatedAt', label: 'Updated At' },
    { key: 'Name', label: 'Name' },
    { key: 'Email', label: 'Email' },
    { key: 'TaxCode', label: 'Tax Code' },
    { key: 'IsDeleted', label: 'Status' },
  ];

  const resetFilters = () => {
    patchParams({
      q: '',
      sort: 'CreatedAt',
      dir: 'desc',
      page: 1,
      pageSize,
    });
  };

  /* -------- List from /company/all-companies -------- */
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const sortColMap: Record<SortKey, string> = {
          CreatedAt: 'CreateAt',
          UpdatedAt: 'UpdateAt',
          Name: 'Name',
          Email: 'Email',
          TaxCode: 'TaxCode',
          IsDeleted: 'IsDeleted',
        };
        const sortCol = sortColMap[sort] ?? 'CreateAt';

        const res = await getAllCompanies(q ?? '', '', '', page, pageSize, sortCol, dirDesc, '');

        const paged = unwrap<any>(res);
        const items = paged?.items ?? [];
        const totalCnt = paged?.totalCount ?? items.length;

        const mapped: Row[] = items.map(mapCompanyToRow);

        if (!cancelled) {
          setRows(mapped);
          setTotal(totalCnt);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || 'Load companies failed');
          setRows([]);
          setTotal(0);
        }
      } finally {
        !cancelled && setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, sort, dirDesc, page, pageSize]);

  // Filter by status (client-side)
  const visibleRows = useMemo(() => {
    if (status === 'All') return rows;
    const flag = status === 'Deleted';
    return rows.filter((x) => x.isDeleted === flag);
  }, [rows, status]);

  // Detail drawer (fetch detail)
  const [selected, setSelected] = useState<Row | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  useEffect(() => {
    if (!selected?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setDetailLoading(true);
        const res = await getCompanyById(selected.id);
        const data = unwrap<any>(res);
        if (!cancelled && data?.id) setSelected(mapCompanyToRow(data));
      } finally {
        !cancelled && setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  /* -------- Edit modal state -------- */
  const [modal, setModal] = useState<{ open: false } | { open: true; data: Row }>({ open: false });

  const buildAdminUpdateForm = (p: {
    name?: string;
    taxCode?: string;
    detail?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    website?: string;
  }) => {
    const fd = new FormData();
    if (p.name !== undefined) fd.append('Name', p.name);
    if (p.taxCode !== undefined) fd.append('TaxCode', p.taxCode);
    if (p.detail !== undefined) fd.append('Detail', p.detail);
    if (p.email !== undefined) fd.append('Email', p.email);
    if (p.phoneNumber !== undefined) fd.append('PhoneNumber', p.phoneNumber);
    if (p.address !== undefined) fd.append('Address', p.address);
    if (p.website !== undefined) fd.append('Website', p.website);
    return fd;
  };

  /* -------- Delete/Deactivate Handler -------- */
  const handleDeactivateCompany = (c: Row) => {
    Modal.confirm({
      title: 'Deactivate Company',
      content: (
        <div className="space-y-2">
          <p>Are you sure you want to deactivate this company?</p>
          <div className="bg-gray-50 p-3 rounded-lg mt-3">
            <p className="font-semibold text-gray-900">{c.name}</p>
            {c.taxCode && <p className="text-sm text-gray-600">Tax Code: {c.taxCode}</p>}
          </div>
          <p className="text-sm text-red-600 mt-2">This action will mark the company as deleted.</p>
        </div>
      ),
      okText: 'Deactivate',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        try {
          setBusyId(c.id);
          await deleteCompanyByAdmin(c.id);

          setRows((prev) => prev.map((x) => (x.id === c.id ? { ...x, isDeleted: true } : x)));
          setSelected((sel) => (sel && sel.id === c.id ? { ...sel, isDeleted: true } : sel));

          toast.success(`Company "${c.name}" has been deactivated successfully.`);
        } catch (e: any) {
          console.error(e);
          toast.error(e?.message || 'Failed to deactivate company.');
        } finally {
          setBusyId(null);
        }
      },
    });
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
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Company Management</h1>
                  <p className="text-sm text-gray-500">Manage and monitor all companies</p>
                </div>
              </div>
              <button
                className="h-10 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium"
                onClick={() => alert('TODO: Wire create to API')}
              >
                <Plus className="w-4 h-4" />
                New Company
              </button>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-3 h-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Search by name or tax code..."
                  value={q}
                  onChange={(e) => patchParams({ q: e.target.value, page: 1 })}
                />
              </div>

              {/* Sort column */}
              <select
                className="h-10 px-3 pr-8 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors"
                onClick={() => patchParams({ dir: dirDesc ? 'asc' : 'desc', page: 1 })}
                aria-label="Toggle sort direction"
                title={dirDesc ? 'Descending' : 'Ascending'}
              >
                {dirDesc ? (
                  <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                ) : (
                  <ArrowUp className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {/* Reset */}
              <button
                className="h-10 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors"
                onClick={resetFilters}
                title="Reset filters"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tax Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
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
                        <span className="text-sm text-gray-500">Loading companies...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && err && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                          <X className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="text-sm font-medium text-red-600">{err}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  !err &&
                  visibleRows.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          className="flex items-center gap-3 hover:text-blue-600 transition-colors"
                          onClick={() => setSelected(c)}
                          title="View details"
                        >
                          {c.avatarCompany ? (
                            <img
                              src={c.avatarCompany}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                              alt={c.name}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{c.name}</div>
                            {c.ownerUserName && (
                              <div className="text-xs text-gray-500">Owner: {c.ownerUserName}</div>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-900 font-mono">{c.taxCode ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-sm text-gray-600 block max-w-[220px] truncate"
                          title={c.email ?? undefined}
                        >
                          {c.email ?? '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{c.phoneNumber ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center hidden lg:table-cell">
                        <span className="text-sm text-gray-600">
                          {new Date(c.updatedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            c.isDeleted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.isDeleted ? 'bg-red-500' : 'bg-green-500'
                            }`}
                          />
                          {c.isDeleted ? 'Deleted' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                            title="View"
                            onClick={() => setSelected(c)}
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Edit"
                            onClick={() => setModal({ open: true, data: c })}
                          >
                            <Pencil className="w-4 h-4 text-yellow-600" />
                          </button>
                          {!c.isDeleted && (
                            <button
                              className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Deactivate"
                              onClick={() => handleDeactivateCompany(c)}
                              disabled={busyId === c.id}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && !err && visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">No companies found</p>
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
                  Showing <span className="font-semibold text-gray-900">{visibleRows.length}</span>{' '}
                  of <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>{' '}
                  companies
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

      {/* Detail Drawer */}
      <CompanyDetailDrawer
        row={selected}
        loading={detailLoading}
        onClose={() => setSelected(null)}
      />

      {/* Edit Modal */}
      {modal.open && (
        <EditCompanyModal
          open={true}
          data={
            modal.data
              ? {
                  name: modal.data.name ?? undefined,
                  taxCode: modal.data.taxCode ?? undefined,
                  detail: modal.data.detail ?? undefined,
                  email: modal.data.email ?? undefined,
                  phoneNumber: modal.data.phoneNumber ?? undefined,
                  address: modal.data.address ?? undefined,
                  website: modal.data.website ?? undefined,
                }
              : null
          }
          onClose={() => setModal({ open: false })}
          onSaved={async (payload) => {
            try {
              const fd = buildAdminUpdateForm(payload);
              const res = await updateCompanyByAdmin(modal.data.id, fd);
              const updated = mapCompanyToRow(unwrap<any>(res));
              setRows((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
              setSelected((sel) => (sel && sel.id === updated.id ? { ...sel, ...updated } : sel));
              setModal({ open: false });
            } catch (e: any) {
              alert(e?.message || 'Update failed');
            }
          }}
        />
      )}
    </>
  );
}
