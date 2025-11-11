import React from "react";
import { useParams } from "react-router-dom";
import type { DropResult } from "@hello-pangea/dnd";
import { ProjectBoardProvider, useProjectBoard } from "@/context/ProjectBoardContext";
import { ViewSwitchNav, SearchBar } from "@/components/Company/Projects/BoardNavBits";
import KanbanBySprintBoard from "@/components/Company/Projects/KanbanBySprintBoard";
import SprintBoard from "@/components/Company/Projects/SprintBoard";
import ProjectTaskList from "@/components/Company/Projects/ProjectTaskList";
import type {
  StatusCategory,
  StatusMeta,
  SprintVm,
  TaskVm,
  MemberRef,
} from "@/types/projectBoard";

// ⬇️ NEW: gọi API + mapper để nhận sprint thật
import { fetchSprintBoard } from "@/services/projectBoardService.js";
import { mapSprint } from "@/mappers/projectBoardMapper";

/* ========== Seed demo data (workflow động) ========== */
function makeDemoBoardData(): { sprints: SprintVm[]; tasks: TaskVm[] } {
  const now = new Date();
  const toISO = (d: Date) => d.toISOString();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 3600 * 1000);

  const startW1 = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -now.getDay());
  const startW2 = addDays(startW1, 7);
  const startW3 = addDays(startW1, 14);

  // Workflow mẫu
  const wf: StatusMeta[] = [
    { id: "st-todo", code: "todo", name: "To do", category: "TODO", order: 1, color: "#94A3B8" },
    { id: "st-dev", code: "inprogress", name: "In progress", category: "IN_PROGRESS", order: 2, color: "#F59E0B" },
    { id: "st-rev", code: "inreview", name: "In review", category: "REVIEW", order: 3, color: "#6366F1" },
    { id: "st-done", code: "done", name: "Done", category: "DONE", order: 4, color: "#10B981", isFinal: true },
  ];
  const statusOrder = [...wf].sort((a, b) => a.order - b.order).map((s) => s.id);
  const statusMeta = Object.fromEntries(wf.map((s) => [s.id, s]));
  const mkEmptyCols = () => Object.fromEntries(statusOrder.map((id) => [id, [] as TaskVm[]]));

  const sprints: SprintVm[] = [
    {
      id: "spr-1",
      name: "Week 1: Authentication",
      start: toISO(startW1),
      end: toISO(addDays(startW1, 6)),
      state: "Active",
      capacityHours: 160,
      committedPoints: 30,
      workflowId: "wf-1",
      statusOrder,
      statusMeta,
      columns: mkEmptyCols(),
    },
    {
      id: "spr-2",
      name: "Week 2: Payments",
      start: toISO(startW2),
      end: toISO(addDays(startW2, 6)),
      state: "Planning",
      capacityHours: 160,
      committedPoints: 28,
      workflowId: "wf-1",
      statusOrder,
      statusMeta,
      columns: mkEmptyCols(),
    },
    {
      id: "spr-3",
      name: "Week 3: Workflow",
      start: toISO(startW3),
      end: toISO(addDays(startW3, 6)),
      state: "Planning",
      capacityHours: 160,
      committedPoints: 26,
      workflowId: "wf-1",
      statusOrder,
      statusMeta,
      columns: mkEmptyCols(),
    },
  ];

  const sprintById = new Map(sprints.map((s) => [s.id, s]));
  const metaByCode = Object.fromEntries(wf.map((s) => [s.code, s]));

  const m = (name: string, i = 0): MemberRef => ({
    id: `mem-${i}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    avatarUrl: `https://i.pravatar.cc/100?img=${(i % 40) + 1}`,
  });

  const T = (id: string, p: Partial<TaskVm>): TaskVm => {
    const def = metaByCode["todo"];
    return {
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
      workflowStatusId: def.id,
      statusCode: def.code,
      statusCategory: def.category,
      assignees: [m("Nguyen Duy", 1)],
      dependsOn: [],
      parentTaskId: null,
      carryOverCount: 0,
      sourceTicketId: null,
      sourceTicketCode: null,
      ...p,
    };
  };

  const tasks: TaskVm[] = [
    T("t-101", {
      title: "Auth flow + refresh token",
      sprintId: "spr-1",
      ...(() => {
        const s = metaByCode["inprogress"];
        return { workflowStatusId: s.id, statusCode: s.code, statusCategory: s.category, storyPoints: 5, estimateHours: 20, remainingHours: 12, priority: "High", assignees: [m("Nguyen Duy", 1), m("Cao Van Dung", 2)] };
      })(),
    }),
    T("t-102", {
      title: "Fix payment webhook signature",
      sprintId: "spr-1",
      type: "Bug",
      priority: "Urgent",
      ...(() => {
        const s = metaByCode["todo"];
        return { workflowStatusId: s.id, statusCode: s.code, statusCategory: s.category };
      })(),
    }),
    T("t-103", {
      title: "Task too big -> split",
      sprintId: "spr-1",
      storyPoints: 8,
      estimateHours: 32,
      remainingHours: 28,
      ...(() => {
        const s = metaByCode["todo"];
        return { workflowStatusId: s.id, statusCode: s.code, statusCategory: s.category };
      })(),
    }),
    T("t-104", {
      title: "Refactor repository layer",
      sprintId: "spr-1",
      ...(() => {
        const s = metaByCode["inreview"];
        return { workflowStatusId: s.id, statusCode: s.code, statusCategory: s.category };
      })(),
    }),
    T("t-105", {
      title: "User profile page",
      sprintId: "spr-1",
      priority: "Low",
      remainingHours: 0,
      ...(() => {
        const s = metaByCode["done"];
        return { workflowStatusId: s.id, statusCode: s.code, statusCategory: s.category };
      })(),
    }),
    T("t-201", {
      title: "Design PayOS mapping",
      sprintId: "spr-2",
      type: "Chore",
      priority: "Low",
    }),
    T("t-202", {
      title: "Create payment link API",
      sprintId: "spr-2",
      priority: "High",
      ...(() => {
        const s = metaByCode["inprogress"];
        return { workflowStatusId: s.id, statusCode: s.code, statusCategory: s.category };
      })(),
    }),
    T("t-203", {
      title: "Handle CancelUrl + webhook",
      sprintId: "spr-2",
    }),
    T("t-301", {
      title: "Workflow designer (edges/guards)",
      sprintId: "spr-3",
    }),
  ];

  // đẩy task vào cột theo statusId
  tasks.forEach((t) => {
    const s = t.sprintId ? sprintById.get(t.sprintId) : undefined;
    if (!s) return;
    if (!Array.isArray(s.columns[t.workflowStatusId])) s.columns[t.workflowStatusId] = [];
    (s.columns[t.workflowStatusId] as TaskVm[]).push(t);
  });

  return { sprints: Array.from(sprintById.values()), tasks };
}

/* ========== Page ========== */
function Inner() {
  const { sprints, tasks, loading, changeStatus, moveToNextSprint, reorder, done, split } = useProjectBoard();

  const [view, setView] = React.useState<"Kanban" | "Sprint" | "List">("Kanban");
  const [query, setQuery] = React.useState("");
  const [kanbanFilter, setKanbanFilter] = React.useState<"ALL" | StatusCategory>("ALL");

  // DnD — Sprint view: đổi cột trong cùng sprint
  const onDragEndSprint = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // "col:<sprintId>:<statusId>"
    const [, sprintIdSrc, statusIdSrc] = source.droppableId.split(":");
    const [, sprintIdDst, statusIdDst] = destination.droppableId.split(":");

    if (sprintIdSrc !== sprintIdDst) return;
    if (statusIdSrc === statusIdDst && source.index === destination.index) return;

    const t = tasks.find((x) => x.id === draggableId);
    if (t) await reorder((window as any).__projectId, sprintIdDst, t, statusIdDst, destination.index);
  };

  // DnD — Kanban view: kéo giữa sprint (giữ nguyên status)
  const onDragEndKanban = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // "spr:<sprintId>" cho lane sprint (tuỳ component KanbanBySprintBoard)
    const [, fromSprintId] = source.droppableId.split(":");
    const [, toSprintId] = destination.droppableId.split(":");
    if (fromSprintId === toSprintId) return;

    const t = tasks.find((x) => x.id === draggableId);
    if (t) await moveToNextSprint((window as any).__projectId, t, toSprintId);
  };

  // Hành vi theo workflow động
  const eventApi = {
    onMarkDone: async (t: TaskVm) => {
      const sp = sprints.find((s) => s.id === t.sprintId);
      if (!sp) return;
      const finalId = sp.statusOrder.find((id) => sp.statusMeta[id]?.isFinal) ?? sp.statusOrder[sp.statusOrder.length - 1];
      if (t.workflowStatusId !== finalId) return changeStatus((window as any).__projectId, t, finalId);
      return done((window as any).__projectId, t);
    },
    onNext: async (t: TaskVm) => {
      const sp = sprints.find((s) => s.id === t.sprintId);
      if (!sp) return;
      const idx = sp.statusOrder.indexOf(t.workflowStatusId);
      const nextId = sp.statusOrder[Math.min(idx + 1, sp.statusOrder.length - 1)];
      if (nextId && nextId !== t.workflowStatusId) {
        return changeStatus((window as any).__projectId, t, nextId);
      }
    },
    onSplit: (t: TaskVm) => split((window as any).__projectId, t),
    onMoveNext: (t: TaskVm) => {
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
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#F7F8FA] border-b border-gray-100">
        <ViewSwitchNav title="Projects Name" view={view} onChange={setView} />
      </div>

      {/* List có search */}
      {view === "List" && (
        <div className="px-8 mt-5 flex items-center justify-between">
          <SearchBar value={query} onChange={setQuery} />
          <div className="text-sm text-gray-600">{loading ? "Loading…" : `${listTasks.length} tasks`}</div>
        </div>
      )}

      {/* Kanban: filter theo StatusCategory */}
      {view === "Kanban" && (
        <>
          <div className="px-8 mt-5 flex items-center gap-2 flex-wrap">
            {(["ALL", "TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKanbanFilter(k)}
                className={`h-8 px-3 rounded-full border text-xs shadow-sm ${
                  kanbanFilter === k ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                style={kanbanFilter === k ? { backgroundColor: "#2E8BFF" } : {}}
              >
                {k === "ALL" ? "All" : k === "TODO" ? "To do" : k === "IN_PROGRESS" ? "In progress" : k === "REVIEW" ? "In review" : "Done"}
              </button>
            ))}
          </div>
          <KanbanBySprintBoard
            sprints={sprints}
            filterCategory={kanbanFilter}
            onDragEnd={onDragEndKanban}
            {...eventApi}
          />
        </>
      )}

      {/* Sprint view */}
      {view === "Sprint" && <SprintBoard onDragEnd={onDragEndSprint} {...eventApi} />}

      {/* List view */}
      {view === "List" && <ProjectTaskList tasks={listTasks} {...eventApi} />}
    </div>
  );
}

/* ========== Mount with BE sprints + fake tasks ========== */
export default function ProjectBoardPage() {
  const { projectId = "project-1" } = useParams();
  (window as any).__projectId = projectId;

  const demo = React.useMemo(() => makeDemoBoardData(), []);
  const [init, setInit] = React.useState<{ sprints: SprintVm[]; tasks: TaskVm[] } | null>(null);

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const res = await fetchSprintBoard(projectId);
        // Hỗ trợ cả 2 format BE:
        // - { sprints: [...] }
        // - { sprint: {...} }  -> chuyển thành mảng 1 phần tử
        const rawSprints = Array.isArray(res?.sprints)
          ? res.sprints
          : res?.sprint
          ? [res.sprint]
          : [];

        const mapped = rawSprints.length ? rawSprints.map(mapSprint) : demo.sprints;
        if (!dead) setInit({ sprints: mapped, tasks: demo.tasks }); // task vẫn giả
      } catch {
        if (!dead) setInit({ sprints: demo.sprints, tasks: demo.tasks });
      }
    })();
    return () => {
      dead = true;
    };
  }, [projectId, demo.sprints, demo.tasks]);

  if (!init) {
    return <div className="p-8 text-sm text-gray-600">Loading board…</div>;
  }

  // Remount provider khi đổi projectId để lấy initialData mới ngay lần đầu
  return (
    <ProjectBoardProvider key={projectId} projectId={projectId} initialData={init}>
      <Inner />
    </ProjectBoardProvider>
  );
}
