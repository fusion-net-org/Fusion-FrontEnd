import React from "react";
import { Calendar, MoreHorizontal, Users } from "lucide-react";

export type Priority = "Urgent" | "High" | "Medium" | "Low";
export type TaskVm = {
  id: string; code: string; title: string; priority: Priority;
  type: string; memberCount: number; dueDate?: string; assigneeName?: string;
};

const priorityBarColor: Record<Priority, string> = {
  Urgent:"#EF4444", High:"#F59E0B", Medium:"#3B82F6", Low:"#9CA3AF"
};

export default function TaskCard({
  task,
  dragHandleProps,          // để parent truyền vào (nếu muốn chỉ kéo ở header)
  compact = false,          // nếu cần chế độ gọn
}: {
  task: TaskVm;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  compact?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow transition-shadow">
      {/* priority bar trái */}
      <div
        className="absolute left-0 top-0 h-full w-[6px] rounded-l-2xl"
        style={{ backgroundColor: priorityBarColor[task.priority], opacity: task.priority === "Low" ? 0.25 : 1 }}
      />

      {/* Header (đặt drag handle ở đây nếu truyền vào) */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div
            {...dragHandleProps}
            className={dragHandleProps ? "cursor-grab active:cursor-grabbing select-none" : ""}
            title={task.code}
          >
            <span className="text-gray-400 text-[12px] tracking-wide">{task.code}</span>
          </div>
          <button className="p-1 rounded hover:bg-gray-100" aria-label="Task menu">
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="mt-1 text-[15px] font-semibold text-gray-800">{task.title}</div>

        {/* meta chips */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 h-6 text-[12px] rounded-full border bg-white text-gray-700 border-gray-200">
            {task.type}
          </span>
          <span className="inline-flex items-center gap-1 px-2 h-6 text-[12px] rounded-full border bg-white text-gray-700 border-gray-200">
            <Users className="w-3.5 h-3.5" /> {task.memberCount} members
          </span>
        </div>

        {!compact && task.dueDate && (
          <div className="mt-3 flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-[13px]">{task.dueDate}</span>
          </div>
        )}

        {!compact && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 text-[12px]">
              <div className="w-6 h-6 rounded-full bg-gray-200" />
              {task.assigneeName && <span className="text-gray-700">{task.assigneeName}</span>}
            </div>
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" />
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" />
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
