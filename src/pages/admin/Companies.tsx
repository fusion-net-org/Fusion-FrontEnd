// src/pages/admin/Admin.tsx
/* Layout wired to API for list & detail, Stats popups, and admin Update/Delete */
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Plus, Pencil, Trash2,
  ArrowUp, ArrowDown as ArrowDownIcon, Eye, X
} from "lucide-react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

// Services (nhớ chỉnh path đúng dự án của bạn)
import {
  getAllCompanies,
  getCompanyById,
  updateCompanyByAdmin,
  // file service đang export deleteCompanyByAdmn (typo) => alias lại cho an toàn
  deleteCompanyByAdmn as deleteCompanyByAdmin,
} from "@/services/companyService.js";

type Row = {
  id: string;
  name: string;
  ownerUserId?: string | null;
  ownerUserName?: string | null;
  taxCode?: string | null;
  email?: string | null;
  detail?: string | null;
  imageCompany?: string | null;   // cover/banner
  avatarCompany?: string | null;  // avatar
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

type SortKey = "CreatedAt" | "UpdatedAt" | "Name" | "Email" | "TaxCode" | "IsDeleted";
type StatusFilter = "All" | "Active" | "Deleted";
const STATUS: StatusFilter[] = ["All", "Active", "Deleted"]; // vẫn hỗ trợ qua URL nếu cần
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

const fmtDate = (d?: any) => (d ? new Date(d).toLocaleString() : "-");

export default function AdminCompaniesPage() {
  const [params, setParams] = useSearchParams();

  // URL params
  const q        = params.get("q") ?? "";
  const status   = (params.get("status") as StatusFilter) || "All"; // không hiển thị nút filter nhưng vẫn tôn trọng param
  const sort     = (params.get("sort") as SortKey) || "CreatedAt";
  const dirDesc  = (params.get("dir") || "desc") !== "asc";
  const page     = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const pageSize = Math.max(1, parseInt(params.get("pageSize") || "10", 10) || 10);

  const patchParams = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next, { replace: true });
  };

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "CreatedAt", label: "Created At" },
    { key: "UpdatedAt", label: "Updated At" },
    { key: "Name",      label: "Name" },
    { key: "Email",     label: "Email" },
    { key: "TaxCode",   label: "Tax Code" },
    { key: "IsDeleted", label: "Status" },
  ];

  const resetFilters = () => {
    patchParams({
      q: "",
      sort: "CreatedAt",
      dir: "desc",
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
          CreatedAt: "CreateAt",
          UpdatedAt: "UpdateAt",
          Name: "Name",
          Email: "Email",
          TaxCode: "TaxCode",
          IsDeleted: "IsDeleted",
        };
        const sortCol = sortColMap[sort] ?? "CreateAt";

        const res = await getAllCompanies(
          q ?? "", "", "", page, pageSize, sortCol, dirDesc, ""
        );

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
          setErr(e?.message || "Load companies failed");
          setRows([]);
          setTotal(0);
        }
      } finally {
        !cancelled && setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q, sort, dirDesc, page, pageSize]);

  // Filter by status (client-side)
  const visibleRows = useMemo(() => {
    if (status === "All") return rows;
    const flag = status === "Deleted";
    return rows.filter(x => x.isDeleted === flag);
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
    return () => { cancelled = true; };
  }, [selected?.id]);

  /* -------- Edit modal state -------- */
  const [modal, setModal] = useState<
    | { open:false }
    | { open:true; data:Row }
  >({ open:false });

  /* helper: build FormData text-only (admin fields) */
  const buildAdminUpdateForm = (p: {
    name?: string; taxCode?: string; detail?: string; email?: string;
    phoneNumber?: string; address?: string; website?: string;
  }) => {
    const fd = new FormData();
    if (p.name !== undefined)        fd.append("Name", p.name);
    if (p.taxCode !== undefined)     fd.append("TaxCode", p.taxCode);
    if (p.detail !== undefined)      fd.append("Detail", p.detail);
    if (p.email !== undefined)       fd.append("Email", p.email);
    if (p.phoneNumber !== undefined) fd.append("PhoneNumber", p.phoneNumber);
    if (p.address !== undefined)     fd.append("Address", p.address);
    if (p.website !== undefined)     fd.append("Website", p.website);
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
            {SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>

          {/* Sort direction */}
          <button
            className="w-11 h-11 rounded-xl border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
            onClick={() => patchParams({ dir: dirDesc ? "asc" : "desc", page: 1 })}
            aria-label="Toggle sort direction"
            title={dirDesc ? "Descending" : "Ascending"}
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
          onClick={()=> alert("TODO: Wire create to API")}
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
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">Loading…</td></tr>
            )}
            {!loading && err && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-red-600">{err}</td></tr>
            )}
            {!loading && !err && visibleRows.map(c => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">
                  <button
                    className="flex items-center gap-2 hover:underline"
                    onClick={()=> setSelected(c)}
                    title="View details"
                  >
                    {c.avatarCompany && <img src={c.avatarCompany} className="w-6 h-6 rounded" alt="logo" />}
                    <div className="font-medium text-left">{c.name}</div>
                  </button>
                </td>
                <td className="px-3 py-2 text-center">{c.taxCode ?? "-"}</td>
                <td className="px-3 py-2 max-w-[220px] truncate" title={c.email ?? undefined}>{c.email ?? "-"}</td>
                <td className="px-3 py-2 hidden md:table-cell">{c.phoneNumber ?? "-"}</td>
                <td className="px-3 py-2 text-center hidden lg:table-cell">
                  {new Date(c.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.isDeleted ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    {c.isDeleted ? "Deleted" : "Active"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right space-x-1">
                  <button className="p-2 rounded hover:bg-gray-100" title="View"
                          onClick={()=> setSelected(c)}>
                    <Eye className="w-4 h-4"/>
                  </button>
                  <button className="p-2 rounded hover:bg-gray-100" title="Edit"
                          onClick={()=> setModal({ open:true, data:c })}>
                    <Pencil className="w-4 h-4"/>
                  </button>

                  {!c.isDeleted && (
                    <button
                      className="p-2 rounded hover:bg-red-50 text-red-600"
                      title="Deactivate"
                      onClick={async ()=> {
                        if (!confirm("Deactivate this company?")) return;
                        try {
                          await deleteCompanyByAdmin(c.id);
                          // đồng bộ UI
                          setRows(prev => prev.map(x => x.id === c.id ? { ...x, isDeleted: true } : x));
                          setSelected(sel => sel && sel.id === c.id ? { ...sel, isDeleted: true } : sel);
                        } catch (e:any) {
                          alert(e?.message || "Deactivate failed");
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && !err && visibleRows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">No companies</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (giống ảnh) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">Total:&nbsp;<b>{total.toLocaleString()}</b></span>
          <label className="inline-flex items-center gap-2">
            <span className="text-gray-600">Rows per page</span>
            <select
              className="px-2 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              value={pageSize}
              onChange={(e) => {
                const size = Math.max(1, parseInt(e.target.value || "10", 10));
                patchParams({ pageSize: size, page: 1 }); // reset về trang 1
              }}
            >
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <Stack spacing={2}>
          <Pagination
            count={Math.max(1, Math.ceil(total / pageSize))}
            page={page}
            onChange={(_, p)=> patchParams({ page: p })}
            color="primary" variant="outlined" shape="rounded"
            showFirstButton showLastButton
          />
        </Stack>
      </div>

      {/* Detail Drawer */}
      <CompanyDetailDrawer
        row={selected}
        loading={detailLoading}
        onClose={()=> setSelected(null)}
      />

      {/* Edit Modal */}
      {modal.open && (
        <EditCompanyModal
          data={modal.data}
          onClose={()=> setModal({ open:false })}
          onSaved={async (payload) => {
            try {
              const fd = buildAdminUpdateForm(payload);
              const res = await updateCompanyByAdmin(modal.data.id, fd);
              const updated = mapCompanyToRow(unwrap<any>(res));
              // sync list & detail
              setRows(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));
              setSelected(sel => sel && sel.id === updated.id ? { ...sel, ...updated } : sel);
              setModal({ open:false });
            } catch (e:any) {
              alert(e?.message || "Update failed");
            }
          }}
        />
      )}
    </div>
  );
}

/* ---------- Detail Drawer + Stats Modal ---------- */
function CompanyDetailDrawer({
  row, loading, onClose
}:{ row: Row | null; loading: boolean; onClose: ()=>void; }) {
  const [stats, setStats] = useState<{open:boolean; tab:"members"|"projects"|"partners"}>({open:false, tab:"members"});
  useEffect(()=>{ if(!row) setStats({open:false, tab:"members"}); },[row]);
  if (!row) return null;

  const cover = row.imageCompany || "https://placehold.co/1200x240?text=Cover";
  const avatar = row.avatarCompany || "https://placehold.co/160x160?text=Avatar";

  const Field = ({ label, children }:{ label:string; children:React.ReactNode }) => (
    <div className="grid gap-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm text-gray-900 break-words">{children || "-"}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <aside className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl p-5 overflow-y-auto">
        {/* Header */}
        <div className="relative -mx-5 -mt-5 mb-10">
          <div className="h-44 w-full bg-gray-100 overflow-hidden rounded-t-[16px]">
            <img src={cover} alt="cover" className="w-full h-full object-cover" />
          </div>
          <button className="absolute right-3 top-3 p-2 rounded-full bg-white/80 hover:bg-white shadow" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5"/>
          </button>
          <div className="absolute left-5 -bottom-8 flex items-end gap-3">
            <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow">
              <img src={avatar} alt="avatar" className="w-full h-full object-cover"/>
            </div>
            <div className="pb-2">
              <div className="text-lg font-semibold leading-tight">{row.name}</div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.isDeleted ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                {row.isDeleted ? "Deleted" : "Active"}
              </span>
            </div>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-500 mb-4">Loading details…</div>}

        {/* Stats (clickable) */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button className="rounded-xl border p-3 text-center hover:bg-gray-50" onClick={()=> setStats({open:true, tab:"members"})}>
            <div className="text-xs text-gray-500">Members</div>
            <div className="text-lg font-semibold">{row.totalMember ?? 0}</div>
          </button>
          <button className="rounded-xl border p-3 text-center hover:bg-gray-50" onClick={()=> setStats({open:true, tab:"projects"})}>
            <div className="text-xs text-gray-500">Projects</div>
            <div className="text-lg font-semibold">{row.totalProject ?? 0}</div>
          </button>
          <button className="rounded-xl border p-3 text-center hover:bg-gray-50" onClick={()=> setStats({open:true, tab:"partners"})}>
            <div className="text-xs text-gray-500">Partners</div>
            <div className="text-lg font-semibold">{row.totalPartners ?? 0}</div>
          </button>
        </div>

        {/* Fields dọc */}
        <div className="space-y-4">
          <Field label="Tax Code">{row.taxCode}</Field>
          <Field label="Owner">{row.ownerUserName || (row.ownerUserId ?? "").slice(0, 8) || "-"}</Field>
          <Field label="Email">{row.email}</Field>
          <Field label="Phone">{row.phoneNumber}</Field>
          <Field label="Website">
            {row.website ? <a className="text-blue-600 hover:underline" href={row.website} target="_blank" rel="noreferrer">{row.website.replace(/^https?:\/\//,"")}</a> : "-"}
          </Field>
          <Field label="Created">{fmtDate(row.createdAt)}</Field>
          <Field label="Updated">{fmtDate(row.updatedAt)}</Field>
          <Field label="Address">{row.address}</Field>
          <div>
            <div className="text-xs text-gray-500 mb-1">Description</div>
            <div className="text-sm text-gray-900 whitespace-pre-line">{row.detail || "-"}</div>
          </div>
        </div>

        {/* Stats Modal */}
        {stats.open && (
          <StatsModal tab={stats.tab} row={row} onClose={()=> setStats(s => ({...s, open:false}))}/>
        )}
      </aside>
    </div>
  );
}

function StatsModal({ tab, row, onClose }:{
  tab:"members"|"projects"|"partners"; row: Row; onClose:()=>void;
}) {
  const title = tab === "members" ? "Members" : tab === "projects" ? "Projects" : "Partners";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative bg-white w-[760px] max-w-[95vw] rounded-2xl shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{title}</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {tab === "members" && <MembersTable rows={row.listMembers ?? []} />}
        {tab === "projects" && <ProjectsTable rows={row.listProjects ?? []} />}
        {tab === "partners" && (
          <div className="text-sm text-gray-700">
            API hiện chưa trả danh sách đối tác. Tổng số: <b>{row.totalPartners ?? 0}</b>.
            Vui lòng bổ sung <code>listPartners</code> vào response để hiển thị chi tiết.
          </div>
        )}
      </div>
    </div>
  );
}

/* ------- Renderers ------- */
function MembersTable({ rows }:{ rows:any[] }) {
  if (!rows?.length) return <div className="text-sm text-gray-500">No members.</div>;
  return (
    <div className="border rounded-xl overflow-auto max-h-[60vh]">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Gender</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Joined</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m:any, idx:number)=>(
            <tr key={m.id ?? idx} className="border-t">
              <td className="px-3 py-2 text-left">{m.memberName ?? "-"}</td>
              <td className="px-3 py-2 text-center">{m.email ?? "-"}</td>
              <td className="px-3 py-2 text-center">{m.memberPhoneNumber ?? m.phone ?? "-"}</td>
              <td className="px-3 py-2 text-center">{m.gender ?? "-"}</td>
              <td className="px-3 py-2 text-center">{m.isOwner ? "Owner" : "Member"}</td>
              <td className="px-3 py-2 text-center">{fmtDate(m.joinedAt)}</td>
              <td className="px-3 py-2 text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.isDeleted ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  {m.status ?? (m.isDeleted ? "Deleted" : "Active")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectsTable({ rows }:{ rows:any[] }) {
  if (!rows?.length) return <div className="text-sm text-gray-500">No projects.</div>;
  return (
    <div className="border rounded-xl overflow-auto max-h-[60vh]">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Code</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Hired</th>
            <th className="px-3 py-2">Start</th>
            <th className="px-3 py-2">End</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p:any, idx:number)=>(
            <tr key={p.id ?? idx} className="border-t">
              <td className="px-3 py-2 text-left">{p.code ?? (p.id ?? "-")}</td>
              <td className="px-3 py-2 text-left">{p.name ?? "-"}</td>
              <td className="px-3 py-2 text-center">{p.status ?? "-"}</td>
              <td className="px-3 py-2 text-center">{p.isHired ? "Yes" : "No"}</td>
              <td className="px-3 py-2 text-center">{p.startDate ?? "-"}</td>
              <td className="px-3 py-2 text-center">{p.endDate ?? "-"}</td>
              <td className="px-3 py-2 text-center">{fmtDate(p.createdAt ?? p.createAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Edit Modal (1 cột dọc, input dài, thân scroll) ---------- */
function EditCompanyModal({
  data, onClose, onSaved
}:{ data: Row; onClose:()=>void; onSaved:(p:{
  name?: string; taxCode?: string; detail?: string; email?: string;
  phoneNumber?: string; address?: string; website?: string;
})=>void }) {
  const [form, setForm] = useState({
    name: data?.name ?? "",
    taxCode: data?.taxCode ?? "",
    detail: data?.detail ?? "",
    email: data?.email ?? "",
    phoneNumber: data?.phoneNumber ?? "",
    address: data?.address ?? "",
    website: data?.website ?? "",
  });

  const canSubmit = form.name.trim().length > 0;

  // submit nhanh: Ctrl/⌘+Enter
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSubmit) {
      onSaved(form);
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white w-[720px] max-w-[96vw] rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Company</h2>
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: 1 cột dọc, input full-width, có scroll */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[70vh]">
          {[
            { label: "Name *", key: "name", type: "text", autoFocus: true },
            { label: "Tax code", key: "taxCode", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Phone", key: "phoneNumber", type: "text" },
            { label: "Website", key: "website", type: "text" },
            { label: "Address", key: "address", type: "text" },
          ].map((f) => (
            <label key={f.key} className="grid gap-1">
              <span className="text-sm text-gray-600">{f.label}</span>
              <input
                type={f.type as any}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                value={(form as any)[f.key] ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                autoFocus={Boolean((f as any).autoFocus)}
              />
            </label>
          ))}

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Description</span>
            <textarea
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              value={form.detail ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, detail: e.target.value }))}
            />
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            className={`px-3 py-2 rounded-lg text-white ${
              canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
            }`}
            onClick={() => onSaved(form)}
            title="Ctrl/⌘ + Enter to save"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
