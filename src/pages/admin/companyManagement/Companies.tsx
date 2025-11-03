// src/pages/admin/Admin.tsx
/* Layout wired to API for list & detail, Stats popups, and admin Update/Delete */
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
} from 'lucide-react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import EditCompanyModal from './EditCompanyModal';
import CompanyDetailDrawer from './CompanyDetailDrawer';

// Services (nhớ chỉnh path đúng dự án của bạn)
import {
  getAllCompanies,
  getCompanyById,
  updateCompanyByAdmin,
  // file service đang export deleteCompanyByAdmn (typo) => alias lại cho an toàn
  deleteCompanyByAdmn as deleteCompanyByAdmin,
} from '@/services/companyService.js';

type Row = {
  id: string;
  name: string;
  ownerUserId?: string | null;
  ownerUserName?: string | null;
  taxCode?: string | null;
  email?: string | null;
  detail?: string | null;
  imageCompany?: string | null; // cover/banner
  avatarCompany?: string | null; // avatar
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
const STATUS: StatusFilter[] = ['All', 'Active', 'Deleted']; // vẫn hỗ trợ qua URL nếu cần
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/* ---------- Helpers ---------- */
function unwrap<T = any>(res: any): T {
  // ResponseModel<T> hoặc T
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

export default function AdminCompaniesPage() {
  const [params, setParams] = useSearchParams();

  // URL params
  const q = params.get('q') ?? '';
  const status = (params.get('status') as StatusFilter) || 'All'; // không hiển thị nút filter nhưng vẫn tôn trọng param
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
      pageSize, // giữ nguyên pageSize hiện tại
    });
  };

  /* -------- List from /company/all-companies -------- */
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

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

  /* helper: build FormData text-only (admin fields) */
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

  return (
    <div className="space-y-5">
      {/* Header - styled like screenshot */}
      <div className="flex items-center justify-between gap-3">
        {/* Left group (search + sort controls) */}
        <div className="flex-1 flex items-center gap-3">
          {/* Search by email */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="w-full pl-10 pr-3 h-11 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or tax..."
              value={q}
              onChange={(e) => patchParams({ q: e.target.value, page: 1 })}
            />
          </div>

          {/* Sort column */}
          <select
            className="h-11 px-3 pr-8 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
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
            className="w-11 h-11 rounded-xl border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
            onClick={() => patchParams({ dir: dirDesc ? 'asc' : 'desc', page: 1 })}
            aria-label="Toggle sort direction"
            title={dirDesc ? 'Descending' : 'Ascending'}
          >
            {dirDesc ? <ArrowDownIcon className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
          </button>

          {/* Reset */}
          <button
            className="h-11 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
            onClick={resetFilters}
            title="Reset filters"
          >
            Reset
          </button>
        </div>

        {/* Right: New */}
        <button
          className="h-11 px-4 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-2"
          onClick={() => alert('TODO: Wire create to API')}
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Company</th>
              <th className="px-3 py-2">Tax</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2 hidden md:table-cell">Phone</th>
              <th className="px-3 py-2 text-center hidden lg:table-cell">Updated</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && err && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-red-600">
                  {err}
                </td>
              </tr>
            )}
            {!loading &&
              !err &&
              visibleRows.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">
                    <button
                      className="flex items-center gap-2 hover:underline"
                      onClick={() => setSelected(c)}
                      title="View details"
                    >
                      {c.avatarCompany && (
                        <img src={c.avatarCompany} className="w-6 h-6 rounded" alt="logo" />
                      )}
                      <div className="font-medium text-left">{c.name}</div>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">{c.taxCode ?? '-'}</td>
                  <td className="px-3 py-2 max-w-[220px] truncate" title={c.email ?? undefined}>
                    {c.email ?? '-'}
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">{c.phoneNumber ?? '-'}</td>
                  <td className="px-3 py-2 text-center hidden lg:table-cell">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.isDeleted ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {c.isDeleted ? 'Deleted' : 'Active'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-1">
                    <button
                      className="p-2 rounded hover:bg-gray-100"
                      title="View"
                      onClick={() => setSelected(c)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-gray-100"
                      title="Edit"
                      onClick={() => setModal({ open: true, data: c })}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {!c.isDeleted && (
                      <button
                        className="p-2 rounded hover:bg-red-50 text-red-600"
                        title="Deactivate"
                        onClick={async () => {
                          if (!confirm('Deactivate this company?')) return;
                          try {
                            await deleteCompanyByAdmin(c.id);
                            // đồng bộ UI
                            setRows((prev) =>
                              prev.map((x) => (x.id === c.id ? { ...x, isDeleted: true } : x)),
                            );
                            setSelected((sel) =>
                              sel && sel.id === c.id ? { ...sel, isDeleted: true } : sel,
                            );
                          } catch (e: any) {
                            alert(e?.message || 'Deactivate failed');
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            {!loading && !err && visibleRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  No companies
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (giống ảnh) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            Total:&nbsp;<b>{total.toLocaleString()}</b>
          </span>
          <label className="inline-flex items-center gap-2">
            <span className="text-gray-600">Rows per page</span>
            <select
              className="px-2 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              value={pageSize}
              onChange={(e) => {
                const size = Math.max(1, parseInt(e.target.value || '10', 10));
                patchParams({ pageSize: size, page: 1 }); // reset về trang 1
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

      {/* Detail Drawer */}
      <CompanyDetailDrawer row={selected} loading={loading} onClose={() => setSelected(null)} />

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
    </div>
  );
}
