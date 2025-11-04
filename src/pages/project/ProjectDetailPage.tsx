// Single-file build for canvas preview (unified views)
// Gradients removed, neutral UI; only task-side priority bar remains.
// In your app, split into files as needed.

/* ===================== Imports ===================== */
import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  ChevronLeft,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

/* ===================== Types ===================== */
export type StatusKey = "todo" | "inprogress" | "inreview" | "done";
export type Priority = "Urgent" | "High" | "Medium" | "Low";

export type TaskVm = {
  id: string;
  code: string; // e.g. PRJ-123
  title: string; // task title
  priority: Priority;
  type: string; // Feature / Bug / Chore
  memberCount: number; // number of members
  dueDate?: string; // dd-mm-yyyy
  assigneeName?: string; // display name
};

export type SprintVm = {
  id: string;
  name: string; // e.g. "Week 1: Name task"
  startDate?: string; // dd-mm-yyyy
  endDate?: string; // dd-mm-yyyy
  columns: Record<StatusKey, TaskVm[]>;
};

/* ===================== Helpers & Theme ===================== */
const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
const statusOrder: StatusKey[] = ["todo", "inprogress", "inreview", "done"];

function flattenSprintTasks(
  sprint: SprintVm,
  filter: StatusKey | "all" = "all"
): TaskVm[] {
  if (filter !== "all") return sprint.columns[filter];
  const list: TaskVm[] = [];
  for (const st of statusOrder) list.push(...sprint.columns[st]);
  return list;
}

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

function computeSprintStats(s: SprintVm) {
  const total = flattenSprintTasks(s, "all").length;
  const done = s.columns.done.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

const priorityBarColor: Record<Priority, string> = {
  Urgent: "#EF4444", // red-500
  High: "#F59E0B", // amber-500
  Medium: "#3B82F6", // blue-500
  Low: "#9CA3AF", // gray-400
};

/* ===================== API Stubs ===================== */
// Replace these with real axios/fetch calls in your project.
export const projectApi = {
  async getSprints(projectId: string): Promise<SprintVm[]> {
    return [
      {
        id: "s1",
        name: "Week 1: Name task",
        startDate: "09-10-2025",
        endDate: "30-10-2025",
        columns: {
          todo: [
            {
              id: "t1",
              code: "PRJ-123",
              title: "Projects Name",
              priority: "Urgent",
              type: "Feature",
              memberCount: 6,
              dueDate: "30-10-2025",
              assigneeName: "Nguyen Duy",
            },
          ],
          inprogress: [
            {
              id: "t2",
              code: "PRJ-123",
              title: "Projects Name",
              priority: "High",
              type: "Bug",
              memberCount: 6,
              dueDate: "30-10-2025",
              assigneeName: "Nguyen Duy",
            },
            {
              id: "t3",
              code: "PRJ-123",
              title: "Projects Name",
              priority: "Medium",
              type: "Feature",
              memberCount: 9,
              dueDate: "30-10-2025",
              assigneeName: "Nguyen Duy",
            },
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

  async updateTaskPosition(params: {
    projectId: string;
    sprintId: string;
    taskId: string;
    toStatus: StatusKey;
    toIndex: number;
  }) {
    // PUT /projects/:projectId/sprints/:sprintId/tasks/:taskId/position
    return true;
  },

  async updateTaskSprint(params: {
    projectId: string;
    taskId: string;
    fromSprintId: string;
    toSprintId: string;
  }) {
    // PUT /projects/:projectId/tasks/:taskId/sprint { fromSprintId, toSprintId }
    return true;
  },
};

/* ===================== Atoms ===================== */
export function Chip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 h-6 text-[12px] rounded-full border bg-white text-gray-600 border-gray-200">
      {children}
    </span>
  );
}

function AvatarStack({ count = 3 }: { count?: number }) {
  return (
    <div className="flex -space-x-2">
      {new Array(count).fill(0).map((_, i) => (
        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" />
      ))}
    </div>
  );
}

export function StatBox({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-[18px] font-semibold text-gray-800">{value}</span>
    </div>
  );
}



export function ViewSwitchNav({
  view,
  onChange,
  title,
}: {
  view: "Kanban" | "Sprint";
  onChange: (v: "Kanban" | "Sprint") => void;
  title: string;
}) {
  const Pill = ({
    children,
    selected,
    onClick,
    title,
  }: {
    children: React.ReactNode;
    selected?: boolean;
    onClick: () => void;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "h-10 px-4 rounded-lg border text-sm font-medium",
        selected ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      )}
      style={selected ? { backgroundColor: brand } : {}}
    >
      {children}
    </button>
  );

  return (
    <div className="px-8 mt-5">
      <div className="text-[22px] font-semibold text-gray-900">{title}</div>
      <div className="mt-3 inline-flex items-center gap-1 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
        <Pill
          selected={view === "Kanban"}
          onClick={() => onChange("Kanban")}
          title="Manage across sprints (Weeks)"
        >
          Sprints Overview
        </Pill>
        <Pill
          selected={view === "Sprint"}
          onClick={() => onChange("Sprint")}
          title="Status board for the active sprint"
        >
          Sprint Board
        </Pill>
      </div>
    </div>
  );
}

export function SprintTabsNav({
  sprints,
  activeId,
  onChange,
}: {
  sprints: SprintVm[];
  activeId: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="px-8 mt-4 overflow-x-auto">
      <div className="flex items-center gap-3 min-w-max">
        {sprints.map((s) => {
          const selected = s.id === activeId;
          const stats = computeSprintStats(s);
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={cn(
                "h-9 px-4 rounded-xl border whitespace-nowrap inline-flex items-center gap-2 shadow-sm",
                selected ? "text-white border-transparent" : "bg-white text-gray-700 hover:bg-gray-50"
              )}
              style={selected ? { backgroundColor: brand } : {}}
              title={`${s.startDate ?? ""}${s.endDate ? " → " + s.endDate : ""}`}
            >
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                {s.name.split(":")[0]}
              </span>
              <span className="font-medium">{s.name}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200">
                {stats.total} tasks
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== Task & Board (Sprint mode) ===================== */
export function TaskCard({ task }: { task: TaskVm }) {
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50">
      {/* priority solid side bar */}
      <div
        className="absolute left-0 top-0 h-full w-[6px] rounded-l-2xl"
        style={{ backgroundColor: priorityBarColor[task.priority], opacity: task.priority === "Low" ? 0.25 : 1 }}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-[12px] tracking-wide">{task.code}</span>
          <button className="p-1 rounded hover:bg-gray-100">
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="mt-1 text-[15px] font-semibold text-gray-800">{task.title}</div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {/* priority chip removed to keep only the side bar as color indicator */}
          <Chip>{task.type}</Chip>
          <Chip>
            <Users className="w-3.5 h-3.5" /> {task.memberCount} members
          </Chip>
        </div>
        {task.dueDate && (
          <div className="mt-3 flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-[13px]">{task.dueDate}</span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 text-[12px]">
            <div className="w-6 h-6 rounded-full bg-gray-200" />
            {task.assigneeName && <span className="text-gray-700">{task.assigneeName}</span>}
          </div>
          <AvatarStack count={3} />
        </div>
      </div>
    </div>
  );
}

export function BoardColumn({
  title,
  tone,
  children,
  right,
  emptyHeight = 420,
}: {
  title: string;
  tone: "amber" | "blue" | "purple" | "green";
  children?: React.ReactNode;
  right?: React.ReactNode;
  emptyHeight?: number;
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
        "rounded-2xl border border-gray-200 bg-white overflow-hidden ring-1 h-full flex flex-col",
        ring[tone]
      )}
      style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.06)" }}
    >
      <div className={cn("h-2 w-full", topBar[tone])} />
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center text-[12px] font-semibold px-2 py-0.5 rounded-full border",
              tone === "amber"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : tone === "blue"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : tone === "purple"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-green-50 text-green-700 border-green-200"
            )}
          >
            {title}
          </span>
          {right}
        </div>
      </div>

      {/* ---- Khu vực task: chiếm phần còn lại + cuộn dọc ---- */}
      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        <div className="space-y-4">
          {children}
          {!children && (
            <div style={{ height: emptyHeight }} className="rounded-xl bg-gray-50" />
          )}
        </div>
      </div>
    </div>
  );
}


export function SprintBoard({
  sprint,
  onDragEnd,
}: {
  sprint: SprintVm;
  onDragEnd: (result: DropResult) => void;
}) {
  const colInfo: Array<{
    key: StatusKey;
    title: string;
    tone: "amber" | "blue" | "purple" | "green";
  }> = [
    { key: "todo", title: "To do", tone: "amber" },
    { key: "inprogress", title: "In progress", tone: "blue" },
    { key: "inreview", title: "Inreview", tone: "purple" },
    { key: "done", title: "Done", tone: "green" },
  ];

  return (
  <DragDropContext onDragEnd={onDragEnd}>
    <div className="px-8 mt-5 pb-4 min-w-0">
      <div
        className="overflow-x-auto overscroll-x-contain rounded-xl"
        style={{ height: "calc(100vh - 220px)" }} // cùng offset với Kanban
      >
        <div className="inline-flex gap-4 h-full">
          {colInfo.map((c) => (
            <div key={c.key} className="shrink-0 h-full w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]">
              <Droppable droppableId={`sprint:${sprint.id}:${c.key}`}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="h-full">
                    <BoardColumn
                      title={c.title}
                      tone={c.tone}
                      right={
                        <span className="text-[12px] text-gray-500">
                          {sprint.columns[c.key].length} tasks
                        </span>
                      }
                    >
                      {sprint.columns[c.key].map((task, idx) => (
                        <Draggable key={task.id} draggableId={task.id} index={idx}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={dragSnapshot.isDragging ? "rotate-[0.5deg]" : ""}
                            >
                              <TaskCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </BoardColumn>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </div>
    </div>
  </DragDropContext>
);

}

/* ===================== Kanban Board (columns = Sprints) ===================== */
export function KanbanBySprintBoard({
  sprints,
  filter = "all",
  onDragEnd,
}: {
  sprints: SprintVm[];
  filter?: StatusKey | "all";
  onDragEnd: (result: DropResult) => void;
}) {
  // khoảng chiều cao bị chiếm (header, tabs, search…) để trừ ra cho board
  const TOP_OFFSET = 220;                     // tinh chỉnh theo layout của bạn
  const BOARD_H = `calc(100vh - ${TOP_OFFSET}px)`;

  // chiều rộng cột cố định theo thiết bị
  const COL_W_CLASS =
    "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* KHUNG chứa board: chỉ khung này cuộn ngang */}
      <div className="px-8 mt-5 pb-4 min-w-0">
        <div
          className="overflow-x-auto overscroll-x-contain rounded-xl"
          style={{ height: BOARD_H }}
        >
          {/* Một hàng, không wrap */}
          <div className="inline-flex gap-4 h-full pr-8">
            {sprints.map((s, colIdx) => {
              const stats = computeSprintStats(s);
              return (
                <div key={s.id} className={`shrink-0 h-full ${COL_W_CLASS}`}>
                  <Droppable droppableId={`kanban:${s.id}`}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="h-full">
                        <BoardColumn
                          title={s.name}
                          tone={
                            (colIdx % 4 === 0
                              ? "amber"
                              : colIdx % 4 === 1
                              ? "blue"
                              : colIdx % 4 === 2
                              ? "purple"
                              : "green") as any
                          }
                          right={
                            <div className="flex items-center gap-2 text-[12px]">
                              <span className="text-gray-600">{stats.total} tasks</span>
                              <span className="text-green-700 font-semibold">{stats.pct}%</span>
                            </div>
                          }
                        >
                          {/* mini progress bar ở trên vùng cuộn */}
                          <div className="h-1.5 w-full rounded-full bg-gray-100">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${stats.pct}%`, backgroundColor: brand }}
                            />
                          </div>

                          {/* danh sách task cuộn dọc (đã enable ở BoardColumn) */}
                          {flattenSprintTasks(s, filter).map((task, idx) => (
                            <Draggable key={task.id} draggableId={task.id} index={idx}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={dragSnapshot.isDragging ? "rotate-[0.5deg]" : ""}
                                >
                                  <TaskCard task={task} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </BoardColumn>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}


/* ===================== Analytics ===================== */
export function WeekAreaChart() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-800">Title of section</div>
        <span className="text-xs text-gray-400">↗</span>
      </div>
      <div className="mt-2">
        <svg viewBox="0 0 600 220" className="w-full h-[180px]">
          <path
            d="M0 90 C 110 70, 160 100, 230 80 C 280 65, 330 120, 380 70 C 440 40, 520 140, 600 110"
            fill="none"
            stroke={brand}
            strokeWidth="3"
          />
          <path
            d="M0 160 C 100 220, 150 110, 230 130 C 290 145, 330 90, 380 150 C 420 180, 500 200, 600 120"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
          />
          {[{ x: 40, y: 90 }, { x: 150, y: 75 }, { x: 230, y: 80 }, { x: 330, y: 120 }, { x: 380, y: 70 }, { x: 540, y: 110 }].map(
            (p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill={brand} />
            )
          )}
          {[{ x: 50, y: 160 }, { x: 110, y: 215 }, { x: 230, y: 130 }, { x: 330, y: 90 }, { x: 420, y: 180 }, { x: 560, y: 120 }].map(
            (p, i) => (
              <circle key={`g${i}`} cx={p.x} cy={p.y} r="4" fill="#22c55e" />
            )
          )}
        </svg>
      </div>
    </div>
  );
}

export function OverviewCard({
  rangeLabel = "09-10-2025 → 30-10-2025",
  daysPastLabel = "143 days past",
}: {
  rangeLabel?: string;
  daysPastLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-gray-500 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{rangeLabel}</span>
        </div>
        <span className="text-[12px] text-gray-400">{daysPastLabel}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatBox label="Committed pts" value={<span className="text-blue-600">5</span>} />
        <StatBox label="Done pts" value={<span className="text-green-600">6</span>} />
        <StatBox label="Task" value={<span>9</span>} />
        <StatBox label="Completion" value={<span className="text-green-600">75%</span>} />
      </div>
      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-1">Overview</div>
        <div className="h-1.5 w-full rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full" style={{ width: "60%", backgroundColor: brand }} />
        </div>
      </div>
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search tasks",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-[300px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 shadow-sm"
      />
    </div>
  );
}

/* ===================== Unified Page (Sprints Overview + Sprint Board) ===================== */
export function ProjectBoardPage() {
  const [view, setView] = useState<"Kanban" | "Sprint">("Kanban");
  const [sprints, setSprints] = useState<SprintVm[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
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

  // Drag logic for Sprint view (move across statuses within same sprint)
  const onDragEndSprint = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const [, srcSprintId, srcStatus] = source.droppableId.split(":");
    const [, dstSprintId, dstStatus] = destination.droppableId.split(":");
    if (srcSprintId !== dstSprintId) return; // restrict inside same sprint

    setSprints((prev) => {
      const next = prev.map((s) => ({ ...s, columns: { ...s.columns } }));
      const sprint = next.find((s) => s.id === srcSprintId)!;
      const srcArr = [...sprint.columns[srcStatus as StatusKey]];
      const dstArr =
        srcStatus === dstStatus
          ? srcArr
          : [...sprint.columns[dstStatus as StatusKey]];
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

  // Drag logic for Kanban view (move across sprint columns; keep status)
  const onDragEndKanban = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const [, fromSprintId] = source.droppableId.split(":"); // kanban:<sprintId>
    const [, toSprintId] = destination.droppableId.split(":");
    if (fromSprintId === toSprintId) return; // same sprint, do nothing here (order per-status not supported in Kanban)

    setSprints((prev) => {
      const next = prev.map((s) => ({ ...s, columns: { ...s.columns } }));
      const from = next.find((s) => s.id === fromSprintId)!;
      const to = next.find((s) => s.id === toSprintId)!;

      const loc = findTaskInSprint(from, draggableId);
      if (!loc) return prev; // safety

      const [moved] = from.columns[loc.status].splice(loc.index, 1);
      // Keep original status; append to destination same status
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

  return (
    <div className="w-full min-h-screen bg-[#F7F8FA]">

      {/* Sticky nav */}
      <div className="sticky top-0 z-30 bg-[#F7F8FA] border-b border-gray-100">
        <ViewSwitchNav title="Projects Name" view={view} onChange={setView} />
        <SprintTabsNav sprints={sprints} activeId={activeId} onChange={setActiveId} />
      </div>

      {/* Analytics visible in Sprint view only */}
      {view === "Sprint" && (
        <div className="px-8 mt-5 grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-4 space-y-3">
            <OverviewCard />
          </div>
          <div className="col-span-12 lg:col-span-8">
            <WeekAreaChart />
          </div>
        </div>
      )}

      {/* Search & Controls */}
      <div className="px-8 mt-5 flex items-center justify-between">
        <SearchBar value={query} onChange={setQuery} />
        <div className="flex items-center gap-3 text-gray-500">
          <button className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 shadow-sm">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">2 tasks visible</span>
        </div>
      </div>

      {/* Kanban status filter chips */}
      {view === "Kanban" && (
        <div className="px-8 mt-3 flex items-center gap-2 flex-wrap">
          {(["all", ...statusOrder] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKanbanFilter(k as any)}
              className={cn(
                "h-8 px-3 rounded-full border text-xs shadow-sm",
                kanbanFilter === k
                  ? "text-white border-transparent"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
              style={kanbanFilter === k ? { backgroundColor: brand } : {}}
            >
              {k === "all" ? "All" : k === "todo" ? "To do" : k === "inprogress" ? "In progress" : k === "inreview" ? "Inreview" : "Done"}
            </button>
          ))}
        </div>
      )}

      {/* Boards */}
      {view === "Sprint" && activeSprint && (
        <SprintBoard sprint={activeSprint} onDragEnd={onDragEndSprint} />
      )}

      {view === "Kanban" && sprints.length > 0 && (
        <KanbanBySprintBoard sprints={sprints} filter={kanbanFilter} onDragEnd={onDragEndKanban} />
      )}
    </div>
  );
}

/* ===================== Dev tests (no-op) ===================== */
const __DEV_TESTS__ = false;
if (__DEV_TESTS__) {
  const s: SprintVm = {
    id: "sX",
    name: "Week X",
    columns: { todo: [{ id: "a", code: "A", title: "A", priority: "Low", type: "Chore", memberCount: 1 }], inprogress: [], inreview: [], done: [] },
  };
  console.assert(flattenSprintTasks(s, "all").length === 1, "flatten all should include todo");
  console.assert(flattenSprintTasks(s, "todo").length === 1, "flatten todo should be 1");
  console.assert(findTaskInSprint(s, "a")?.status === "todo", "findTaskInSprint locates by id");
  console.assert(computeSprintStats(s).pct === 0, "pct 0 when none done");
}

/*
  ====================
  Export default for canvas preview. In your app you can route to this single
  page and keep both tabs here.
  ====================
*/
export default ProjectBoardPage;
