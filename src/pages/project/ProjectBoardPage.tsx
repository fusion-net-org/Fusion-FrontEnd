import React from "react";
import { useParams } from "react-router-dom";
import type { DropResult } from "@hello-pangea/dnd";
import { ProjectBoardProvider, useProjectBoard } from "@/context/ProjectBoardContext";
import { ViewSwitchNav, SearchBar } from "@/components/Company/Projects/BoardNavBits";
import KanbanBySprintBoard from "@/components/Company/Projects/KanbanBySprintBoard";
import SprintBoard from "@/components/Company/Projects/SprintBoard";
import ProjectTaskList from "@/components/Company/Projects/ProjectTaskList";
import type { StatusKey, SprintVm, TaskVm, MemberRef } from "@/types/projectBoard";

/* ========== Seed demo data (tuần = sprint) ========== */
function makeDemoBoardData(): { sprints: SprintVm[]; tasks: TaskVm[] } {
  const now = new Date();
  const toISO = (d: Date) => d.toISOString();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 3600 * 1000);

  const startW1 = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -now.getDay());
  const startW2 = addDays(startW1, 7);
  const startW3 = addDays(startW1, 14);

  const sprints: SprintVm[] = [
    { id: "spr-1", name: "Week 1: Authentication", start: toISO(startW1), end: toISO(addDays(startW1, 6)), columns: { todo: [], inprogress: [], inreview: [], done: [] } },
    { id: "spr-2", name: "Week 2: Payments",       start: toISO(startW2), end: toISO(addDays(startW2, 6)), columns: { todo: [], inprogress: [], inreview: [], done: [] } },
    { id: "spr-3", name: "Week 3: Workflow",       start: toISO(startW3), end: toISO(addDays(startW3, 6)), columns: { todo: [], inprogress: [], inreview: [], done: [] } },
  ];
  const m = (name: string, i = 0): MemberRef => ({ id: `mem-${i}-${name.toLowerCase().replace(/\s+/g, "-")}`, name, avatarUrl: `https://i.pravatar.cc/100?img=${(i % 40) + 1}` });
  const T = (id: string, p: Partial<TaskVm>): TaskVm => ({
    id,
    code: `PRJ-${id.toUpperCase()}`,
    title: "Untitled",
    type: "Feature",
    priority: "Medium",
    storyPoints: 3,
    estimateHours: 12,
    remainingHours: 8,
    dueDate: toISO(addDays(now, 5)),
    openedAt: toISO(addDays(now, -2)),
    updatedAt: toISO(now),
    createdAt: toISO(addDays(now, -3)),
    sprintId: "spr-1",
    status: "todo",
    stage: "IN_PROGRESS",
    assignees: [m("Nguyen Duy", 1)],
    dependsOn: [],
    parentTaskId: null,
    carryOverCount: 0,
    sourceTicketId: null,
    sourceTicketCode: null,
    ...p,
  });

  const tasks: TaskVm[] = [
    T("t-101", { title: "Auth flow + refresh token", sprintId: "spr-1", status: "inprogress", storyPoints: 5, estimateHours: 20, remainingHours: 12, priority: "High", assignees: [m("Nguyen Duy", 1), m("Cao Van Dung", 2)] }),
    T("t-102", { title: "Fix payment webhook signature", sprintId: "spr-1", status: "todo", type: "Bug", priority: "Urgent" }),
    T("t-103", { title: "Task too big -> split", sprintId: "spr-1", status: "todo", storyPoints: 8, estimateHours: 32, remainingHours: 28 }),
    T("t-104", { title: "Refactor repository layer", sprintId: "spr-1", status: "inreview" }),
    T("t-105", { title: "User profile page", sprintId: "spr-1", status: "done", priority: "Low", remainingHours: 0 }),
    T("t-201", { title: "Design PayOS mapping", sprintId: "spr-2", status: "todo", type: "Chore", priority: "Low" }),
    T("t-202", { title: "Create payment link API", sprintId: "spr-2", status: "inprogress", priority: "High" }),
    T("t-203", { title: "Handle CancelUrl + webhook", sprintId: "spr-2", status: "todo" }),
    T("t-301", { title: "Workflow designer (edges/guards)", sprintId: "spr-3", status: "todo" }),
  ];

  // đẩy task vào cột theo status
  const byId = new Map(sprints.map((s) => [s.id, s]));
  tasks.forEach((t) => {
    const s = byId.get(t.sprintId || "");
    if (s) (s.columns[t.status] as TaskVm[]).push(t);
  });
  return { sprints: Array.from(byId.values()), tasks };
}

/* ========== Page ========== */
function Inner() {
  const { sprints, tasks, loading } = useProjectBoard();
  const [view, setView] = React.useState<"Kanban" | "Sprint" | "List">("Kanban");
  const [query, setQuery] = React.useState("");
  const [kanbanFilter, setKanbanFilter] = React.useState<StatusKey | "all">("all");

  // handlers
  const { changeStatus, moveToNextSprint, reorder, done, split } = useProjectBoard();

  const onDragEndSprint = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const [, sprintId, srcStatus] = source.droppableId.split(":");
    const [, sprintId2, dstStatus] = destination.droppableId.split(":");
    if (sprintId !== sprintId2) return;
    if (srcStatus === dstStatus && source.index === destination.index) return;
    const t = tasks.find((x) => x.id === draggableId);
    if (t) await reorder((window as any).__projectId, sprintId, t, dstStatus as StatusKey, destination.index);
  };

  const onDragEndKanban = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const [, fromSprintId] = source.droppableId.split(":");
    const [, toSprintId] = destination.droppableId.split(":");
    if (fromSprintId === toSprintId) return;
    const t = tasks.find((x) => x.id === draggableId);
    if (t) await moveToNextSprint((window as any).__projectId, t, toSprintId);
  };

  const eventApi = {
    onMarkDone: (t: TaskVm) => done((window as any).__projectId, t),
    onNext: (t: TaskVm) => {
      const next: Record<StatusKey, StatusKey> = { todo: "inprogress", inprogress: "inreview", inreview: "done", done: "done" };
      return changeStatus((window as any).__projectId, t, next[t.status]);
    },
    onSplit: (t: TaskVm) => split((window as any).__projectId, t),
    onMoveNext: (t: TaskVm) => {
      // tìm sprint tiếp theo và move
      const idx = sprints.findIndex((s) => s.id === (t.sprintId ?? ""));
      const next = sprints[idx + 1];
      if (next) return moveToNextSprint((window as any).__projectId, t, next.id);
    },
  };

  // List: filter theo search
  const listTasks = React.useMemo(() => {
    const k = query.trim().toLowerCase();
    if (!k) return tasks;
    return tasks.filter((t) => `${t.code} ${t.title}`.toLowerCase().includes(k));
  }, [tasks, query]);

  return (
    <div className="w-full min-h-screen bg-[#F7F8FA]">
      {/* Header: chỉ có switch view (KHÔNG còn tabs tuần ở đây) */}
      <div className="sticky top-0 z-30 bg-[#F7F8FA] border-b border-gray-100">
        <ViewSwitchNav title="Projects Name" view={view} onChange={setView} />
      </div>

      {/* List có search; Kanban/Sprint không cần search trên đầu */}
      {view === "List" && (
        <div className="px-8 mt-5 flex items-center justify-between">
          <SearchBar value={query} onChange={setQuery} />
          <div className="text-sm text-gray-600">{loading ? "Loading…" : `${listTasks.length} tasks`}</div>
        </div>
      )}

      {/* Kanban = tổng theo sprint (không có thanh tuần riêng) */}
      {view === "Kanban" && (
        <>
          <div className="px-8 mt-5 flex items-center gap-2 flex-wrap">
            {(["all", "todo", "inprogress", "inreview", "done"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKanbanFilter(k as any)}
                className={`h-8 px-3 rounded-full border text-xs shadow-sm ${
                  kanbanFilter === k ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                style={kanbanFilter === k ? { backgroundColor: "#2E8BFF" } : {}}
              >
                {k === "all" ? "All" : k === "todo" ? "To do" : k === "inprogress" ? "In progress" : k === "inreview" ? "In review" : "Done"}
              </button>
            ))}
          </div>
          <KanbanBySprintBoard sprints={sprints} filter={kanbanFilter} onDragEnd={onDragEndKanban} {...eventApi} />
        </>
      )}

      {/* Sprint: dùng component trong project (có tabs tuần nội bộ) */}
      {view === "Sprint" && <SprintBoard onDragEnd={onDragEndSprint} {...eventApi} />}
      {/* Nếu SprintBoard của bạn yêu cầu prop sprint, đổi thành:
          {view === "Sprint" && activeSprint && (
            <SprintBoard sprint={activeSprint} onDragEnd={onDragEndSprint} {...eventApi} />
          )} */}

      {view === "List" && <ProjectTaskList tasks={listTasks} {...eventApi} />}
    </div>
  );
}

/* ========== Mount with demo data ========== */
export default function ProjectBoardPage() {
  const { projectId = "project-1" } = useParams();
  (window as any).__projectId = projectId;
  const demo = React.useMemo(() => makeDemoBoardData(), []);
  return (
    <ProjectBoardProvider projectId={projectId} initialData={demo}>
      <Inner />
    </ProjectBoardProvider>
  );
}
