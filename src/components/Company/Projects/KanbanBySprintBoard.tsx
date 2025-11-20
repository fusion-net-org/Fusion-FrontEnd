// src/components/KanbanBySprintBoard.tsx
import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import TaskCard, {
  type TaskVm,
} from "@/components/Company/Projects/TaskCard";
import QuickTaskCreateModal from "@/components/Tasks/QuickTaskCreateModal";

/* ====== Private types & helpers (local) ====== */
type StatusKey = "todo" | "inprogress" | "inreview" | "done";

export type SprintVm = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  columns: Record<StatusKey, TaskVm[]>;
};

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const flattenSprintTasks = (
  s: SprintVm,
  filter: StatusKey | "all" = "all"
) =>
  filter === "all"
    ? ([] as TaskVm[]).concat(
        ...(["todo", "inprogress", "inreview", "done"] as StatusKey[]).map(
          (k) => s.columns[k]
        )
      )
    : s.columns[filter];

const computeSprintStats = (s: SprintVm, filter: StatusKey | "all") => {
  const list = flattenSprintTasks(s, filter);
  const total = list.length;
  const done =
    filter === "all" ? s.columns.done.length : list.filter(t => t.status === "done").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
};

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

/* ====== Main ====== */
export default function KanbanBySprintBoard({
  sprints,
  filter = "all",
  onDragEnd,
  onMarkDone,
  onNext,
  onSplit,
  onMoveNext,
  onOpenTicket,
}: {
  sprints: SprintVm[];
  filter?: StatusKey | "all";
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
const [openCreate, setOpenCreate] = useState(false);

  const noop = () => {};
  const _onMarkDone = onMarkDone ?? noop;
  const _onNext = onNext ?? noop;
  const _onSplit = onSplit ?? noop;
  const _onMoveNext = onMoveNext ?? noop;

  return (
    
    <DragDropContext onDragEnd={onDragEnd}>
      {/* <button
  onClick={() => setOpenCreate(true)}
  className="px-3 h-9 rounded-full border text-sm flex items-center gap-1 border-slate-300 text-slate-700 hover:bg-slate-50"
>
  + New task
</button>

<QuickTaskCreateModal
  projectId={'projectId'}
  sprints={sprints.map(s => ({ id: s.id, name: s.name, status: (s as any).state  }))}
  defaultSprintId={'defaultSprintId'}
  isOpen={openCreate}
  onClose={() => setOpenCreate(false)}
  onCreated={(t) => {
    // tuỳ bạn: update local state để hiện ngay trên Board/List
    // fetch lại hoặc append tối thiểu:
    // setTasks(prev => [{ id: t.id, code: t.code, ... }, ...prev])
  }}
  navigateToDetail={true}
/> */}
      <div className="px-8 mt-5 pb-4 min-w-0 max-w-[100vw]">
        <div className="relative w-full min-w-0 max-w-[100vw] overflow-x-clip">
          <div
            className="overflow-x-auto overscroll-x-contain rounded-xl w-full min-w-0 max-w-[100vw]"
            style={{ height: BOARD_H, overflowY: "hidden" }}
          >
            <div className="inline-flex gap-4 h-full pr-8 min-w-max pb-5">
              {sprints.map((s, colIdx) => {
                const stats = computeSprintStats(s, filter);
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
                        </div>
                      }
                    >
                      <Droppable droppableId={`kanban:${s.id}`} type="task">
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
                              {flattenSprintTasks(s, filter).map(
                                (task, idx, arr) => {
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
                                }
                              )}
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
