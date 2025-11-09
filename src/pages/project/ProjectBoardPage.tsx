// src/pages/project/ProjectBoardPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { Search, SlidersHorizontal } from "lucide-react";
import BoardNav from "@/components/Company/Projects/BoardNav";
import SprintBoard from "@/components/Company/Projects/SprintBoard";
import KanbanBySprintBoard from "@/components/Company/Projects/KanbanBySprintBoard";

// === Types: dùng StatusKey local + TaskVm từ TaskCard để khỏi lệch schema
export type StatusKey = "todo" | "inprogress" | "inreview" | "done";
import type { TaskVm as CardTaskVm, MemberRef as CardMemberRef } from "@/components/Company/Projects/TaskCard";
import ProjectTaskList from "@/components/Company/Projects/ProjectTaskList";
type TaskVm = CardTaskVm;
type MemberRef = CardMemberRef;

export type SprintVm = {
  id: string;
  name: string;
  startDate?: string; // dd-mm-yyyy (để Dashboard dùng parseDDMMYYYY)
  endDate?: string;   // dd-mm-yyyy
  columns: Record<StatusKey, TaskVm[]>;
};

const statusOrder: StatusKey[] = ["todo", "inprogress", "inreview", "done"];

function findTaskInSprint(
  sprint: SprintVm,
  taskId: string
): { status: StatusKey; index: number } | null {
  for (const st of statusOrder) {
    const idx = sprint.columns[st].findIndex((t) => t.id === taskId);
    if (idx !== -1) return { status: st, index: idx };
  }
  return null;
}
function flattenSprintTasks(s: SprintVm, filter: StatusKey | "all" = "all") {
  if (filter !== "all") return s.columns[filter];
  const list: TaskVm[] = [];
  for (const st of statusOrder) list.push(...s.columns[st]);
  return list;
}
function computeSprintStats(s: SprintVm) {
  const total = flattenSprintTasks(s, "all").length;
  const done = s.columns.done.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}
function parseDDMMYYYY(v?: string) {
  if (!v) return null;
  const [dd, mm, yyyy] = v.split("-").map((x) => parseInt(x, 10));
  if (!yyyy || !mm || !dd) return null;
  return new Date(yyyy, mm - 1, dd);
}
function formatRange(start?: string, end?: string) {
  return `${start ?? "—"} → ${end ?? "—"}`;
}
function humanDaysRemaining(end?: string) {
  const d = parseDDMMYYYY(end);
  if (!d) return "";
  const today = new Date();
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 0) return `${diff} days left`;
  if (diff === 0) return `due today`;
  return `${Math.abs(diff)} days past`;
}

// === Mock API: trả về TaskVm đầy đủ (ISO date cho SLA/format)
const projectApi = {
  async getSprints(projectId: string): Promise<SprintVm[]> {
    const now = new Date();
    const isoIn = (hours: number) => new Date(now.getTime() + hours * 3600 * 1000).toISOString();
    const isoAgo = (hours: number) => new Date(now.getTime() - hours * 3600 * 1000).toISOString();
    const avatar = (i: number) => `https://i.pravatar.cc/100?img=${(i % 60) + 1}`;

    const m = (id: string, name: string, i = 1): MemberRef => ({
      id, name, avatarUrl: avatar(i),
    });

    const mk = (o: Partial<TaskVm>): TaskVm => ({
      id: "t-x",
      code: "PRJ-000",
      title: "Untitled",
      type: "Feature",
      priority: "Low",
      severity: "Low",
      tags: [],
      storyPoints: 3,
      estimateHours: 8,
      remainingHours: 8,
      dueDate: isoIn(72),
      openedAt: isoAgo(24),
      updatedAt: isoAgo(2),
      createdAt: isoAgo(48),
      sprintId: "s1",
      status: "todo",
      stage: "IN_PROGRESS",
      assignees: [m("u1", "Nguyen Duy", 11)],
      dependsOn: [],
      parentTaskId: null,
      carryOverCount: 0,
      sourceTicketId: null,
      sourceTicketCode: null,
      ...o,
    });

    return [
      {
        id: "s1",
        name: "Week 1: Name task",
        startDate: "09-10-2025",
        endDate: "30-10-2025",
        columns: {
          todo: [
            mk({
              id: "t1",
              code: "PRJ-123",
              title: "Projects Name",
              priority: "Urgent",
              type: "Feature",
              storyPoints: 5,
              estimateHours: 20,
              remainingHours: 16,
              dueDate: isoIn(24),
              assignees: [m("u1","Nguyen Duy",11), m("u2","Cao Van Dung",22)],
              sourceTicketId: "TK-1001",
              sourceTicketCode: "TK-1001",
            }),
          ],
          inprogress: [
            mk({
              id: "t2",
              code: "PRJ-124",
              title: "Fix webhook signature",
              priority: "High",
              type: "Bug",
              severity: "Critical",
              status: "inprogress",
              remainingHours: 3,
              dueDate: isoIn(12),
              assignees: [m("u1","Nguyen Duy",11)],
              sourceTicketId: "TK-1001",
              sourceTicketCode: "TK-1001",
            }),
            mk({
              id: "t3",
              code: "PRJ-125",
              title: "Implement pricing cards",
              priority: "Medium",
              type: "Feature",
              status: "inprogress",
              remainingHours: 5,
              assignees: [m("u3","Nguyen Kien Minh",33)],
              sourceTicketId: "TK-1002",
              sourceTicketCode: "TK-1002",
            }),
            mk({
              id: "t4",
              code: "PRJ-126",
              title: "Add audit trail",
              priority: "Medium",
              type: "Feature",
              status: "inprogress",
              assignees: [m("u4","Luong Cong Bang",44)],
            }),
            mk({
              id: "t5",
              code: "PRJ-127",
              title: "Optimize EF Core queries",
              priority: "Medium",
              type: "Feature",
              status: "inprogress",
              assignees: [],
            }),
            mk({
              id: "t6",
              code: "PRJ-128",
              title: "Finalize workflow designer",
              priority: "Medium",
              type: "Feature",
              status: "inprogress",
              assignees: [m("u1","Nguyen Duy",11), m("u5","Nguyen Tan Tuong",55)],
            }),
            mk({
              id: "t7",
              code: "PRJ-129",
              title: "Admin dashboard polish",
              priority: "Medium",
              type: "Feature",
              status: "inprogress",
            }),
            mk({
              id: "t8",
              code: "PRJ-130",
              title: "Notification center",
              priority: "Medium",
              type: "Feature",
              status: "inprogress",
            }),
            mk({
              id: "t9",
              code: "PRJ-131",
              title: "CSV export for tickets",
              priority: "Medium",
              type: "Feature",
              status: "inprogress",
            }),
          ],
          inreview: [],
          done: [],
        },
      },
      { id: "s2", name: "Week 2: Name task", columns: { todo: [], inprogress: [], inreview: [], done: [] } },
      { id: "s3", name: "Week 3: Name task", columns: { todo: [], inprogress: [], inreview: [], done: [] } },
      { id: "s4", name: "Week 4: Name task", columns: { todo: [], inprogress: [], inreview: [], done: [] } },
      { id: "s5", name: "Week 5: Name task", columns: { todo: [], inprogress: [], inreview: [], done: [] } },
    ];
  },
  async updateTaskPosition(_: {
    projectId: string; sprintId: string; taskId: string; toStatus: StatusKey; toIndex: number;
  }) {},
  async updateTaskSprint(_: {
    projectId: string; taskId: string; fromSprintId: string; toSprintId: string;
  }) {}
};

/* ====== Dashboard (y như cũ, dùng dd-mm-yyyy cho sprint range) ====== */
function SprintDashboard({ sprint }: { sprint: SprintVm }) {
  const brand = "#2E8BFF";
  const { total, done, pct } = computeSprintStats(sprint);
  const StatBox = ({ label, value, colorClass = "text-gray-800" }: { label: string; value: React.ReactNode; colorClass?: string }) => (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`text-[18px] font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
  const LeftCard = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium text-gray-800">{sprint.name}</div>
        <span className="text-[12px] text-gray-400">{humanDaysRemaining(sprint.endDate)}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-gray-600 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M7 2v3M17 2v3M3 10h18M4 6h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
                stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>{formatRange(sprint.startDate, sprint.endDate)}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
        <StatBox label="Committed pts" value={total} colorClass="text-blue-600" />
        <StatBox label="Done pts" value={done} colorClass="text-green-600" />
        <StatBox label="Task" value={total} colorClass="text-red-500" />
        <StatBox label="Completion" value={`${pct}%`} colorClass="text-green-600" />
      </div>
      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-1">Overview</div>
        <div className="h-1.5 w-full rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: brand }} />
        </div>
      </div>
    </div>
  );
  const RightChart = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-800">Title of section</div>
        <span className="text-xs text-gray-400">↗</span>
      </div>
      <div className="mt-2">
        {/* placeholder chart svg */}
        <svg viewBox="0 0 680 240" className="w-full h-[180px] sm:h-[200px] md:h-[240px] lg:h-[260px]">
          <rect x="0"   y="0" width="90"  height="240" fill={brand} opacity="0.08" />
          <rect x="590" y="0" width="90"  height="240" fill="#22c55e" opacity="0.08" />
          <defs>
            <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brand} stopOpacity="0.25" />
              <stop offset="100%" stopColor={brand} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M20 60 C 120 55, 170 80, 240 70 C 300 60, 350 110, 420 60 C 480 40, 560 140, 660 120 L 660 200 L 20 200 Z"
                fill="url(#blueFill)" />
          <path d="M20 60 C 120 55, 170 80, 240 70 C 300 60, 350 110, 420 60 C 480 40, 560 140, 660 120"
                fill="none" stroke={brand} strokeWidth="3" />
          {[{x:60,y:62},{x:140,y:58},{x:240,y:70},{x:340,y:95},{x:420,y:60},{x:560,y:140},{x:660,y:120}]
            .map((p,i)=>(<circle key={i} cx={p.x} cy={p.y} r="4" fill={brand}/>))}
          <path d="M20 140 C 110 210, 160 105, 240 125 C 300 140, 350 85, 420 150 C 470 180, 550 200, 660 120 L 660 200 L 20 200 Z"
                fill="url(#greenFill)" />
          <path d="M20 140 C 110 210, 160 105, 240 125 C 300 140, 350 85, 420 150 C 470 180, 550 200, 660 120"
                fill="none" stroke="#22c55e" strokeWidth="3" />
        </svg>
      </div>
    </div>
  );

  return (
    <div
      className="
        px-8 mt-5 grid grid-cols-1 gap-5 items-start
        md:[grid-template-columns:clamp(280px,30vw,420px)_1fr]
        2xl:[grid-template-columns:clamp(320px,26vw,500px)_1fr]
      "
    >
      <LeftCard />
      <RightChart />
    </div>
  );
}

/* ====== Bottom search bar ====== */
function BottomControls() {
  return (
    <div className="px-8 mt-5 flex items-center justify-between">
      <div className="relative w-[280px]">
        <input
          placeholder="Input search"
          className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-3 pr-3 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50">
          <Search className="w-4 h-4 text-gray-600" />
        </button>
        <button className="h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50">
          <SlidersHorizontal className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="text-sm text-gray-600">2 tasks visible</div>
    </div>
  );
}

/* ===================== PAGE ===================== */
export default function ProjectBoardPage() {
const [view, setView] = useState<"Kanban" | "Sprint" | "List">("Kanban");
  const [sprints, setSprints] = useState<SprintVm[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [kanbanFilter, setKanbanFilter] = useState<StatusKey | "all">("all");

  useEffect(() => {
    (async () => {
      const data = await projectApi.getSprints("project-1");
      setSprints(data);
      if (!activeId && data.length) setActiveId(data[0].id);
    })();
  }, []);

  const activeSprint = useMemo(
    () => sprints.find((s) => s.id === activeId) || null,
    [sprints, activeId]
  );

  // Drag trong 1 sprint (đổi cột/status)
  const onDragEndSprint = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const [, srcSprintId, srcStatus] = source.droppableId.split(":");
    const [, dstSprintId, dstStatus] = destination.droppableId.split(":");
    if (srcSprintId !== dstSprintId) return;

    setSprints((prev) => {
      const next = prev.map((s) => ({ ...s, columns: { ...s.columns } }));
      const sprint = next.find((s) => s.id === srcSprintId)!;
      const srcArr = [...sprint.columns[srcStatus as StatusKey]];
      const dstArr = srcStatus === dstStatus ? srcArr : [...sprint.columns[dstStatus as StatusKey]];
      const [moved] = srcArr.splice(source.index, 1);
      dstArr.splice(destination.index, 0, moved);
      sprint.columns[srcStatus as StatusKey] = srcArr;
      sprint.columns[dstStatus as StatusKey] = dstArr;
      return [...next];
    });

    await projectApi.updateTaskPosition({
      projectId: "project-1",
      sprintId: srcSprintId,
      taskId: draggableId,
      toStatus: dstStatus as StatusKey,
      toIndex: destination.index,
    });
  };

  // Drag giữa các sprint (Kanban by sprint)
  const onDragEndKanban = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const [, fromSprintId] = source.droppableId.split(":");
    const [, toSprintId] = destination.droppableId.split(":");
    if (fromSprintId === toSprintId) return;

    setSprints((prev) => {
      const next = prev.map((s) => ({ ...s, columns: { ...s.columns } }));
      const from = next.find((s) => s.id === fromSprintId)!;
      const to = next.find((s) => s.id === toSprintId)!;

      const loc = findTaskInSprint(from, draggableId);
      if (!loc) return prev;

      const [moved] = from.columns[loc.status].splice(loc.index, 1);
      to.columns[loc.status] = [...to.columns[loc.status], moved];
      return [...next];
    });

    await projectApi.updateTaskSprint({
      projectId: "project-1",
      taskId: draggableId,
      fromSprintId,
      toSprintId,
    });
  };
const allTasks = useMemo<TaskVm[]>(
  () => sprints.flatMap(s => flattenSprintTasks(s, "all")),
  [sprints]
);
  return (
    <div className="w-full min-w-0 max-w-[100vw] min-h-screen bg-[#F7F8FA] overflow-x-auto">
      <div className="sticky top-0 z-30 bg-[#F7F8FA] border-b border-gray-100 pb-2 min-w-0">
        <BoardNav
          title="Projects Name"
          view={view}
          onViewChange={setView}
          sprints={sprints}
          activeId={activeId}
          onActiveChange={setActiveId}
        />
      </div>
      
      {/* {view === "Sprint" && <BottomControls />} */}

      <div className="min-w-0 max-w-[100vw]">
        {view === "Sprint" && activeSprint && (
          <SprintBoard sprint={activeSprint} onDragEnd={onDragEndSprint} />
        )}
        {view === "Kanban" && sprints.length > 0 && (
          <KanbanBySprintBoard
            sprints={sprints}
            filter={kanbanFilter}
            onDragEnd={onDragEndKanban}
            // các action là optional; nếu muốn show behavior có thể truyền thêm:
            // onMarkDone={(t)=>{}}
            // onNext={(t)=>{}}
            // onSplit={(t)=>{}}
            // onMoveNext={(t)=>{}}
            // onOpenTicket={(ticketId)=>{}}
          />
        )}
          {view === "List" && (
        <ProjectTaskList
          tasks={allTasks}
          // các action có thể map sang API thật khi bạn nối:
          // onMarkDone={(t)=> ... }
          // onNext={(t)=> ... }
          // onSplit={(t)=> ... }
          // onMoveNext={(t)=> ... }
        />
      )}
      </div>
    </div>
  );
}
