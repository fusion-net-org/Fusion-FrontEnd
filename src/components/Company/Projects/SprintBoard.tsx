// src/pages/project/SprintWorkspacePage.tsx
// FUSION — Sprint page (Board / Analytics / Roadmap). Tailwind-only demo.

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  KanbanSquare,
  CalendarDays,
  CircleSlash2,
  TrendingUp,
  Search,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  AreaChart, Area, // <-- thêm cho Burn-up
} from "recharts";
import TaskCard, {
  type TaskVm as CardTaskVm,
  type MemberRef as CardMemberRef,
} from "@/components/Company/Projects/TaskCard";

/* ========= Types ========= */
type Id = string;
type StatusKey = "todo" | "inprogress" | "inreview" | "done";
type Priority = "Urgent" | "High" | "Medium" | "Low";
type SprintState = "Planning" | "Active" | "Closed";

interface SprintVm {
  id: Id;
  name: string;
  start: string; // ISO
  end: string;   // ISO
  state: SprintState;
  teamCapacityHours: number;
  committedPoints: number;
}
type TaskVm = CardTaskVm;
type MemberRef = CardMemberRef;

interface SprintSnapshot {
  sprintId: Id;
  sprintName: string;
  committed: number;
  completed: number;
  addedAfterStart: number;
  closedAt: string;
}

const brand = "#2E8BFF";
const WIP_LIMIT: Record<StatusKey, number> = {
  todo: 999,
  inprogress: 5,
  inreview: 3,
  done: 999,
};
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "N/A");

/* ========= Seed (demo) ========= */
function seedSprints(): SprintVm[] {
  const base = new Date();
  base.setDate(base.getDate() - base.getDay());
  const s: SprintVm[] = [];
  for (let i = 0; i < 6; i++) {
    const start = new Date(base);
    start.setDate(start.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    s.push({
      id: `spr-${i + 1}`,
      name: `Week ${i + 1}: Name task`,
      start: start.toISOString(),
      end: end.toISOString(),
      state: i === 0 ? "Active" : "Planning",
      teamCapacityHours: 160,
      committedPoints: 0,
    });
  }
  return s;
}
const demoAvatars = [
  "https://i.pravatar.cc/100?img=11",
  "https://i.pravatar.cc/100?img=22",
  "https://i.pravatar.cc/100?img=33",
  "https://i.pravatar.cc/100?img=44",
];
function seedTasks(sprints: SprintVm[]): TaskVm[] {
  const now = new Date();
  const activeSprintId = sprints.find((x) => x.state === "Active")!.id;
  const nextSprintId = sprints[1]?.id ?? null;
  const m = (name: string, i = 0): MemberRef => ({
    id: `mem-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    avatarUrl: demoAvatars[i % demoAvatars.length],
  });
  const mk = (i: number, o: Partial<TaskVm> = {}): TaskVm => ({
    id: `T-${i}`,
    code: `PRJ-${100 + i}`,
    title: o.title ?? `Task ${i}`,
    type: i % 4 === 0 ? "Bug" : i % 3 === 0 ? "Chore" : "Feature",
    priority: i % 5 === 0 ? "Urgent" : i % 3 === 0 ? "High" : i % 2 === 0 ? "Medium" : "Low",
    storyPoints: (i % 5) + 1,
    estimateHours: 4 * ((i % 5) + 1),
    remainingHours: 4 * ((i % 5) + 1),
    dueDate: new Date(now.getTime() + 1000 * 3600 * (24 * ((i % 7) + 1))).toISOString(),
    sprintId: activeSprintId,
    status: i % 6 === 0 ? "inprogress" : "todo",
    assignees: [m("Nguyen Duy", i), m("Cao Van Dung", i + 1)].slice(0, (i % 3) + 1),
    dependsOn: [],
    parentTaskId: null,
    carryOverCount: 0,
    openedAt: new Date(now.getTime() - 1000 * 3600 * (24 * ((i % 10) + 1))).toISOString(),
    updatedAt: now.toISOString(),
    createdAt: now.toISOString(),
    stage: "IN_PROGRESS",
    severity: "Low",
    tags: i % 2 === 0 ? ["Payment", "Core"] : ["UI"],
    sourceTicketId: null,
    sourceTicketCode: null,
    ...o,
  });
  const list: TaskVm[] = [
    mk(1, { title: "Auth flow + refresh token", status: "inprogress", storyPoints: 5, estimateHours: 20, remainingHours: 12, tags: ["Auth", "Security"], sourceTicketId: "TK-1001", sourceTicketCode: "TK-1001" }),
    mk(2, { title: "Fix payment webhook signature", type: "Bug", priority: "Urgent", sourceTicketId: "TK-1001", sourceTicketCode: "TK-1001" }),
    mk(3, { title: "Task too big -> split", storyPoints: 8, estimateHours: 32, remainingHours: 28, sourceTicketId: "TK-1002", sourceTicketCode: "TK-1002" }),
    mk(4, { title: "Design workflow edge states", sprintId: nextSprintId, status: "todo" }),
    mk(5, { title: "Build project roadmap view" }),
    mk(6, { title: "Refactor repository layer", status: "inreview" }),
    mk(7, { title: "Migrate subscriptions data", priority: "High", assignees: [] }),
  ];
  const t6 = list.find((t) => t.id === "T-6")!;
  const t7 = list.find((t) => t.id === "T-7")!;
  t7.dependsOn.push(t6.id);
  return list;
}

/* ========= Board atoms ========= */
const statusLabels: Record<StatusKey, string> = {
  todo: "To do",
  inprogress: "In progress",
  inreview: "In review",
  done: "Done",
};
const toneByStatus: Record<StatusKey, "amber" | "blue" | "purple" | "green"> = {
  todo: "amber",
  inprogress: "blue",
  inreview: "purple",
  done: "green",
};
function BoardColumnShell({
  title,
  tone,
  right,
  children,
}: {
  title: string;
  tone: "amber" | "blue" | "purple" | "green";
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const topBar: Record<string, string> = {
    amber: "bg-amber-500",
    blue: "bg-blue-600",
    purple: "bg-purple-600",
    green: "bg-green-600",
  };
  const ring: Record<string, string> = {
    amber: "ring-amber-200",
    blue: "ring-blue-200",
    purple: "ring-purple-200",
    green: "ring-green-200",
  };
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white overflow-hidden ring-1 h-full flex flex-col",
        ring[tone]
      )}
      style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.06)" }}
    >
      <div className={cn("h-2 w-full", topBar[tone])} />
      <div className="p-4 pb-3 flex items-center justify-between">
        <span className="inline-flex items-center text-[12px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
          {title}
        </span>
        {right}
      </div>
      <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

/* ========= Page ========= */
export default function SprintBoard() {
  const initialSprints = useMemo(() => seedSprints(), []);
  const [sprints, setSprints] = useState<SprintVm[]>(initialSprints);
  const [tasks, setTasks] = useState<TaskVm[]>(() => seedTasks(initialSprints));
  const [snapshots, setSnapshots] = useState<SprintSnapshot[]>([]);
  const [activeSprintId, setActiveSprintId] = useState<Id>(
    initialSprints.find((s) => s.state === "Active")!.id
  );
  const [view, setView] = useState<"Board" | "Analytics" | "Roadmap">("Board");
  const [closePanelOpen, setClosePanelOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const activeSprint = useMemo(
    () => sprints.find((s) => s.id === activeSprintId)!,
    [sprints, activeSprintId]
  );

  const columns = useMemo(
    () => ({
      todo: tasks.filter(
        (t) =>
          t.sprintId === activeSprintId &&
          t.status === "todo" &&
          (!keyword ||
            t.title.toLowerCase().includes(keyword.toLowerCase()) ||
            (t.code ?? "").toLowerCase().includes(keyword.toLowerCase()))
      ),
      inprogress: tasks.filter(
        (t) =>
          t.sprintId === activeSprintId &&
          t.status === "inprogress" &&
          (!keyword ||
            t.title.toLowerCase().includes(keyword.toLowerCase()) ||
            (t.code ?? "").toLowerCase().includes(keyword.toLowerCase()))
      ),
      inreview: tasks.filter(
        (t) =>
          t.sprintId === activeSprintId &&
          t.status === "inreview" &&
          (!keyword ||
            t.title.toLowerCase().includes(keyword.toLowerCase()) ||
            (t.code ?? "").toLowerCase().includes(keyword.toLowerCase()))
      ),
      done: tasks.filter(
        (t) =>
          t.sprintId === activeSprintId &&
          t.status === "done" &&
          (!keyword ||
            t.title.toLowerCase().includes(keyword.toLowerCase()) ||
            (t.code ?? "").toLowerCase().includes(keyword.toLowerCase()))
      ),
    }),
    [tasks, activeSprintId, keyword]
  );

  const committedPoints = useMemo(
    () =>
      tasks
        .filter((t) => t.sprintId === activeSprintId)
        .reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0),
    [tasks, activeSprintId]
  );
  const completedPoints = useMemo(
    () => columns.done.reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0),
    [columns]
  );
  const completionPct =
    committedPoints > 0
      ? Math.round((100 * completedPoints) / committedPoints)
      : 0;

  function changeStatus(t: TaskVm, next: StatusKey) {
    setTasks((prev) =>
      prev.map((x) =>
        x.id === t.id
          ? { ...x, status: next, updatedAt: new Date().toISOString() }
          : x
      )
    );
  }
  function moveToNextSprint(t: TaskVm) {
    const currentIdx = sprints.findIndex((s) => s.id === activeSprintId);
    const next = sprints[currentIdx + 1];
    setTasks((prev) =>
      prev.map((x) =>
        x.id === t.id
          ? {
              ...x,
              sprintId: next ? next.id : null,
              status: "todo",
              carryOverCount: (x.carryOverCount || 0) + 1,
            }
          : x
      )
    );
  }
  function splitTask(t: TaskVm) {
    const sp = Math.max(0, t.storyPoints || 0);
    const rh = Math.max(0, t.remainingHours || 0);
    if (sp < 2 && rh < 2) {
      alert("Cannot split: task is too small (needs >=2 pts or >=2h remaining).");
      return;
    }
    const base = t.title.replace(/(\s*\(Part [AB]\)\s*)+$/g, "").trim();
    const bPts = sp >= 2 ? Math.max(1, Math.floor(sp / 2)) : 0;
    const aPts = sp - bPts;
    const bHrs = rh >= 2 ? Math.max(1, Math.floor(rh / 2)) : 0;
    const aHrs = Math.max(0, rh - bHrs);
    const nextSprint =
      sprints[sprints.findIndex((s) => s.id === t.sprintId) + 1]?.id ?? null;

    setTasks((prev) => [
      ...prev.map((x) =>
        x.id === t.id
          ? { ...x, storyPoints: aPts, remainingHours: aHrs, title: base + " (Part A)" }
          : x
      ),
      ...((bPts > 0 || bHrs > 0)
        ? [
            {
              ...t,
              id: `${t.id}-B`,
              title: base + " (Part B)",
              storyPoints: bPts,
              remainingHours: bHrs,
              status: "todo" as StatusKey,
              sprintId: nextSprint,
              parentTaskId: t.id,
              carryOverCount: 0,
              createdAt: new Date().toISOString(),
            },
          ]
        : []),
    ]);
  }
  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const src = source.droppableId as StatusKey;
    const dst = destination.droppableId as StatusKey;
    if (src === dst && source.index === destination.index) return;
    if (["inprogress", "inreview"].includes(dst)) {
      const dstCount = (columns[dst].length || 0) + (src === dst ? 0 : 1);
      if (dstCount > WIP_LIMIT[dst]) {
        alert(`WIP limit reached: ${dst} ${dstCount}/${WIP_LIMIT[dst]}`);
        return;
      }
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggableId
          ? { ...t, status: dst, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }
  function closeSprint() {
    const sprint = activeSprint;
    if (!sprint) return;
    const currentTasks = tasks.filter((t) => t.sprintId === sprint.id);
    const committed = currentTasks.reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);
    const completed = currentTasks.filter((t) => t.status === "done")
      .reduce((s, t) => s + Math.max(0, t.storyPoints || 0), 0);
    const snap: SprintSnapshot = {
      sprintId: sprint.id,
      sprintName: sprint.name,
      committed,
      completed,
      addedAfterStart: 0,
      closedAt: new Date().toISOString(),
    };
    const idx = sprints.findIndex((s) => s.id === sprint.id);
    const next = sprints[idx + 1];
    setTasks((prev) =>
      prev.map((t) =>
        t.sprintId === sprint.id && t.status !== "done"
          ? { ...t, sprintId: next ? next.id : null, status: "todo", carryOverCount: (t.carryOverCount || 0) + 1 }
          : t
      )
    );
    setSnapshots((p) => [...p, snap]);
    setSprints((p) =>
      p.map((s) =>
        s.id === sprint.id ? { ...s, state: "Closed" } : s.id === next?.id ? { ...s, state: "Active" } : s
      )
    );
    if (next) setActiveSprintId(next.id);
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
        <button onClick={() => setView("Board")}
          className={cn("px-3 h-9 rounded-full border text-sm flex items-center gap-1",
            view === "Board" ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-700 hover:bg-slate-50")}>
          <KanbanSquare className="w-4 h-4" /> Board
        </button>
        <button onClick={() => setView("Analytics")}
          className={cn("px-3 h-9 rounded-full border text-sm flex items-center gap-1",
            view === "Analytics" ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-700 hover:bg-slate-50")}>
          <TrendingUp className="w-4 h-4" /> Analytics
        </button>
        <button onClick={() => setView("Roadmap")}
          className={cn("px-3 h-9 rounded-full border text-sm flex items-center gap-1",
            view === "Roadmap" ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-700 hover:bg-slate-50")}>
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
            selected
              ? "bg-blue-600 text-white border-blue-600"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          )}
          title={`${fmtDate(s.start)} - ${fmtDate(s.end)}`}
        >
          <span className={cn("font-semibold", selected && "text-white")}>
            {s.name}
          </span>
          <span
            className={cn(
              "ml-2 text-xs",
              selected ? "text-blue-100/90" : "text-slate-500"
            )}
          >
            {fmtDate(s.start)} - {fmtDate(s.end)}
          </span>
        </button>
      );
    })}
  </div>
);


  /* ===== Summary + Burn-up (gộp) ===== */
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
    const base = snapshots.length
      ? snapshots.map(s => ({ name: s.sprintName, scope: s.committed, done: s.completed }))
      : [
          { name: "W-1", scope: 21, done: 9 },
          { name: "W-2", scope: 18, done: 14 },
          { name: "W-3", scope: 24, done: 12 },
        ];
    const data = base.map((p, i) => {
      const prev = i === 0 ? { scope: 0, done: 0 } :
        base.slice(0, i).reduce((a, b) => ({ scope: a.scope + b.scope, done: a.done + b.done }), { scope: 0, done: 0 });
      return { name: p.name, scope: prev.scope + p.scope, completed: prev.done + p.done };
    });
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[15px] font-semibold mb-3">Burn-up (Scope vs Completed)</div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gScope" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.15}/>
                </linearGradient>
                <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#86EFAC" stopOpacity={0.2}/>
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
        <div className="text-[15px] font-semibold">{activeSprint.name}</div>
        <div className="text-xs text-slate-500">
          {fmtDate(activeSprint.start)} – {fmtDate(activeSprint.end)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <MetricCard label="Committed pts" value={committedPoints} />
          <MetricCard label="Done pts" value={completedPoints} />
          <MetricCard label="Team capacity"
            value={`${activeSprint.teamCapacityHours}h`}
            sub={`Estimate sum: ${
              tasks.filter((t) => t.sprintId === activeSprintId)
                   .reduce((s, t) => s + (t.estimateHours || 0), 0)
            }h`} />
          <MetricCard label="Completion" value={
            <div className="flex items-center gap-3">
              <span className="font-semibold">{completionPct}%</span>
              <div className="h-1.5 w-24 bg-slate-100 rounded-full">
                <div className="h-1.5 rounded-full" style={{ width: `${completionPct}%`, background: brand }} />
              </div>
            </div>
          } />
        </div>
      </div>
      <BurnUpCard />
    </div>
  );

  /* ===== Board ===== */
  function Board() {
    const COL_W = "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";
    const BOARD_H = `calc(100vh - 260px)`;
    const renderCol = (k: StatusKey) => {
      const items = columns[k];
      const over = items.length > WIP_LIMIT[k];
      const tone = toneByStatus[k];
      return (
        <div key={k} className={`shrink-0 h-full ${COL_W}`}>
          <BoardColumnShell
            title={statusLabels[k]}
            tone={tone}
            right={
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-slate-500">{items.length} tasks</span>
                {over && (
                  <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    WIP {items.length}/{WIP_LIMIT[k]}
                  </span>
                )}
              </div>
            }
          >
            <Droppable droppableId={k} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn("h-full overflow-y-auto overscroll-contain pr-1",
                    snapshot.isDraggingOver && "bg-slate-50 rounded-xl")}
                  style={{ scrollbarWidth: "thin" }}
                >
                  <div className="h-1.5 w-full rounded-full bg-slate-100 mb-2">
                    <div className="h-1.5 rounded-full"
                      style={{
                        width: `${
                          Math.min(100,
                            Math.round(
                              ((items.filter((i) => i.status === "done").length || 0) /
                                Math.max(1, items.length)) * 100))
                        }%`,
                        backgroundColor: brand,
                      }} />
                  </div>

                  <div className="space-y-4">
                    {items.map((t, idx) => {
                      const siblings = t.sourceTicketId
                        ? tasks.filter((x) => x.id !== t.id && x.sourceTicketId === t.sourceTicketId).length
                        : 0;
                      return (
                        <Draggable key={t.id} draggableId={t.id} index={idx}>
                          {(drag, snap) => (
                            <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}
                              className={snap.isDragging ? "rotate-[0.5deg]" : ""}>
                              <TaskCard
                                t={t}
                                ticketSiblingsCount={siblings}
                                onMarkDone={(x) => changeStatus(x, "done")}
                                onNext={(x) =>
                                  changeStatus(x, x.status === "todo" ? "inprogress" :
                                                   x.status === "inprogress" ? "inreview" : "done")}
                                onSplit={splitTask}
                                onMoveNext={moveToNextSprint}
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
              {(["todo", "inprogress", "inreview", "done"] as StatusKey[]).map(renderCol)}
            </div>
          </div>
        </div>
      </DragDropContext>
    );
  }

  /* ===== Roadmap (đã làm đầy đủ) ===== */
  function Roadmap() {
    const sprintIds = sprints.map(s => s.id);
    const byTypeBySprint: Record<string, Record<string, number>> = {};
    tasks.forEach(t => {
      if (!t.sprintId) return;
      const type = t.type;
      byTypeBySprint[type] ||= {};
      byTypeBySprint[type][t.sprintId] = (byTypeBySprint[type][t.sprintId] || 0) + Math.max(0, t.storyPoints || 0);
    });
    const types = Object.keys(byTypeBySprint).length ? Object.keys(byTypeBySprint) : ["Feature", "Bug", "Chore"];
    const rowMax = (type: string) => Math.max(1, ...sprintIds.map(id => byTypeBySprint[type]?.[id] || 0));

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-semibold">Roadmap by Sprint</div>
          <div className="text-xs text-slate-500">độ đậm = tổng story points</div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: `220px repeat(${sprintIds.length}, minmax(120px,1fr))` }}>
          <div className="text-xs text-slate-500 px-2 py-1">Epic / Type</div>
          {sprints.map(s => (
            <div key={s.id} className="text-xs text-slate-500 px-2 py-1 truncate">{s.name}</div>
          ))}

          {types.map(type => (
            <React.Fragment key={type}>
              <div className="px-2 py-2 border-t text-sm font-medium">{type}</div>
              {sprintIds.map(sid => {
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
            <div className="text-slate-600 text-sm">Sprint – {activeSprint.name}</div>
            <button onClick={() => setClosePanelOpen(true)}
              className="px-3 h-9 rounded-full border text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-1">
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
            <LineChart data={snapshots.length ? snapshots : [
              { name: "W-1", committed: 22, completed: 10 },
              { name: "W-2", committed: 18, completed: 14 },
              { name: "W-3", committed: 25, completed: 12 },
            ]}>
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

      {/* Close sprint panel */}
      {closePanelOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-end md:items-center justify-center p-4 z-50">
          <div className="bg-white w-full md:max-w-2xl rounded-2xl p-4 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Close sprint – {activeSprint.name}</div>
              <button className="text-slate-500" onClick={() => setClosePanelOpen(false)}>x</button>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              All unfinished tasks will be moved to the next sprint (spillover). A snapshot will be stored for velocity analytics.
            </div>
            <div className="mt-4 bg-slate-50 rounded-xl p-3 max-h-56 overflow-auto">
              {tasks.filter((t) => t.sprintId === activeSprintId && t.status !== "done").map((t) => (
                <div key={t.id} className="flex items-center justify-between py-1.5">
                  <div className="truncate">{t.title}</div>
                  <div className="text-xs text-slate-500">{Math.max(0, t.storyPoints)} pts</div>
                </div>
              ))}
              {tasks.filter((t) => t.sprintId === activeSprintId && t.status !== "done").length === 0 && (
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
