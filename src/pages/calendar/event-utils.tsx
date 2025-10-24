import type { EventInput } from '@fullcalendar/core';

export function demoEventsFor(date = new Date()): EventInput[] {
  const Y = date.getFullYear();
  const M = date.getMonth();
  return [
    {
      title: 'Design for new shopping...',
      start: new Date(Y, M, 21, 18, 30),
      extendedProps: {
        owner: 'AL',
        ownerColor: 'bg-indigo-600',
        pill: 'bg-pink-400',
        tags: ['bg-yellow-300', 'bg-pink-300', 'bg-sky-300', 'bg-violet-300'],
      },
    },
    {
      title: 'Fix tasks',
      start: new Date(Y, M, 21),
      end: new Date(Y, M, 26),
      allDay: true,
      extendedProps: {
        owner: 'MF',
        ownerColor: 'bg-indigo-600',
        pill: 'bg-pink-400',
        tags: ['bg-yellow-300', 'bg-pink-300', 'bg-sky-300', 'bg-violet-300'],
      },
    },
    {
      title: 'Test',
      start: new Date(Y, M, 21),
      end: new Date(Y, M, 22),
      allDay: true,
      extendedProps: {
        owner: 'NA',
        ownerColor: 'bg-sky-600',
        pill: 'bg-rose-300',
        tags: ['bg-yellow-300', 'bg-pink-300', 'bg-sky-300', 'bg-violet-300'],
      },
    },

    {
      title: 'Website content',
      start: new Date(Y, M, 22),
      end: new Date(Y, M, 23),
      allDay: true,
      extendedProps: {
        owner: 'MF',
        ownerColor: 'bg-indigo-600',
        pill: 'bg-amber-300',
        tags: ['bg-yellow-300', 'bg-pink-300', 'bg-sky-300'],
      },
    },

    {
      title: 'Update product packaging in-...',
      start: new Date(Y, M, 24),
      end: new Date(Y, M, 25),
      allDay: true,
      extendedProps: {
        owner: 'MF',
        ownerColor: 'bg-indigo-600',
        pill: 'bg-amber-300',
        tags: ['bg-yellow-300', 'bg-pink-300', 'bg-sky-300', 'bg-violet-300'],
      },
    },

    {
      title: 'Japanese Launch Assets',
      start: new Date(Y, M, 29),
      end: new Date(Y, M + 1, 2),
      allDay: true,
      extendedProps: {
        owner: 'JP',
        ownerColor: 'bg-emerald-600',
        pill: 'bg-emerald-400',
        tags: ['bg-yellow-300', 'bg-pink-300', 'bg-sky-300', 'bg-violet-300'],
      },
    },
    {
      title: 'Sales video update - Forms v2...',
      start: new Date(Y, M, 29),
      end: new Date(Y, M, 30),
      allDay: true,
      extendedProps: {
        owner: 'MF',
        ownerColor: 'bg-indigo-600',
        pill: 'bg-violet-400',
        tags: ['bg-yellow-300', 'bg-pink-300', 'bg-sky-300'],
      },
    },
  ];
}
