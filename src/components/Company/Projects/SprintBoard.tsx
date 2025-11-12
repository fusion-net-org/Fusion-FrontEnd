// FUSION — Sprint page (Board / Analytics / Roadmap). Tailwind-only.
// Dữ liệu & thao tác lấy từ ProjectBoardContext (workflow động).

import React, { useEffect, useMemo, useState } from "react";
import { useProjectBoard } from "@/context/ProjectBoardContext";
import {
  KanbanSquare, CalendarDays, CircleSlash2, TrendingUp, Search,
} from "lucide-react";
import {
  DragDropContext, Droppable, Draggable, type DropResult,
} from "@hello-pangea/dnd";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, AreaChart, Area,
} from "recharts";
import TaskCard from "@/components/Company/Projects/TaskCard";
import type { SprintVm, TaskVm } from "@/types/projectBoard";
import QuickTaskCreateCard from "../Task/QuickTaskCreateCard";
import ColumnHoverCreate from "../Task/ColumnHoverCreate";

type Id = string;

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "N/A");

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
  title, tone, colorHex, right, children, 
}: {
  title: string;
  tone: "amber" | "blue" | "purple" | "green";
  colorHex?: string;                // <— màu từ API
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const fallback: Record<string, string> = {
    amber: "#F59E0B", blue: "#2563EB", purple: "#7C3AED", green: "#059669",
  };
  const accent = colorHex || fallback[tone];
  const labelBg = hexToRgba(accent, 0.08);
  const labelBd = hexToRgba(accent, 0.25);
  const labelTx = accent;
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white overflow-hidden ring-1 h-full flex flex-col",
      )}
      style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.06)" }}
    >
      <div className="h-2 w-full" style={{ backgroundColor: accent }} />
      <div className="p-4 pb-3 flex items-center justify-between">
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
      <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

/* ========= Page ========= */
export default function SprintWorkspacePage() {
  // ===== từ context =====
  const {
    sprints, tasks, changeStatus, moveToNextSprint, split, done, reorder,
  } = useProjectBoard();

  // ===== UI State =====
  const [activeSprintId, setActiveSprintId] = useState<Id>(sprints[0]?.id ?? "");
  const [view, setView] = useState<"Board" | "Analytics" | "Roadmap">("Board");
  const [closePanelOpen, setClosePanelOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [snapshots, setSnapshots] = useState<{ name: string; committed: number; completed: number }[]>([]);

  // set sprint mặc định khi có dữ liệu
  useEffect(() => {
    if (!activeSprintId && sprints.length) setActiveSprintId(sprints[0].id);
  }, [sprints, activeSprintId]);

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

  // ===== Columns động theo sprint đang chọn + search =====
  const columns = useMemo(() => {
    if (!activeSprint) return { order: [] as string[], byId: {} as Record<string, TaskVm[]> };
    const order = activeSprint.statusOrder;
    const byId: Record<string, TaskVm[]> = {};
    const match = (t: TaskVm) =>
      !keyword ||
      t.title?.toLowerCase().includes(keyword.toLowerCase()) ||
      (t.code ?? "").toLowerCase().includes(keyword.toLowerCase());

    for (const stId of order) byId[stId] = [];

    const validSprintIds = new Set(sprints.map(s => s.id));

    for (const t of tasks) {
      // Nếu task có sprintId lạ (demo) → coi như thuộc sprint đang active
      const belongToActive =
        (t.sprintId ?? "") === activeSprint.id ||
        !validSprintIds.has(t.sprintId ?? "");

      if (!belongToActive) continue;
      if (!match(t)) continue;

      const stId = resolveStatusId(t, activeSprint);
      if (!byId[stId]) byId[stId] = [];
      byId[stId].push({ ...t, sprintId: activeSprint.id, workflowStatusId: stId });
    }
    return { order, byId };
  }, [tasks, activeSprint, keyword, sprints]);

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
  }, [tasks, activeSprint, sprints]);

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

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination || !activeSprint) return;
    const [, s1, st1] = source.droppableId.split(":");
    const [, s2, st2] = destination.droppableId.split(":");
    if (s1 !== s2) return;
    if (st1 === st2 && source.index === destination.index) return;
    const t = tasks.find((x) => x.id === draggableId);
    if (t) reorder((window as any).__projectId, activeSprint.id, t, st2, destination.index);
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
      <div className="text-2xl font-semibold">Sprint</div>
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
        <button
          onClick={() => setView("Roadmap")}
          className={cn(
            "px-3 h-9 rounded-full border text-sm flex items-center gap-1",
            view === "Roadmap" ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-700 hover:bg-slate-50"
          )}
        >
          <CalendarDays className="w-4 h-4" /> Roadmap
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
  function BurnUpCard() {
    const base = snapshots.length > 0
      ? snapshots
      : [
          { name: "W-1", committed: 21, completed: 9 },
          { name: "W-2", committed: 18, completed: 14 },
          { name: "W-3", committed: 24, completed: 12 },
        ];
    const data = base.map((p, i) => {
      const prev = i === 0 ? { committed: 0, completed: 0 }
        : base.slice(0, i).reduce((a, b) => ({ committed: a.committed + b.committed, completed: a.completed + b.completed }), { committed: 0, completed: 0 });
      return { name: p.name, scope: prev.committed + p.committed, completed: prev.completed + p.completed };
    });

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[15px] font-semibold mb-3">Burn-up (Scope vs Completed)</div>
        <div className="h-[220px]">
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
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="scope" name="scope" stroke="#60A5FA" fill="url(#gScope)" />
              <Area type="monotone" dataKey="completed" name="completed" stroke="#34D399" fill="url(#gDone)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const SummaryAndChart = (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[15px] font-semibold">{activeSprint?.name ?? "Sprint"}</div>
        <div className="text-xs text-slate-500">{fmtDate(activeSprint?.start)} – {fmtDate(activeSprint?.end)}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <MetricCard label="Committed pts" value={committedPoints} />
          <MetricCard label="Done pts" value={completedPoints} />
          <MetricCard
            label="Team capacity"
            value={`${activeSprint?.capacityHours ?? 160}h`}
            sub={`Estimate sum: ${
              tasks.filter((t) => (t.sprintId ?? "") === activeSprintId).reduce((s, t) => s + (t.estimateHours || 0), 0)
            }h`}
          />
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
      <BurnUpCard />
    </div>
  );

  /* ===== Board ===== */
  function Board() {
    if (!activeSprint) return null;

    const COL_W = "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";
    const BOARD_H = `calc(100vh - 260px)`;
    const tones: Array<"amber" | "blue" | "purple" | "green"> = ["amber", "blue", "purple", "green"];

    const renderCol = (statusId: string, idx: number) => {
      const items = columns.byId[statusId] ?? [];
      const meta = activeSprint.statusMeta[statusId];
      const tone = tones[idx % 4];
      const wip = meta?.wipLimit ?? 9999;
      const over = items.length > wip;

      return (
        <div key={statusId} className={`shrink-0 h-full ${COL_W}  relative group`}>
          <BoardColumnShell
            title={meta?.name ?? meta?.code ?? statusId}
            tone={tone}
            colorHex={meta?.color}   // <— dùng màu API
            right={
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-slate-500">{items.length} tasks</span>
                {wip !== 9999 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border",
                      over ? "text-rose-700 bg-rose-50 border-rose-200" : "text-slate-600 bg-slate-50 border-slate-200"
                    )}
                  >
                    WIP {items.length}/{wip}
                  </span>
                )}
              </div>
            }
          >
           
            <Droppable droppableId={`col:${activeSprint.id}:${statusId}`} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn("h-full overflow-y-auto overscroll-contain pr-1", snapshot.isDraggingOver && "bg-slate-50 rounded-xl")}
                  style={{ scrollbarWidth: "thin" }}
                >
                    <ColumnHoverCreate
                  sprint={activeSprint}
                  statusId={statusId}
                />

                  <div className="space-y-4">
                    {items.map((t, index) => {
                      const siblings = t.sourceTicketId
                        ? items.filter(x => x.id !== t.id && x.sourceTicketId === t.sourceTicketId).length
                        : 0;
                      return (
                        <Draggable key={t.id} draggableId={t.id} index={index}>
                          {(drag, snap) => (
                            <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className={snap.isDragging ? "rotate-[0.5deg]" : ""}>
                              <TaskCard
                                t={t}
                                ticketSiblingsCount={siblings}
                                onMarkDone={onMarkDone}
                                onNext={(x) => {
                                  const nextId = toNextStatusId(x, activeSprint);
                                  if (nextId && nextId !== x.workflowStatusId) onChangeStatus(x, nextId);
                                }}
                                onSplit={onSplit}
                                onMoveNext={onMoveToNextSprint}
                                onOpenTicket={(ticketId) => alert(`Open ticket: ${ticketId}`)}
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
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="px-8 mt-5 pb-4 min-w-0 max-w-[100vw]">
          <div className="overflow-x-auto rounded-xl w-full" style={{ height: BOARD_H, overflowY: "hidden" }}>
            <div className="inline-flex gap-4 h-full min-w-max pr-6 pb-5">
              {columns.order.map((statusId, i) => renderCol(statusId, i))}
            </div>
          </div>
        </div>
      </DragDropContext>
    );
  }

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
          <div className="text-xs text-slate-500">độ đậm = tổng story points</div>
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
            <div className="text-slate-600 text-sm">Sprint – {activeSprint?.name ?? "..."}</div>
            <button onClick={() => setClosePanelOpen(true)} className="px-3 h-9 rounded-full border text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-1">
              <CircleSlash2 className="w-4 h-4" /> Close sprint
            </button>
          </div>
          <Board />
        </>
      )}

      {view === "Analytics" && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-slate-600 text-sm mb-2">Velocity (last sprints)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={snapshots.length ? snapshots : [
                { name: "W-1", committed: 22, completed: 10 },
                { name: "W-2", committed: 18, completed: 14 },
                { name: "W-3", committed: 25, completed: 12 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="committed" dot />
              <Line type="monotone" dataKey="completed" dot />
            </LineChart>
          </ResponsiveContainer>
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
