import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Save, Plus, RotateCcw } from "lucide-react";
import StatusBadge from "@/components/MySubscription/StatusBadge";
import { getCompanySubscriptionById, updateCompanySubscription } from "@/services/companySubscription.js";
import type { CompanySubscriptionDetailResponse, CompanySubscriptionEntitlementDetail } from "@/interfaces/CompanySubscription/CompanySubscription";
import type { SubscriptionStatus } from "@/interfaces/CompanySubscription/CompanySubscription";

const formatDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN") : "--");

type Props = { open: boolean; id: string | null; onClose: () => void };

type DraftEnt = {
  tempId?: string;
  id?: string;
  featureKey: string;
  quantity: number;
  remaining?: number | null;
};

const CompanySubscriptionDetailModal: React.FC<Props> = ({ open, id, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<CompanySubscriptionDetailResponse | null>(null);

  /** Edit state */
  const [editMode, setEditMode] = useState(false);
  const [draftStatus, setDraftStatus] = useState<SubscriptionStatus | null>(null);
  const [draftEnts, setDraftEnts] = useState<DraftEnt[]>([]);

  useEffect(() => {
    if (!open || !id) return;
    (async () => {
      setLoading(true);
      setErr(null);
      setData(null);
      setEditMode(false);
      setMessage(null);
      try {
        const resp = await getCompanySubscriptionById(id);
        setData(resp);
        setDraftStatus(resp?.status ?? null);
        const ents: DraftEnt[] = (resp?.entitlements ?? []).map((e: CompanySubscriptionEntitlementDetail) => ({
          id: e.id,
          featureKey: String(e.featureKey ?? ""),
          quantity: Number(e.quantity ?? 0),
          remaining: e.remaining ?? null,
        }));
        setDraftEnts(ents);
      } catch (e: any) {
        setErr(e?.message || "Cannot load company subscription detail.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, id]);

  /** Khoá scroll + Esc để đóng */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /** Feature options (gợi ý bằng datalist) */
  const featureOptions = useMemo(() => {
    const keys = new Set<string>();
    (data?.entitlements ?? []).forEach((e) => keys.add(String(e.featureKey ?? "")));
    return Array.from(keys).filter(Boolean);
  }, [data]);

  if (!open) return null;

  const startEdit = () => {
    setEditMode(true);
    setMessage(null);
  };
  const cancelEdit = () => {
    if (!data) return;
    setEditMode(false);
    setMessage(null);
    setDraftStatus(data.status as SubscriptionStatus);
    const ents: DraftEnt[] = (data.entitlements ?? []).map((e) => ({
      id: e.id,
      featureKey: String(e.featureKey ?? ""),
      quantity: Number(e.quantity ?? 0),
      remaining: e.remaining ?? null,
    }));
    setDraftEnts(ents);
  };

  const addRow = () => {
    setDraftEnts((prev) => [
      ...prev,
      { tempId: `tmp-${Date.now()}`, featureKey: "", quantity: 0, remaining: null },
    ]);
  };

  const updateRow = (idx: number, patch: Partial<DraftEnt>) => {
    setDraftEnts((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeEmptyNewRows = () => {
    setDraftEnts((prev) =>
      prev.filter((it) => it.id || (it.featureKey?.trim() && Number.isFinite(it.quantity)))
    );
  };

  const save = async () => {
    if (!data || !draftStatus) return;
    setSaving(true);
    setErr(null);
    setMessage(null);
    try {
      removeEmptyNewRows();

      const payload = {
        id: data.id,
        status: draftStatus,
        entitlements: draftEnts.map((e) => ({
          id: e.id ?? undefined,
          featureKey: e.featureKey || undefined,
          quantity: Number.isFinite(e.quantity) ? e.quantity : 0,
        })),
      };

      const updated = await updateCompanySubscription(payload);
      setData(updated);
      setEditMode(false);
      setMessage("Update company subscription successfully.");
      // sync draft lại từ server
      setDraftStatus(updated.status as SubscriptionStatus);
      const ents: DraftEnt[] = (updated.entitlements ?? []).map((e: CompanySubscriptionEntitlementDetail) => ({
        id: e.id,
        featureKey: String(e.featureKey ?? ""),
        quantity: Number(e.quantity ?? 0),
        remaining: e.remaining ?? null,
      }));
      setDraftEnts(ents);
    } catch (e: any) {
      setErr(e?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4" role="dialog" aria-modal="true">
      {/* backdrop */}
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-900/40" />

      {/* panel */}
      <div
        className="relative flex w-full max-w-[960px] max-h-[86vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-slate-900">
              Company subscription detail
            </div>
            {data && (
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                <span className="truncate font-medium text-slate-900">
                  {data.nameSubscription ?? "--"}
                </span>
                <StatusBadge value={data.status} />
                <span className="ml-auto truncate text-xs text-slate-500">
                  ID: {data.id.slice(0, 8)}…
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!editMode ? (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
                Update
              </button>
            ) : (
              <>
                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  title="Cancel"
                >
                  <RotateCcw className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={save}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Save"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-48 rounded bg-slate-200/70" />
              <div className="h-20 rounded-xl bg-slate-200/70" />
              <div className="h-40 rounded-xl bg-slate-200/70" />
            </div>
          ) : err ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {err}
            </div>
          ) : data ? (
            <>
              {message && (
                <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              {/* Top info: IDs + Timeline + Status (editable) */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Company</div>
                  <div className="mt-1 truncate text-sm text-slate-700">{data.companyId}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">User Subscription</div>
                  <div className="mt-1 truncate text-sm text-slate-700">{data.userSubscriptionId}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Created</div>
                  <div className="mt-1 text-sm text-slate-700">{formatDateTime(data.createdAt)}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Expired</div>
                  <div className="mt-1 text-sm text-slate-700">{formatDateTime(data.expiredAt)}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Status</div>
                  {!editMode ? (
                    <div className="mt-1"><StatusBadge value={data.status} /></div>
                  ) : (
                    <select
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                      value={draftStatus ?? ""}
                      onChange={(e) => setDraftStatus(e.target.value as SubscriptionStatus)}
                    >
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                      <option value="InActive">InActive</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Entitlements */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">Entitlements</div>
                  {editMode && (
                    <button
                      onClick={addRow}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add row
                    </button>
                  )}
                </div>

                {!editMode ? (
                  data.entitlements?.length ? (
                    <div className="rounded-xl border border-slate-200">
                      <div className="max-h-[40vh] overflow-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="sticky top-0 bg-slate-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">Feature</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">Quantity</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">Remaining</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.entitlements.map((e) => (
                              <tr key={e.id}>
                                <td className="px-4 py-2 text-sm text-slate-800">{String(e.featureKey)}</td>
                                <td className="px-4 py-2 text-sm text-slate-700">{e.quantity}</td>
                                <td className="px-4 py-2 text-sm text-slate-700">{e.remaining}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      There is no entitlement.
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-slate-200">
                    <div className="max-h-[40vh] overflow-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">Feature</th>
                            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">Quantity</th>
                            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">Remaining</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {draftEnts.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                                Chưa có entitlement. Nhấn “Add row” để thêm.
                              </td>
                            </tr>
                          ) : (
                            draftEnts.map((row, idx) => (
                              <tr key={row.id ?? row.tempId ?? idx}>
                                <td className="px-4 py-2">
                                  <input
                                    list="feature-keys"
                                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                    value={row.featureKey}
                                    onChange={(e) => updateRow(idx, { featureKey: e.target.value })}
                                    placeholder="Feature key..."
                                  />
                                  <datalist id="feature-keys">
                                    {featureOptions.map((k) => (
                                      <option key={k} value={k} />
                                    ))}
                                  </datalist>
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    min={0}
                                    className="h-9 w-28 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                    value={Number.isFinite(row.quantity) ? row.quantity : 0}
                                    onChange={(e) => updateRow(idx, { quantity: parseInt(e.target.value || "0") })}
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm text-slate-700">
                                  {row.remaining ?? "--"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-500">No data.</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CompanySubscriptionDetailModal;
