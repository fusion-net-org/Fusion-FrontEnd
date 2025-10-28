import React, { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventContentArg } from '@fullcalendar/core';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  CalendarDays,
  MoreHorizontal,
  ListChecks,
} from 'lucide-react';
import { mapTasksToEvents } from './event-utils';
import TaskPage from './TaskManagement/TaskPage';
import { toast } from 'react-toastify';
import TaskFormModal from './TaskManagement/TaskFormModal';
import { getAllTask, postTask, putTask, getTaskById } from '@/services/taskService.js';
import TaskDetailModal from './TaskManagement/TaskDetailModal';
import '@/pages/calendar/css/calendar.css';

const menuItems = [
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  { id: 'list' as const, label: 'List', icon: ListChecks },
];

const Calendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [title, setTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('calendar');
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Task detail modal states
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);

  // Task edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<any>(null);

  // Load tasks from API
  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await getAllTask();

      if (res?.succeeded) {
        let taskData = [];

        if (Array.isArray(res.data)) {
          taskData = res.data;
        } else if (res.data?.items && Array.isArray(res.data.items)) {
          taskData = res.data.items;
        } else if (res.data?.tasks && Array.isArray(res.data.tasks)) {
          taskData = res.data.tasks;
        } else {
          console.warn('Unexpected data structure:', res.data);
        }

        console.log('Processed tasks:', taskData);
        setTasks(taskData);
      } else {
        toast.error('Failed to load tasks');
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('An error occurred while loading tasks');
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const events = useMemo(() => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return [];
    }

    try {
      const mappedEvents = mapTasksToEvents(tasks);
      return mappedEvents;
    } catch (error) {
      console.error('Error mapping tasks to events:', error);
      return [];
    }
  }, [tasks]);

  const api = () => calendarRef.current?.getApi();
  const gotoPrev = () => api()?.prev();
  const gotoNext = () => api()?.next();
  const gotoToday = () => api()?.today();

  // Handle add/update
  const handleAddOrUpdateTask = async (values: any) => {
    console.log('✅ SUBMIT VALUES:', values);
    setLoading(true);
    try {
      if (isEditMode && values?.id) {
        const res = await putTask(values.id, values);
        if (res?.succeeded) {
          toast.success('Task updated successfully!');
        } else {
          toast.error('Failed to update task');
        }
      } else {
        // create new task
        const res = await postTask(values);
        if (res?.succeeded) {
          toast.success('Task created successfully!');
        } else {
          toast.error('Failed to create task');
        }
      }

      // refresh and close
      await fetchTasks();
      setOpenModal(false);
      setIsEditMode(false);
      setFormInitialValues(null);
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving the task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-1 border-b border-gray-200">
        {menuItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                'relative -mb-px inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium',
                'border-b-2',
                isActive
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-600 border-transparent hover:bg-gray-50',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* === CALENDAR VIEW === */}
      {activeTab === 'calendar' && (
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

              <div className="ml-1 text-sm font-semibold text-gray-900">{title}</div>
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded-md px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Months
              </button>
              <button className="rounded-md px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </button>
              <button className="rounded-md px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100">
                Unscheduled
              </button>
              <button className="rounded-md px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
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
                ref={calendarRef}
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
                  console.log('Event mounted:', info.event);
                }}
                eventClick={async (info) => {
                  const taskId = info.event.id;
                  console.log('Clicked event:', taskId);

                  setSelectedTask(null);
                  setLoadingTaskDetail(true);
                  setOpenDetailModal(true);

                  try {
                    const res = await getTaskById(taskId);
                    console.log('data', res.data);
                    if (res?.succeeded && res.data) {
                      setSelectedTask(res.data);
                    } else {
                      toast.error('Failed to load task details');
                    }
                  } catch (err) {
                    console.error('Error fetching task detail:', err);
                    toast.error('An error occurred while loading task details');
                  } finally {
                    setLoadingTaskDetail(false);
                  }
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* === LIST VIEW === */}
      {activeTab === 'list' && (
        <div className="rounded-xl bg-white ring-1 ring-gray-200 p-6 text-gray-600">
          <TaskPage />
        </div>
      )}

      <TaskFormModal
        open={openModal}
        onCancel={() => {
          setOpenModal(false);
          setIsEditMode(false);
          setFormInitialValues(null);
        }}
        onSubmit={handleAddOrUpdateTask}
        task={formInitialValues}
      />

      <TaskDetailModal
        open={openDetailModal}
        loading={loadingTaskDetail}
        task={selectedTask}
        onClose={() => setOpenDetailModal(false)}
        onEdit={(task) => {
          setFormInitialValues(task);
          setIsEditMode(true);
          setOpenDetailModal(false);
          setOpenModal(true);
        }}
      />
    </div>
  );
};

function EventPill(arg: EventContentArg) {
  const { event, timeText } = arg;
  const ex: any = event.extendedProps || {};
  const pill = ex.pill || 'bg-slate-100';
  const owner = ex.owner || '';
  const ownerColor = ex.ownerColor || 'bg-slate-600';
  const tags: string[] = ex.tags || [];

  return (
    <div className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs text-gray-900 ${pill}`}>
      {owner ? (
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ownerColor}`}
          title={owner}
        >
          {owner}
        </span>
      ) : null}
      {timeText ? <b className="mr-1 hidden sm:inline">{timeText}</b> : null}
      <span className="min-w-0 truncate">{event.title}</span>
      <span className="ml-auto flex gap-1">
        {tags.map((c, i) => (
          <span key={i} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
      </span>
    </div>
  );
}

export default Calendar;
