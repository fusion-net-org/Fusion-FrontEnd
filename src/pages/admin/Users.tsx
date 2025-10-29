// src/pages/admin/Users.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Plus, Pencil, ArrowUp, ArrowDown, X, ToggleLeft, ToggleRight,
} from "lucide-react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel,
  Select, MenuItem, IconButton
} from "@mui/material";

import type { AdminUser, PagedResult } from "@/interfaces/User/User";
import { getAdminUsersPaged, putSelfUserByAdmin, putStatusByAdmin } from "@/services/userService.js";

/* ---------- Helpers ---------- */
type StatusFilter = "All" | "Active" | "Inactive";
const STATUS: StatusFilter[] = ["All", "Active", "Inactive"];

// Map tên cột sort UI -> tên cột BE (BE đang là "CreateAt")
const SORT_MAP: Record<string, string> = {
  CreateAt: "CreateAt", // giữ nguyên theo BE để tránh 500
  Email: "Email",
  UserName: "UserName",
  Status: "Status",
};

/* ================================== */
export default function AdminUsersPage() {
  const [params, setParams] = useSearchParams();

  // URL params
  const q        = params.get("q") ?? "";
  const status   = (params.get("status") as StatusFilter) || "All";
  const page     = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const pageSize = Math.max(1, parseInt(params.get("pageSize") || "10", 10) || 10);
  const sort     = (params.get("sort") as "CreateAt"|"Email"|"UserName"|"Status") || "CreateAt";
  const dirDesc  = (params.get("dir") || "desc") !== "asc";

  const patchParams = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next, { replace: true });
  };

  // data state
  const [items, setItems]     = useState<AdminUser[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [busyId, setBusyId]   = useState<string | null>(null);

  // convert UI status -> BE "Stauts" (bool?) (All => undefined)
  const beStatus = useMemo(() => {
    if (status === "All") return undefined;
    return status === "Active";
  }, [status]);

  // load data
  const reload = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data: PagedResult<AdminUser> = await getAdminUsersPaged({
        Email: q || undefined,
        Stauts: beStatus,                          // dùng đúng key theo BE (typo "Stauts")
        PageNumber: page,
        PageSize: pageSize,
        SortColumn: SORT_MAP[sort] || sort,        // CreateAt / Email / ...
        SortDescending: dirDesc,
      });
      setItems(data?.items ?? []);
      setTotal(data?.totalCount ?? 0);
    } catch (e: any) {
      setErr(e?.message ?? "Load users failed");
    } finally {
      setLoading(false);
    }
  }, [q, beStatus, page, pageSize, sort, dirDesc]);

  useEffect(() => { reload(); }, [reload]);

  // Toggle status
  const handleToggleStatus = async (u: AdminUser) => {
    try {
      setBusyId(u.id);
      const next = !u.status;
      await putStatusByAdmin(u.id, next);
      await reload(); // đồng bộ với BE (đặc biệt khi đang lọc theo status)
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Update user status failed");
    } finally {
      setBusyId(null);
    }
  };

  // Modal
  const [modal, setModal] =
    useState<{ open:false } | { open:true; user: AdminUser }>({ open:false });

  // Reset filters nhanh
  const handleReset = () =>
    patchParams({ q: undefined, status: "All", sort: "CreateAt", dir: "desc", page: 1 });

  return (
    <div className="space-y-5">
      {/* Header / Filters */}
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"/>
            <input
              className="w-full pl-10 pr-9 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Search by email…"
              value={q} // controlled
              onChange={(e)=> patchParams({ q: e.target.value, page: 1 })}
              onKeyDown={(e) => { if (e.key === "Escape") patchParams({ q: undefined, page: 1 }); }}
            />
            {q && (
              <button
                className="absolute right-2 top-2.5 p-1 rounded hover:bg-gray-100"
                onClick={() => patchParams({ q: undefined, page: 1 })}
                aria-label="Clear search"
                title="Clear"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <select
            className="px-3 py-2 rounded-lg border border-gray-300"
            value={sort}
            onChange={(e)=> patchParams({ sort: e.target.value, page: 1 })}
            title="Sort by"
          >
            <option value="CreateAt">Created At</option>
            <option value="Email">Email</option>
            <option value="UserName">User Name</option>
            <option value="Status">Status</option>
          </select>
          <button
            className="px-2 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            onClick={()=> patchParams({ dir: dirDesc ? "asc" : "desc", page: 1 })}
            aria-label="Toggle sort direction"
            title={dirDesc ? "Descending" : "Ascending"}
          >
            {dirDesc ? <ArrowDown className="w-4 h-4"/> : <ArrowUp className="w-4 h-4"/>}
          </button>

          {/* Reset */}
          <button
            className="px-3 py-2 rounded-lg border hover:bg-gray-50"
            onClick={handleReset}
            title="Reset filters"
          >
            Reset
          </button>

          {/* New user – disabled */}
          <button
            className="px-3 py-2 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed flex items-center gap-2"
            title="Backend chưa có API create user (admin)"
            disabled
          >
            <Plus className="w-4 h-4"/> New
          </button>
        </div>

        {/* Status segmented tabs */}
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden w-fit">
          {STATUS.map(s => {
            const active = status === s;
            return (
              <button
                key={s}
                className={`px-3 py-1.5 text-sm border-r last:border-r-0 ${
                  active ? "bg-blue-50 text-blue-700" : "bg-white text-gray-700 hover:bg-gray-50"
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
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">User name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Address</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Created</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">Loading…</td></tr>
            )}
            {!loading && items.map(u=>(
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.userName}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.phone ?? "-"}</td>
                <td className="px-3 py-2">{u.address ?? "-"}</td>

                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${
                    u.status
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}>
                    {u.status ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-3 py-2 text-center">
                  {u.createAt ? new Date(u.createAt).toLocaleDateString() : "-"}
                </td>

                <td className="px-3 py-2 text-right">
                  <button
                    className="p-2 rounded hover:bg-gray-100"
                    onClick={()=> setModal({ open:true, user: u })}
                    aria-label="Edit user"
                  >
                    <Pencil className="w-4 h-4"/>
                  </button>

                  <button
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => handleToggleStatus(u)}
                    disabled={busyId === u.id}
                    aria-label={u.status ? "Deactivate" : "Activate"}
                    title={u.status ? "Deactivate" : "Activate"}
                  >
                    {u.status
                      ? <ToggleRight className="w-5 h-5 text-green-600" />
                      : <ToggleLeft  className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">{err ?? "No users"}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: page size + pagination */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Total:</span>
          <span className="font-medium">{total.toLocaleString()}</span>
          <span className="ml-3">Rows per page</span>
          <select
            className="px-2 py-1 rounded border border-gray-300"
            value={pageSize}
            onChange={(e)=> patchParams({ pageSize: Number(e.target.value), page: 1 })}
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
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

      {/* Modal edit */}
      {modal.open && (
        <EditUserModal
          open
          selected={modal.user}
          onUpdated={async ()=> { await reload(); }}
          onClose={()=> setModal({ open:false })}
        />
      )}
    </div>
  );
}

/* ---------------------- EditUserModal ---------------------- */
function EditUserModal({
  open, onClose, selected, onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  selected: AdminUser;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    userName: selected.userName || "",
    email:    selected.email || "",
    phone:    selected.phone || "",
    address:  selected.address || "",
    gender:   selected.gender || "",
    avatar:   null as string | null,
  });
  const [file, setFile] = useState<File|null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      userName: selected.userName || "",
      email:    selected.email || "",
      phone:    selected.phone || "",
      address:  selected.address || "",
      gender:   selected.gender || "",
      avatar:   null,
    });
    setFile(null);
  }, [selected]);

  const canSubmit = !saving;

  const handleSave = async () => {
    if (!canSubmit) return;
    try {
      setSaving(true);
      const fd = new FormData();
      if (form.phone   != null) fd.append("Phone",   form.phone);
      if (form.address != null) fd.append("Address", form.address);
      if (form.gender  != null) fd.append("Gender",  form.gender);
      if (file) fd.append("Avatar", file);

      await putSelfUserByAdmin(selected.id, fd);
      await onUpdated();
      onClose();
    } catch (e:any) {
      console.error('Admin update error:', e);
      alert(e?.message ?? "Admin update failed!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx:{ borderRadius:3 }}}>
      <DialogTitle sx={{ pr:7 }}>
        User details
        <IconButton onClick={onClose} size="small" sx={{ position:"absolute", right:12, top:12 }} aria-label="Close">
          <X className="w-5 h-5"/>
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight:"70vh", "& .MuiFormControl-root, & .MuiTextField-root":{ width:"100%" }}}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="User name" value={form.userName} disabled />
          <TextField label="Email" type="email" value={form.email} disabled />

          <TextField
            label="Phone"
            value={form.phone ?? ""}
            onChange={(e)=> setForm(s=>({ ...s, phone:e.target.value }))}
          />
          <TextField
            label="Address"
            value={form.address ?? ""}
            onChange={(e)=> setForm(s=>({ ...s, address:e.target.value }))}
          />

          <FormControl>
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              label="Gender"
              value={form.gender ?? ""}
              onChange={(e)=> setForm(s=>({ ...s, gender: e.target.value as string }))}
            >
              <MenuItem value=""><em>—</em></MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          <div className="flex flex-col gap-2">
            <div className="text-sm">Avatar</div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e)=> setFile(e.target.files?.[0] ?? null)}
              />
              {(file) && (
                <img
                  src={URL.createObjectURL(file)}
                  alt="avatar preview"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ px:3, py:2 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSubmit}>
          {saving ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
