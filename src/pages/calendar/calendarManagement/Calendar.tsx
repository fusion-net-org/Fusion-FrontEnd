/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg } from "@fullcalendar/core";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  CalendarDays,
  MoreHorizontal,
  ListChecks,
} from "lucide-react";
import { toast } from "react-toastify";

import { mapTasksToEvents, type TaskCalendarItem } from "./event-utils";
import TaskPage from "../TaskManagement/TaskPage";
import TaskFormModal from "../TaskManagement/TaskFormModal";
import TaskCalendarDetailModal from "@/components/Calendar/TaskCalendarDetailModal";

import {
  getMyTasks,
  postTask,
  putTask,
} from "@/services/taskService.js";

import "@/pages/calendar/css/calendar.css";

const menuItems = [
  { id: "calendar" as const, label: "Calendar", icon: CalendarDays },
  { id: "list" as const, label: "List", icon: ListChecks },
];

/* ========= Viên task hiển thị trên Calendar ========= */

function EventPill(arg: EventContentArg) {
  const { event, timeText } = arg;
  const ex: any = event.extendedProps || {};

  const wfColor: string | undefined = ex.workflowStatus?.color;

  const pillClass =
    wfColor != null
      ? "text-white"
      : ex.pillClass || "bg-slate-100 text-slate-900";

  const owner: string = ex.owner || "";
  const ownerColor: string = ex.ownerColor || "bg-slate-600";
  const tags: string[] = ex.tags || [];

  const priorityLabel: string = ex.priority || "Low";
  const typeLabel: string = ex.type || "Task";

  const from = ex.createAt ? String(ex.createAt).slice(0, 10) : "—";
  const to = ex.dueDate ? String(ex.dueDate).slice(0, 10) : "—";
  const statusText: string = ex.workflowStatus?.name || ex.status || "";

  return (
    <div
      className={`
        flex items-center gap-2 rounded-md px-2 py-1 text-xs
        transition-all duration-150 ease-in-out cursor-pointer
        hover:opacity-95 hover:scale-[1.02] hover:shadow-md
        active:scale-[0.98] active:shadow-sm
        ${pillClass}
      `}
      style={wfColor ? { backgroundColor: wfColor } : undefined}
      title={`${event.title}
Status: ${statusText}
Priority: ${priorityLabel}
Type: ${typeLabel}
From: ${from} → To: ${to}`}
    >
      {owner ? (
        <span
          className={`
            inline-flex h-5 w-5 shrink-0 items-center justify-center
            rounded-full text-[10px] font-bold text-white ${ownerColor}
          `}
          title={ex.assigneeName || ex.assignedTo || owner}
        >
          {owner}
        </span>
      ) : null}

      {timeText ? (
        <b className="mr-1 hidden sm:inline">{timeText}</b>
      ) : null}

      <span className="min-w-0 truncate font-medium">{event.title}</span>

      {tags.length > 0 && (
        <span className="ml-auto flex gap-1">
          {tags.map((colorClass, i) => (
            <span key={i} className={`h-3 w-3 rounded-sm ${colorClass}`} />
          ))}
        </span>
      )}
    </div>
  );
}

/* ========= MAIN COMPONENT ========= */

const Calendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [title, setTitle] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"list" | "calendar">("calendar");

  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [detailInitialTask, setDetailInitialTask] =
    useState<TaskCalendarItem | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* ======= Load tasks từ API /tasks/user ======= */
  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);

      const res = await getMyTasks({
        pageNumber: 1,
        pageSize: 200,
        sortColumn: "DueDate",
        sortDescending: false,
      });

      let taskData: any[] = [];
      const payload = res?.data ?? res;

      if (Array.isArray(payload)) {
        taskData = payload;
      } else if (Array.isArray(payload.items)) {
        taskData = payload.items;
      } else if (Array.isArray(payload.tasks)) {
        taskData = payload.tasks;
      } else {
        taskData = [];
      }

      setTasks(taskData);
    } catch (err: any) {
      console.error("Error loading my tasks", err);
      toast.error(err?.message || "An error occurred while loading tasks");
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // sync tab theo URL
  useEffect(() => {
    if (location.pathname === "/calendar/tasks") {
      setActiveTab("list");
    } else {
      setActiveTab("calendar");
    }
  }, [location.pathname]);

  // map Task[] -> events
  const events = useMemo(() => {
    if (!Array.isArray(tasks) || tasks.length === 0) return [];
    try {
      return mapTasksToEvents(tasks as any[]);
    } catch (error) {
      console.error("mapTasksToEvents error", error);
      return [];
    }
  }, [tasks]);

  const api = () => calendarRef.current?.getApi();
  const gotoPrev = () => api()?.prev();
  const gotoNext = () => api()?.next();
  const gotoToday = () => api()?.today();

  // Add / update task
  const handleAddOrUpdateTask = async (values: any) => {
    setLoading(true);
    try {
      if (values?.id) {
        const res = await putTask(values.id, values);
        if (res?.succeeded) {
          toast.success("Task updated successfully!");
        } else {
          toast.error("Failed to update task");
        }
      } else {
        const res = await postTask(values);
        if (res?.succeeded) {
          toast.success("Task created successfully!");
        } else {
          toast.error("Failed to create task");
        }
      }

      await fetchTasks();
      setOpenModal(false);
    } catch (err) {
      console.error("Save task error", err);
      toast.error("An error occurred while saving the task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Tabs calendar / list */}
      <div className="mb-3 flex items-center gap-1 border-b border-gray-200">
        {menuItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                if (id === "calendar") navigate("/calendar/calendar");
                else navigate("/calendar/tasks");
              }}
              className={[
                "relative -mb-px inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium",
                "border-b-2",
                isActive
                  ? "text-gray-900 border-gray-900"
                  : "text-gray-600 border-transparent hover:bg-gray-50",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* === CALENDAR VIEW === */}
      {activeTab === "calendar" && (
        <div className="min-h-[80vh] w-full rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white">
                <button
                  onClick={() => setOpenModal(true)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  + Add task
                </button>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center border-l border-gray-300 text-gray-600 hover:bg-gray-50 leading-none"
                  aria-label="More options"
                  aria-haspopup="menu"
                >
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </button>
              </div>

              <div className="h-5 w-px bg-gray-300" />

              <button
                onClick={gotoPrev}
                className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
                aria-label="Prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={gotoToday}
                className="rounded-md px-2.5 py-1 text-sm font-normal text-gray-700 hover:bg-gray-100"
              >
                Today
              </button>
              <button
                onClick={gotoNext}
                className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="ml-1 text-sm font-semibold text-gray-900">
                {title}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 rounded-md px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100">
                <CalendarDays className="h-3.5 w-3.5" />
                Months
              </button>
              <button className="flex items-center gap-1 rounded-md px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </button>
              <button className="rounded-md px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100">
                Unscheduled
              </button>
              <button className="flex items-center gap-1 rounded-md px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100">
                <MoreHorizontal className="h-3.5 w-3.5" />
                Options
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            {loadingTasks ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-sm text-gray-500">Loading tasks...</div>
              </div>
            ) : (
              <FullCalendar
                ref={calendarRef as any}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                height="auto"
                editable={false}
                selectable={false}
                eventStartEditable={false}
                eventDurationEditable={false}
                droppable={false}
                weekends
                displayEventTime
                eventDisplay="block"
                eventColor="transparent"
                eventBorderColor="transparent"
                dayMaxEventRows={3}
                events={events}
                eventContent={EventPill}
                datesSet={(arg) => setTitle(arg.view.title)}
                eventDidMount={(info) => {
                  const el = info.el;
                  el.classList.add(
                    "transition-all",
                    "duration-150",
                    "ease-in-out",
                    "cursor-pointer",
                  );
                  el.addEventListener("mouseenter", () => {
                    el.style.transform = "scale(1.03)";
                    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
                    el.style.zIndex = "10";
                  });
                  el.addEventListener("mouseleave", () => {
                    el.style.transform = "";
                    el.style.boxShadow = "";
                    el.style.zIndex = "";
                  });
                }}
                eventClick={(info) => {
                  const taskId = info.event.id;
                  const ex = info.event.extendedProps as any;

                  setDetailTaskId(taskId);
                  setDetailInitialTask(ex as TaskCalendarItem);
                  setDetailOpen(true);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* === LIST VIEW === */}
      {activeTab === "list" && (
        <div className="rounded-xl bg-white p-6 text-gray-600 ring-1 ring-gray-200">
          <TaskPage />
        </div>
      )}

      {/* Modal create / edit task */}
      <TaskFormModal
        open={openModal}
        onCancel={() => {
          setOpenModal(false);
        }}
        onSubmit={handleAddOrUpdateTask}
        task={null}
      />

      {/* Modal chi tiết (read-only + change status + open full page) */}
      <TaskCalendarDetailModal
        open={detailOpen}
        taskId={detailTaskId}
        initialTask={detailInitialTask}
        onClose={() => {
          setDetailOpen(false);
          setDetailTaskId(null);
          setDetailInitialTask(null);
        }}
        onStatusChanged={async (
          _taskId: string,
          _newStatusIdOrName: string,
        ) => {
          // Reload lại list để calendar sync màu/status
          await fetchTasks();
        }}
      />
    </div>
  );
};

export default Calendar;
