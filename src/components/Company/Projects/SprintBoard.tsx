// FUSION — Sprint page (Board / Analytics / Roadmap). Tailwind-only.
// Dữ liệu & thao tác lấy từ ProjectBoardContext (workflow động).

import React, { useEffect, useMemo, useState } from "react";
import { useProjectBoard } from "@/context/ProjectBoardContext";
import {
  KanbanSquare, CalendarDays, CircleSlash2, TrendingUp, Search,
} from "lucide-react";
import {
  DragDropContext, Droppable, Draggable, type DropResult,  type DragStart, 
} from "@hello-pangea/dnd";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, AreaChart, Area,
} from "recharts";
import TaskCard from "@/components/Company/Projects/TaskCard";
import type { SprintVm, TaskVm } from "@/types/projectBoard";
import ColumnHoverCreate from "../Task/ColumnHoverCreate";
import {  useNavigate, useParams } from "react-router-dom";
import { Can, usePermissions } from "@/permission/PermissionProvider";
import SprintKpiTable from "./SprintKpiTable";
import { getUserIdFromToken } from "@/utils/token";

type Id = string;
const userId = getUserIdFromToken();
const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "N/A");
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
      !validSprintIds.has(t.sprintId ?? ""),
  );
  if (!sprintTasks.length) return [];

  const clampIndex = (idx: number) => Math.max(0, Math.min(totalDays - 1, idx));

  const dailyScopeAdd = new Array<number>(totalDays).fill(0);
  const dailyCompletedAdd = new Array<number>(totalDays).fill(0);

  const getAnchorDate = (t: TaskVm): string | null =>
    (t.openedAt as any) ||
    (t.createdAt as any) ||
    (t.dueDate as any) ||
    startIso;

  const getDoneDate = (t: TaskVm): string | null => {
    if (t.statusCategory !== "DONE") return null;
    return (
      (t.updatedAt as any) ||
      (t.dueDate as any) ||
      endIso
    );
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
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const ideal =
      totalScope && totalDays > 1
        ? Math.round((totalScope * i) / (totalDays - 1))
        : totalScope;

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
    byId.set(s.id, {
      id: s.id,
      name: s.name,
      startMs,
      committed: 0,
      completed: 0,
    });
  }

  for (const t of tasks) {
    const sid = t.sprintId ?? "";
    const rec = byId.get(sid);
    if (!rec) continue;
    const pts = taskPoints(t);
    rec.committed += pts;
    if (t.statusCategory === "DONE") {
      rec.completed += pts;
    }
  }

  return Array.from(byId.values())
    .filter((x) => x.committed > 0 || x.completed > 0)
    .sort((a, b) => a.startMs - b.startMs)
    .map((x) => ({
      name: x.name,
      committed: x.committed,
      completed: x.completed,
    }));
}

// work-mix: storyPoints theo type cho từng sprint
function buildWorkMixData(
  sprints: SprintVm[],
  tasks: TaskVm[],
): Array<{ name: string; Feature: number; Bug: number; Chore: number; Other: number }> {
  if (!sprints.length) return [];

  const byId = new Map<
    string,
    { id: string; name: string; startMs: number; Feature: number; Bug: number; Chore: number; Other: number }
  >();

  for (const s of sprints) {
    const startMs = s.start ? new Date(s.start).getTime() : 0;
    byId.set(s.id, {
      id: s.id,
      name: s.name,
      startMs,
      Feature: 0,
      Bug: 0,
      Chore: 0,
      Other: 0,
    });
  }

  for (const t of tasks) {
    const sid = t.sprintId ?? "";
    const rec = byId.get(sid);
    if (!rec) continue;

    const pts = taskPoints(t);
    if (!pts) continue;

    const rawType = (t.type || "Task").toLowerCase();
    let bucket: keyof typeof rec = "Other";
    if (rawType.includes("feature")) bucket = "Feature";
    else if (rawType.includes("bug")) bucket = "Bug";
    else if (rawType.includes("chore") || rawType.includes("task")) bucket = "Chore";

    rec[bucket] += pts;
  }

  return Array.from(byId.values())
    .filter((x) => x.Feature || x.Bug || x.Chore || x.Other)
    .sort((a, b) => a.startMs - b.startMs)
    .map((x) => ({
      name: x.name,
      Feature: x.Feature,
      Bug: x.Bug,
      Chore: x.Chore,
      Other: x.Other,
    }));
}

/* ===== helpers màu từ API ===== */
function hexToRgba(hex?: string, a = 1) {
  if (!hex) return `rgba(148,163,184,${a})`; // slate-400 fallback
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return `rgba(148,163,184,${a})`;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${a})`;
}
function isDark(hex?: string) {
  if (!hex) return false;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return false;
  const r = parseInt(m[1], 16)/255, g = parseInt(m[2], 16)/255, b = parseInt(m[3], 16)/255;
  const L = 0.2126*r + 0.7152*g + 0.0722*b;
  return L < 0.5;
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
}: {
  title: string;
  tone: "amber" | "blue" | "purple" | "green";
  colorHex?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  highlightType?: "success" | "optional" | "failure";
  labels?: string[];
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

  // 🌟 Glow màu + ring khi highlight
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
        // 🟩 Base shadow dày hơn – luôn có khung nổi
        "border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.12)]",
        glowClass,
      )}
      style={{
        willChange: isHighlighted ? "transform, box-shadow" : undefined,
      }}
    >
      {/* top stripe */}
      <div
        className="h-2 w-full"
        style={{
          backgroundColor: accent,
          opacity: isHighlighted ? 0.95 : 0.8,
        }}
      />

      {/* header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <span
          className="inline-flex items-center text-[12px] font-semibold px-2 py-0.5 rounded-full border"
          style={{
            background: labelBg,
            borderColor: labelBd,
            color: labelTx,
          }}
        >
          {title}
        </span>
        {right}
      </div>

      {/* nhãn dán transition */}
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

      {/* body */}
      <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
}





type ColumnsMap = {
  order: string[];
  byId: Record<string, TaskVm[]>;
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
  dragPolicy,
}: SprintBoardProps) {


  if (!activeSprint) return null;

  const COL_W =
    "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";
  const BOARD_H = `calc(100vh - 260px)`;
  const tones: Array<"amber" | "blue" | "purple" | "green"> = [
    "amber",
    "blue",
    "purple",
    "green",
  ];

const renderCol = (statusId: string, idx: number) => {
  const items = columns.byId[statusId] ?? [];
  const meta = activeSprint.statusMeta[statusId];
  const tone = tones[idx % 4];
  const wip = meta?.wipLimit ?? 9999;
  const over = items.length > wip;

  const highlight = highlightTargets[statusId]; // HighlightInfo | undefined
  const targetType = highlight?.kind;           // "success" | "optional" | "failure" | undefined
  const targetLabels = highlight?.labels ?? [];
const dimmed =
    !!dragPolicy &&
    statusId !== dragPolicy.fromStatusId && // cột nguồn luôn được
    !dragPolicy.allowed.includes(statusId); 
  return (
    <div
      key={statusId}
      className={`shrink-0 h-full ${COL_W} relative group`}
    >
      <BoardColumnShell
        title={meta?.name ?? meta?.code ?? statusId}
        tone={tone}
        colorHex={meta?.color}
        highlightType={targetType}
        labels={targetLabels}
        right={
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-slate-500">{items.length} tasks</span>
            {wip !== 9999 && (
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
      <Droppable droppableId={statusId} type="task" isDropDisabled={dimmed}>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      className={cn(
        "relative h-full overflow-y-auto overscroll-contain pr-1",
        snapshot.isDraggingOver && "bg-slate-50 rounded-xl",
        dimmed && "opacity-40 grayscale", //  dim UI
      )}
      style={{ scrollbarWidth: "thin" }}
    >
      {dimmed && (
        <div className="absolute inset-0 bg-slate-200/25 pointer-events-none rounded-xl" />
      )}

              <Can code='TASK_CREATE'>
              <ColumnHoverCreate
                sprint={activeSprint}
                statusId={statusId}
                onCreatedVM={(vm) => {
                  setFlashTaskId(vm.id);
                }}
              />
</Can>
              <div className="space-y-4">
                {items.map((t, index) => {
                  const siblings = t.sourceTicketId
                    ? items.filter(
                        (x) =>
                          x.id !== t.id &&
                          x.sourceTicketId === t.sourceTicketId,
                      ).length
                    : 0;

                  return (
                    <Draggable
                      key={t.id}
                      draggableId={t.id}
                      index={index}
                    >
                      {(drag, snap) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                          className={snap.isDragging ? "rotate-[0.5deg]" : ""}
                        >
                          <TaskCard
                            t={t}
                            ticketSiblingsCount={siblings}
                            onMarkDone={onMarkDone}
                            isNew={t.id === flashTaskId}
                            onNext={(x) => {
                              const nextId = toNextStatusId(x, activeSprint);
                              if (nextId && nextId !== x.workflowStatusId) {
                                onChangeStatus(x, nextId);
                              }
                            }}
                            onSplit={onSplit}
                            onMoveNext={onMoveToNextSprint}
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
        <div
          className="overflow-x-auto rounded-xl w-full"
          style={{ height: BOARD_H, overflowY: "hidden" }}
        >
          <div className="inline-flex gap-4 h-full min-w-max pr-6 pb-5">
            {columns.order.map((statusId, i) => renderCol(statusId, i))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

type HighlightKind = "success" | "optional" | "failure";

type HighlightInfo = {
  kind: HighlightKind;
  labels: string[];
};

/* ========= Page ========= */
export default function SprintWorkspacePage() {
   

  // ===== từ context =====
  const {
    sprints, tasks, changeStatus, moveToNextSprint, split, done, reorder,
  } = useProjectBoard();
   // ===== Realtime clock =====
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // update mỗi 30s cho “realtime” (nhẹ hơn mỗi giây)
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

    // 1) sprint đang diễn ra
    const running = sprints.find((s) => isInRange(now, s.start, s.end));
    if (running) return running;

    // 2) nếu không có sprint đang chạy -> lấy sprint sắp tới gần nhất (start > now)
    const upcoming = sprints
      .filter((s) => {
        const sMs = toMs(s.start);
        return !Number.isNaN(sMs) && sMs > now.getTime();
      })
      .sort((a, b) => toMs(a.start) - toMs(b.start))[0];

    if (upcoming) return upcoming;

    // 3) nếu cũng không có upcoming -> lấy sprint gần nhất đã qua (end < now)
    const latestPast = sprints
      .filter((s) => {
        const eMs = toMs(s.end);
        return !Number.isNaN(eMs) && eMs < now.getTime();
      })
      .sort((a, b) => toMs(b.end) - toMs(a.end))[0];

    return latestPast ?? sprints[0];
  }, [sprints, now]);

  const currentSprintId = currentSprint?.id ?? "";
  const { can } = usePermissions();

  // ✅ permission mới
  const canViewAllSprintTasks = can("SPRINT_TASK_VIEW_ALL");

  const myUserId =userId;

  const isAssignedToMe = React.useCallback(
    (t: TaskVm) => {
      if (!myUserId) return true;

      const anyT: any = t as any;
      if (anyT.assigneeId && anyT.assigneeId === myUserId) return true;
      if (anyT.assignedToId && anyT.assignedToId === myUserId) return true;

      if (anyT.assignee?.id && anyT.assignee.id === myUserId) return true;

      const arr =
        anyT.assignees ||
        anyT.assignedMembers ||
        anyT.members ||
        anyT.assignments ||
        [];

      if (Array.isArray(arr)) {
        return arr.some((x: any) => (x?.id ?? x?.userId) === myUserId);
      }

      return false;
    },
    [myUserId],
  );

  // ✅ tasks hiển thị theo permission
  const visibleTasks = React.useMemo(() => {
    if (canViewAllSprintTasks) return tasks;
    return tasks.filter(isAssignedToMe);
  }, [tasks, canViewAllSprintTasks, isAssignedToMe]);

const [flashTaskId, setFlashTaskId] = useState<Id | null>(null);
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();

  const handleOpenTicket = React.useCallback(
    (taskId: string) => {
console.log(taskId)     

      if (!companyId || !projectId) return; // phòng trường hợp chưa có params
 navigate(`/companies/${companyId}/project/${projectId}/task/${taskId}`);
    },
    [navigate, companyId, projectId]
  );
useEffect(() => {
  if (!flashTaskId) return;
  const timer = setTimeout(() => setFlashTaskId(null), 800); // 0.8s
  return () => clearTimeout(timer);
}, [flashTaskId]);
  // ===== UI State =====
  const [activeSprintId, setActiveSprintId] = useState<Id>("");
  const [view, setView] = useState<"Board" | "Analytics" | "Roadmap">("Board");
  const [closePanelOpen, setClosePanelOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [snapshots, setSnapshots] = useState<{ name: string; committed: number; completed: number }[]>([]);
const [lastCrossMove, setLastCrossMove] = useState<{
  taskId: string;
  toStatusId: string;
} | null>(null);
  // set sprint mặc định khi có dữ liệu
  
  useEffect(() => {
    if (!sprints.length) return;

    // nếu chưa chọn sprint => auto chọn current sprint
    if (!activeSprintId) {
      setActiveSprintId(currentSprintId || sprints[0].id);
      return;
    }

    // nếu sprint đang chọn không còn tồn tại => fallback về current sprint
    const stillExists = sprints.some((s) => s.id === activeSprintId);
    if (!stillExists) {
      setActiveSprintId(currentSprintId || sprints[0].id);
    }
  }, [sprints, activeSprintId, currentSprintId]);


  const activeSprint: SprintVm | null = useMemo(
    () => sprints.find((s) => s.id === activeSprintId) ?? null,
    [sprints, activeSprintId]
  );

  /* ===== resolver: status id hợp lệ theo sprint (id -> code -> category -> first) ===== */
  function resolveStatusId(t: TaskVm, sp: SprintVm): string {
    if (sp.statusMeta[t.workflowStatusId]) return t.workflowStatusId;
    const code = (t.statusCode || "").toLowerCase();
    const byCode = sp.statusOrder.find(id => (sp.statusMeta[id].code || "").toLowerCase() === code);
    if (byCode) return byCode;
    const byCat  = sp.statusOrder.find(id => sp.statusMeta[id].category === t.statusCategory);
    return byCat || sp.statusOrder[0];
  }
const normalizedStatusOrder = useMemo(() => {
  if (!activeSprint) return [] as string[];

  const raw = activeSprint.statusOrder ?? [];
  const endIds = raw.filter((id) => {
    const meta: any = activeSprint.statusMeta?.[id];
    return meta?.isEnd === true || meta?.category === "DONE";
  });

  if (!endIds.length) return raw;

  const endSet = new Set(endIds);
  return [...raw.filter((id) => !endSet.has(id)), ...endIds];
}, [activeSprint]);

  // ===== Columns động theo sprint đang chọn + search =====
const columns = useMemo(() => {
  if (!activeSprint) return { order: [] as string[], byId: {} as Record<string, TaskVm[]> };
  const order = normalizedStatusOrder;

  const byId: Record<string, TaskVm[]> = {};
  const match = (t: TaskVm) =>
    !keyword ||
    t.title?.toLowerCase().includes(keyword.toLowerCase()) ||
    (t.code ?? "").toLowerCase().includes(keyword.toLowerCase());

  for (const stId of order) byId[stId] = [];

  const validSprintIds = new Set(sprints.map(s => s.id));

  for (const t of visibleTasks) {
    const belongToActive =
      (t.sprintId ?? "") === activeSprint.id ||
      !validSprintIds.has(t.sprintId ?? "");

    if (!belongToActive) continue;
    if (!match(t)) continue;

    const stId = resolveStatusId(t, activeSprint);
    if (!byId[stId]) byId[stId] = [];
    byId[stId].push({ ...t, sprintId: activeSprint.id, workflowStatusId: stId });
  }

  // ✨ ÉP card vừa move cross-column lên đầu cột đích
  if (lastCrossMove && byId[lastCrossMove.toStatusId]) {
    const arr = byId[lastCrossMove.toStatusId];
    const idx = arr.findIndex((x) => x.id === lastCrossMove.taskId);
    if (idx > 0) {
      const [moved] = arr.splice(idx, 1);
      arr.unshift(moved);
    }
  }

  return { order, byId };
}, [visibleTasks, activeSprint, keyword, sprints, lastCrossMove]);


  // ===== Metrics =====
  const committedPoints = useMemo(() => {
    if (!activeSprint) return 0;
    const validSprintIds = new Set(sprints.map(s => s.id));
    return tasks
      .filter((t) =>
        (t.sprintId ?? "") === activeSprint.id ||
        !validSprintIds.has(t.sprintId ?? "")
      )
      .reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);
  }, [visibleTasks, activeSprint, sprints]);

  const completedPoints = useMemo(() => {
    if (!activeSprint) return 0;
    const validSprintIds = new Set(sprints.map(s => s.id));
    return tasks
      .filter((t) =>
        ((t.sprintId ?? "") === activeSprint.id ||
         !validSprintIds.has(t.sprintId ?? "")) &&
        t.statusCategory === "DONE"
      )
      .reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);
  }, [tasks, activeSprint, sprints]);

  const completionPct = committedPoints > 0 ? Math.round((100 * completedPoints) / committedPoints) : 0;
 const burnupData = useMemo(
    () => buildBurnupData(activeSprint, sprints, visibleTasks),
    [activeSprint, sprints, tasks],
  );

  const velocityData = useMemo(
    () => buildVelocityData(sprints, visibleTasks),
    [sprints, tasks],
  );

  const workMixData = useMemo(
    () => buildWorkMixData(sprints, visibleTasks),
    [sprints, tasks],
  );
    // ===== Workflow transitions theo sprint (để highlight đích success) =====
  type SprintTransition = {
    id: string;
    fromStatusId: string;
    toStatusId: string;
    type: string; // "success" | "failure" | "optional" | ...
    label?: string | null;
    enforceTransitions?: boolean;
  };

  // Lấy transitions từ sprint đang active
  const activeTransitions: SprintTransition[] = useMemo(() => {
  if (!activeSprint) return [];

  const raw =
    (activeSprint as any).transitions ??
    (activeSprint as any).workflowTransitions ??
    [];

  return (raw as any[])
    .map(
      (x: any): SprintTransition => ({
        id: String(x.id ?? `${x.fromStatusId}-${x.toStatusId}`),
        fromStatusId:
          x.fromStatusId ??
          x.fromStatus ??
          x.sourceStatusId ??
          x.sourceId ??
          x.from ??
          "",
        toStatusId:
          x.toStatusId ??
          x.toStatus ??
          x.targetStatusId ??
          x.targetId ??
          x.to ??
          "",
        type: String(x.type ?? x.transitionType ?? "success").toLowerCase(),
        label: x.label ?? null, // ⬅ lấy label "Go", "Complete", "Rework"
        enforceTransitions: !!x.enforceTransitions,
      }),
    )
    .filter((tr) => tr.fromStatusId && tr.toStatusId);
}, [activeSprint]);

const [dragPolicy, setDragPolicy] = useState<{
  fromStatusId: string;
  allowed: string[];
} | null>(null);

  // Map: fromStatusId -> list các toStatusId được phép move tới
  const allowedTargetsByFromId = useMemo(() => {
    const map = new Map<string, string[]>();

    activeTransitions
      .filter((tr) => tr.type === "success" || tr.type === "optional")
      .forEach((tr) => {
        const list = map.get(tr.fromStatusId) ?? [];
        list.push(tr.toStatusId);
        map.set(tr.fromStatusId, list);
      });

    return map;
  }, [activeTransitions]);

const [highlightTargets, setHighlightTargets] = useState<
  Record<string, HighlightInfo>
>({});




  // ===== Handlers =====
  function toNextStatusId(t: TaskVm, sp: SprintVm): string | null {
    const idx = sp.statusOrder.indexOf(resolveStatusId(t, sp));
    return sp.statusOrder[Math.min(idx + 1, sp.statusOrder.length - 1)] ?? null;
  }
  function onChangeStatus(t: TaskVm, nextStatusId: string) {
    changeStatus((window as any).__projectId, t, nextStatusId);
  }
  function onMoveToNextSprint(t: TaskVm) {
    const idx = sprints.findIndex((s) => s.id === (t.sprintId ?? activeSprintId));
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

  const task = visibleTasks.find((x) => x.id === start.draggableId);
  if (!task) return;

  const fromStatusId = resolveStatusId(task, activeSprint);

  //  policy chỉ bật khi có enforceTransitions=true ở source này
  const enforcedTargets = Array.from(
    new Set(
      activeTransitions
        .filter((tr) => tr.fromStatusId === fromStatusId && tr.enforceTransitions)
        .map((tr) => tr.toStatusId),
    ),
  );

  setDragPolicy(
    enforcedTargets.length ? { fromStatusId, allowed: enforcedTargets } : null,
  );

  // (giữ highlightTargets như bạn đang làm - muốn highlight hết transition hay chỉ enforce tùy bạn)
  const next: Record<string, HighlightInfo> = {};
  const priority: Record<HighlightKind, number> = { success: 3, failure: 2, optional: 1 };

  activeTransitions.forEach((tr) => {
    if (tr.fromStatusId !== fromStatusId) return;

    let kind: HighlightKind;
    if (tr.type === "success") kind = "success";
    else if (tr.type === "failure") kind = "failure";
    else kind = "optional";

    const rawLabel = (tr.label || "").trim();
    const label =
      rawLabel || (kind === "success" ? "Success" : kind === "failure" ? "Rework" : "Optional");

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





function onDragEnd(result: DropResult) {
  setHighlightTargets({});
  setDragPolicy(null);

  const { source, destination, draggableId } = result;
  if (!destination || !activeSprint) return;

  const fromStatusId = source.droppableId;
  const toStatusId = destination.droppableId;

  const task = visibleTasks.find((x) => x.id === draggableId);
  if (!task) return;

  const isSameColumn = fromStatusId === toStatusId;

  if (!isSameColumn && dragPolicy) {
    const allowed = dragPolicy.allowed.includes(toStatusId);
    if (!allowed) {
      //  drop vào cột không cho phép => bỏ qua
      return;
    }
  }

  if (isSameColumn) {
    if (source.index === destination.index) return;

    reorder((window as any).__projectId, activeSprint.id, task, toStatusId, destination.index);
    setLastCrossMove(null);
    return;
  }

  reorder(
    (window as any).__projectId,
    activeSprint.id,
    { ...task, workflowStatusId: toStatusId, sprintId: activeSprint.id },
    toStatusId,
    0,
  );

  setLastCrossMove({ taskId: task.id, toStatusId });
}




  // Close sprint (demo)
  function closeSprint() {
    if (!activeSprint) return;
    const validSprintIds = new Set(sprints.map(s => s.id));
    const currentTasks = tasks.filter(
      (t) => (t.sprintId ?? "") === activeSprint.id || !validSprintIds.has(t.sprintId ?? "")
    );
    const committed = currentTasks.reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);
    const completed = currentTasks.filter((t) => t.statusCategory === "DONE")
      .reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);
    const idx = sprints.findIndex((s) => s.id === activeSprint.id);
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
      </div>      <div className="flex items-center gap-2">
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
            view === "Board" ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-700 hover:bg-slate-50"
          )}
        >
          <KanbanSquare className="w-4 h-4" /> Board
        </button>
        <button
          onClick={() => setView("Analytics")}
          className={cn(
            "px-3 h-9 rounded-full border text-sm flex items-center gap-1",
            view === "Analytics" ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-700 hover:bg-slate-50"
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
      {sprints.map((s) => {
        const selected = s.id === activeSprintId;
        return (
          <button
            key={s.id}
            onClick={() => setActiveSprintId(s.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm border flex items-center gap-2 transition-colors",
              selected ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-700 hover:bg-slate-50"
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
  function MetricCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string; }) {
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
console.log(hasData)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[15px] font-semibold">
              Burn-up – {sprint?.name ?? "Sprint"}
            </div>
            <div className="text-[11px] text-slate-500">
              Scope vs completed story points over days
            </div>
          </div>
          {hasData && (
            <div className="text-right text-[11px] text-slate-500">
              <div>Scope: <span className="font-semibold">{totalScope}</span> pts</div>
              <div>Done: <span className="font-semibold">{totalCompleted}</span> pts</div>
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
                {/* scope = area xanh dương */}
                <Area
                  type="monotone"
                  dataKey="scope"
                  name="Scope"
                  stroke="#60A5FA"
                  fill="url(#gScope)"
                />
                {/* completed = line xanh lá */}
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 3 }}
                />
                {/* ideal = line chấm chấm xám */}
                <Line
                  type="monotone"
                  dataKey="ideal"
                  name="Ideal"
                  stroke="#9CA3AF"
                  strokeDasharray="4 4"
                  dot={false}
                />
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
        <div className="text-[15px] font-semibold">
          {activeSprint?.name ?? "Sprint"}
        </div>
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
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${completionPct}%`, background: brand }}
                  />
                </div>
              </div>
            }
          />
        </div>
      </div>

      <BurnUpCard sprint={activeSprint} data={burnupData} />
    </div>
  );


  /* ===== Board ===== */
  //  function Board() {
  //   if (!activeSprint) return null;

  //   const COL_W =
  //     "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";
  //   const BOARD_H = `calc(100vh - 260px)`;
  //   const tones: Array<"amber" | "blue" | "purple" | "green"> = [
  //     "amber",
  //     "blue",
  //     "purple",
  //     "green",
  //   ];

  //   const renderCol = (statusId: string, idx: number) => {
  //     const items = columns.byId[statusId] ?? [];
  //     const meta = activeSprint.statusMeta[statusId];
  //     const tone = tones[idx % 4];
  //     const wip = meta?.wipLimit ?? 9999;
  //     const over = items.length > wip;

  //     const isSource = dragSourceStatusId === statusId;
  //     const isTarget = successTargetStatusIds.includes(statusId);

  //     return (
  //       <div
  //         key={statusId}
  //         className={`shrink-0 h-full ${COL_W} relative group`}
  //       >
  //         <BoardColumnShell
  //           title={meta?.name ?? meta?.code ?? statusId}
  //           tone={tone}
  //           colorHex={meta?.color}
  //           isSource={isSource}
  //           isTarget={isTarget}
  //           right={
  //             <div className="flex items-center gap-2 text-[12px]">
  //               <span className="text-slate-500">{items.length} tasks</span>
  //               {wip !== 9999 && (
  //                 <span
  //                   className={cn(
  //                     "text-[10px] px-1.5 py-0.5 rounded-full border",
  //                     over
  //                       ? "text-rose-700 bg-rose-50 border-rose-200"
  //                       : "text-slate-600 bg-slate-50 border-slate-200",
  //                   )}
  //                 >
  //                   WIP {items.length}/{wip}
  //                 </span>
  //               )}
  //             </div>
  //           }
  //         >
  //           <Droppable
  //             droppableId={`col:${activeSprint.id}:${statusId}`}
  //             type="task"
  //           >
  //             {(provided, snapshot) => (
  //               <div
  //                 ref={provided.innerRef}
  //                 {...provided.droppableProps}
  //                 className={cn(
  //                   "h-full overflow-y-auto overscroll-contain pr-1",
  //                   snapshot.isDraggingOver &&
  //                     "bg-slate-50 rounded-xl",
  //                 )}
  //                 style={{ scrollbarWidth: "thin" }}
  //               >
  //                 <ColumnHoverCreate
  //                   sprint={activeSprint}
  //                   statusId={statusId}
  //                   onCreatedVM={(vm) => {
  //                     setFlashTaskId(vm.id);
  //                   }}
  //                 />

  //                 <div className="space-y-4">
  //                   {items.map((t, index) => {
  //                     const siblings = t.sourceTicketId
  //                       ? items.filter(
  //                           (x) =>
  //                             x.id !== t.id &&
  //                             x.sourceTicketId === t.sourceTicketId,
  //                         ).length
  //                       : 0;
  //                     return (
  //                       <Draggable
  //                         key={t.id}
  //                         draggableId={t.id}
  //                         index={index}
  //                       >
  //                         {(drag, snap) => (
  //                           <div
  //                             ref={drag.innerRef}
  //                             {...drag.draggableProps}
  //                             {...drag.dragHandleProps}
  //                             className={snap.isDragging ? "rotate-[0.5deg]" : ""}
  //                           >
  //                             <TaskCard
  //                               t={t}
  //                               ticketSiblingsCount={siblings}
  //                               onMarkDone={onMarkDone}
  //                               isNew={t.id === flashTaskId}
  //                               onNext={(x) => {
  //                                 const nextId = toNextStatusId(
  //                                   x,
  //                                   activeSprint,
  //                                 );
  //                                 if (
  //                                   nextId &&
  //                                   nextId !== x.workflowStatusId
  //                                 )
  //                                   onChangeStatus(x, nextId);
  //                               }}
  //                               onSplit={onSplit}
  //                               onMoveNext={onMoveToNextSprint}
  //                               onOpenTicket={handleOpenTicket}
  //                             />
  //                           </div>
  //                         )}
  //                       </Draggable>
  //                     );
  //                   })}
  //                 </div>
  //                 {provided.placeholder}
  //               </div>
  //             )}
  //           </Droppable>
  //         </BoardColumnShell>
  //       </div>
  //     );
  //   };

  //   return (
  //     <DragDropContext
  //       onDragStart={onDragStart}
  //       onDragEnd={onDragEnd}
  //     >
  //       <div className="px-8 mt-5 pb-4 min-w-0 max-w-[100vw]">
  //         <div
  //           className="overflow-x-auto rounded-xl w-full"
  //           style={{ height: BOARD_H, overflowY: "hidden" }}
  //         >
  //           <div className="inline-flex gap-4 h-full min-w-max pr-6 pb-5">
  //             {columns.order.map((statusId, i) => renderCol(statusId, i))}
  //           </div>
  //         </div>
  //       </div>
  //     </DragDropContext>
  //   );
  // }


  /* ===== Roadmap (nhẹ) ===== */
  function Roadmap() {
    const sprintIds = sprints.map((s) => s.id);
    const byTypeBySprint: Record<string, Record<string, number>> = {};
    tasks.forEach((t) => {
      if (!t.sprintId) return;
      const type = t.type || "Task";
      byTypeBySprint[type] ||= {};
      byTypeBySprint[type][t.sprintId] =
        (byTypeBySprint[type][t.sprintId] || 0) + Math.max(0, t.storyPoints || 0);
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
          {sprints.map((s) => (
            <div key={s.id} className="text-xs text-slate-500 px-2 py-1 truncate">{s.name}</div>
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
    <div className="flex items-center justify-between mt-2">
      <div className="text-slate-600 text-sm">
      </div>
     
    </div>

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
    />
  </>
)}





         {view === "Analytics" && (
  <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
    {/* Velocity per sprint */}
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between mb-2">
        <div className="text-slate-600 text-sm">Velocity (per sprint)</div>
        {velocityData.length > 0 && (
          <div className="text-[11px] text-slate-500">
            Avg done:&nbsp;
            <span className="font-semibold">
              {Math.round(
                velocityData.reduce((s, d) => s + (d.completed || 0), 0) /
                  Math.max(1, velocityData.length),
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

    {/* KPI table (same row on xl) */}
    <SprintKpiTable
      className="min-w-0"
      sprints={sprints}
      tasks={tasks}
    />

    {/* Nếu muốn thêm chart khác thì để ở dưới: */}
    {/* <div className="xl:col-span-2">...</div> */}
  </div>
)}




      {view === "Roadmap" && <Roadmap />}

      {/* Close sprint panel (demo) */}
      {closePanelOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-end md:items-center justify-center p-4 z-50">
          <div className="bg-white w-full md:max-w-2xl rounded-2xl p-4 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Close sprint – {activeSprint?.name ?? "..."}</div>
              <button className="text-slate-500" onClick={() => setClosePanelOpen(false)}>x</button>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              All unfinished tasks will be moved to the next sprint (spillover).
              A snapshot will be stored for velocity analytics.
            </div>
            <div className="mt-4 bg-slate-50 rounded-xl p-3 max-h-56 overflow-auto">
              {tasks
                .filter((t) => (t.sprintId ?? "") === activeSprintId)
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-1.5">
                    <div className="truncate">{t.title}</div>
                    <div className="text-xs text-slate-500">{Math.max(0, t.storyPoints || 0)} pts</div>
                  </div>
                ))}
              {tasks.filter((t) => (t.sprintId ?? "") === activeSprintId).length === 0 && (
                <div className="text-sm text-slate-500">Everything is done</div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-3 py-1.5 rounded-xl border text-sm text-slate-700 hover:bg-slate-50" onClick={() => setClosePanelOpen(false)}>Cancel</button>
              <button className="px-3 py-1.5 rounded-xl border text-sm bg-blue-600 text-white" onClick={closeSprint}>Close sprint</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
