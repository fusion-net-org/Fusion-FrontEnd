import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventApi, DateSelectArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import { formatDate } from '@fullcalendar/core';
import { INITIAL_EVENTS, createEventId } from './event-utils';

const Calendar: React.FC = () => {
  const [weekendsVisible, setWeekendsVisible] = useState(true);
  const [currentEvents, setCurrentEvents] = useState<EventApi[]>([]);

  const handleWeekendsToggle = () => {
    setWeekendsVisible(!weekendsVisible);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = prompt('Please enter a new title for your event');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect();

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'?`)) {
      clickInfo.event.remove();
    }
  };

  const handleEvents = (events: EventApi[]) => {
    setCurrentEvents(events);
  };

  return (
    <div className="demo-app flex">
      {/* Sidebar */}
      <div className="demo-app-sidebar w-1/4 p-4 bg-gray-50 border-r border-gray-200">
        <div className="demo-app-sidebar-section mb-4">
          <h2 className="font-semibold text-lg mb-2">Instructions</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Select dates and create events</li>
            <li>Drag, drop, and resize events</li>
            <li>Click an event to delete it</li>
          </ul>
        </div>

        <div className="demo-app-sidebar-section mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={weekendsVisible} onChange={handleWeekendsToggle} />
            Toggle weekends
          </label>
        </div>

        <div className="demo-app-sidebar-section">
          <h2 className="font-semibold text-lg mb-2">All Events ({currentEvents.length})</h2>
          <ul className="text-sm space-y-1">{currentEvents.map(renderSidebarEvent)}</ul>
        </div>
      </div>

      {/* Main calendar */}
      <div className="demo-app-main flex-1 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={weekendsVisible}
          initialEvents={INITIAL_EVENTS}
          select={handleDateSelect}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventsSet={handleEvents}
        />
      </div>
    </div>
  );
};

function renderEventContent(eventContent: EventContentArg) {
  return (
    <>
      <b>{eventContent.timeText}</b>&nbsp;
      <i>{eventContent.event.title}</i>
    </>
  );
}

function renderSidebarEvent(event: EventApi) {
  return (
    <li key={event.id} className="flex flex-col">
      <b>{formatDate(event.start!, { year: 'numeric', month: 'short', day: 'numeric' })}</b>
      <i>{event.title}</i>
    </li>
  );
}

export default Calendar;
