// src/pages/project/TicketDetailPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  ChevronUp,
  ChevronDown,
  Paperclip,
  Send,
} from "lucide-react";

import { useProjectBoard } from "@/context/ProjectBoardContext";
import type { TaskVm, SprintVm, MemberRef } from "@/types/projectBoard";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type CommentItem = {
  id: string;
  author: string;
  createdAt: string;
  message: string;
};

const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "N/A";

const toInputDate = (iso?: string) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

const fromInputDate = (val: string): string | undefined =>
  val ? new Date(val).toISOString() : undefined;

/* =========================================
 * PARENT PAGE – resolve task from context
 * ========================================= */

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const { sprints, tasks, changeStatus } = useProjectBoard() as {
    sprints: SprintVm[];
    tasks: TaskVm[];
    changeStatus: (projectId: string, task: TaskVm, statusId: string) => void;
  };

  const task = useMemo(
    () => tasks.find((t) => t.id === taskId) ?? tasks[0],
    [tasks, taskId]
  );

  const sprintForTask: SprintVm | undefined = useMemo(() => {
    if (!task) return sprints[0];
    return (
      sprints.find((s) => s.id === (task.sprintId || "")) ??
      sprints[0] ??
      undefined
    );
  }, [sprints, task]);

  if (!task) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Ticket not found. Please go back to the board.
      </div>
    );
  }

  return (
    <TicketDetailLayout
      task={task}
      sprint={sprintForTask}
      allSprints={sprints}
      changeStatus={changeStatus}
      onBack={() => navigate(-1)}
    />
  );
}

/* =========================================
 * LAYOUT COMPONENT
 * ========================================= */

function TicketDetailLayout({
  task,
  sprint,
  allSprints,
  changeStatus,
  onBack,
}: {
  task: TaskVm;
  sprint?: SprintVm;
  allSprints: SprintVm[];
  changeStatus: (projectId: string, task: TaskVm, statusId: string) => void;
  onBack: () => void;
}) {
  const [model, setModel] = useState<TaskVm>(task);
  const [description, setDescription] = useState<string>(
    "Describe the goal, scope and acceptance criteria of this ticket."
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "1", label: "Requirement analysis", done: true },
    { id: "2", label: "Admin UI design", done: false },
  ]);
  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: "c1",
      author: model.assignees[0]?.name || "System",
      createdAt: model.createdAt,
      message: `Ticket created with status "${model.StatusName || model.statusCode}"`,
    },
    {
      id: "c2",
      author: model.assignees[0]?.name || "System",
      createdAt: model.updatedAt,
      message: `Last updated – status "${model.StatusName || model.statusCode}"`,
    },
  ]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    setModel(task);
  }, [task]);

  /* ===== derived data ===== */

  const statusList =
    sprint?.statusOrder
      .map((id) => sprint.statusMeta[id])
      .filter(Boolean) ?? [];

  const activeStatusId = model.workflowStatusId;
  const activeMeta = sprint?.statusMeta[activeStatusId];
  const primaryAssignee: MemberRef | undefined = model.assignees[0];

  const checklistDone = checklist.filter((x) => x.done).length;
  const checklistTotal = checklist.length || 1;
  const checklistPct = Math.round((checklistDone / checklistTotal) * 100);

  const projectId = (window as any).__projectId as string | undefined;

  /* ===== handlers ===== */

  function updateField<K extends keyof TaskVm>(key: K, value: TaskVm[K]) {
    setModel((prev) => ({ ...prev, [key]: value }));
  }

  function handleStatusChange(statusId: string) {
    if (!sprint) return;
    const meta = sprint.statusMeta[statusId];
    if (!meta) return;

    const next: TaskVm = {
      ...model,
      workflowStatusId: statusId,
      statusCode: meta.code,
      statusCategory: meta.category,
      StatusName: meta.name,
    };

    setModel(next);

    // call context like board
    if (projectId) {
      changeStatus(projectId, next, statusId);
    }
  }

  function toggleChecklist(id: string) {
    setChecklist((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );
  }

  function moveChecklist(id: string, dir: "up" | "down") {
    setChecklist((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapWith = dir === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  }

  function addChecklistItem() {
    const label = window.prompt("Checklist item title?");
    if (!label) return;
    setChecklist((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), label, done: false },
    ]);
  }

  function addComment() {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        author: primaryAssignee?.name || "You",
        createdAt: new Date().toISOString(),
        message: newComment.trim(),
      },
    ]);
    setNewComment("");
  }

  function handleSave() {
    // TODO: wire to API / context update
    console.log("Save ticket detail", model, {
      description,
      checklist,
      comments,
    });
    alert("Ticket data prepared. Wire handleSave() to your API/context.");
  }

  /* ===== UI ===== */

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400 mb-1">{model.code}</div>
          <div className="text-xl md:text-2xl font-semibold text-slate-900">
            {model.title}
          </div>

          {/* meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900 text-white">
              Internal
            </span>
            {model.type && (
              <Badge label="Type" value={model.type} colorClass="border-slate-300" />
            )}
            {model.priority && (
              <Badge
                label="Priority"
                value={model.priority}
                colorClass="border-amber-400"
              />
            )}
            {typeof model.storyPoints === "number" && (
              <Badge
                label="Points"
                value={String(model.storyPoints ?? 0)}
                colorClass="border-emerald-400"
              />
            )}
            {sprint && (
              <Badge
                label="Sprint"
                value={sprint.name}
                colorClass="border-slate-300"
              />
            )}
            <span className="ml-1">
              Created&nbsp;
              <strong>{fmtDateTime(model.createdAt)}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 px-3 h-9 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1 px-4 h-9 rounded-full border border-[var(--brand,theme(colors.blue.600))] bg-[var(--brand,theme(colors.blue.600))] text-sm text-white hover:bg-blue-700"
            style={{ ["--brand" as any]: brand }}
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* ===== Main layout: LEFT big, RIGHT small ===== */}
      <div className="mt-2 flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDE: main content (takes all remaining width) */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* STATUS RAIL */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-500">
                Drag knob or click a step to change status
              </div>
              {activeMeta && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900 text-white text-[11px]">
                  {activeMeta.name}
                </span>
              )}
            </div>

            <div className="rounded-full bg-slate-50 p-1 flex items-center gap-1">
              {statusList.map((st) => {
                const isActive = st.id === activeStatusId;
                const isDone =
                  sprint &&
                  sprint.statusMeta[activeStatusId]?.order >= st.order &&
                  st.category !== "TODO";

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStatusChange(st.id)}
                    className={cn(
                      "flex-1 min-w-[80px] px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-transparent text-slate-700 hover:bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        isDone && !isActive && "opacity-70"
                      )}
                    >
                      {st.name}
                      {isDone && !isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeMeta && (
              <div className="mt-2 text-[11px] text-slate-500">
                Current status:{" "}
                <span className="font-medium text-slate-700">
                  {activeMeta.name}
                </span>
                {activeMeta.isFinal && " • Final step"}
                {activeMeta.isStart && " • Start step"}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-900 mb-2">
              Description
            </div>
            <textarea
              className="w-full min-h-[140px] resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              placeholder="Describe the goal, scope and context of this ticket..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* CHECKLIST */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-900">
                Checklist
              </div>
              <button
                type="button"
                onClick={addChecklistItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Plus className="w-3 h-3" />
                Add item
              </button>
            </div>
            <div className="text-xs text-slate-500 mb-2">
              {checklistDone}/{checklistTotal} items completed
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${checklistPct}%` }}
              />
            </div>

            <div className="space-y-1.5">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                >
                  <label className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      checked={item.done}
                      onChange={() => toggleChecklist(item.id)}
                    />
                    <span
                      className={cn(
                        "truncate",
                        item.done && "line-through text-slate-400"
                      )}
                    >
                      {item.label}
                    </span>
                  </label>
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => moveChecklist(item.id, "up")}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveChecklist(item.id, "down")}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ATTACHMENTS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-900">
                Attachments
              </div>
              <div className="text-[11px] text-slate-500">
                Images, documents, video…
              </div>
            </div>
            <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-sm text-slate-500">
              <Paperclip className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              Drag & drop files here or{" "}
              <span className="text-blue-600 font-medium cursor-pointer">
                browse
              </span>
              .
            </div>
          </div>

          {/* COMMENTS & ACTIVITY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-900 mb-2">
              Comments & activity
            </div>
            <div className="mb-3 flex items-center gap-2">
              <textarea
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                placeholder="Write a comment or update…"
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                type="button"
                onClick={addComment}
                className="self-stretch mt-auto px-3 rounded-xl border border-blue-600 bg-blue-600 text-white text-sm inline-flex items-center justify-center hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-auto space-y-2 text-sm">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-100 px-3 py-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-700">
                      {c.author}
                    </span>
                    <span>{fmtDateTime(c.createdAt)}</span>
                  </div>
                  <div className="text-sm text-slate-700 whitespace-pre-line">
                    {c.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – small properties card */}
        <aside className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 lg:sticky lg:top-20 self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-900 mb-1">
              Properties
            </div>
            <div className="text-xs text-slate-500 mb-3">
              In production only project owner / PM can change these.
            </div>

            {/* Assignee */}
            <Field label="Assignee">
              <select
                className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                value={primaryAssignee?.id ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) {
                    updateField("assignees", []);
                    return;
                  }
                  const found =
                    model.assignees.find((a) => a.id === id) || primaryAssignee;
                  updateField("assignees", found ? [found] : []);
                }}
              >
                <option value="">Unassigned</option>
                {model.assignees.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* Priority */}
            <Field label="Priority">
              <select
                className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                value={model.priority}
                onChange={(e) =>
                  updateField("priority", e.target.value as TaskVm["priority"])
                }
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </Field>

            {/* Type */}
            <Field label="Type">
              <select
                className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                value={model.type}
                onChange={(e) => updateField("type", e.target.value)}
              >
                <option value="Feature">Feature</option>
                <option value="Bug">Bug</option>
                <option value="Chore">Chore</option>
                {["Feature", "Bug", "Chore"].includes(model.type) ? null : (
                  <option value={model.type}>{model.type}</option>
                )}
              </select>
            </Field>

            {/* Story points & estimate */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Story points">
                <input
                  type="number"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={model.storyPoints ?? 0}
                  onChange={(e) =>
                    updateField("storyPoints", Number(e.target.value) || 0)
                  }
                />
              </Field>
              <Field label="Estimate (h)">
                <input
                  type="number"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={model.estimateHours ?? 0}
                  onChange={(e) =>
                    updateField("estimateHours", Number(e.target.value) || 0)
                  }
                />
              </Field>
            </div>

            {/* Remaining & severity */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Field label="Remaining (h)">
                <input
                  type="number"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={model.remainingHours ?? 0}
                  onChange={(e) =>
                    updateField("remainingHours", Number(e.target.value) || 0)
                  }
                />
              </Field>
              <Field label="Severity">
                <select
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                  value={model.severity ?? "Medium"}
                  onChange={(e) =>
                    updateField(
                      "severity",
                      e.target.value as TaskVm["severity"]
                    )
                  }
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </Field>
            </div>

            {/* Dates */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Start date">
                <input
                  type="date"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={toInputDate(model.openedAt)}
                  onChange={(e) =>
                    updateField("openedAt", fromInputDate(e.target.value)!)
                  }
                />
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={toInputDate(model.dueDate)}
                  onChange={(e) =>
                    updateField("dueDate", fromInputDate(e.target.value))
                  }
                />
              </Field>
            </div>

            {/* Sprint */}
            <Field label="Sprint" className="mt-3">
              <select
                className="h-9 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                value={model.sprintId ?? ""}
                onChange={(e) =>
                  updateField("sprintId", e.target.value || null)
                }
              >
                <option value="">Backlog / no sprint</option>
                {allSprints.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* technical info */}
            <div className="mt-4 text-[11px] text-slate-500 space-y-1">
              <div>
                Last updated:{" "}
                <span className="font-medium">
                  {fmtDateTime(model.updatedAt)}
                </span>
              </div>
              <div>
                Status key:{" "}
                <span className="font-mono text-xs">{model.statusCode}</span>
              </div>
              {model.carryOverCount > 0 && (
                <div>Spillover count: {model.carryOverCount}</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ===== Tiny helpers ===== */

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2", className)}>
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      {children}
    </div>
  );
}

function Badge({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white",
        colorClass || "border-slate-300"
      )}
    >
      <span className="uppercase tracking-wide text-[10px] text-slate-400">
        {label}
      </span>
      <span className="text-[11px] text-slate-700 font-medium">{value}</span>
    </span>
  );
}
