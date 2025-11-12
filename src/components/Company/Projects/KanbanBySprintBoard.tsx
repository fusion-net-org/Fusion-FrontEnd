// src/components/KanbanBySprintBoard.tsx
import React from "react";
import { createPortal } from "react-dom";
import {
  DragDropContext, Droppable, Draggable, type DropResult,
} from "@hello-pangea/dnd";
import TaskCard from "@/components/Company/Projects/TaskCard";
import type { SprintVm, TaskVm, StatusCategory } from "@/types/projectBoard";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

/* === helpers giữ nguyên (rút gọn ở đây) === */
const flattenSprintTasks = (s: SprintVm, filter: "ALL" | StatusCategory = "ALL"): TaskVm[] => {
  const order = s.statusOrder ?? Object.keys(s.columns ?? {});
  const out: TaskVm[] = [];
  for (const stId of order) {
    const arr = (s.columns?.[stId] as TaskVm[]) ?? [];
    out.push(...(filter === "ALL" ? arr : arr.filter(t => t.statusCategory === filter)));
  }
  return out;
};
const sprintHasRealTasks = (s: SprintVm) => flattenSprintTasks(s, "ALL").length > 0;
function makeDemoTasksForSprint(s: SprintVm): TaskVm[] {
  const order = s.statusOrder?.length ? s.statusOrder : Object.keys(s.columns ?? {});
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  return (order.slice(0, Math.min(4, Math.max(2, order.length)))).map((stId, i) => {
    const meta = s.statusMeta?.[stId];
    return {
      id: `__demo_${s.id}_${stId}_${i}`, code: `DEMO-${i+1}`,
      title: meta?.category === "REVIEW" ? "Code review + tests"
            : meta?.category === "DONE"   ? "User profile page"
            : i % 2 ? "Fix webhook signature" : "Implement payment link API",
      type: (["Bug","Feature","Chore"] as const)[i % 3],
      priority: (["High","Medium","Low"] as const)[i % 3],
      storyPoints: 2 + (i % 3), estimateHours: 10 + i*2, remainingHours: meta?.category==="DONE"?0:4,
      dueDate: s.end ?? iso(new Date(now.getTime()+3*86400e3)),
      openedAt: iso(new Date(now.getTime()-2*86400e3)),
      updatedAt: iso(now), createdAt: iso(new Date(now.getTime()-3*86400e3)),
      sprintId: s.id, workflowStatusId: meta?.id ?? stId,
      statusCode: meta?.code ?? "todo", statusCategory: meta?.category ?? "TODO",
      assignees: [], dependsOn: [], parentTaskId: null, carryOverCount: 0, sourceTicketId: null, sourceTicketCode: null,
    };
  });
}
const computeSprintStats = (s: SprintVm, filter: "ALL" | StatusCategory, tasksOverride?: TaskVm[]) => {
  const list = tasksOverride ?? flattenSprintTasks(s, filter);
  const total = list.length;
  const done = (tasksOverride ?? flattenSprintTasks(s, "ALL")).filter(t => t.statusCategory==="DONE").length;
  const pct = total ? Math.round((done/total)*100) : 0;
  return { total, pct };
};

const BoardColumn = ({
  title, tone, right, children,
}: {title:string; tone:"amber"|"blue"|"purple"|"green"; right?:React.ReactNode; children?:React.ReactNode;}) => {
  const top: Record<string,string> = { amber:"bg-amber-500", blue:"bg-blue-600", purple:"bg-purple-600", green:"bg-green-600" };
  const ring: Record<string,string> = { amber:"ring-amber-200", blue:"ring-blue-200", purple:"ring-purple-200", green:"ring-green-200" };
  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white overflow-hidden ring-1 h-full flex flex-col", ring[tone])}
         style={{ boxShadow:"0 1px 2px rgba(16,24,40,0.06)" }}>
      <div className={cn("h-2 w-full", top[tone])} />
      <div className="p-4 pb-3 flex items-center justify-between">
        <span className="inline-flex items-center text-[12px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">{title}</span>
        {right}
      </div>
      <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
};

export default function KanbanBySprintBoard({
  sprints, filterCategory = "ALL", onDragEnd, onMarkDone, onNext, onSplit, onMoveNext, onOpenTicket,
}: {
  sprints: SprintVm[];
  filterCategory?: "ALL" | StatusCategory;
  onDragEnd: (r: DropResult) => void;
  onMarkDone?: (t: TaskVm) => void; onNext?: (t: TaskVm) => void;
  onSplit?: (t: TaskVm) => void; onMoveNext?: (t: TaskVm) => void;
  onOpenTicket?: (ticketId: string) => void;
}) {
  const TOP_OFFSET = 220;
  const BOARD_H = `calc(100vh - ${TOP_OFFSET}px)`;
  const COL_W = "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";
  const noop = () => {};
  const _onMarkDone = onMarkDone ?? noop;
  const _onNext = onNext ?? noop;
  const _onSplit = onSplit ?? noop;
  const _onMoveNext = onMoveNext ?? noop;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="px-8 mt-5 pb-4 min-w-0 max-w-[100vw]">
        {/* ❌ bỏ overflow-x-clip để không bị cắt khi drag */}
        <div className="relative w-full min-w-0 max-w-[100vw]">
          <div
            className="overflow-x-auto overscroll-x-contain rounded-xl w-full min-w-0 max-w-[100vw]"
            style={{ height: BOARD_H /* ✅ KHÔNG set overflowY: 'hidden' */ }}
          >
            <div className="inline-flex gap-4 h-full pr-8 min-w-max pb-5">
              {sprints.map((s, colIdx) => {
                const hasReal = sprintHasRealTasks(s);
                const tasks = hasReal
                  ? flattenSprintTasks(s, filterCategory)
                  : makeDemoTasksForSprint(s).filter(t => filterCategory==="ALL" || t.statusCategory===filterCategory);
                const stats = computeSprintStats(s, filterCategory, hasReal ? undefined : tasks);

                return (
                  <div key={s.id} className={`shrink-0 h-full ${COL_W}`}>
                    <BoardColumn
                      title={s.name}
                      tone={(colIdx % 4 === 0 ? "amber" : colIdx % 4 === 1 ? "blue" : colIdx % 4 === 2 ? "purple" : "green") as any}
                      right={
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="text-gray-600">{stats.total} tasks</span>
                          <span className="text-green-700 font-semibold">{stats.pct}%</span>
                          {!hasReal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">demo</span>
                          )}
                        </div>
                      }
                    >
                      {/* ✅ đổi prefix thành spr: để khớp onDragEndKanban */}
                      <Droppable
                        droppableId={`spr:${s.id}`}
                        type="task"
                        // ✅ Portal clone để khi kéo không bị clip/z-index
                        renderClone={(provided, snapshot, rubric) => {
                          const t = tasks[rubric.source.index];
                          return createPortal(
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style, zIndex: 9999, pointerEvents: "none" }}
                            >
                              <TaskCard
                                t={t}
                                ticketSiblingsCount={
                                  t.sourceTicketId ? tasks.filter(x => x.id !== t.id && x.sourceTicketId === t.sourceTicketId).length : 0
                                }
                                onMarkDone={_onMarkDone}
                                onNext={_onNext}
                                onSplit={_onSplit}
                                onMoveNext={_onMoveNext}
                                onOpenTicket={onOpenTicket}
                              />
                            </div>,
                            document.body
                          );
                        }}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn("h-full overflow-y-auto overscroll-contain pr-1",
                              snapshot.isDraggingOver && "bg-gray-50 rounded-xl")}
                            style={{ scrollbarWidth: "thin" }}
                          >
                            <div className="h-1.5 w-full rounded-full bg-gray-100 mb-2">
                              <div className="h-1.5 rounded-full" style={{ width: `${stats.pct}%`, backgroundColor: brand }} />
                            </div>

                            <div className="space-y-4">
                              {tasks.map((task, idx, arr) => {
                                const sibs = task.sourceTicketId ? arr.filter(x => x.id !== task.id && x.sourceTicketId === task.sourceTicketId).length : 0;
                                return (
                                  <Draggable
                                    key={task.id}
                                    draggableId={task.id}
                                    index={idx}
                                    isDragDisabled={!hasReal}  // khoá drag khi là demo
                                  >
                                    {(drag, snap) => (
                                      <div
                                        ref={drag.innerRef}
                                        {...drag.draggableProps}
                                        {...drag.dragHandleProps}
                                        style={{ ...drag.draggableProps.style, zIndex: snap.isDragging ? 9999 : undefined }}
                                        className={snap.isDragging ? "rotate-[0.5deg]" : ""}
                                        // đừng tắt pointer khi là real
                                      >
                                        <TaskCard
                                          t={task}
                                          ticketSiblingsCount={sibs}
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
