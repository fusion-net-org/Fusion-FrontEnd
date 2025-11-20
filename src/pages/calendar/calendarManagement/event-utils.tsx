// src/utils/event-util.tsx
import type { EventInput } from '@fullcalendar/core';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  source?: string;
  point?: number;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  createAt?: string;
}

// Màu nền theo priority
export const priorityColors: Record<string, string> = {
  High: 'bg-red-500 text-white',
  Medium: 'bg-yellow-400 text-black',
  Low: 'bg-green-400 text-black',
};

// Màu tag theo type
export const typeTagColors: Record<string, string> = {
  Bug: 'bg-red-600',
  Feature: 'bg-blue-600',
  Task: 'bg-cyan-600',
};

// Màu owner
export const ownerColors: Record<string, string> = {
  default: 'bg-slate-600',
  A: 'bg-blue-600',
  B: 'bg-green-600',
  C: 'bg-purple-600',
  D: 'bg-pink-600',
  E: 'bg-yellow-500',
};

/**
 * Convert Task[] from API to FullCalendar EventInput[]
 */
export function mapTasksToEvents(tasks: Task[]): EventInput[] {
  if (!Array.isArray(tasks)) return [];

  return tasks.map((task) => {
    const priority = task.priority || 'Low';
    const type = task.type || 'Task';
    const owner = task.assignedTo || '';
    const ownerInitial = owner ? owner.charAt(0).toUpperCase() : '';

    const start = task.createAt || task.startDate || task.dueDate;
    const end = task.dueDate || task.startDate || task.createAt;

    return {
      id: task.id,
      title: task.title,
      start,
      end,
      allDay: true,
      classNames: [`priority-${priority.toLowerCase()}`],
      extendedProps: {
        ...task,
        pillClass: priorityColors[priority],
        owner: ownerInitial,
        ownerColor: ownerColors[ownerInitial] || ownerColors.default,
        tags: [typeTagColors[type]],
      },
    };
  });
}

/**
 * Format date into readable form
 */
export const formatDate = (date?: string): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN');
};
