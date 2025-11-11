import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

import {
  GetSubscriptionForAdmin,
  CreateSubscription,
  UpdateSubscription,
  DeleteSubscription,
} from "@/services/subscriptionService.js";

type Row = {
  id: string;
  name: string;
  price: number;
  quotaCompany: number;
  quotaProject: number;
  description?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

type SortKey = "CreatedAt" | "UpdatedAt" | "Name" | "Price" | "QuotaCompany" | "QuotaProject";

function uid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

// unwrap cho ResponseModel { data, message, ... } hoặc mảng thô
const unwrap = (res: any) => (res?.data !== undefined ? res.data : res);

// Map mọi biến thể casing từ BE -> Row
function mapAdminDtoToRow(d: any): Row {
  const get = (...keys: string[]) =>
    keys.find((k) => d?.[k] !== undefined) ? d[keys.find((k) => d?.[k] !== undefined)!] : undefined;

  return {
    id: get("id", "Id") ?? uid(),
    name: get("name", "Name") ?? "",
    price: Number(get("price", "Price") ?? 0),
    quotaCompany: Number(get("quotaCompany", "QuotaCompany", "quota_company") ?? 0),
    quotaProject: Number(get("quotaProject", "QuotaProject", "quota_project") ?? 0),
    description: get("description", "Description") ?? null,
    createdAt: get("createdAt", "createAt", "CreatedAt", "CreateAt") ?? new Date().toISOString(),
    updatedAt: get("updatedAt", "updateAt", "UpdatedAt", "UpdateAt") ?? null,
  };
}

export default function AdminSubscriptionsPage() {
  const [params, setParams] = useSearchParams();

  const q        = params.get("q") ?? "";
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

  const [db, setDb] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const raw = await GetSubscriptionForAdmin();
      const list = unwrap(raw);
      setDb(Array.isArray(list) ? list.map(mapAdminDtoToRow) : []);
    } catch (err: any) {
      setBanner({ type: "error", text: err?.message || "Failed to load subscriptions" });
      setDb([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const { items, total } = useMemo(() => {
    let list = db;

    if (q.trim()) {
      const k = q.trim().toLowerCase();
      list = list.filter(
        (x) => x.name.toLowerCase().includes(k) || (x.description ?? "").toLowerCase().includes(k)
      );
    }

    const mul = dirDesc ? -1 : 1;
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "Name":          return a.name.localeCompare(b.name) * mul;
        case "Price":         return (a.price - b.price) * mul;
        case "QuotaCompany":  return (a.quotaCompany - b.quotaCompany) * mul;
        case "QuotaProject":  return (a.quotaProject - b.quotaProject) * mul;
        case "UpdatedAt":     return ((new Date(a.updatedAt ?? 0)).getTime() - (new Date(b.updatedAt ?? 0)).getTime()) * mul;
        case "CreatedAt":
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * mul;
      }
    });

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { items: list.slice(start, end), total: list.length };
  }, [db, q, sort, dirDesc, page, pageSize]);

  const [modal, setModal] = useState<
    | { open:false }
    | { open:true; mode:"create"; data?:undefined }
    | { open:true; mode:"edit"; data:Row }
  >({ open:false });

  return (
    <div className="space-y-5">
      {banner && (
        <div
          className={`px-3 py-2 rounded-lg ${
            banner.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
  {/* Search (pill lớn, icon trái) */}
  <div className="relative flex-1 min-w-[420px]">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      className="w-full h-11 pl-10 pr-3 rounded-2xl border border-gray-200 bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Search by name..."
      defaultValue={q}
      onChange={(e) => patchParams({ q: e.target.value, page: 1 })}
    />
  </div>

  {/* Sort dropdown (pill) */}
  <select
    className="h-11 px-3 rounded-2xl border border-gray-200 bg-white"
    value={sort}
    onChange={(e) => patchParams({ sort: e.target.value, page: 1 })}
  >
    <option value="CreatedAt">Created At</option>
    <option value="UpdatedAt">Updated At</option>
    <option value="Name">Name</option>
    <option value="Price">Price</option>
    <option value="QuotaCompany">Quota Company</option>
    <option value="QuotaProject">Quota Project</option>
  </select>

  {/* Nút đổi chiều sort (pill tròn) */}
  <button
    className="h-11 w-11 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center"
    onClick={() => patchParams({ dir: dirDesc ? "asc" : "desc", page: 1 })}
    aria-label="Toggle sort direction"
  >
    {dirDesc ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
  </button>

  {/* Reset */}
  <button
    className="h-11 px-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50"
    onClick={() => patchParams({
      q: "",
      sort: "CreatedAt",
      dir: "desc",
      page: 1,
      pageSize // giữ nguyên pageSize hiện tại
    })}
  >
    Reset
  </button>

  {/* New (màu xám nhạt đúng kiểu hình) */}
  <button
    className="h-11 px-4 rounded-2xl bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-2"
    onClick={() => setModal({ open: true, mode: "create" })}
  >
    <span className="text-lg">+</span> New
  </button>
</div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-center">Quota</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-center">Created</th>
              <th className="px-3 py-2 text-center">Updated</th>
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
            {!loading && items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2 text-right">
                  {p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 text-center">
                  {p.quotaCompany} company / {p.quotaProject} project
                </td>
                <td className="px-3 py-2">
                  <span className="line-clamp-2">{p.description || "-"}</span>
                </td>
                <td className="px-3 py-2 text-center">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-center">
                  {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "-"}
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button
                    className="p-2 rounded hover:bg-gray-100"
                    onClick={() => setModal({ open: true, mode: "edit", data: p })}
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded hover:bg-red-50 text-red-600"
                    onClick={async () => {
                      if (!confirm("Delete this package?")) return;
                      try {
                        const ok = await DeleteSubscription(p.id);
                        const success = ok === true || (ok && ok.status === 204) || ok?.data === true;
                        if (success) {
                          setDb((prev) => prev.filter((x) => x.id !== p.id));
                          setBanner({ type: "success", text: "Deleted successfully" });
                        } else {
                          setBanner({ type: "error", text: "Delete failed" });
                        }
                      } catch (err: any) {
                        setBanner({ type: "error", text: err?.message || "Delete failed" });
                      }
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  No packages
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3 text-sm text-gray-600">
    <span>Total: <span className="font-medium">{total.toLocaleString()}</span></span>
    <span>Rows per page</span>
    <select
      className="h-9 px-2 rounded-lg border border-gray-200 bg-white"
      value={pageSize}
      onChange={(e) => patchParams({ pageSize: Number(e.target.value), page: 1 })}
    >
      {[10, 20, 50, 100].map(n => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  </div>

  <Stack spacing={0.5}>
    <Pagination
      size="small"                 // nhỏ gọn như hình
      variant="outlined"
      shape="rounded"
      count={Math.max(1, Math.ceil(total / pageSize))}
      page={page}
      onChange={(_, p) => patchParams({ page: p })}
      showFirstButton
      showLastButton
      siblingCount={0}            // hiển thị 1 trang hiện tại
      boundaryCount={1}           // << < 1 > >>
    />
  </Stack>
</div>

      {/* Modal */}
      {modal.open && (
        <PackageModal
          mode={modal.mode}
          data={modal.mode === "edit" ? modal.data : undefined}
          onClose={() => setModal({ open: false })}
          onSaved={async (payload) => {
            try {
              if (modal.mode === "create") {
                const raw = await CreateSubscription(payload);
                const created = mapAdminDtoToRow(unwrap(raw));
                setDb((prev) => [created, ...prev]);
                setBanner({ type: "success", text: "Created successfully" });
              } else if (modal.mode === "edit" && modal.data) {
                const raw = await UpdateSubscription(modal.data.id, payload);
                const updated = mapAdminDtoToRow(unwrap(raw));
                setDb((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                setBanner({ type: "success", text: "Updated successfully" });
              }
              setModal({ open: false });
            } catch (err: any) {
              setBanner({ type: "error", text: err?.message || "Save failed" });
            }
          }}
        />
      )}
    </div>
  );
}

function PackageModal({
  mode, data, onClose, onSaved,
}: {
  mode: "create" | "edit";
  data?: Row;
  onClose: () => void;
  onSaved: (p: Omit<Row, "id" | "createdAt" | "updatedAt">) => Promise<void> | void;
}) {
  const [form, setForm] = useState<Omit<Row, "id" | "createdAt" | "updatedAt">>({
    name: data?.name ?? "",
    price: data?.price ?? 0,
    quotaCompany: data?.quotaCompany ?? 1,
    quotaProject: data?.quotaProject ?? 1,
    description: data?.description ?? "",
  });

  const canSubmit =
    form.name.trim() &&
    Number.isFinite(form.price) &&
    form.price >= 0 &&
    form.quotaCompany > 0 &&
    form.quotaProject > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white w-[620px] rounded-2xl shadow-xl p-5 space-y-4">
        <div className="text-lg font-semibold">
          {mode === "create" ? "Create Package" : "Edit Package"}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 col-span-2">
            <span className="text-sm text-gray-600">Name</span>
            <input
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Price</span>
            <input
              type="number" step="0.01" min={0}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Quota Company</span>
            <input
              type="number" min={1}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              value={form.quotaCompany}
              onChange={(e) => setForm({ ...form, quotaCompany: Number(e.target.value) })}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Quota Project</span>
            <input
              type="number" min={1}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              value={form.quotaProject}
              onChange={(e) => setForm({ ...form, quotaProject: Number(e.target.value) })}
            />
          </label>

          <label className="grid gap-1 col-span-2">
            <span className="text-sm text-gray-600">Description</span>
            <textarea
              rows={3}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100" onClick={onClose}>
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            className={`px-3 py-2 rounded-lg text-white ${canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
            onClick={() => onSaved(form)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
