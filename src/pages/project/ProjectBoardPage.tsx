// src/pages/project/ProjectBoardPage.tsx
import React from "react";
import { useParams } from "react-router-dom";
import type { DropResult } from "@hello-pangea/dnd";

import { ProjectBoardProvider, useProjectBoard } from "@/context/ProjectBoardContext";
import { ViewSwitchNav, SearchBar } from "@/components/Company/Projects/BoardNavBits";
import KanbanBySprintBoard from "@/components/Company/Projects/KanbanBySprintBoard";
import SprintBoard from "@/components/Company/Projects/SprintBoard";
import ProjectTaskList from "@/components/Company/Projects/ProjectTaskList";

import type { StatusCategory, SprintVm, TaskVm } from "@/types/projectBoard";

// NEW: dùng mapper để chuẩn hoá cả sprints + tasks thật
import { normalizeBoardInput } from "@/mappers/projectBoardMapper";
import { fetchSprintBoard } from "@/services/projectBoardService.js";

/* ========== Inner: logic view board ========== */
function Inner() {
  const { sprints, tasks, loading, changeStatus, moveToNextSprint, reorder, done, split } =
    useProjectBoard();

  const [view, setView] = React.useState<"Kanban" | "Sprint" | "List">("Kanban");
  const [query, setQuery] = React.useState("");
  const [kanbanFilter, setKanbanFilter] = React.useState<"ALL" | StatusCategory>("ALL");

  // DnD — Sprint view: đổi cột trong cùng sprint (dùng statusId động)
  const onDragEndSprint = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // droppableId format: "col:<sprintId>:<statusId>"
    const [, sprintIdSrc, statusIdSrc] = source.droppableId.split(":");
    const [, sprintIdDst, statusIdDst] = destination.droppableId.split(":");

    if (sprintIdSrc !== sprintIdDst) return;
    if (statusIdSrc === statusIdDst && source.index === destination.index) return;

    const t = tasks.find((x) => x.id === draggableId);
    if (t) await reorder((window as any).__projectId, sprintIdDst, t, statusIdDst, destination.index);
  };

  // DnD — Kanban view: kéo task giữa các sprint (giữ nguyên statusId)
  const onDragEndKanban = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // droppableId format: "spr:<sprintId>"
    const [, fromSprintId] = source.droppableId.split(":");
    const [, toSprintId] = destination.droppableId.split(":");
    if (fromSprintId === toSprintId) return;

    const t = tasks.find((x) => x.id === draggableId);
    if (t) await moveToNextSprint((window as any).__projectId, t, toSprintId);
  };

  // Nghiệp vụ theo workflow động
  const eventApi = {
    onMarkDone: async (t: TaskVm) => {
      const sp = sprints.find((s) => s.id === t.sprintId);
      if (!sp) return;
      const finalId =
        sp.statusOrder.find((id) => sp.statusMeta[id]?.isFinal) ??
        sp.statusOrder[sp.statusOrder.length - 1];
      if (t.workflowStatusId !== finalId) {
        return changeStatus((window as any).__projectId, t, finalId);
      }
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

  // List view: filter theo search
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
          <div className="text-sm text-gray-600">
            {loading ? "Loading…" : `${listTasks.length} tasks`}
          </div>
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
                  kanbanFilter === k
                    ? "text-white border-transparent"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                style={kanbanFilter === k ? { backgroundColor: "#2E8BFF" } : {}}
              >
                {k === "ALL"
                  ? "All"
                  : k === "TODO"
                  ? "To do"
                  : k === "IN_PROGRESS"
                  ? "In progress"
                  : k === "REVIEW"
                  ? "In review"
                  : "Done"}
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

/* ========== Page: load từ BE, không còn demo ========== */
export default function ProjectBoardPage() {
  const { projectId = "project-1" } = useParams<{ projectId: string }>();
  (window as any).__projectId = projectId;

  const [init, setInit] = React.useState<{ sprints: SprintVm[]; tasks: TaskVm[] } | null>(null);

  React.useEffect(() => {
    let dead = false;

    (async () => {
      try {
        const res = await fetchSprintBoard(projectId);
        // res giờ là { sprints:[], tasks:[] }
        const normalized = normalizeBoardInput(res ?? {});
        if (!dead) setInit(normalized);
      } catch (err) {
        console.error("Failed to load sprint board", err);
        if (!dead) setInit({ sprints: [], tasks: [] }); // hết sạch demo, lỗi thì board trống
      }
    })();

    return () => {
      dead = true;
    };
  }, [projectId]);

  if (!init) {
    return <div className="p-8 text-sm text-gray-600">Loading board…</div>;
  }

  // Remount khi đổi projectId để lấy initialData mới
  return (
    <ProjectBoardProvider key={projectId} projectId={projectId} initialData={init}>
      <Inner />
    </ProjectBoardProvider>
  );
}
