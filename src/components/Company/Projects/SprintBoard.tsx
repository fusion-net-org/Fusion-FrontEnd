// FUSION — Sprint page (Board / Analytics / Roadmap). Tailwind-only.
// Dữ liệu & thao tác lấy từ ProjectBoardContext (workflow động).

import React, { useEffect, useMemo, useState } from "react";
import { useProjectBoard } from "@/context/ProjectBoardContext";
import { KanbanSquare, TrendingUp, Search } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DragStart,
} from "@hello-pangea/dnd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import TaskCard from "@/components/Company/Projects/TaskCard";
import type { SprintVm, TaskVm } from "@/types/projectBoard";
import ColumnHoverCreate from "../Task/ColumnHoverCreate";
import { useNavigate, useParams } from "react-router-dom";
import { Can, usePermissions } from "@/permission/PermissionProvider";
import SprintKpiTable from "./SprintKpiTable";
import { getUserIdFromToken } from "@/utils/token";
import { toast } from "react-toastify";
import {
   materializeDraftTask,
  patchTaskCloseById, getDraftTasks, createDraftTask,
} from "@/services/taskService.js";
type Id = string;
const userId = getUserIdFromToken();
const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "N/A");
const norm = (s?: string | null) => (s ?? "").trim();
import BacklogHoverCreate from "../Backlog/BacklogHoverCreate";

/** ===== Virtual lanes (NOT workflow statuses) =====
 * Backlog/Close là lane type riêng, KHÔNG map isStart/isEnd, KHÔNG thuộc transitions.
 * - Hiện tại: drop vào lane = UI-only (không lưu DB) nhưng để hở đường: có hook optional persist.
 */
const VCOL_BACKLOG = "__LANE_BACKLOG__";
const VCOL_CLOSE = "__LANE_CLOSE__";
type TaskLane = "BACKLOG" | "WORKFLOW" | "CLOSE";
const isVirtualCol = (id: string) => id === VCOL_BACKLOG || id === VCOL_CLOSE;
const colToLane = (id: string): TaskLane =>
  id === VCOL_BACKLOG ? "BACKLOG" : id === VCOL_CLOSE ? "CLOSE" : "WORKFLOW";

// ===== Analytics helpers: burn-up + velocity + work-mix =====
// dùng storyPoints, nếu không có thì = 0 (chart sẽ phẳng, đúng data)
const taskPoints = (t: TaskVm) => Math.max(0, t.storyPoints || 0);

// build burn-up cho 1 sprint theo ngày
function buildBurnupData(
  sprint: SprintVm | null,
  sprints: SprintVm[],
  tasks: TaskVm[],
): Array<{ date: string; scope: number; completed: number; ideal: number }> {
  if (!sprint) return [];

  const startIso = sprint.start;
  const endIso = sprint.end;
  if (!startIso || !endIso) return [];

  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [];
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / dayMs) + 1);

  const validSprintIds = new Set(sprints.map((s) => s.id));

  // giống committedPoints: task có sprintId rác -> tính chung cho sprint active
  const sprintTasks = tasks.filter(
    (t) =>
      (t.sprintId ?? "") === sprint.id ||
      (!!norm(t.sprintId) && !validSprintIds.has(t.sprintId ?? "")),
  );
  if (!sprintTasks.length) return [];

  const clampIndex = (idx: number) => Math.max(0, Math.min(totalDays - 1, idx));

  const dailyScopeAdd = new Array<number>(totalDays).fill(0);
  const dailyCompletedAdd = new Array<number>(totalDays).fill(0);

  const getAnchorDate = (t: TaskVm): string | null =>
    (t.openedAt as any) || (t.createdAt as any) || (t.dueDate as any) || startIso;

  const getDoneDate = (t: TaskVm): string | null => {
    if (t.statusCategory !== "DONE") return null;
    return (t.updatedAt as any) || (t.dueDate as any) || endIso;
  };

  let totalScope = 0;

  for (const t of sprintTasks) {
    const pts = taskPoints(t);
    if (!pts) continue;

    // scope: ngày task “vào” sprint
    const anchorIso = getAnchorDate(t);
    if (anchorIso) {
      const d = new Date(anchorIso);
      const idx = clampIndex(Math.floor((d.getTime() - start.getTime()) / dayMs));
      dailyScopeAdd[idx] += pts;
      totalScope += pts;
    }

    // completed: ngày task DONE (approx = updatedAt)
    const doneIso = getDoneDate(t);
    if (doneIso) {
      const d2 = new Date(doneIso);
      const idx2 = clampIndex(Math.floor((d2.getTime() - start.getTime()) / dayMs));
      dailyCompletedAdd[idx2] += pts;
    }
  }

  if (!totalScope) {
    // không có storyPoints -> không vẽ burn-up (tránh vẽ sai)
    return [];
  }

  const data: Array<{ date: string; scope: number; completed: number; ideal: number }> = [];
  let cumScope = 0;
  let cumDone = 0;

  for (let i = 0; i < totalDays; i++) {
    cumScope += dailyScopeAdd[i];
    cumDone += dailyCompletedAdd[i];

    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const ideal =
      totalScope && totalDays > 1 ? Math.round((totalScope * i) / (totalDays - 1)) : totalScope;

    data.push({
      date: label,
      scope: cumScope,
      completed: cumDone,
      ideal,
    });
  }

  return data;
}

// velocity: committed vs completed / sprint
function buildVelocityData(
  sprints: SprintVm[],
  tasks: TaskVm[],
): Array<{ name: string; committed: number; completed: number }> {
  if (!sprints.length) return [];

  const byId = new Map<
    string,
    { id: string; name: string; startMs: number; committed: number; completed: number }
  >();

  for (const s of sprints) {
    const startMs = s.start ? new Date(s.start).getTime() : 0;
    byId.set(s.id, { id: s.id, name: s.name, startMs, committed: 0, completed: 0 });
  }

  for (const t of tasks) {
    const sid = t.sprintId ?? "";
    const rec = byId.get(sid);
    if (!rec) continue;
    const pts = taskPoints(t);
    rec.committed += pts;
    if (t.statusCategory === "DONE") rec.completed += pts;
  }

  return Array.from(byId.values())
    .filter((x) => x.committed > 0 || x.completed > 0)
    .sort((a, b) => a.startMs - b.startMs)
    .map((x) => ({ name: x.name, committed: x.committed, completed: x.completed }));
}

/* ===== helpers màu từ API ===== */
function hexToRgba(hex?: string, a = 1) {
  if (!hex) return `rgba(148,163,184,${a})`; // slate-400 fallback
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return `rgba(148,163,184,${a})`;
  const r = parseInt(m[1], 16),
    g = parseInt(m[2], 16),
    b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ========= Board atoms ========= */
function BoardColumnShell({
  title,
  tone,
  colorHex,
  right,
  children,
  highlightType,
  labels,
  titleClassName,
}: {
  title: string;
  tone: "amber" | "blue" | "purple" | "green";
  colorHex?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  highlightType?: "success" | "optional" | "failure";
  labels?: string[];
  titleClassName?: string;
}) {
  const fallback: Record<string, string> = {
    amber: "#F59E0B",
    blue: "#2563EB",
    purple: "#7C3AED",
    green: "#059669",
  };

  const accent = colorHex || fallback[tone];
  const isHighlighted = !!highlightType;

  const labelBg = hexToRgba(accent, isHighlighted ? 0.16 : 0.08);
  const labelBd = hexToRgba(accent, isHighlighted ? 0.4 : 0.25);
  const labelTx = accent;

  const glowClass =
    highlightType === "success"
      ? "ring-2 ring-emerald-300/80 shadow-[0_16px_40px_rgba(34,197,94,0.35)]"
      : highlightType === "optional"
      ? "ring-2 ring-sky-300/80 shadow-[0_16px_40px_rgba(56,189,248,0.35)]"
      : highlightType === "failure"
      ? "ring-2 ring-rose-300/80 shadow-[0_16px_40px_rgba(239,68,68,0.35)]"
      : "";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white overflow-hidden h-full flex flex-col transition-all duration-200",
        "border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.12)]",
        glowClass,
      )}
      style={{ willChange: isHighlighted ? "transform, box-shadow" : undefined }}
    >
      <div className="h-2 w-full" style={{ backgroundColor: accent, opacity: isHighlighted ? 0.95 : 0.8 }} />

      <div className="p-4 pb-2 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center text-[12px] font-semibold px-2 py-0.5 rounded-full border",
            titleClassName,
          )}
          style={{ background: labelBg, borderColor: labelBd, color: labelTx }}
        >
          {title}
        </span>
        {right}
      </div>

      {labels && labels.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {labels.map((lb, i) => {
            const base =
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium";
            const cls =
              highlightType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : highlightType === "failure"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-sky-200 bg-sky-50 text-sky-700";

            return (
              <span key={`${lb}-${i}`} className={cn(base, cls)}>
                {lb}
              </span>
            );
          })}
        </div>
      )}

      <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

type ColumnsMap = {
  order: string[];
  byId: Record<string, TaskVm[]>;
};

type HighlightKind = "success" | "optional" | "failure";

type HighlightInfo = {
  kind: HighlightKind;
  labels: string[];
};

type SprintBoardProps = {
  activeSprint: SprintVm | null;
  columns: ColumnsMap;
  highlightTargets: Record<string, HighlightInfo>;
  flashTaskId: string | null;
  setFlashTaskId: (id: string | null) => void;
  onDragStart: (start: DragStart) => void;
  onDragEnd: (result: DropResult) => void;
  onMarkDone: (t: TaskVm) => void;
  onSplit: (t: TaskVm) => void;
  onMoveToNextSprint: (t: TaskVm) => void;
  onChangeStatus: (t: TaskVm, nextStatusId: string) => void;
  toNextStatusId: (t: TaskVm, sp: SprintVm) => string | null;
  onOpenTicket: (taskId: string) => void;
  dragPolicy: { fromStatusId: string; allowed: string[] } | null;
   onCloseTask: (t: TaskVm) => void; 
     onBacklogCreatedVM?: (t: TaskVm) => void;
  onReloadBacklog?: () => Promise<void> | void;

   maintenanceEnabled?: boolean;
  components?: { id: string; name: string }[];
  defaultComponentId?: string | null;

};

function SprintBoard({
  activeSprint,
  columns,
  highlightTargets,
  flashTaskId,
  setFlashTaskId,
  onDragStart,
  onDragEnd,
  onMarkDone,
  onSplit,
  onMoveToNextSprint,
  onChangeStatus,
  toNextStatusId,
  onOpenTicket,
  onCloseTask,
  dragPolicy,
    onBacklogCreatedVM,
  onReloadBacklog,
   maintenanceEnabled,
  components,
  defaultComponentId,

}: SprintBoardProps) {
  if (!activeSprint) return null;

  const COL_W = "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";
  const BOARD_H = `calc(100vh - 260px)`;
  const tones: Array<"amber" | "blue" | "purple" | "green"> = ["amber", "blue", "purple", "green"];
  const renderCol = (colId: string, idx: number) => {
    const isBacklog = colId === VCOL_BACKLOG;
    const isClose = colId === VCOL_CLOSE;
    const isVirtual = isBacklog || isClose;

    const items = columns.byId[colId] ?? [];
    const meta = !isVirtual ? (activeSprint.statusMeta as any)?.[colId] : null;

    const tone = tones[idx % 4];
    const wip = meta?.wipLimit ?? 9999;
    const over = items.length > wip;

    const highlight = !isVirtual ? highlightTargets[colId] : undefined;
    const targetType = highlight?.kind;
    const targetLabels = highlight?.labels ?? [];

   const restrictFromBacklog = dragPolicy?.fromStatusId === VCOL_BACKLOG;

const allowedWhenBacklog =
  !restrictFromBacklog ||
  colId === VCOL_BACKLOG ||
  (dragPolicy?.allowed ?? []).includes(colId);

const dimmed = restrictFromBacklog
  ? !allowedWhenBacklog
  : (
      !!dragPolicy &&
      !isVirtual &&
      colId !== dragPolicy.fromStatusId &&
      !dragPolicy.allowed.includes(colId)
    );
const dropDisabled =
  isBacklog ? true : (
    restrictFromBacklog ? !allowedWhenBacklog : (!isVirtual ? dimmed : false)
  );


    const title = isBacklog ? "Backlog" : isClose ? "Close" : meta?.name ?? meta?.code ?? colId;

    const accent = isBacklog ? "#f59e0b" : isClose ? "#94A3B8" : meta?.color;

    return (
      <div key={colId} className={`shrink-0 h-full ${COL_W} relative group`}>
        <BoardColumnShell
          title={title}
          tone={tone}
          colorHex={accent}
          highlightType={targetType}
          labels={targetLabels}
          titleClassName={isClose ? "line-through decoration-slate-400" : undefined}
          right={
            <div className="flex items-center gap-2 text-[12px]">
              <span className={cn("text-slate-500", isClose && "line-through decoration-slate-400")}>
                {items.length} tasks
              </span>
              {!isVirtual && wip !== 9999 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full border",
                    over
                      ? "text-rose-700 bg-rose-50 border-rose-200"
                      : "text-slate-600 bg-slate-50 border-slate-200",
                  )}
                >
                  WIP {items.length}/{wip}
                </span>
              )}
            </div>
          }
        >
          
       <Droppable droppableId={colId} type="task" isDropDisabled={dropDisabled}>


            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "relative h-full overflow-y-auto overscroll-contain pr-1",
                  snapshot.isDraggingOver && "bg-slate-50 rounded-xl",
                  dimmed && "opacity-40 grayscale",
                )}
                style={{ scrollbarWidth: "thin" }}
              >
                {dimmed && (
                  <div className="absolute inset-0 bg-slate-200/25 pointer-events-none rounded-xl" />
                )}

                {/* NOTE:
                    Backlog/Close là lane type riêng -> hiện tại KHÔNG cho create trực tiếp ở đây
                    (vì ColumnHoverCreate cần statusId thật). Sau này có thể làm CreateInBacklog riêng.
                 */}
               {isBacklog && (
  <Can code="TASK_CREATE">
  <BacklogHoverCreate
  onReload={onReloadBacklog}
  maintenanceEnabled={!!maintenanceEnabled}
  components={components ?? []}
  defaultComponentId={defaultComponentId ?? null}
  onCreatedVM={(vm) => {
    setFlashTaskId(vm.id);
    onBacklogCreatedVM?.(vm);
  }}
/>

  </Can>
)}


                {!isVirtual && (
                  <Can code="TASK_CREATE">
                   <ColumnHoverCreate
  sprint={activeSprint}
  statusId={colId}
  onCreatedVM={(vm) => setFlashTaskId(vm.id)}
  maintenanceEnabled={!!maintenanceEnabled}
  components={components ?? []}
  defaultComponentId={defaultComponentId ?? null}
/>

                  </Can>
                )}

                <div className="space-y-4">
                  {items.map((t, index) => {
                    const siblings = t.sourceTicketId
                      ? items.filter((x) => x.id !== t.id && x.sourceTicketId === t.sourceTicketId).length
                      : 0;

                    const disabledActions = isVirtual; // nghiệp vụ: lane type chưa tham gia workflow actions

                    return (
                   <Draggable key={t.id} draggableId={t.id} index={index} isDragDisabled={isClose}>

                        {(drag, snap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={cn(
                              snap.isDragging ? "rotate-[0.5deg]" : "",
                              isClose && "opacity-80",
                            )}
                          >
                            <TaskCard
                              t={t}
                              ticketSiblingsCount={siblings}
                              mode={isBacklog ? "backlog" : "default"}
                              components={components ?? []} 
                              onMarkDone={(x) => {
                                if (disabledActions) {
                                  toast.info("This lane is not part of workflow yet. Drag task into a status column.");
                                  return;
                                }
                                onMarkDone(x);
                              }}
                              isNew={t.id === flashTaskId}
                              onNext={(x) => {
                                if (disabledActions) {
                                  toast.info("This lane is not part of workflow yet. Drag task into a status column.");
                                  return;
                                }
                                const nextId = toNextStatusId(x, activeSprint);
                                if (nextId && nextId !== x.workflowStatusId) onChangeStatus(x, nextId);
                              }}
                              onClose={(x) => onCloseTask(x)}
                              onSplit={(x) => {
                                if (disabledActions) {
                                  toast.info("This lane is not part of workflow yet. Drag task into a status column.");
                                  return;
                                }
                                onSplit(x);
                              }}
                              onMoveNext={(x) => {
                                if (disabledActions) {
                                  toast.info("This lane is not part of workflow yet. Drag task into a status column.");
                                  return;
                                }
                                onMoveToNextSprint(x);
                              }}
                              onOpenTicket={onOpenTicket}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                </div>

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </BoardColumnShell>
      </div>
    );
  };

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="px-8 mt-5 pb-4 min-w-0 max-w-[100vw]">
        <div className="overflow-x-auto rounded-xl w-full" style={{ height: BOARD_H, overflowY: "hidden" }}>
          <div className="inline-flex gap-4 h-full min-w-max pr-6 pb-5">
            {columns.order.map((colId, i) => renderCol(colId, i))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

/* ========= Page ========= */
export default function SprintWorkspacePage() {
  // ===== từ context =====
  const { companyId, projectId } = useParams();

  const board = useProjectBoard() as any;
  const { sprints, tasks, changeStatus, moveToNextSprint, split, done, reorder } = board;
const [taskPatchById, setTaskPatchById] = useState<Record<string, TaskPatch>>({});
const mergedTasks: TaskVm[] = useMemo(() => {
  if (!tasks?.length) return [];
  return tasks.map((t: TaskVm) => {
    const patch = taskPatchById[t.id];
    return patch ? ({ ...t, ...patch } as TaskVm) : t;
  });
}, [tasks, taskPatchById]);

// ===== Maintenance detect + components =====

const maintenanceEnabled = React.useMemo(() => {
  const sp: any = Array.isArray(sprints) && sprints.length ? sprints[0] : null;
  if (sp && typeof sp.isMain !== "undefined") return !!sp.isMain;

  // fallback: infer từ components nếu isMain chưa có (tránh crash)
  const raw: any =
    board?.components ??
    board?.projectComponents ??
    board?.maintenanceComponents ??
    board?.project?.components ??
    [];
  return Array.isArray(raw) && raw.length > 0;
}, [sprints, board]);

// (tuỳ bạn) giữ alias cho dễ đọc
const isMaintenanceProject = maintenanceEnabled;
const maintenanceComponents = React.useMemo(() => {
  const raw: any =
    board?.components ??
    board?.projectComponents ??
    board?.maintenanceComponents ??
    board?.project?.components ??
    [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c: any) => ({
      id: String(c?.id ?? c?.componentId ?? ""),
      name: String(c?.name ?? c?.componentName ?? ""),
    }))
    .filter((x) => x.id && x.name);
}, [board]);

const maintenanceDefaultComponentId = React.useMemo(() => {
  const p: any = board?.project ?? board?.projectInfo ?? board?.projectDetail ?? {};
  return (
    (p?.defaultComponentId as string) ??
    (board?.defaultComponentId as string) ??
    maintenanceComponents[0]?.id ??
    null
  );
}, [board, maintenanceComponents]);
console.log(board);
  // ===== Realtime clock =====
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const toMs = (iso?: string | null) => {
    if (!iso) return Number.NaN;
    const d = new Date(iso);
    const ms = d.getTime();
    return Number.isNaN(ms) ? Number.NaN : ms;
  };
  const isInRange = (n: Date, start?: string | null, end?: string | null) => {
    const s = toMs(start);
    const e = toMs(end);
    const x = n.getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return false;
    return x >= s && x <= e;
  };

  // ===== Current sprint resolver =====
  const currentSprint: SprintVm | null = useMemo(() => {
    if (!sprints.length) return null;

    const running = sprints.find((s: SprintVm) => isInRange(now, s.start, s.end));
    if (running) return running;

    const upcoming = sprints
      .filter((s: SprintVm) => {
        const sMs = toMs(s.start);
        return !Number.isNaN(sMs) && sMs > now.getTime();
      })
      .sort((a: SprintVm, b: SprintVm) => toMs(a.start) - toMs(b.start))[0];
    if (upcoming) return upcoming;

    const latestPast = sprints
      .filter((s: SprintVm) => {
        const eMs = toMs(s.end);
        return !Number.isNaN(eMs) && eMs < now.getTime();
      })
      .sort((a: SprintVm, b: SprintVm) => toMs(b.end) - toMs(a.end))[0];

    return latestPast ?? sprints[0];
  }, [sprints, now]);

  const currentSprintId = currentSprint?.id ?? "";

  const { can } = usePermissions();
  const canViewAllSprintTasks = can("SPRINT_TASK_VIEW_ALL");
  const myUserId = userId;

  const isAssignedToMe = React.useCallback(
    (t: TaskVm) => {
      if (!myUserId) return true;

      const anyT: any = t as any;
      if (anyT.assigneeId && anyT.assigneeId === myUserId) return true;
      if (anyT.assignedToId && anyT.assignedToId === myUserId) return true;
      if (anyT.assignee?.id && anyT.assignee.id === myUserId) return true;

      const arr = anyT.assignees || anyT.assignedMembers || anyT.members || anyT.assignments || [];
      if (Array.isArray(arr)) return arr.some((x: any) => (x?.id ?? x?.userId) === myUserId);

      return false;
    },
    [myUserId],
  );

const visibleTasks: TaskVm[] = React.useMemo(() => {
  if (canViewAllSprintTasks) return mergedTasks;
  return mergedTasks.filter(isAssignedToMe);
}, [mergedTasks, canViewAllSprintTasks, isAssignedToMe]);


  const [flashTaskId, setFlashTaskId] = useState<Id | null>(null);

const [backlogDrafts, setBacklogDrafts] = useState<TaskVm[]>([]);
const [loadingBacklog, setLoadingBacklog] = useState(false);

const mapBacklogDtoToTaskVm = React.useCallback((dto: any): TaskVm => {
  const now = new Date().toISOString();

  return {
    id: String(dto?.id ?? dto?.taskId ?? ""),
    code:
      dto?.ticketCode ??
      dto?.ticket_code ??
      dto?.sourceTicketCode ??
      "BACKLOG",
    title: String(dto?.title ?? ""),
    type: (dto?.type ?? dto?.taskType ?? "Feature") as any,
    priority: (dto?.priority ?? "Medium") as any,
    severity: dto?.severity ?? null,

    storyPoints: Number(dto?.storyPoints ?? dto?.story_points ?? 0) || 0,
    estimateHours:
      typeof dto?.estimateHours === "number"
        ? dto.estimateHours
        : typeof dto?.estimate_hours === "number"
          ? dto.estimate_hours
          : null,
    remainingHours:
      typeof dto?.remainingHours === "number"
        ? dto.remainingHours
        : typeof dto?.remaining_hours === "number"
          ? dto.remaining_hours
          : null,

    // draft backlog: chưa thuộc sprint / workflow thật
    sprintId: null,
    workflowStatusId: "__LANE_BACKLOG__" as any,
    statusCode: "backlog" as any,
    statusCategory: "TODO" as any,
    StatusName: "Backlog" as any,

    assignees: [],
    dependsOn: [],
    parentTaskId: null,
    carryOverCount: 0,

    openedAt: dto?.createdAt ?? dto?.created_at ?? now,
    createdAt: dto?.createdAt ?? dto?.created_at ?? now,
    updatedAt: dto?.updatedAt ?? dto?.updated_at ?? dto?.createdAt ?? now,

    sourceTicketId: dto?.ticketId ?? dto?.ticket_id ?? null,
    sourceTicketCode:
      dto?.ticketCode ?? dto?.ticket_code ?? dto?.ticket?.code ?? null,

    ...(dto?.componentId || dto?.component_id
      ? {
          componentId: dto?.componentId ?? dto?.component_id,
          componentName:
            dto?.componentName ??
            dto?.component_name ??
            dto?.component?.name ??
            null,
        }
      : {}),
  } as any;
}, []);
const reloadBacklogDrafts = React.useCallback(async () => {
  if (!projectId) return;

  try {
    setLoadingBacklog(true);

    const res: any = await getDraftTasks(projectId, {
      pageSize: 200,
      sortColumn: "CreatedAt",
      sortDescending: true,
    });

    const items: any[] =
      Array.isArray(res) ? res :
      Array.isArray(res?.items) ? res.items :
      Array.isArray(res?.data?.items) ? res.data.items :
      [];

    const mapped = items
      .map(mapBacklogDtoToTaskVm)
      .filter((x) => !!x?.id && !!x?.title);

    setBacklogDrafts(mapped);
  } catch (err) {
    console.error("[SprintBoard] load backlog drafts failed", err);
    setBacklogDrafts([]);
  } finally {
    setLoadingBacklog(false);
  }
}, [projectId, mapBacklogDtoToTaskVm]);

useEffect(() => {
  let alive = true;
  if (!projectId) return;

  (async () => {
    try {
      setLoadingBacklog(true);

      const res: any = await getDraftTasks(projectId, {
        pageSize: 200,
        sortColumn: "CreatedAt",
        sortDescending: true,
      });

      const items: any[] =
        Array.isArray(res) ? res :
        Array.isArray(res?.items) ? res.items :
        Array.isArray(res?.data?.items) ? res.data.items :
        [];

      const mapped = items
        .map(mapBacklogDtoToTaskVm)
        .filter((x) => !!x?.id && !!x?.title);

      if (alive) setBacklogDrafts(mapped);
    } catch (err) {
      console.error("[SprintBoard] load backlog drafts failed", err);
      if (alive) setBacklogDrafts([]);
    } finally {
      if (alive) setLoadingBacklog(false);
    }
  })();

  return () => {
    alive = false;
  };
}, [projectId, mapBacklogDtoToTaskVm]);

  const navigate = useNavigate();

  const handleOpenTicket = React.useCallback(
    (taskId: string) => {
      if (!companyId || !projectId) return;
      navigate(`/companies/${companyId}/project/${projectId}/task/${taskId}`);
    },
    [navigate, companyId, projectId],
  );

  useEffect(() => {
    if (!flashTaskId) return;
    const timer = setTimeout(() => setFlashTaskId(null), 800);
    return () => clearTimeout(timer);
  }, [flashTaskId]);

  // ===== UI State =====
  const [activeSprintId, setActiveSprintId] = useState<Id>("");
  const [view, setView] = useState<"Board" | "Analytics" | "Roadmap">("Board");
  const [closePanelOpen, setClosePanelOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [snapshots, setSnapshots] = useState<{ name: string; committed: number; completed: number }[]>(
    [],
  );

  // lane UI-only (Backlog/Close)
  const [uiLaneByTaskId, setUiLaneByTaskId] = useState<Record<string, TaskLane>>({});
  // order UI-only cho 2 lane ảo
  const [uiOrderByColId, setUiOrderByColId] = useState<Record<string, string[]>>({});
type CloseMode = "CLOSE" | "CANCEL";
type CloseIntent = {
  task: TaskVm;
  mode: CloseMode;
  destIndex?: number;
  fromColId?: string;
  fromIndex?: number;
};

// Nếu TaskVm type chưa có isClose => dùng patch type riêng để TS không báo lỗi
type TaskPatch = Partial<TaskVm> & { isClose?: boolean };

const [closeIntent, setCloseIntent] = useState<CloseIntent | null>(null);

  const [lastCrossMove, setLastCrossMove] = useState<{ taskId: string; toColId: string } | null>(
    null,
  );

  useEffect(() => {
    if (!sprints.length) return;
    if (!activeSprintId) {
      setActiveSprintId(currentSprintId || sprints[0].id);
      return;
    }
    const stillExists = sprints.some((s: SprintVm) => s.id === activeSprintId);
    if (!stillExists) setActiveSprintId(currentSprintId || sprints[0].id);
  }, [sprints, activeSprintId, currentSprintId]);

  const activeSprint: SprintVm | null = useMemo(
    () => sprints.find((s: SprintVm) => s.id === activeSprintId) ?? null,
    [sprints, activeSprintId],
  );
const startStatusId = useMemo(() => {
  if (!activeSprint) return null;
  const order = activeSprint.statusOrder ?? [];
  const meta: any = (activeSprint.statusMeta as any) ?? {};
  return order.find((id) => meta?.[id]?.isStart === true) ?? order[0] ?? null;
}, [activeSprint]);

  // ===== helpers lane (persist + detect) =====
  const getPersistedLane = React.useCallback((t: TaskVm): TaskLane | null => {
    const anyT: any = t as any;
    const raw = String(
      anyT.laneType ?? anyT.taskLane ?? anyT.boardLane ?? anyT.lane ?? anyT.laneCode ?? "",
    )
      .trim()
      .toUpperCase();

    if (raw === "BACKLOG") return "BACKLOG";
    if (raw === "CLOSE" || raw === "CLOSED") return "CLOSE";
    return null;
  }, []);

const detectClosed = React.useCallback((t: TaskVm): boolean => {
  const anyT: any = t as any;
  return !!(anyT.isClose || anyT.isClosed || anyT.closedAt || anyT.closedReason || anyT.closedById);
}, []);


  const validSprintIds = useMemo(() => new Set<string>(sprints.map((s: SprintVm) => s.id)), [sprints]);

  const isInActiveSprintScope = React.useCallback(
    (t: TaskVm) => {
      if (!activeSprint) return false;
      const sid = norm(t.sprintId);
      // giữ logic cũ: sprintId "rác" (không tồn tại) => tính như sprint active
      return sid === activeSprint.id || (!!sid && !validSprintIds.has(sid));
    },
    [activeSprint, validSprintIds],
  );

  const resolveLane = React.useCallback(
    (t: TaskVm): TaskLane => {
      const ui = uiLaneByTaskId[t.id];
      if (ui) return ui;

      const persisted = getPersistedLane(t);
      if (persisted) return persisted;
if (isCloseTrue(t)) return "CLOSE";

      // default nghiệp vụ:
      // - Backlog: task chưa plan sprint (sprintId rỗng)
      // - Close: task thuộc sprint active và có dấu closed (placeholder mở rộng)
      if (!norm(t.sprintId)) return "BACKLOG";
      if (isInActiveSprintScope(t) && detectClosed(t)) return "CLOSE";

      return "WORKFLOW";
    },
    [uiLaneByTaskId, getPersistedLane, isInActiveSprintScope, detectClosed],
  );
  const removeFromUiOrder = (colId: string, taskId: string) => {
    setUiOrderByColId((prev) => {
      const list = prev[colId];
      if (!list?.length) return prev;
      if (!list.includes(taskId)) return prev;
      return { ...prev, [colId]: list.filter((x) => x !== taskId) };
    });
  };

  // ===== resolver: status id hợp lệ theo sprint (id -> code -> category -> first) =====
  function resolveStatusId(t: TaskVm, sp: SprintVm): string {
    if ((sp.statusMeta as any)?.[t.workflowStatusId]) return t.workflowStatusId;
    const code = (t.statusCode || "").toLowerCase();
    const byCode = sp.statusOrder.find(
      (id: string) => ((sp.statusMeta as any)?.[id]?.code || "").toLowerCase() === code,
    );
    if (byCode) return byCode;
    const byCat = sp.statusOrder.find((id: string) => (sp.statusMeta as any)?.[id]?.category === t.statusCategory);
    return byCat || sp.statusOrder[0];
  }
const isEndLike = React.useCallback(
  (t: TaskVm) => {
    if (!activeSprint) return t.statusCategory === "DONE";
    const stId = resolveStatusId(t, activeSprint);
    const meta: any = (activeSprint.statusMeta as any)?.[stId];
    return (
      meta?.isEnd === true ||
      meta?.isFinal === true ||
      meta?.category === "DONE" ||
      t.statusCategory === "DONE"
    );
  },
  [activeSprint],
);

const isCloseTrue = (t: TaskVm) => (t as any).isClose === true;

const openCloseConfirm = React.useCallback(
  (t: TaskVm, destIndex?: number) => {
   if (isCloseTrue(t)) {
      toast.info("Task already close.");
      return;
    }
    const mode: CloseMode = isEndLike(t) ? "CLOSE" : "CANCEL";
    setCloseIntent({ task: t, mode, destIndex });
  },
  [isEndLike],
);
const stageClose = React.useCallback(
  (t: TaskVm, fromColId: string, fromIndex: number, destIndex: number) => {
    if (isCloseTrue(t) || taskPatchById[t.id]?.isClose) {
      toast.info("Task already close.");
      return;
    }

    const mode: CloseMode = isEndLike(t) ? "CLOSE" : "CANCEL";
    setCloseIntent({ task: t, mode, destIndex, fromColId, fromIndex });

    // ✅ stage UI: cho task vào Close lane ngay
    setUiLaneByTaskId((prev) => ({ ...prev, [t.id]: "CLOSE" }));

    setUiOrderByColId((prev) => {
      const existed = [...(prev[VCOL_CLOSE] ?? [])].filter((x) => x !== t.id);
      const idx = Math.max(0, Math.min(destIndex ?? 0, existed.length));
      existed.splice(idx, 0, t.id);
      return { ...prev, [VCOL_CLOSE]: existed };
    });

    // remove khỏi backlog order nếu có
    removeFromUiOrder(VCOL_BACKLOG, t.id);

    setLastCrossMove({ taskId: t.id, toColId: VCOL_CLOSE });
  },
  [isEndLike, isCloseTrue, taskPatchById, removeFromUiOrder],
);

async function confirmClose() {
  if (!closeIntent) return;
  const intent = closeIntent;
  const t = intent.task;

  // ✅ finalize: set isClose=true (persist)
  setTaskPatchById((prev) => ({
    ...prev,
    [t.id]: { ...(prev[t.id] ?? {}), isClose: true },
  }));

  try {
    await patchTaskCloseById(t.id, true, { flashColorHex: "#94A3B8" });
   toast.success(intent.mode === "CLOSE" ? "Task closed." : "Task canceled.");
  } catch (e: any) {
    toast.error(e?.message || "Close failed");

    // rollback: bỏ isClose + trả task về workflow (vì lane CLOSE chỉ là stage)
    setTaskPatchById((prev) => ({
      ...prev,
      [t.id]: { ...(prev[t.id] ?? {}), isClose: false },
    }));

    setUiLaneByTaskId((prev) => {
      const next = { ...prev };
      delete next[t.id];
      return next;
    });
    removeFromUiOrder(VCOL_CLOSE, t.id);
  } finally {
    setCloseIntent(null);
  }
}



  const normalizedStatusOrder = useMemo(() => {
    if (!activeSprint) return [] as string[];

    const raw = activeSprint.statusOrder ?? [];
  const endIds = raw.filter((id: string) => {
  const meta: any = (activeSprint.statusMeta as any)?.[id];
  return meta?.isEnd === true || meta?.isFinal === true || meta?.category === "DONE";
});

    if (!endIds.length) return raw;
    const endSet = new Set(endIds);
    return [...raw.filter((id: string) => !endSet.has(id)), ...endIds];
  }, [activeSprint]);

  const boardOrder = useMemo(() => {
    if (!activeSprint) return [] as string[];
    return [VCOL_BACKLOG, ...normalizedStatusOrder, VCOL_CLOSE];
  }, [activeSprint, normalizedStatusOrder]);

  // ===== Columns động theo sprint đang chọn + search + lanes =====
  const columns: ColumnsMap = useMemo(() => {
    if (!activeSprint) return { order: [] as string[], byId: {} as Record<string, TaskVm[]> };

    const order = boardOrder;
    const byId: Record<string, TaskVm[]> = {};
    for (const colId of order) byId[colId] = [];

    const match = (t: TaskVm) =>
      !keyword ||
      t.title?.toLowerCase().includes(keyword.toLowerCase()) ||
      (t.code ?? "").toLowerCase().includes(keyword.toLowerCase());

    const sortByUiOrder = (colId: string, items: TaskVm[]) => {
      const list = uiOrderByColId[colId];
      if (!list?.length) return items;
      const pos = new Map<string, number>();
      list.forEach((id, i) => pos.set(id, i));
      return [...items].sort((a, b) => {
        const pa = pos.has(a.id) ? (pos.get(a.id) as number) : 1e9;
        const pb = pos.has(b.id) ? (pos.get(b.id) as number) : 1e9;
        return pa - pb;
      });
    };
for (const d of backlogDrafts) {
  if (!match(d)) continue;
  byId[VCOL_BACKLOG].push(d);
}

const dedupe = (arr: TaskVm[]) => {
  const seen = new Set<string>();
  return arr.filter(x => (seen.has(x.id) ? false : (seen.add(x.id), true)));
};
byId[VCOL_BACKLOG] = dedupe(byId[VCOL_BACKLOG]);

   for (const t of visibleTasks) {
  if (!match(t)) continue;

  // ✅ ƯU TIÊN ABSOLUTE: isClose thì luôn vào Close lane
  const patched = taskPatchById[t.id]?.isClose;
if (isCloseTrue(t) || patched === true) {
  byId[VCOL_CLOSE].push(t);
  continue;
}

  const lane = resolveLane(t);

  if (lane === "BACKLOG") { byId[VCOL_BACKLOG].push(t); continue; }
  if (lane === "CLOSE")   { byId[VCOL_CLOSE].push(t);   continue; }

  // WORKFLOW...
  if (!isInActiveSprintScope(t)) continue;
  const stId = resolveStatusId(t, activeSprint);
  byId[stId].push({ ...t, sprintId: activeSprint.id, workflowStatusId: stId });
}


    // apply UI ordering for virtual cols
    byId[VCOL_BACKLOG] = sortByUiOrder(VCOL_BACKLOG, byId[VCOL_BACKLOG] ?? []);
    byId[VCOL_CLOSE] = sortByUiOrder(VCOL_CLOSE, byId[VCOL_CLOSE] ?? []);

    // ✨ ÉP card vừa move cross-column lên đầu cột đích (kể cả lane ảo)
    if (lastCrossMove && byId[lastCrossMove.toColId]) {
      const arr = byId[lastCrossMove.toColId];
      const idx = arr.findIndex((x) => x.id === lastCrossMove.taskId);
      if (idx > 0) {
        const [moved] = arr.splice(idx, 1);
        arr.unshift(moved);
      }
    }

    return { order, byId };
  }, [
    activeSprint,
    boardOrder,
    visibleTasks,
    keyword,
    resolveLane,
    isInActiveSprintScope,
    uiLaneByTaskId,
    uiOrderByColId,
    lastCrossMove,
    taskPatchById,
    backlogDrafts,
  ]);

  // ===== Metrics (scope sprint active; backlog excluded; close included) =====
  const committedPoints = useMemo(() => {
    if (!activeSprint) return 0;
    return visibleTasks
      .filter((t) => isInActiveSprintScope(t))
      .filter((t) => resolveLane(t) !== "BACKLOG")
      .reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);
  }, [activeSprint, visibleTasks, isInActiveSprintScope, resolveLane]);

  const completedPoints = useMemo(() => {
    if (!activeSprint) return 0;
    return visibleTasks
      .filter((t) => isInActiveSprintScope(t))
      .filter((t) => resolveLane(t) !== "BACKLOG")
      .filter((t) => t.statusCategory === "DONE")
      .reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);
  }, [activeSprint, visibleTasks, isInActiveSprintScope, resolveLane]);

  const completionPct = committedPoints > 0 ? Math.round((100 * completedPoints) / committedPoints) : 0;

  const burnupData = useMemo(() => {
    // burn-up chỉ tính scope sprint active (không lấy backlog)
    const scopeTasks = visibleTasks
      .filter((t) => isInActiveSprintScope(t))
      .filter((t) => resolveLane(t) !== "BACKLOG");
    return buildBurnupData(activeSprint, sprints, scopeTasks);
  }, [activeSprint, sprints, visibleTasks, isInActiveSprintScope, resolveLane]);

  const velocityData = useMemo(() => buildVelocityData(sprints, visibleTasks), [sprints, visibleTasks]);

  // ===== Workflow transitions theo sprint (để highlight đích success) =====
  type SprintTransition = {
    id: string;
    fromStatusId: string;
    toStatusId: string;
    type: string; // "success" | "failure" | "optional" | ...
    label?: string | null;
    enforceTransitions?: boolean;
  };

  const activeTransitions: SprintTransition[] = useMemo(() => {
    if (!activeSprint) return [];
    const raw = (activeSprint as any).transitions ?? (activeSprint as any).workflowTransitions ?? [];
    return (raw as any[])
      .map(
        (x: any): SprintTransition => ({
          id: String(x.id ?? `${x.fromStatusId}-${x.toStatusId}`),
          fromStatusId:
            x.fromStatusId ?? x.fromStatus ?? x.sourceStatusId ?? x.sourceId ?? x.from ?? "",
          toStatusId: x.toStatusId ?? x.toStatus ?? x.targetStatusId ?? x.targetId ?? x.to ?? "",
          type: String(x.type ?? x.transitionType ?? "success").toLowerCase(),
          label: x.label ?? null,
          enforceTransitions: !!x.enforceTransitions,
        }),
      )
      .filter((tr) => tr.fromStatusId && tr.toStatusId);
  }, [activeSprint]);

  const [dragPolicy, setDragPolicy] = useState<{ fromStatusId: string; allowed: string[] } | null>(null);
  const [highlightTargets, setHighlightTargets] = useState<Record<string, HighlightInfo>>({});

  // ===== Handlers =====
  function toNextStatusId(t: TaskVm, sp: SprintVm): string | null {
    const idx = sp.statusOrder.indexOf(resolveStatusId(t, sp));
    return sp.statusOrder[Math.min(idx + 1, sp.statusOrder.length - 1)] ?? null;
  }

  function onChangeStatus(t: TaskVm, nextStatusId: string) {
    changeStatus((window as any).__projectId, t, nextStatusId);
  }

  function onMoveToNextSprint(t: TaskVm) {
    const idx = sprints.findIndex((s: SprintVm) => s.id === (t.sprintId ?? activeSprintId));
    const next = sprints[idx + 1];
    if (next) moveToNextSprint((window as any).__projectId, t, next.id);
  }

  function onSplit(t: TaskVm) {
    split((window as any).__projectId, t);
  }

  function onMarkDone(t: TaskVm) {
    done((window as any).__projectId, t);
  }

  function onDragStart(start: DragStart) {
    if (!activeSprint) return;

  const fromColId = start.source?.droppableId;

if (fromColId === VCOL_BACKLOG) {
  if (!startStatusId) {
    setDragPolicy(null);
    setHighlightTargets({});
    return;
  }

  setDragPolicy({ fromStatusId: VCOL_BACKLOG, allowed: [startStatusId] });

  setHighlightTargets({
    [startStatusId]: { kind: "success", labels: ["Start"] },
  });

  return;
}

if (fromColId === VCOL_CLOSE) {
  setDragPolicy(null);
  setHighlightTargets({});
  return;
}


    const task = visibleTasks.find((x) => x.id === start.draggableId);
    
    if (!task) return;

    const fromStatusId = resolveStatusId(task, activeSprint);

    const enforcedNonFailTargets = Array.from(
      new Set(
        activeTransitions
          .filter(
            (tr) =>
              tr.fromStatusId === fromStatusId &&
              tr.enforceTransitions &&
              tr.type !== "failure",
          )
          .map((tr) => tr.toStatusId),
      ),
    );

    const failureTargets = Array.from(
      new Set(
        activeTransitions
          .filter((tr) => tr.fromStatusId === fromStatusId && tr.type === "failure")
          .map((tr) => tr.toStatusId),
      ),
    );

    const allowed = enforcedNonFailTargets.length ? Array.from(new Set([...enforcedNonFailTargets, ...failureTargets])) : [];
    setDragPolicy(enforcedNonFailTargets.length ? { fromStatusId, allowed } : null);

    const next: Record<string, HighlightInfo> = {};
    const priority: Record<HighlightKind, number> = { success: 3, failure: 2, optional: 1 };

    activeTransitions.forEach((tr) => {
      if (tr.fromStatusId !== fromStatusId) return;

      let kind: HighlightKind;
      if (tr.type === "success") kind = "success";
      else if (tr.type === "failure") kind = "failure";
      else kind = "optional";

      const rawLabel = (tr.label || "").trim();
      const label = rawLabel || (kind === "success" ? "Success" : kind === "failure" ? "Rework" : "Optional");

      const prev = next[tr.toStatusId];
      if (!prev) next[tr.toStatusId] = { kind, labels: [label] };
      else {
        const bestKind = priority[kind] > priority[prev.kind] ? kind : prev.kind;
        const labels = prev.labels.includes(label) ? prev.labels : [...prev.labels, label];
        next[tr.toStatusId] = { kind: bestKind, labels };
      }
    });

    setHighlightTargets(next);
  }

  function getErrMsg(err: any) {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
    if (status === 403) return "You are not allowed to move this task from the current status.";
    return msg || "Cannot move task. Please try again.";
  }


  const insertIntoUiOrder = (colId: string, taskId: string, index: number) => {
    setUiOrderByColId((prev) => {
      const list = [...(prev[colId] ?? [])].filter((x) => x !== taskId);
      const idx = Math.max(0, Math.min(index, list.length));
      list.splice(idx, 0, taskId);
      return { ...prev, [colId]: list };
    });
  };

  const reorderUiOrder = (colId: string, fromIndex: number, toIndex: number) => {
    setUiOrderByColId((prev) => {
      const list = [...(prev[colId] ?? [])];
      if (!list.length) return prev;
      const a = Math.max(0, Math.min(fromIndex, list.length - 1));
      const b = Math.max(0, Math.min(toIndex, list.length - 1));
      const [m] = list.splice(a, 1);
      list.splice(b, 0, m);
      return { ...prev, [colId]: list };
    });
  };
function onCloseTask(t: TaskVm) {
  openCloseConfirm(t, 0);
}




  // Optional hook để mở rộng sau (persist lane)
  async function tryPersistLaneChange(task: TaskVm, lane: TaskLane) {
    // Bạn có thể implement trong ProjectBoardContext sau:
    // - setTaskLane(projectId, taskId, lane)
    // - moveToBacklog(projectId, taskId) / closeTask(projectId, taskId)
    const fn =
      board?.setTaskLane ||
      board?.moveTaskToLane ||
      board?.updateTaskLane ||
      null;

    if (typeof fn !== "function") return;

    try {
      await fn((window as any).__projectId, task.id, lane);
    } catch {
      // nếu persist fail, vẫn để UI chạy (fallback)
    }
  }

  async function onDragEnd(result: DropResult) {
    setHighlightTargets({});
    setDragPolicy(null);

    const { source, destination, draggableId } = result;
    if (!destination || !activeSprint) return;

    const fromColId = source.droppableId;
    const toColId = destination.droppableId;

    if (fromColId === toColId && source.index === destination.index) return;
if (toColId === VCOL_BACKLOG && fromColId !== VCOL_BACKLOG) {
toast.info("Backlog is view-only. You can't drop tasks into it.");
  return; 
}

if (fromColId === VCOL_CLOSE) {
  toast.info("Tasks in Close cannot be dragged.");
  return;
}

if (fromColId === VCOL_BACKLOG) {
  const draft = backlogDrafts.find((x) => x.id === draggableId);
  if (draft) {
    if (!startStatusId) {
      toast.error("This sprint has no Start status.");
      return;
    }

    if (toColId !== startStatusId) {
      toast.info("You can only move items from Backlog to the Start column.");
      return;
    }

    // optimistic: bỏ draft khỏi list (đỡ nhìn duplicate)
    setBacklogDrafts((prev) => prev.filter((x) => x.id !== draggableId));

    try {
  const draftComponentId =
  (draft as any)?.componentId ??
  (draft as any)?.component?.id ??
  null;

await materializeDraftTask(draggableId, {
  sprintId: activeSprint.id,
  workflowStatusId: startStatusId,
  ...(draftComponentId ? { componentId: draftComponentId } : {}),
});


      toast.success("Moved backlog item to Start.");
      await reloadBacklogDrafts();

      // nếu context có hàm reload thì gọi luôn (không có thì thôi)
      const rb = board?.reloadBoard || board?.reload;
      if (typeof rb === "function") await rb();
    } catch (err: any) {
      toast.error(getErrMsg(err));
      await reloadBacklogDrafts(); // rollback bằng reload
    }

    return; 
  }
}

    const task = visibleTasks.find((x) => x.id === draggableId);
    if (!task) return;
if (toColId === VCOL_CLOSE && fromColId !== VCOL_CLOSE) {
  stageClose(task, fromColId, source.index, destination.index);
  return;
}
    const projectId = (window as any).__projectId;

    // ===== 1) MOVE/TRẢI TRONG LANE ẢO (UI-only) =====
    if (isVirtualCol(toColId)) {
      const lane = colToLane(toColId);

      // update lane map
      setUiLaneByTaskId((prev) => ({ ...prev, [task.id]: lane }));

      // update ui order: remove from both virtual lists then insert into dest
      removeFromUiOrder(VCOL_BACKLOG, task.id);
      removeFromUiOrder(VCOL_CLOSE, task.id);

      if (fromColId === toColId && isVirtualCol(fromColId)) {
        // reorder inside same virtual lane
        // ensure list exists; if not, create by current columns order
        if (!(uiOrderByColId[toColId]?.length)) {
          const ids = (columns.byId[toColId] ?? []).map((x) => x.id);
          setUiOrderByColId((prev) => ({ ...prev, [toColId]: ids }));
        }
        reorderUiOrder(toColId, source.index, destination.index);
      } else {
        insertIntoUiOrder(toColId, task.id, destination.index);
      }

      // optional persist hook (để hở đường)
      await tryPersistLaneChange(task, lane);

      setLastCrossMove({ taskId: task.id, toColId });
      return;
    }

    // ===== 2) KÉO RA KHỎI LANE ẢO -> WORKFLOW =====
    if (isVirtualCol(fromColId)) {
      setUiLaneByTaskId((prev) => {
        if (!prev[task.id]) return prev;
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      removeFromUiOrder(VCOL_BACKLOG, task.id);
      removeFromUiOrder(VCOL_CLOSE, task.id);
    }
if (fromColId === VCOL_CLOSE && !isVirtualCol(toColId)) {
  setTaskPatchById((prev) => ({
    ...prev,
    [task.id]: { ...(prev[task.id] ?? {}), isClose: false },
  }));
  removeFromUiOrder(VCOL_CLOSE, task.id);
}
// Nếu kéo từ Close lane ra status workflow => reopen trước (để tránh BE chặn move khi IsClose=true)
if (fromColId === VCOL_CLOSE && !isVirtualCol(toColId)) {
  // optimistic
  setTaskPatchById((prev) => ({
    ...prev,
    [task.id]: { ...(prev[task.id] ?? {}), isClose: false },
  }));

  try {
    await patchTaskCloseById(task.id, false, { flashColorHex: "#2E8BFF" }); // ✅ reopen
  } catch (e: any) {
    toast.error(e?.message || "Reopen failed");

    // rollback: giữ ở close
    setTaskPatchById((prev) => ({
      ...prev,
      [task.id]: { ...(prev[task.id] ?? {}), isClose: true },
    }));
    setUiLaneByTaskId((prev) => ({ ...prev, [task.id]: "CLOSE" }));
    return; // chặn move status
  }
}

    // ===== 3) WORKFLOW -> WORKFLOW (PERSIST) =====
    const isSameColumn = fromColId === toColId;

    if (!isSameColumn && dragPolicy && dragPolicy.fromStatusId === fromColId) {
      if (!dragPolicy.allowed.includes(toColId)) {
        toast.info("Workflow does not allow moving to this status.");
        return;
      }
    }

    try {
      if (isSameColumn) {
        await reorder(projectId, activeSprint.id, task, toColId, destination.index);
        setLastCrossMove(null);
        return;
      }

      await reorder(
        projectId,
        activeSprint.id,
        { ...task, workflowStatusId: toColId, sprintId: activeSprint.id },
        toColId,
        0, // cross-column: đưa lên đầu
      );

      setLastCrossMove({ taskId: task.id, toColId });
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  }

  // Close sprint (demo)
  function closeSprint() {
    if (!activeSprint) return;

    const currentTasks = visibleTasks.filter((t) => isInActiveSprintScope(t));
    const committed = currentTasks
      .filter((t) => resolveLane(t) !== "BACKLOG")
      .reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);

    const completed = currentTasks
      .filter((t) => resolveLane(t) !== "BACKLOG")
      .filter((t) => t.statusCategory === "DONE")
      .reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);

    const idx = sprints.findIndex((s: SprintVm) => s.id === activeSprint.id);
    const next = sprints[idx + 1];

    if (next) {
      for (const t of currentTasks) {
        if (t.statusCategory !== "DONE") moveToNextSprint((window as any).__projectId, t, next.id);
      }
      setActiveSprintId(next.id);
    }

    setSnapshots((p) => [...p, { name: activeSprint.name, committed, completed }]);
    setClosePanelOpen(false);
  }

  /* ===== Header ===== */
  const Header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="text-2xl font-semibold">Sprint</div>
        <div className="mt-1 text-xs text-slate-600 flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
            Current sprint: {currentSprint?.name ?? "N/A"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-9 pl-9 pr-3 rounded-full border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            placeholder="Search tasks"
          />
        </div>

        <button
          onClick={() => setView("Board")}
          className={cn(
            "px-3 h-9 rounded-full border text-sm flex items-center gap-1",
            view === "Board"
              ? "bg-blue-600 text-white border-blue-600"
              : "border-slate-300 text-slate-700 hover:bg-slate-50",
          )}
        >
          <KanbanSquare className="w-4 h-4" /> Board
        </button>

        <button
          onClick={() => setView("Analytics")}
          className={cn(
            "px-3 h-9 rounded-full border text-sm flex items-center gap-1",
            view === "Analytics"
              ? "bg-blue-600 text-white border-blue-600"
              : "border-slate-300 text-slate-700 hover:bg-slate-50",
          )}
        >
          <TrendingUp className="w-4 h-4" /> Analytics
        </button>
      </div>
    </div>
  );

  /* ===== Sprint tabs ===== */
  const SprintTabs = (
    <div className="flex flex-wrap gap-2">
      {sprints.map((s: SprintVm) => {
        const selected = s.id === activeSprintId;
        return (
          <button
            key={s.id}
            onClick={() => setActiveSprintId(s.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm border flex items-center gap-2 transition-colors",
              selected
                ? "bg-blue-600 text-white border-blue-600"
                : "border-slate-300 text-slate-700 hover:bg-slate-50",
            )}
            title={`${fmtDate(s.start)} - ${fmtDate(s.end)}`}
          >
            <span className={cn("font-semibold", selected && "text-white")}>{s.name}</span>
            <span className={cn("ml-2 text-xs", selected ? "text-blue-100/90" : "text-slate-500")}>
              {fmtDate(s.start)} - {fmtDate(s.end)}
            </span>
          </button>
        );
      })}
    </div>
  );

  /* ===== Summary + Burn-up ===== */
  function MetricCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
    return (
      <div className="rounded-xl border border-slate-200 p-4 bg-white">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      </div>
    );
  }

  function BurnUpCard({
    sprint,
    data,
  }: {
    sprint: SprintVm | null;
    data: Array<{ date: string; scope: number; completed: number; ideal: number }>;
  }) {
    const hasData = sprint && data.length > 0;
    const totalScope = hasData ? data[data.length - 1].scope : 0;
    const totalCompleted = hasData ? data[data.length - 1].completed : 0;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[15px] font-semibold">Burn-up – {sprint?.name ?? "Sprint"}</div>
            <div className="text-[11px] text-slate-500">Scope vs completed story points over days</div>
          </div>
          {hasData && (
            <div className="text-right text-[11px] text-slate-500">
              <div>
                Scope: <span className="font-semibold">{totalScope}</span> pts
              </div>
              <div>
                Done: <span className="font-semibold">{totalCompleted}</span> pts
              </div>
            </div>
          )}
        </div>

        <div className="h-[230px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gScope" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#93C5FD" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#86EFAC" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#86EFAC" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value, key) => {
                    if (key === "scope") return [value, "Scope"];
                    if (key === "completed") return [value, "Completed"];
                    if (key === "ideal") return [value, "Ideal"];
                    return [value, key];
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="scope" name="Scope" stroke="#60A5FA" fill="url(#gScope)" />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 3 }}
                />
                <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#9CA3AF" strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Not enough story points data to build burn-up.
            </div>
          )}
        </div>
      </div>
    );
  }

  const SummaryAndChart = (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[15px] font-semibold">{activeSprint?.name ?? "Sprint"}</div>
        <div className="text-xs text-slate-500">
          {fmtDate(activeSprint?.start)} – {fmtDate(activeSprint?.end)}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <MetricCard label="Committed pts" value={committedPoints} />
          <MetricCard label="Done pts" value={completedPoints} />
          <MetricCard
            label="Completion"
            value={
              <div className="flex items-center gap-3">
                <span className="font-semibold">{completionPct}%</span>
                <div className="h-1.5 w-24 bg-slate-100 rounded-full">
                  <div className="h-1.5 rounded-full" style={{ width: `${completionPct}%`, background: brand }} />
                </div>
              </div>
            }
          />
        </div>
      </div>

      <BurnUpCard sprint={activeSprint} data={burnupData} />
    </div>
  );

  /* ===== Roadmap (nhẹ) ===== */
  function Roadmap() {
    const sprintIds = sprints.map((s: SprintVm) => s.id);
    const byTypeBySprint: Record<string, Record<string, number>> = {};
    tasks.forEach((t: TaskVm) => {
      if (!t.sprintId) return;
      const type = t.type || "Task";
      byTypeBySprint[type] ||= {};
      byTypeBySprint[type][t.sprintId] = (byTypeBySprint[type][t.sprintId] || 0) + Math.max(0, t.storyPoints || 0);
    });
    const types = Object.keys(byTypeBySprint).length ? Object.keys(byTypeBySprint) : ["Feature", "Bug", "Chore"];
    const rowMax = (type: string) => Math.max(1, ...sprintIds.map((id) => byTypeBySprint[type]?.[id] || 0));

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-semibold">Roadmap by Sprint</div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: `220px repeat(${sprintIds.length}, minmax(120px,1fr))` }}>
          <div className="text-xs text-slate-500 px-2 py-1">Epic / Type</div>
          {sprints.map((s: SprintVm) => (
            <div key={s.id} className="text-xs text-slate-500 px-2 py-1 truncate">
              {s.name}
            </div>
          ))}

          {types.map((type) => (
            <React.Fragment key={type}>
              <div className="px-2 py-2 border-t text-sm font-medium">{type}</div>
              {sprintIds.map((sid) => {
                const pts = byTypeBySprint[type]?.[sid] || 0;
                const pct = Math.round((pts / rowMax(type)) * 100);
                return (
                  <div key={sid} className="px-2 py-2 border-t">
                    <div className="h-2 w-full rounded bg-slate-100">
                      <div className="h-2 rounded" style={{ width: `${pct}%`, background: pct ? brand : "#e5e7eb" }} />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">{pts} pts</div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  /* ===== Render ===== */
  return (
    <div className="p-6 space-y-4">
      {Header}
      {SprintTabs}
      {SummaryAndChart}

      {view === "Board" && (
        <>
          <SprintBoard
            activeSprint={activeSprint}
            columns={columns}
            highlightTargets={highlightTargets}
            flashTaskId={flashTaskId}
            setFlashTaskId={setFlashTaskId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMarkDone={onMarkDone}
            onSplit={onSplit}
            onMoveToNextSprint={onMoveToNextSprint}
            onChangeStatus={onChangeStatus}
            toNextStatusId={toNextStatusId}
            onOpenTicket={handleOpenTicket}
            dragPolicy={dragPolicy}
            onCloseTask={onCloseTask}
              onReloadBacklog={reloadBacklogDrafts}
  onBacklogCreatedVM={(vm) => {
    setBacklogDrafts((prev) => [vm, ...prev]);
  }}
 maintenanceEnabled={isMaintenanceProject}
components={maintenanceComponents}
defaultComponentId={maintenanceDefaultComponentId}

          />
        </>
      )}

      {view === "Analytics" && (
        <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-600 text-sm">Velocity (per sprint)</div>
              {velocityData.length > 0 && (
                <div className="text-[11px] text-slate-500">
                  Avg done:&nbsp;
                  <span className="font-semibold">
                    {Math.round(
                      velocityData.reduce((s, d) => s + (d.completed || 0), 0) / Math.max(1, velocityData.length),
                    )}
                  </span>{" "}
                  pts / sprint
                </div>
              )}
            </div>

            <div className="h-[260px]">
              {velocityData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value, key) => {
                        if (key === "committed") return [value, "Committed"];
                        if (key === "completed") return [value, "Completed"];
                        return [value, key];
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="committed" name="Committed" stroke="#60A5FA" dot />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke="#22C55E" dot />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  No story points data across sprints yet.
                </div>
              )}
            </div>
          </div>

          <SprintKpiTable className="min-w-0" sprints={sprints} tasks={tasks} />
        </div>
      )}

      {view === "Roadmap" && <Roadmap />}

      {closePanelOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-end md:items-center justify-center p-4 z-50">
          <div className="bg-white w-full md:max-w-2xl rounded-2xl p-4 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Close sprint – {activeSprint?.name ?? "..."}</div>
              <button className="text-slate-500" onClick={() => setClosePanelOpen(false)}>
                x
              </button>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              All unfinished tasks will be moved to the next sprint (spillover). A snapshot will be stored for velocity
              analytics.
            </div>

            <div className="mt-4 bg-slate-50 rounded-xl p-3 max-h-56 overflow-auto">
              {visibleTasks
                .filter((t) => (t.sprintId ?? "") === activeSprintId)
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-1.5">
                    <div className="truncate">{t.title}</div>
                    <div className="text-xs text-slate-500">{Math.max(0, t.storyPoints || 0)} pts</div>
                  </div>
                ))}

              {visibleTasks.filter((t) => (t.sprintId ?? "") === activeSprintId).length === 0 && (
                <div className="text-sm text-slate-500">Everything is done</div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="px-3 py-1.5 rounded-xl border text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setClosePanelOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded-xl border text-sm bg-blue-600 text-white"
                onClick={closeSprint}
              >
                Close sprint
              </button>
            </div>
          </div>
        </div>
        
      )}
      {closeIntent && (
  <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-4">
    <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="text-[15px] font-semibold">
          {closeIntent.mode === "CLOSE" ? "Close task" : "Cancel task"}
        </div>
        <div className="mt-1 text-[12px] text-slate-600 line-clamp-2">
          {closeIntent.task.code} — {closeIntent.task.title}
        </div>
      </div>

     <div className="p-4 text-sm text-slate-700">
  {closeIntent.mode === "CLOSE" ? (
    <div>Are you sure you want to <b>close</b> this task?</div>
  ) : (
    <div>
      This task is <b>not completed</b>. Do you want to <b>cancel</b> it?
    </div>
  )}
 
</div>


      <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2">
        <button
          className="px-3 py-1.5 rounded-xl border text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => {
  const intent = closeIntent;
  const t = intent.task;

  // nếu chưa confirm (chưa set isClose=true) thì rollback stage UI
  if (!taskPatchById[t.id]?.isClose && !isCloseTrue(t)) {
    setUiLaneByTaskId((prev) => {
      const next = { ...prev };
      delete next[t.id];
      return next;
    });
    removeFromUiOrder(VCOL_CLOSE, t.id);
  }

  setCloseIntent(null);
}}

        >
          No
        </button>
        <button
          className={cn(
            "px-3 py-1.5 rounded-xl text-sm text-white",
            closeIntent.mode === "CLOSE" ? "bg-slate-700 hover:bg-slate-800" : "bg-rose-600 hover:bg-rose-700",
          )}
          onClick={confirmClose}
        >
          Yes, confirm
        </button>
      </div>
    </div>
  </div>
)}

    </div>
    
  );
}
