import React, { useMemo, useRef, useState } from 'react';
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
import { demoEventsFor } from './event-utils';
import { TaskList } from './TaskManagement/TaskList';
import TaskPage from './TaskManagement/TaskPage';

const menuItems = [
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  { id: 'list' as const, label: 'List', icon: ListChecks },
];

const Calendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [title, setTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('calendar');

  const monthStart = new Date(2024, 9, 1);
  const events = useMemo(() => demoEventsFor(monthStart), [monthStart]);

  const api = () => calendarRef.current?.getApi();
  const gotoPrev = () => api()?.prev();
  const gotoNext = () => api()?.next();
  const gotoToday = () => api()?.today();

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
                  onClick={() => alert('Hook this to your create-task flow')}
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
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={monthStart}
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
            />
          </div>
        </div>
      )}

      {/* === LIST VIEW === */}
      {activeTab === 'list' && (
        <div className="rounded-xl bg-white ring-1 ring-gray-200 p-6 text-gray-600">
          <TaskPage />
        </div>
      )}
    </div>
  );
};

function EventPill(arg: EventContentArg) {
  const { event, timeText } = arg;
  const ex: any = event.extendedProps || {};
  const pill = ex.pill || 'bg-slate-300';
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
