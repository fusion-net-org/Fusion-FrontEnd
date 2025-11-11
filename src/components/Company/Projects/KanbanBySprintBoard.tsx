// src/components/KanbanBySprintBoard.tsx
import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import TaskCard from "@/components/Company/Projects/TaskCard";
import type { SprintVm, TaskVm, StatusCategory } from "@/types/projectBoard";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

/* ================== Helpers ================== */

/** Lấy tasks của sprint theo filter category (workflow động) từ columns thật */
const flattenSprintTasks = (
  s: SprintVm,
  filterCategory: "ALL" | StatusCategory = "ALL"
): TaskVm[] => {
  const order = s.statusOrder ?? Object.keys(s.columns ?? {});
  const out: TaskVm[] = [];
  for (const stId of order) {
    const arr = (s.columns?.[stId] as TaskVm[]) ?? [];
    if (filterCategory === "ALL") out.push(...arr);
    else out.push(...arr.filter((t) => t.statusCategory === filterCategory));
  }
  return out;
};

const sprintHasRealTasks = (s: SprintVm) =>
  flattenSprintTasks(s, "ALL").length > 0;

/** Sinh task demo ổn định theo sprint (để nhìn UI khi chưa có dữ liệu) */
function makeDemoTasksForSprint(s: SprintVm): TaskVm[] {
  const order = s.statusOrder?.length ? s.statusOrder : Object.keys(s.columns ?? {});
  const take = Math.min(4, Math.max(2, order.length)); // 2–4 tasks
  const now = new Date();
  const mkIso = (d: Date) => d.toISOString();

  const list: TaskVm[] = [];
  for (let i = 0; i < take; i++) {
    const stId = order[i % order.length];
    const meta = s.statusMeta?.[stId];
    const idx = i + 1;

    list.push({
      id: `__demo_${s.id}_${stId}_${idx}`,
      code: `DEMO-${idx}`,
      title:
        (meta?.category === "IN_PROGRESS" && idx % 2 === 0)
          ? "Implement payment link API"
          : (meta?.category === "REVIEW"
              ? "Code review + unit tests"
              : (meta?.category === "DONE"
                  ? "User profile page"
                  : "Fix webhook signature")),
      type: (idx % 3 === 0 ? "Bug" : idx % 3 === 1 ? "Feature" : "Chore") as TaskVm["type"],
      priority: (idx % 3 === 0 ? "High" : idx % 3 === 1 ? "Medium" : "Low"),
      severity: undefined,
      storyPoints: (idx % 3) + 2,     // 2..4
      estimateHours: 8 + idx * 2,     // 10..14
      remainingHours: meta?.category === "DONE" ? 0 : 4 + (idx % 3),
      dueDate: s.end || mkIso(new Date(now.getTime() + 3 * 86400e3)),
      openedAt: mkIso(new Date(now.getTime() - 2 * 86400e3)),
      updatedAt: mkIso(now),
      createdAt: mkIso(new Date(now.getTime() - 3 * 86400e3)),

      sprintId: s.id,
      workflowStatusId: meta?.id ?? stId,
      statusCode: meta?.code ?? "todo",
      statusCategory: meta?.category ?? "TODO",

      assignees: [],
      dependsOn: [],
      parentTaskId: null,
      carryOverCount: 0,
      sourceTicketId: null,
      sourceTicketCode: null,
    } as TaskVm);
  }
  return list;
}

/** Tính tổng/đã done theo filter; có thể truyền danh sách tasks override (demo) */
const computeSprintStats = (
  s: SprintVm,
  filterCategory: "ALL" | StatusCategory,
  tasksOverride?: TaskVm[]
) => {
  const list = tasksOverride ?? flattenSprintTasks(s, filterCategory);
  const total = list.length;
  const done =
    filterCategory === "ALL"
      ? (tasksOverride
          ? tasksOverride.filter((t) => t.statusCategory === "DONE").length
          : flattenSprintTasks(s, "DONE").length)
      : list.filter((t) => t.statusCategory === "DONE").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
};

/* ================== UI atoms ================== */

const BoardColumn = ({
  title,
  tone,
  right,
  children,
}: {
  title: string;
  tone: "amber" | "blue" | "purple" | "green";
  right?: React.ReactNode;
  children?: React.ReactNode;
}) => {
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
      <div className="p-4 pb-3 flex items-center justify-between">
        <span className="inline-flex items-center text-[12px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
          {title}
        </span>
        {right}
      </div>
      <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
};

/* ================== Main ================== */

export default function KanbanBySprintBoard({
  sprints,
  filterCategory = "ALL",
  onDragEnd,
  onMarkDone,
  onNext,
  onSplit,
  onMoveNext,
  onOpenTicket,
}: {
  sprints: SprintVm[];
  /** Lọc theo category động: "ALL" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" */
  filterCategory?: "ALL" | StatusCategory;
  onDragEnd: (result: DropResult) => void;
  onMarkDone?: (t: TaskVm) => void;
  onNext?: (t: TaskVm) => void;
  onSplit?: (t: TaskVm) => void;
  onMoveNext?: (t: TaskVm) => void;
  onOpenTicket?: (ticketId: string) => void;
}) {
  const TOP_OFFSET = 220;
  const BOARD_H = `calc(100vh - ${TOP_OFFSET}px)`;
  const COL_W_CLASS =
    "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";

  const noop = () => {};
  const _onMarkDone = onMarkDone ?? noop;
  const _onNext = onNext ?? noop;
  const _onSplit = onSplit ?? noop;
  const _onMoveNext = onMoveNext ?? noop;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="px-8 mt-5 pb-4 min-w-0 max-w-[100vw]">
        <div className="relative w-full min-w-0 max-w-[100vw] overflow-x-clip">
          <div
            className="overflow-x-auto overscroll-x-contain rounded-xl w-full min-w-0 max-w-[100vw]"
            style={{ height: BOARD_H, overflowY: "hidden" }}
          >
            <div className="inline-flex gap-4 h-full pr-8 min-w-max pb-5">
              {sprints.map((s, colIdx) => {
                // Lấy tasks thật; nếu rỗng → sinh demo cho sprint đó
                const hasReal = sprintHasRealTasks(s);
                const demoTasks = hasReal ? [] : makeDemoTasksForSprint(s);
                const tasks =
                  hasReal
                    ? flattenSprintTasks(s, filterCategory)
                    : demoTasks.filter(
                        (t) =>
                          filterCategory === "ALL" ||
                          t.statusCategory === filterCategory
                      );

                const stats = computeSprintStats(
                  s,
                  filterCategory,
                  hasReal ? undefined : tasks
                );

                return (
                  <div key={s.id} className={`shrink-0 h-full ${COL_W_CLASS}`}>
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
                          <span className="text-gray-600">
                            {stats.total} tasks
                          </span>
                          <span className="text-green-700 font-semibold">
                            {stats.pct}%
                          </span>
                          {!hasReal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                              demo
                            </span>
                          )}
                        </div>
                      }
                    >
                      {/* Lane droppable theo sprint (kéo giữa sprint, giữ nguyên statusId) */}
                      {/* NOTE: đổi prefix thành 'spr:' để khớp onDragEndKanban */}
                      <Droppable droppableId={`spr:${s.id}`} type="task">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "h-full overflow-y-auto overscroll-contain pr-1",
                              snapshot.isDraggingOver && "bg-gray-50 rounded-xl"
                            )}
                            style={{ scrollbarWidth: "thin" }}
                          >
                            {/* mini progress */}
                            <div className="h-1.5 w-full rounded-full bg-gray-100 mb-2">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${stats.pct}%`,
                                  backgroundColor: brand,
                                }}
                              />
                            </div>

                            <div className="space-y-4">
                              {tasks.map((task, idx, arr) => {
                                const ticketSiblingsCount = task.sourceTicketId
                                  ? arr.filter(
                                      (x) =>
                                        x.id !== task.id &&
                                        x.sourceTicketId ===
                                          task.sourceTicketId
                                    ).length
                                  : 0;

                                return (
                                  <Draggable
                                    key={task.id}
                                    draggableId={task.id}
                                    index={idx}
                                    isDragDisabled={!hasReal} // Không cho drag khi là demo
                                  >
                                    {(dragProvided, dragSnapshot) => (
                                      <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={
                                          dragSnapshot.isDragging
                                            ? "rotate-[0.5deg]"
                                            : ""
                                        }
                                        // Khi là demo: khóa actions UI (không chặn hover)
                                        style={
                                          !hasReal
                                            ? { pointerEvents: "none", opacity: 0.95 }
                                            : undefined
                                        }
                                      >
                                        <TaskCard
                                          t={task}
                                          ticketSiblingsCount={
                                            ticketSiblingsCount
                                          }
                                          onMarkDone={_onMarkDone}
                                          onNext={_onNext}
                                          onSplit={_onSplit}
                                          onMoveNext={_onMoveNext}
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
                    </BoardColumn>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
