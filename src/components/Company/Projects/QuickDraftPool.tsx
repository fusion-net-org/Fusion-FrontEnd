/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import { createDraftTask, deleteDraftTaskApi } from "@/services/taskService.js";
import { toast } from "react-toastify";

export type QuickDraftType = "Feature" | "Bug" | "Chore";
export type QuickDraftPriority = "Urgent" | "High" | "Medium" | "Low";

export type QuickDraft = {
  id: string;
  title: string;
  type: QuickDraftType;
  priority: QuickDraftPriority;
  estimateHours?: number | null;
  createdAt: string;
};

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  drafts: QuickDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<QuickDraft[]>>;
  draggingFromPool?: boolean;

  projectId?: string | null;
  loading?: boolean;

  /** Cho phép parent reload backlog từ BE sau khi create / delete */
  onReloadDrafts?: () => void | Promise<void>;
};

const priorityBadgeClass = (p: QuickDraftPriority) => {
  switch (p) {
    case "Urgent":
      return "border-rose-500 text-rose-700 bg-rose-50";
    case "High":
      return "border-amber-500 text-amber-700 bg-amber-50";
    case "Medium":
      return "border-sky-500 text-sky-700 bg-sky-50";
    default:
      return "border-slate-300 text-slate-600 bg-slate-50";
  }
};

const typeDotColor: Record<QuickDraftType, string> = {
  Feature: "#2E8BFF",
  Bug: "#F97316",
  Chore: "#64748B",
};

const QuickDraftPool: React.FC<Props> = ({
  open,
  setOpen,
  drafts,
  setDrafts,
  draggingFromPool,
  projectId,
  loading,
  onReloadDrafts,
}) => {
  const [addingDraft, setAddingDraft] = useState(false);
  const [draftForm, setDraftForm] = useState<{
    title: string;
    type: QuickDraftType;
    priority: QuickDraftPriority;
    estimate: string;
  }>({
    title: "",
    type: "Feature",
    priority: "Medium",
    estimate: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = draftForm.title.trim();
    if (!title) return;

    if (!projectId) {
      toast.error("Missing project context – cannot create draft task.");
      return;
    }
    if (creating) return;

    const estimateVal = draftForm.estimate
      ? Number(draftForm.estimate)
      : undefined;

    try {
      setCreating(true);

      // Gọi BE tạo backlog draft
      const apiDraft: any = await createDraftTask(projectId, {
        title,
        type: draftForm.type,
        priority: draftForm.priority,
        estimateHours:
          Number.isFinite(estimateVal as number) && estimateVal !== undefined
            ? estimateVal
            : null,
      });

      // Map ProjectTaskResponse -> QuickDraft
      const newDraft: QuickDraft = {
        id: String(apiDraft.id ?? apiDraft.taskId),
        title: apiDraft.title ?? title,
        type: (apiDraft.type as QuickDraftType) ?? draftForm.type,
        priority:
          (apiDraft.priority as QuickDraftPriority) ?? draftForm.priority,
        estimateHours:
          typeof apiDraft.estimateHours === "number"
            ? apiDraft.estimateHours
            : typeof apiDraft.estimate_hours === "number"
            ? apiDraft.estimate_hours
            : null,
        createdAt:
          apiDraft.createdAt ??
          apiDraft.created_at ??
          new Date().toISOString(),
      };

      // Cập nhật state pool để phản ánh ngay
      setDrafts((prev) => [newDraft, ...prev]);

      // Nếu parent muốn, reload lại toàn bộ backlog từ BE cho chắc
      if (onReloadDrafts) {
        await onReloadDrafts();
      }

      // Reset form
      setDraftForm({
        title: "",
        type: "Feature",
        priority: "Medium",
        estimate: "",
      });
      setAddingDraft(false);

      toast.success("Draft created in backlog.");
    } catch (err: any) {
      console.error("[QuickDraftPool] create draft failed", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create draft task.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveDraft = async (id: string) => {
    if (!id) return;
    const ok = window.confirm("Remove this draft from backlog?");
    if (!ok) return;

    try {
      setDeletingId(id);
      await deleteDraftTaskApi(id);

      // Cập nhật local
      setDrafts((prev) => prev.filter((d) => d.id !== id));

      // Cho parent reload lại backlog nếu muốn
      if (onReloadDrafts) {
        await onReloadDrafts();
      }

      toast.success("Draft deleted.");
    } catch (err: any) {
      console.error("[QuickDraftPool] delete draft failed", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete draft task.",
      );
    } finally {
      setDeletingId((prev) => (prev === id ? null : prev));
    }
  };

  const overlayActive = open && !draggingFromPool;

  return (
    <>
      {/* overlay – tắt đi khi đang drag từ pool */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          overlayActive
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* drawer + droppable pool */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[360px] bg-white border-l border-slate-100 shadow-2xl transform transition-transform duration-300 ease-out will-change-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Drag pool
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                Unplanned tasks
              </p>
              <p className="text-xs text-slate-500 max-w-[260px]">
                Ghi nhanh các ý tưởng / work item chưa gán sprint. Sau này có
                thể dùng làm nguồn để kéo thả vào sprint.
              </p>
            </div>
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            {loading && (
              <div className="mb-3 text-[11px] text-slate-400">
                Loading backlog drafts…
              </div>
            )}

            {/* nút add */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <button
                type="button"
                onClick={() => setAddingDraft(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#2E8BFF] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1f6fd6]"
              >
                <Plus className="w-3 h-3" />
                Add draft card
              </button>
              <span className="text-[11px] text-slate-400">
                {drafts.length} item(s)
              </span>
            </div>

            {/* form nhỏ để add */}
            {addingDraft && (
              <form
                onSubmit={handleCreateDraft}
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Title
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#2E8BFF] focus:ring-2 focus:ring-[#2E8BFF]/10"
                    placeholder="Ex: Refine mobile login flow"
                    value={draftForm.title}
                    onChange={(e) =>
                      setDraftForm((x) => ({
                        ...x,
                        title: e.target.value,
                      }))
                    }
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Type
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-[#2E8BFF] focus:ring-2 focus:ring-[#2E8BFF]/10"
                      value={draftForm.type}
                      onChange={(e) =>
                        setDraftForm((x) => ({
                          ...x,
                          type: e.target.value as QuickDraftType,
                        }))
                      }
                    >
                      <option value="Feature">Feature</option>
                      <option value="Bug">Bug</option>
                      <option value="Chore">Chore</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Priority
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-[#2E8BFF] focus:ring-2 focus:ring-[#2E8BFF]/10"
                      value={draftForm.priority}
                      onChange={(e) =>
                        setDraftForm((x) => ({
                          ...x,
                          priority:
                            e.target.value as QuickDraftPriority,
                        }))
                      }
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Estimate (hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#2E8BFF] focus:ring-2 focus:ring-[#2E8BFF]/10"
                    value={draftForm.estimate}
                    onChange={(e) =>
                      setDraftForm((x) => ({
                        ...x,
                        estimate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAddingDraft(false)}
                    className="inline-flex items-center px-3 h-7 rounded-full border border-slate-300 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 h-7 rounded-full bg-[#2E8BFF] text-[11px] font-semibold text-white shadow-sm hover:bg-[#1f6fd6] disabled:opacity-60"
                    disabled={!draftForm.title.trim() || creating}
                  >
                    {creating ? "Saving…" : "Save draft"}
                  </button>
                </div>
              </form>
            )}

            {/* list draft + DnD */}
            <Droppable
              droppableId="draftPool"
              type="task"
              renderClone={(provided, snapshot, rubric) => {
                const d = drafts[rubric.source.index];
                if (!d || typeof document === "undefined") return null;

                return createPortal(
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_6px_14px_rgba(15,23,42,0.18)] text-xs cursor-grabbing"
                    style={{
                      ...provided.draggableProps.style,
                      zIndex: 9999,
                      pointerEvents: "none",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span
                            className="inline-block size-2 rounded-full"
                            style={{
                              backgroundColor: typeDotColor[d.type],
                            }}
                          />
                          <span className="truncate">{d.type}</span>
                          <span className="mx-1 text-slate-300">•</span>
                          <span
                            className={[
                              "inline-flex items-center px-1.5 py-0.5 rounded-full border",
                              priorityBadgeClass(d.priority),
                            ].join(" ")}
                          >
                            {d.priority}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[13px] font-semibold text-slate-900 truncate">
                          {d.title}
                        </div>
                        {d.estimateHours != null && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{d.estimateHours}h estimate</span>
                          </div>
                        )}
                        <p className="mt-1 text-[10px] text-slate-400">
                          Drag source only – chưa tạo task trên board. Kéo vào
                          sprint để thêm vào sprint backlog.
                        </p>
                      </div>
                    </div>
                  </div>,
                  document.body,
                );
              }}
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-3"
                >
                  {drafts.length === 0 && !addingDraft && !loading && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-[11px] text-slate-400">
                      Chưa có draft nào. Bấm{" "}
                      <span className="font-semibold text-slate-500">
                        “Add draft card”
                      </span>{" "}
                      để ghi nhanh các công việc rồi sau này kéo thả vào
                      sprint.
                    </div>
                  )}

                  {drafts.map((d, index) => (
                    <Draggable key={d.id} draggableId={d.id} index={index}>
                      {(drag, snap) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                          className="group rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] text-xs cursor-grab active:cursor-grabbing"
                          style={{
                            ...drag.draggableProps.style,
                            boxShadow: snap.isDragging
                              ? "0 6px 14px rgba(15,23,42,0.18)"
                              : "0 1px 2px rgba(15,23,42,0.06)",
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <span
                                  className="inline-block size-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      typeDotColor[d.type],
                                  }}
                                />
                                <span className="truncate">{d.type}</span>
                                <span className="mx-1 text-slate-300">•</span>
                                <span
                                  className={[
                                    "inline-flex items-center px-1.5 py-0.5 rounded-full border",
                                    priorityBadgeClass(d.priority),
                                  ].join(" ")}
                                >
                                  {d.priority}
                                </span>
                              </div>
                              <div className="mt-0.5 text-[13px] font-semibold text-slate-900 truncate">
                                {d.title}
                              </div>
                              {d.estimateHours != null && (
                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{d.estimateHours}h estimate</span>
                                </div>
                              )}
                              <p className="mt-1 text-[10px] text-slate-400">
                                Drag source only – chưa tạo task trên board. Kéo
                                vào sprint để thêm vào sprint backlog.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraft(d.id)}
                              disabled={deletingId === d.id}
                              className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-red-500 hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                              title="Remove draft"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </div>

      {/* toggle handle */}
      <button
        type="button"
        aria-label="Toggle drag pool"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 flex h-16 w-9 items-center justify-center rounded-l-2xl border bg-white shadow-lg transition-[right,background-color,box-shadow] duration-300 hover:bg-slate-50 ${
          open ? "right-[360px]" : "right-0"
        } ${
          draggingFromPool
            ? "border-blue-400 shadow-xl"
            : "border-slate-200"
        }`}
      >
        {open ? (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        )}
      </button>
    </>
  );
};

export default QuickDraftPool;
