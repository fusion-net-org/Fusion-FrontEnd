// src/components/KanbanBySprintBoard.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import TaskCard from "@/components/Company/Projects/TaskCard";
import type { SprintVm, TaskVm, StatusCategory } from "@/types/projectBoard";
import ColumnHoverCreate from "../Task/ColumnHoverCreate";

const brand = "#2E8BFF";
const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

/* ===== CSS-inject: animations & effects (mount once) ===== */
function useFuseKanbanStyles() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("fuse-kanban-style")) return;

    const css = `
@keyframes fusePillIn {
  0% { transform: translateY(4px) scale(.96); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes fuseSheen {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}
@keyframes fuseDropGlow {
  0% { box-shadow: inset 0 0 0 0 rgba(46,139,255,.28); }
  100% { box-shadow: inset 0 0 0 2px rgba(46,139,255,.28); }
}

.fuse-pill {
  display:inline-flex; align-items:center;
  font-weight:600; font-size:12px;
  border-radius:9999px; padding:2px 8px;
  background:${brand}; color:#fff;
  animation:fusePillIn .42s cubic-bezier(.2,.8,.2,1);
  transition: background-color .35s ease, color .35s ease, transform .2s ease;
}
.fuse-pill:hover { background:#ffffff; color:${brand}; transform: translateY(-1px); }
.fuse-pill--sheen {
  position:relative; overflow:hidden; isolation:isolate;
}
.fuse-pill--sheen::after {
  content:""; position:absolute; inset:0; pointer-events:none;
  background: linear-gradient(100deg, transparent 0%, rgba(255,255,255,.65) 12%, transparent 24%);
  transform: translateX(-120%);
}
.group:hover .fuse-pill--sheen::after {
  animation: fuseSheen 1.2s ease forwards;
}

.fuse-dropzone { transition: background-color .2s ease, box-shadow .2s ease; }
.fuse-dropzone.is-over {
  background: radial-gradient(600px 120px at center top, rgba(46,139,255,.08), transparent 70%);
  animation: fuseDropGlow .18s ease-out forwards;
}

.fuse-progress { height:6px; background:#eef2f7; border-radius:9999px; overflow:hidden; }
.fuse-progress > i { display:block; height:100%; background:${brand}; transition: width .45s cubic-bezier(.2,.8,.2,1); }
`;
    const el = document.createElement("style");
    el.id = "fuse-kanban-style";
    el.textContent = css;
    document.head.appendChild(el);
  }, []);
}

/* === helpers === */

// Lấy toàn bộ task trong sprint theo thứ tự statusOrder + filter category
const flattenSprintTasks = (
  s: SprintVm,
  filter: "ALL" | StatusCategory = "ALL",
): TaskVm[] => {
  const order = s.statusOrder ?? Object.keys(s.columns ?? {});
  const out: TaskVm[] = [];
  for (const stId of order) {
    const arr = (s.columns?.[stId] as TaskVm[]) ?? [];
    out.push(
      ...(filter === "ALL"
        ? arr
        : arr.filter((t) => t.statusCategory === filter)),
    );
  }
  return out;
};

// Thống kê số task + % done, chỉ dùng dữ liệu thật
const computeSprintStats = (s: SprintVm, filter: "ALL" | StatusCategory) => {
  const listVisible = flattenSprintTasks(s, filter);
  const listAll = flattenSprintTasks(s, "ALL");
  const total = listVisible.length;
  const done = listAll.filter((t) => t.statusCategory === "DONE").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, pct };
};

/* ===== Column shell: 1 màu xanh + hiệu ứng ===== */
const BoardColumn = ({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white overflow-hidden ring-1 ring-blue-200 h-full flex flex-col group",
      )}
      style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.06)" }}
    >
      {/* top bar 1 màu xanh */}
      <div className="h-2 w-full" style={{ backgroundColor: brand }} />

      <div className="p-4 pb-3 flex items-center justify-between">
        {/* pill 1 màu xanh, hover fade -> trắng, không viền */}
        <span className="fuse-pill fuse-pill--sheen">{title}</span>
        {right}
      </div>

      <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
};

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
  filterCategory?: "ALL" | StatusCategory;
  onDragEnd: (r: DropResult) => void;
  onMarkDone?: (t: TaskVm) => void;
  onNext?: (t: TaskVm) => void;
  onSplit?: (t: TaskVm) => void;
  onMoveNext?: (t: TaskVm) => void;
  onOpenTicket?: (ticketId: string) => void;
}) {
  useFuseKanbanStyles();

  // flash card mới tạo (animate "isNew")
  const [flashTaskId, setFlashTaskId] = useState<string | null>(null);
  useEffect(() => {
    if (!flashTaskId) return;
    const t = setTimeout(() => setFlashTaskId(null), 900);
    return () => clearTimeout(t);
  }, [flashTaskId]);

  const TOP_OFFSET = 220;
  const BOARD_H = `calc(100vh - ${TOP_OFFSET}px)`;
  const COL_W =
    "w-[320px] sm:w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]";
  const noop = () => {};
  const _onMarkDone = onMarkDone ?? noop;
  const _onNext = onNext ?? noop;
  const _onSplit = onSplit ?? noop;
  const _onMoveNext = onMoveNext ?? noop;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="px-8 mt-5 pb-4 min-w-0 max-w-[100vw]">
        {/* không dùng overflow-x-clip để không bị cắt khi drag */}
        <div className="relative w-full min-w-0 max-w-[100vw]">
          <div
            className="overflow-x-auto overscroll-x-contain rounded-xl w-full min-w-0 max-w-[100vw]"
            style={{ height: BOARD_H }}
          >
            <div className="inline-flex gap-4 h-full pr-8 min-w-max pb-5 ">
              {sprints.map((s) => {
                const tasks = flattenSprintTasks(s, filterCategory);
                const stats = computeSprintStats(s, filterCategory);
                return (
                  <div key={s.id} className={`shrink-0 h-full ${COL_W} relative`}>
                    <BoardColumn
                      title={s.name}
                      right={
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="text-gray-600">{stats.total} tasks</span>
                          <span className="text-green-700 font-semibold">
                            {stats.pct}%
                          </span>
                        </div>
                      }
                    >
                      {/* prefix spr: để khớp onDragEndKanban */}
                      <Droppable
                        droppableId={`spr:${s.id}`}
                        type="task"
                        renderClone={(provided, snapshot, rubric) => {
                          const t = tasks[rubric.source.index];
                          return createPortal(
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                zIndex: 9999,
                                pointerEvents: "none",
                              }}
                            >
                              <TaskCard
                                t={t}
                                ticketSiblingsCount={
                                  t.sourceTicketId
                                    ? tasks.filter(
                                        (x) =>
                                          x.id !== t.id &&
                                          x.sourceTicketId === t.sourceTicketId,
                                      ).length
                                    : 0
                                }
                                onMarkDone={_onMarkDone}
                                onNext={_onNext}
                                onSplit={_onSplit}
                                onMoveNext={_onMoveNext}
                                onOpenTicket={onOpenTicket}
                                isNew={t.id === flashTaskId}
                              />
                            </div>,
                            document.body,
                          );
                        }}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "h-full overflow-y-auto overscroll-contain pr-1 fuse-dropzone",
                              snapshot.isDraggingOver && "is-over rounded-xl",
                            )}
                            style={{ scrollbarWidth: "thin" }}
                          >
                            {/* progress bar (animated width) */}
                            <div className="fuse-progress mb-2">
                              <i style={{ width: `${stats.pct}%` }} />
                            </div>

                            {/* Quick create; set flashTaskId khi tạo */}
                            <ColumnHoverCreate
                              sprint={s}
                              statusId={s.statusOrder?.[0] ?? Object.keys(s.columns ?? {})[0]}
                              allowStatusPicker
                              onCreatedVM={(vm) => setFlashTaskId(vm.id)}
                            />

                            <div className="space-y-4">
                              {tasks.map((task, idx, arr) => {
                                const sibs = task.sourceTicketId
                                  ? arr.filter(
                                      (x) =>
                                        x.id !== task.id &&
                                        x.sourceTicketId === task.sourceTicketId,
                                    ).length
                                  : 0;
                                return (
                                  <Draggable
                                    key={task.id}
                                    draggableId={task.id}
                                    index={idx}
                                  >
                                    {(drag, snap) => (
                                      <div
                                        ref={drag.innerRef}
                                        {...drag.draggableProps}
                                        {...drag.dragHandleProps}
                                        style={{
                                          ...drag.draggableProps.style,
                                          zIndex: snap.isDragging ? 9999 : undefined,
                                        }}
                                        className={snap.isDragging ? "rotate-[0.5deg]" : ""}
                                      >
                                        <TaskCard
                                          t={task}
                                          ticketSiblingsCount={sibs}
                                          onMarkDone={_onMarkDone}
                                          onNext={_onNext}
                                          onSplit={_onSplit}
                                          onMoveNext={_onMoveNext}
                                          onOpenTicket={onOpenTicket}
                                          isNew={task.id === flashTaskId}
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
