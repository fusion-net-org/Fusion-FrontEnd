import React from "react";
import { Calendar, MoreHorizontal, Users } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import TaskCard from "@/components/Company/Projects/TaskCard";
import type { TaskVm } from "@/components/Company/Projects/TaskCard";

/* ====== Private types & theme (local) ====== */
type StatusKey = "todo" | "inprogress" | "inreview" | "done";
type Priority = "Urgent" | "High" | "Medium" | "Low";

export type SprintVm = {
  id: string; name: string; startDate?: string; endDate?: string;
  columns: Record<StatusKey, TaskVm[]>;
};
const brand = "#2E8BFF";
const priorityBarColor: Record<Priority, string> = {
  Urgent:"#EF4444", High:"#F59E0B", Medium:"#3B82F6", Low:"#9CA3AF"
};
const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

/* ====== Local atoms ====== */
const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 px-2 h-6 text-[12px] rounded-full border bg-white text-gray-600 border-gray-200">
    {children}
  </span>
);

const AvatarStack = ({ count = 3 }: { count?: number }) => (
  <div className="flex -space-x-2">
    {new Array(count).fill(0).map((_, i) => (
      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" />
    ))}
  </div>
);

/** Shell của 1 cột: header nằm ngoài scroller để không di chuyển */
const BoardColumn = ({
  title, tone, right, children,
}: {
  title: string; tone: "amber" | "blue" | "purple" | "green"; right?: React.ReactNode; children?: React.ReactNode;
}) => {
  const topBar: Record<string, string> = { amber:"bg-amber-500", blue:"bg-blue-600", purple:"bg-purple-600", green:"bg-green-600" };
  const ring: Record<string, string> = { amber:"ring-amber-200", blue:"ring-blue-200", purple:"ring-purple-200", green:"ring-green-200" };
  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white overflow-hidden ring-1 h-full flex flex-col", ring[tone])}
         style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.06)" }}>
      <div className={cn("h-2 w-full", topBar[tone])} />
      {/* Header cột – KHÔNG scroll */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <span className={cn(
            "inline-flex items-center text-[12px] font-semibold px-2 py-0.5 rounded-full border",
            tone==="amber" ? "bg-amber-50 text-amber-700 border-amber-200" :
            tone==="blue"  ? "bg-blue-50  text-blue-700  border-blue-200"  :
            tone==="purple"? "bg-purple-50 text-purple-700 border-purple-200" :
                             "bg-green-50  text-green-700  border-green-200"
          )}>{title}</span>
          {right}
        </div>
      </div>

      {/* Vùng bạn truyền Droppable vào đây (scroller) */}
      <div className="px-4 pb-4 flex-1 overflow-auto">{children}</div>
    </div>
  );
};

/* ====== Main ====== */
export default function SprintBoard({
  sprint,
  onDragEnd,
}: {
  sprint: SprintVm;
  onDragEnd: (result: DropResult) => void;
}) {
  const columns: Array<{ key: StatusKey; title: string; tone: "amber" | "blue" | "purple" | "green" }> = [
    { key: "todo",       title: "To do",       tone: "amber" },
    { key: "inprogress", title: "In progress", tone: "blue" },
    { key: "inreview",   title: "Inreview",    tone: "purple" },
    { key: "done",       title: "Done",        tone: "green" },
  ];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="px-8 mt-5 pb-4 min-w-0 max-w-[100vw]">
        <div className="relative w-full min-w-0 max-w-[100vw] overflow-x-clip">
          <div
            className="overflow-x-auto overscroll-x-contain rounded-xl w-full min-w-0 max-w-[100vw]"
            style={{ height: "calc(100vh - 220px)", overflowY: "hidden" }}
          >
            <div className="inline-flex flex-nowrap gap-4 h-full min-w-max pr-6 pb-5">
              {columns.map((c) => (
                <div key={c.key} className="shrink-0 h-full w-[360px] md:w-[380px] lg:w-[400px] xl:w-[420px]">
                  <BoardColumn
                    title={c.title}
                    tone={c.tone}
                    right={<span className="text-[12px] text-gray-500">{sprint.columns[c.key].length} tasks</span>}
                  >
                    <Droppable droppableId={`sprint:${sprint.id}:${c.key}`} type="task">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "h-full overflow-y-auto overscroll-contain",
                            "scroll-py-2 pr-1",
                            snapshot.isDraggingOver && "bg-gray-50 rounded-xl"
                          )}
                          style={{ scrollbarWidth: 'thin' }}
                        >
                          <div className="space-y-4">
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
                          </div>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </BoardColumn>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
