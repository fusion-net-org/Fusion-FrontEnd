import React, { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  EventApi,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  DatesSetArg,
} from '@fullcalendar/core';
import { formatDate } from '@fullcalendar/core';
import { INITIAL_EVENTS, createEventId } from './event-utils';

/* ======= Helpers to decorate your demo events with UI props ======= */
type UiEvent = {
  id?: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  extendedProps?: {
    owner?: string; // initials e.g. "MF"
    ownerColor?: string; // tailwind bg-* for avatar
    pill?: string; // tailwind bg-* for pill
    tags?: string[]; // tailwind bg-* for little squares
  };
};

const palette = [
  { pill: 'bg-pink-400', avatar: 'bg-indigo-600' },
  { pill: 'bg-amber-300', avatar: 'bg-amber-600' },
  { pill: 'bg-emerald-400', avatar: 'bg-emerald-600' },
  { pill: 'bg-sky-400', avatar: 'bg-sky-600' },
  { pill: 'bg-violet-400', avatar: 'bg-violet-600' },
];

function decorate(events: any[]): UiEvent[] {
  return events.map((e, i) => {
    const p = palette[i % palette.length];
    return {
      ...e,
      extendedProps: {
        ...(e.extendedProps || {}),
        owner: ['MF', 'AL', 'NA', 'JP', 'TT'][i % 5] as string,
        ownerColor: p.avatar,
        pill: p.pill,
        tags: ['bg-yellow-300', 'bg-pink-300', 'bg-sky-300', 'bg-violet-300'].slice(0, (i % 4) + 1),
      },
    };
  });
}

/* ================= Component ================= */
const Calendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [title, setTitle] = useState<string>('');
  const [currentEvents, setCurrentEvents] = useState<EventApi[]>([]);
  const initialDecorated = useMemo(() => decorate(INITIAL_EVENTS), []);

  /* Header actions */
  const api = () => calendarRef.current?.getApi();
  const gotoPrev = () => api()?.prev();
  const gotoNext = () => api()?.next();
  const gotoToday = () => api()?.today();

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = prompt('Event title?');
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        extendedProps: {
          owner: 'YOU',
          ownerColor: 'bg-slate-600',
          pill: 'bg-slate-300',
          tags: ['bg-slate-400'],
        },
      });
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm(`Delete '${clickInfo.event.title}'?`)) clickInfo.event.remove();
  };

  return (
    <div className="min-h-[80vh] w-full rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      {/* Top nav (like screenshot) */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black/90"
            onClick={() => alert('Hook this to your create-task flow')}
          >
            + Add task
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <button
            onClick={gotoToday}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>

          <div className="ml-1 flex items-center">
            <button
              onClick={gotoPrev}
              className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-50"
              aria-label="Prev"
            >
              ‹
            </button>
            <button
              onClick={gotoNext}
              className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-50"
              aria-label="Next"
            >
              ›
            </button>
          </div>

          <div className="ml-2 text-base font-semibold text-gray-900">{title}</div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            Months
          </button>
          <button className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            Filter
          </button>
          <button className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            Unscheduled
          </button>
          <button className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
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
          headerToolbar={false}
          height="auto"
          editable
          selectable
          selectMirror
          weekends
          /* Let us style events ourselves */
          eventColor="transparent"
          eventBorderColor="transparent"
          eventDisplay="block"
          /* Data */
          initialEvents={initialDecorated as any}
          select={handleDateSelect}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventsSet={(evts) => setCurrentEvents(evts)}
          datesSet={(arg: DatesSetArg) => setTitle(arg.view.title)}
          dayMaxEventRows={3}
        />
      </div>

      {/* Footer small summary like “All events (x)” (optional) */}
      <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
        All events: <span className="font-medium text-gray-900">{currentEvents.length}</span>
      </div>
    </div>
  );
};

/* ======= Custom event renderer (pill bar with avatar + tags) ======= */
function renderEventContent(arg: EventContentArg) {
  const { event, timeText } = arg;
  const ex = (event.extendedProps || {}) as any;
  const pill = ex.pill || 'bg-slate-300';
  const owner = ex.owner || '';
  const ownerColor = ex.ownerColor || 'bg-slate-600';
  const tags: string[] = ex.tags || [];

  return (
    <div className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs text-gray-900 ${pill}`}>
      {/* avatar initials */}
      {owner ? (
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ownerColor}`}
          title={owner}
        >
          {owner}
        </span>
      ) : null}

      {/* time (only in week/day views) */}
      {timeText ? <b className="mr-1 hidden sm:inline">{timeText}</b> : null}

      {/* title */}
      <span className="min-w-0 truncate">{event.title}</span>

      {/* tags (colored squares) */}
      <span className="ml-auto flex gap-1">
        {tags.map((c, i) => (
          <span key={i} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
      </span>
    </div>
  );
}

export default Calendar;
