/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  ExternalLink,
  Boxes,
} from "lucide-react";
import { Modal } from "antd";
import { createDraftTask, deleteDraftTaskApi } from "@/services/taskService.js";
import { toast } from "react-toastify";
import { Can, usePermissions } from "@/permission/PermissionProvider";

const { confirm } = Modal;

export type QuickDraftType = "Feature" | "Bug" | "Chore";
export type QuickDraftPriority = "Urgent" | "High" | "Medium" | "Low";

export type QuickDraft = {
  id: string;
  title: string;
  type: QuickDraftType;
  priority: QuickDraftPriority;
  estimateHours?: number | null;
  createdAt: string;

  // highlight nếu được sinh từ ticket
  ticketId?: string | null;
  ticketCode?: string | null;

  // maintenance component
  componentId?: string | null;
  componentName?: string | null;
};

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  drafts: QuickDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<QuickDraft[]>>;
  draggingFromPool?: boolean;

  projectId?: string | null;
  loading?: boolean;

  onReloadDrafts?: () => void | Promise<void>;

  // callback mở màn ticket
  onOpenTicket?: (ticketId: string) => void;

  componentEnabled?: boolean;
  components?: { id: string; name: string }[];
  defaultComponentId?: string | null;
};

const priorityBadgeClass = (p: QuickDraftPriority) => {
  switch (p) {
    case "Urgent":
      return "border-rose-400 text-rose-700 bg-rose-50";
    case "High":
      return "border-amber-400 text-amber-700 bg-amber-50";
    case "Medium":
      return "border-sky-400 text-sky-700 bg-sky-50";
    default:
      return "border-slate-300 text-slate-600 bg-slate-50";
  }
};

const typeDotColor: Record<QuickDraftType, string> = {
  Feature: "#2E8BFF",
  Bug: "#F97316",
  Chore: "#64748B",
};

/**
 * ✅ Nghiệp vụ màu:
 * - normal backlog: slate/white
 * - maintenance backlog (có component): emerald
 * - ticket backlog: sky
 * - ticket + maintenance: fuchsia (khác hẳn)
 */
const draftTone = (d: QuickDraft) => {
  const hasTicket = !!d.ticketId;
  const isMaintenance = !!d.componentId || !!d.componentName;

  // ticket + maintenance
  if (hasTicket && isMaintenance) {
    return {
      card: "border border-fuchsia-500 bg-fuchsia-50/90 shadow-[0_1px_6px_rgba(217,70,239,0.55)]",
      ticketPill: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700",
      ticketDot: "bg-fuchsia-500",
      ticketBtn: "border-fuchsia-500 text-fuchsia-700 hover:bg-fuchsia-50",
      hint: "Created from a maintenance ticket – drag into a sprint column to plan it.",
    };
  }

  // maintenance only
  if (isMaintenance) {
    return {
      card: "border border-emerald-500 bg-emerald-50/90 shadow-[0_1px_6px_rgba(16,185,129,0.45)]",
      ticketPill: "border-sky-500 bg-sky-50 text-sky-700", // (không dùng nếu không có ticket)
      ticketDot: "bg-sky-500",
      ticketBtn: "border-sky-500 text-sky-700 hover:bg-sky-50",
      hint: "Maintenance backlog – drag into a sprint column to plan it.",
    };
  }

  // ticket only
  if (hasTicket) {
    return {
      card: "border border-sky-500 bg-sky-50/90 shadow-[0_1px_6px_rgba(56,189,248,0.65)]",
      ticketPill: "border-sky-500 bg-sky-50 text-sky-700",
      ticketDot: "bg-sky-500",
      ticketBtn: "border-sky-500 text-sky-700 hover:bg-sky-50",
      hint: "Created from a ticket – drag into a sprint column to plan it.",
    };
  }

  // normal
  return {
    card: "border border-slate-200 bg-white/95 shadow-[0_1px_3px_rgba(15,23,42,0.08)]",
    ticketPill: "border-sky-500 bg-sky-50 text-sky-700",
    ticketDot: "bg-sky-500",
    ticketBtn: "border-sky-500 text-sky-700 hover:bg-sky-50",
    hint: "Drag into a sprint column to add it to that sprint backlog.",
  };
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
  onOpenTicket,
  componentEnabled = false,
  components = [],
  defaultComponentId = null,
}) => {
  const [addingDraft, setAddingDraft] = useState(false);

  const componentOptions = useMemo(() => components ?? [], [components]);

  const initialComponentId = useMemo(() => {
    if (!componentEnabled) return "";
    if (defaultComponentId && componentOptions.some((c) => c.id === defaultComponentId)) {
      return defaultComponentId;
    }
    return componentOptions[0]?.id ?? "";
  }, [componentEnabled, defaultComponentId, componentOptions]);

  const [draftForm, setDraftForm] = useState<{
    title: string;
    type: QuickDraftType;
    priority: QuickDraftPriority;
    estimate: string;
    componentId: string;
  }>({
    title: "",
    type: "Feature",
    priority: "Medium",
    estimate: "",
    componentId: initialComponentId,
  });

  React.useEffect(() => {
    if (!componentEnabled) return;
    setDraftForm((x) => ({ ...x, componentId: initialComponentId }));
  }, [componentEnabled, initialComponentId]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = draftForm.title.trim();
    if (!title) return;

    if (!projectId) {
      toast.error("Missing project context – cannot create backlog item.");
      return;
    }
    if (creating) return;

    const estimateVal = draftForm.estimate ? Number(draftForm.estimate) : undefined;

    // lấy componentId gửi lên (nếu enabled)
    const selectedComponentId =
      componentEnabled && draftForm.componentId ? draftForm.componentId : null;

    // lấy componentName từ list components (nếu có)
    const selectedComponentName = selectedComponentId
      ? componentOptions.find((c) => c.id === selectedComponentId)?.name ?? null
      : null;

    try {
      setCreating(true);

      const apiDraft: any = await createDraftTask(projectId, {
        title,
        type: draftForm.type,
        priority: draftForm.priority,
        estimateHours:
          Number.isFinite(estimateVal as number) && estimateVal !== undefined ? estimateVal : null,
        componentId: selectedComponentId,
      });

      const newDraft: QuickDraft = {
        id: String(apiDraft.id ?? apiDraft.taskId),
        title: apiDraft.title ?? title,
        type: (apiDraft.type as QuickDraftType) ?? draftForm.type,
        priority: (apiDraft.priority as QuickDraftPriority) ?? draftForm.priority,
        estimateHours:
          typeof apiDraft.estimateHours === "number"
            ? apiDraft.estimateHours
            : typeof apiDraft.estimate_hours === "number"
              ? apiDraft.estimate_hours
              : null,
        createdAt: apiDraft.createdAt ?? apiDraft.created_at ?? new Date().toISOString(),

        // tạo từ backlog panel nên mặc định không có ticket (nhưng vẫn map nếu BE có)
        ticketId: apiDraft.ticketId ?? apiDraft.ticket_id ?? null,
        ticketCode: apiDraft.ticketCode ?? apiDraft.ticket_code ?? apiDraft.ticket?.code ?? null,

        // map component info từ API hoặc fallback theo selected
        componentId:
          apiDraft.componentId ??
          apiDraft.component_id ??
          apiDraft.component?.id ??
          selectedComponentId ??
          null,
        componentName:
          apiDraft.componentName ??
          apiDraft.component_name ??
          apiDraft.component?.name ??
          selectedComponentName ??
          null,
      };

      setDrafts((prev) => [newDraft, ...prev]);

      if (onReloadDrafts) {
        await onReloadDrafts();
      }

      setDraftForm({
        title: "",
        type: "Feature",
        priority: "Medium",
        estimate: "",
        componentId: initialComponentId,
      });

      setAddingDraft(false);
      toast.success("Backlog item created.");
    } catch (err: any) {
      console.error("[QuickDraftPool] create draft failed", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to create backlog item.");
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveDraft = (id: string) => {
    if (!id) return;

    confirm({
      title: "Remove this backlog item?",
      content:
        "This backlog item will be soft-deleted from the project and removed from the backlog list.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          setDeletingId(id);
          await deleteDraftTaskApi(id);

          setDrafts((prev) => prev.filter((d) => d.id !== id));

          if (onReloadDrafts) {
            await onReloadDrafts();
          }

          toast.success("Backlog item removed.");
        } catch (err: any) {
          console.error("[QuickDraftPool] delete draft failed", err);
          toast.error(err?.response?.data?.message || err?.message || "Failed to remove backlog item.");
        } finally {
          setDeletingId((prev) => (prev === id ? null : prev));
        }
      },
    });
  };

  const overlayActive = open && !draggingFromPool;
  const { can, loading: permLoading } = usePermissions();

  const canUpdateTask = !permLoading && can("MOVE_BACKLOG_TO_SPRINT");
  const dragDisabled = !canUpdateTask;

  return (
    <>
      {/* Dimmed background */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm transition-opacity duration-300 ${
          overlayActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Backlog drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[380px] bg-white border-l border-slate-100 shadow-2xl transform transition-transform duration-300 ease-out will-change-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col bg-gradient-to-b from-slate-50 via-white to-white">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 border-b border-slate-100">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 border border-slate-200">
                Backlog
              </span>
              <h2 className="text-sm font-semibold text-slate-900">Unplanned work</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-500">Backlog</span>
                <span className="mx-1 text-slate-300">•</span>
                <span className="font-semibold text-slate-900">{drafts.length}</span>
                <span className="text-slate-400">item(s)</span>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between px-6 border-b border-slate-100">
            <p className="text-xs text-slate-500 max-w-[260px] mb-0 leading-relaxed">
              Capture ideas, bugs and work items that are not scheduled in any sprint yet.
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            {loading && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-500 border border-slate-200">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                <span>Loading backlog…</span>
              </div>
            )}

            {/* Add button row */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <Can code="BACKLOG_CREATE">
                <button
                  type="button"
                  onClick={() => setAddingDraft(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2E8BFF] px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1f6fd6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8BFF]/40"
                >
                  <Plus className="w-3 h-3" />
                  Add backlog item
                </button>
              </Can>

              <span className="text-[11px] text-slate-400">
                Total: <span className="font-medium text-slate-700">{drafts.length}</span> items
              </span>
            </div>

            {/* Inline create form */}
            {addingDraft && (
              <form
                onSubmit={handleCreateDraft}
                className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm"
              >
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">Title</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none placeholder:text-slate-300 focus:border-[#2E8BFF] focus:ring-2 focus:ring-[#2E8BFF]/12"
                    placeholder="e.g. Refine mobile login flow"
                    value={draftForm.title}
                    onChange={(e) => setDraftForm((x) => ({ ...x, title: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Work type
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-[#2E8BFF] focus:ring-2 focus:ring-[#2E8BFF]/12"
                      value={draftForm.type}
                      onChange={(e) =>
                        setDraftForm((x) => ({ ...x, type: e.target.value as QuickDraftType }))
                      }
                    >
                      <option value="Feature">Feature</option>
                      <option value="Bug">Bug</option>
                      <option value="Chore">Chore / housekeeping</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Priority
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-[#2E8BFF] focus:ring-2 focus:ring-[#2E8BFF]/12"
                      value={draftForm.priority}
                      onChange={(e) =>
                        setDraftForm((x) => ({
                          ...x,
                          priority: e.target.value as QuickDraftPriority,
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

                {componentEnabled && (
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Component
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                        <Boxes className="h-3.5 w-3.5" />
                      </span>
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2.5 py-1.5 text-[11px] outline-none focus:border-[#2E8BFF] focus:ring-2 focus:ring-[#2E8BFF]/12 disabled:opacity-60"
                        value={draftForm.componentId}
                        onChange={(e) => setDraftForm((x) => ({ ...x, componentId: e.target.value }))}
                        disabled={!componentOptions.length || creating}
                      >
                        {!componentOptions.length ? (
                          <option value="">No component</option>
                        ) : (
                          componentOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAddingDraft(false)}
                    className="inline-flex h-7 items-center rounded-full border border-slate-300 bg-white px-3 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-7 items-center rounded-full bg-[#2E8BFF] px-4 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1f6fd6] disabled:opacity-60"
                    disabled={!draftForm.title.trim() || creating}
                  >
                    {creating ? "Saving…" : "Save backlog item"}
                  </button>
                </div>
              </form>
            )}

            {/* Backlog list + DnD */}
            <Droppable
              droppableId="draftPool"
              type="task"
              renderClone={(provided, snapshot, rubric) => {
                const d = drafts[rubric.source.index];
                if (!d || typeof document === "undefined") return null;

                const tone = draftTone(d);
                const hasTicket = !!d.ticketId;

                return createPortal(
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={[
                      "group rounded-xl px-3 py-2.5 text-xs cursor-grabbing shadow-[0_8px_20px_rgba(15,23,42,0.22)]",
                      tone.card,
                    ].join(" ")}
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
                            style={{ backgroundColor: typeDotColor[d.type] }}
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

                          {!!d.componentName && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              <Boxes className="h-3 w-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">{d.componentName}</span>
                            </span>
                          )}

                          {hasTicket && (
                            <span
                              className={[
                                "ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                tone.ticketPill,
                              ].join(" ")}
                            >
                              <span className={["h-1.5 w-1.5 rounded-full", tone.ticketDot].join(" ")} />
                              {d.ticketCode || "From ticket"}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 truncate text-[13px] font-semibold text-slate-900">
                          {d.title}
                        </div>

                        {d.estimateHours != null && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="h-3 w-3" />
                            <span>{d.estimateHours}h estimate</span>
                          </div>
                        )}

                        <p className="mt-1 text-[10px] text-slate-400">{tone.hint}</p>
                      </div>
                    </div>
                  </div>,
                  document.body
                );
              }}
            >
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 pb-2">
                  {drafts.length === 0 && !addingDraft && !loading && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-[11px] text-slate-400">
                      No backlog items yet. Use{" "}
                      <span className="font-semibold text-slate-600">“Add backlog item”</span>{" "}
                      to capture work, then drag items into sprints when you are ready.
                    </div>
                  )}

                  {drafts.map((d, index) => {
                    const tone = draftTone(d);
                    const hasTicket = !!d.ticketId;

                    return (
                      <Draggable
                        key={d.id}
                        draggableId={d.id}
                        index={index}
                        isDragDisabled={dragDisabled}
                      >
                        {(drag, snap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={[
                              "group cursor-grab rounded-xl px-3 py-2.5 text-xs transition-shadow active:cursor-grabbing",
                              tone.card,
                            ].join(" ")}
                            style={{
                              ...drag.draggableProps.style,
                              boxShadow: snap.isDragging ? "0 8px 20px rgba(15,23,42,0.22)" : undefined,
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                                  <span
                                    className="inline-block size-2 rounded-full"
                                    style={{ backgroundColor: typeDotColor[d.type] }}
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

                                  {!!d.componentName && (
                                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                      <Boxes className="h-3 w-3 text-slate-400" />
                                      <span className="truncate max-w-[140px]">{d.componentName}</span>
                                    </span>
                                  )}

                                  {hasTicket && (
                                    <span
                                      className={[
                                        "ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                        tone.ticketPill,
                                      ].join(" ")}
                                    >
                                      <span className={["h-1.5 w-1.5 rounded-full", tone.ticketDot].join(" ")} />
                                      {d.ticketCode || "From ticket"}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-0.5 truncate text-[13px] font-semibold text-slate-900">
                                  {d.title}
                                </div>

                                {d.estimateHours != null && (
                                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                    <Clock className="h-3 w-3" />
                                    <span>{d.estimateHours}h estimate</span>
                                  </div>
                                )}

                                <p className="mt-1 text-[10px] text-slate-400">{tone.hint}</p>
                              </div>

                              <div className="mt-0.5 flex flex-col items-end gap-1">
                                {hasTicket && onOpenTicket && d.ticketId && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenTicket(d.ticketId!)}
                                    className={[
                                      "inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[10px] font-semibold shadow-sm",
                                      tone.ticketBtn,
                                    ].join(" ")}
                                    title="View ticket"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>Ticket</span>
                                  </button>
                                )}

                                <Can code="BACKLOG_DELETE">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDraft(d.id)}
                                    disabled={deletingId === d.id}
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                    title="Remove backlog item"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </Can>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </div>

      {/* Toggle handle */}
      <button
        type="button"
        aria-label="Toggle backlog panel"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 flex h-16 w-9 items-center justify-center rounded-l-2xl border bg-white shadow-lg transition-[right,background-color,box-shadow] duration-300 hover:bg-slate-50 ${
          open ? "right-[380px]" : "right-0"
        } ${draggingFromPool ? "border-blue-400 shadow-xl" : "border-slate-200"}`}
      >
        {open ? (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-slate-500" />
        )}
      </button>
    </>
  );
};

export default QuickDraftPool;
