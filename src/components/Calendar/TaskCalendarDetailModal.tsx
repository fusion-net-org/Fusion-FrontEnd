/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ExternalLink,
  CalendarDays,
  Flag,
  Hash,
  User2,
  Users2,
  Clock,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";

import type { TaskCalendarItem } from "@/pages/calendar/calendarManagement/event-utils";
import { getTaskById, patchTaskStatusById } from "@/services/taskService.js";

/* ========= Local types ========= */

type WorkflowStatusOptionVm = {
  id: string;
  name: string;
  bgClass?: string | null;
  isEnd?: boolean;
};

type TaskDetailVm = TaskCalendarItem & {
  description?: string | null;

  reporterName?: string | null;
  reporterEmail?: string | null;

  workflowStatusOptions?: WorkflowStatusOptionVm[];

  // Một số field BE có thể trả
  createdByEmail?: string | null;
  createdByAvatar?: string | null;

  currentStatusId?: string | null;
};

type Props = {
  open: boolean;
  taskId: string | null;
  /**
   * Optional: truyền extendedProps của event để hiển thị skeleton nhanh
   * trong lúc chờ getTaskById.
   */
  initialTask?: TaskCalendarItem | null;
  onClose: () => void;
  /**
   * Optional: callback cho Calendar/parent sync lại trạng thái
   */
  onStatusChanged?: (taskId: string, newStatusIdOrName: string) => void;
};

/* ========= Helpers ========= */

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const STATUS_PILL_CLASSES: Record<string, string> = {
  TODO: "bg-sky-100 text-sky-900",
  "TO DO": "bg-sky-100 text-sky-900",
  IN_PROGRESS: "bg-amber-100 text-amber-900",
  DOING: "bg-amber-100 text-amber-900",
  REVIEW: "bg-violet-100 text-violet-900",
  IN_REVIEW: "bg-violet-100 text-violet-900",
  DONE: "bg-emerald-100 text-emerald-900",
  COMPLETED: "bg-emerald-100 text-emerald-900",
};

const fallbackStatusOptions: WorkflowStatusOptionVm[] = [
  { id: "TODO", name: "To do" },
  { id: "IN_PROGRESS", name: "In progress" },
  { id: "IN_REVIEW", name: "In review" },
  { id: "DONE", name: "Done" },
];

const getStatusPillClass = (name?: string | null) => {
  if (!name) return "bg-slate-100 text-slate-800";
  const key = name.toUpperCase().trim();
  return STATUS_PILL_CLASSES[key] ?? "bg-slate-100 text-slate-800";
};

const initials = (name?: string | null) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ========= MAIN COMPONENT ========= */

export default function TaskCalendarDetailModal({
  open,
  taskId,
  initialTask,
  onClose,
  onStatusChanged,
}: Props) {
  const navigate = useNavigate();

  const [task, setTask] = React.useState<TaskDetailVm | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState(false);

  React.useEffect(() => {
    if (!open || !taskId) {
      setTask(null);
      return;
    }

    let alive = true;

    // ưu tiên hiển thị nhanh initialTask
    if (initialTask) {
      setTask((prev) => {
        if (prev) return prev;
        const t: TaskDetailVm = {
          ...(initialTask as any),
          description: (initialTask as any).description ?? null,
          reporterName:
            (initialTask as any).reporterName ?? initialTask.createByName ?? null,
          workflowStatusOptions:
            (initialTask as any).workflowStatusOptions ?? undefined,
        };
        return t;
      });
    }

    (async () => {
      setLoading(true);
      try {
        const res: any = await getTaskById(taskId);
        const raw: any = res?.data ?? res ?? {};

        // Lấy danh sách status từ workflowAssignments.items
        const wa = raw.workflowAssignments ?? {};
        const waItems: any[] = Array.isArray(wa.items) ? wa.items : [];

        const statusOptions: WorkflowStatusOptionVm[] = waItems.map((x) => ({
          id: String(x.workflowStatusId),
          name: x.statusName ?? "",
        }));

        const detail: TaskDetailVm = {
          // từ TaskCalendarItem / BE
          id: String(raw.id ?? taskId),
          taskId: String(raw.id ?? taskId),
          code: raw.code ?? initialTask?.code ?? "",
          title: raw.title ?? raw.name ?? initialTask?.title ?? "",
          description:
            raw.description ?? (initialTask as any)?.description ?? null,

          type: raw.type ?? raw.taskType ?? initialTask?.type ?? null,
          priority: raw.priority ?? initialTask?.priority ?? null,
          severity: raw.severity ?? initialTask?.severity ?? null,
          status:
            raw.status ??
            raw.statusName ??
            initialTask?.status ??
            null,

          point: raw.point ?? raw.storyPoints ?? initialTask?.point ?? null,
          estimateHours:
            raw.estimateHours ?? raw.estimate ?? initialTask?.estimateHours,
          remainingHours:
            raw.remainingHours ??
            raw.remaining ??
            initialTask?.remainingHours ??
            null,

          createAt:
            raw.createdAt ??
            raw.createAt ??
            initialTask?.createAt ??
            null,
          startDate:
            raw.startDate ?? raw.beginDate ?? initialTask?.startDate ?? null,
          endDate:
            raw.endDate ?? raw.completeDate ?? initialTask?.endDate ?? null,
          dueDate: raw.dueDate ?? initialTask?.dueDate ?? null,

          createByName:
            raw.createdByName ??
            raw.reporterName ??
            initialTask?.createByName ??
            null,
          createdByEmail: raw.createdByEmail ?? null,
          createdByAvatar: raw.createdByAvatar ?? null,

          reporterName:
            raw.reporterName ??
            raw.createdByName ??
            initialTask?.createByName ??
            null,
          reporterEmail: raw.reporterEmail ?? raw.createdByEmail ?? null,

          project:
            initialTask?.project ??
            raw.project ??
            (raw.projectId
              ? {
                  id: raw.projectId,
                  name: initialTask?.project?.name ?? null,
                  companyId: (initialTask as any)?.project?.companyId,
                }
              : null),
          sprint: initialTask?.sprint ?? raw.sprint ?? null,

          workflowStatus:
            raw.workflowStatus ??
            raw.statusObj ??
            initialTask?.workflowStatus ??
            null,
          members: raw.members ?? raw.assignees ?? initialTask?.members ?? [],

          workflowStatusOptions:
            statusOptions.length > 0 ? statusOptions : undefined,

          currentStatusId:
            raw.currentStatusId ??
            (initialTask?.workflowStatus as any)?.id ??
            null,
        };

        if (!alive) return;
        setTask(detail);
      } catch (err) {
        console.error("Load task detail for calendar failed", err);
        if (!alive) return;
        if (!initialTask) {
          toast.error("Không tải được chi tiết task.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, taskId, initialTask]);

  if (!open) return null;

  const currentStatusName =
    task?.workflowStatus?.name ?? task?.status ?? "Unknown";

  const hasRealWorkflowOptions =
    !!task?.workflowStatusOptions && task.workflowStatusOptions.length > 0;

  const statusOptions = hasRealWorkflowOptions
    ? task!.workflowStatusOptions!
    : fallbackStatusOptions;

  const currentStatusId =
    task?.currentStatusId ??
    (task?.workflowStatus as any)?.id ??
    statusOptions.find(
      (x) =>
        x.id === currentStatusName ||
        x.name.toLowerCase() === currentStatusName.toLowerCase(),
    )?.id ??
    statusOptions[0]?.id;

  const handleChangeStatus = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    if (!task || !task.id) return;
    if (!hasRealWorkflowOptions) return; // không có workflowAssignments thì thôi

    const newId = e.target.value;
    if (!newId || newId === currentStatusId) return;

    setSavingStatus(true);
    try {
      // newId là GUID workflowStatusId
      await patchTaskStatusById(task.id, newId);

      const option = statusOptions.find((x) => x.id === newId);
      const newName = option?.name ?? newId;

      setTask((prev) =>
        prev
          ? {
              ...prev,
              currentStatusId: newId,
              status: newName,
              workflowStatus: {
                ...(prev.workflowStatus ?? {}),
                id: newId,
                name: newName,
              },
            }
          : prev,
      );

      toast.success("Change task success.");
      onStatusChanged?.(String(task.id), newId);
    } catch (err) {
      console.error("Update status from calendar modal failed", err);
      toast.error("Change task fail.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleOpenFullPage = () => {
    if (!task) return;

    const projectId = task.project?.id;
    const companyId = (task.project as any)?.companyId;

    if (companyId && projectId) {
      // Route chuẩn cho TaskDetailPage trong project
      navigate(`/companies/${companyId}/project/${projectId}/task/${task.id}`);
      return;
    }

    // Nếu sau này có ticket riêng thì chỉnh route ở đây
    // if (companyId && task.ticketId) {
    //   navigate(`/companies/${companyId}/tickets/${task.ticketId}`);
    // }
  };

  const assigneeNames =
    task?.members?.map((m: any) => m.memberName).filter(Boolean).join(", ") ??
    "—";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-start justify-between border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[11px] text-slate-600">
                {task?.code || "#—"}
              </span>
              {task?.type && (
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-100">
                  {task.type}
                </span>
              )}
              {task?.priority && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-100">
                  {task.priority}
                </span>
              )}
              {task?.severity && (
                <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 border border-rose-100">
                  {task.severity}
                </span>
              )}
            </div>

            <h2 className="truncate text-base font-semibold leading-snug text-slate-900 sm:text-lg">
              {task?.title || "Untitled task"}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              {task?.project?.name && (
                <span className="inline-flex items-center gap-1">
                  <Layers className="size-3" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">
                    {task.project.name}
                  </span>
                </span>
              )}
              {task?.sprint?.name && (
                <span className="inline-flex items-center gap-1">
                  <Hash className="size-3" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">
                    {task.sprint.name}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="ml-3 flex flex-col items-end gap-2">
            {/* Status dropdown (ONLY interactive part) */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  getStatusPillClass(currentStatusName),
                )}
              >
                {currentStatusName}
              </span>
              <select
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={currentStatusId ?? ""}
                onChange={handleChangeStatus}
                disabled={savingStatus || !hasRealWorkflowOptions}
              >
                {statusOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOpenFullPage}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="size-3.5" />
                <span>Open full page</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="grid max-h-[calc(90vh-60px)] gap-4 overflow-y-auto px-4 py-3 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)] sm:px-5 sm:py-4">
          {/* LEFT: Description + timeline */}
          <div className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </div>
              </div>
              {loading && !task ? (
                <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {task?.description ||
                    "No description has been provided yet for this ticket."}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timeline
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5 text-slate-500" />
                    <span>Start</span>
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatDateTime(task?.startDate ?? task?.createAt ?? null)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5 text-slate-500" />
                    <span>Due</span>
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatDateTime(task?.dueDate ?? task?.endDate ?? null)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5 text-slate-500" />
                    <span>Created at</span>
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatDateTime(task?.createAt)}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Meta info (read-only) */}
          <div className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                People
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <User2 className="size-3.5" />
                    Reporter
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                      {initials(task?.reporterName ?? task?.createByName)}
                    </div>
                    <div className="text-right">
                      <div className="max-w-[140px] truncate text-xs font-medium">
                        {task?.reporterName ?? task?.createByName ?? "—"}
                      </div>
                      <div className="max-w-[160px] truncate text-[11px] text-slate-500">
                        {task?.reporterEmail ?? task?.createdByEmail ?? ""}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Users2 className="size-3.5" />
                    Assignees
                  </span>
                  <div className="text-right">
                    <div className="max-w-[160px] truncate text-xs font-medium">
                      {assigneeNames || "—"}
                    </div>
                    {task?.members && task.members.length > 1 && (
                      <div className="text-[11px] text-slate-400">
                        {task.members.length} members
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Attributes
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Flag className="size-3.5" />
                    Priority
                  </span>
                  <span className="font-medium">{task?.priority ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <AlertTriangle className="size-3.5" />
                    Severity
                  </span>
                  <span className="font-medium">
                    {task?.severity ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Layers className="size-3.5" />
                    Story points
                  </span>
                  <span className="font-medium">{task?.point ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock className="size-3.5" />
                    Estimate (h)
                  </span>
                  <span className="font-medium">
                    {task?.estimateHours ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock className="size-3.5" />
                    Remaining (h)
                  </span>
                  <span className="font-medium">
                    {task?.remainingHours ?? "—"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
