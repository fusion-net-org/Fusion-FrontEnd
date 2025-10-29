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
}

// Màu nền theo priority
export const priorityColors: Record<string, string> = {
  High: '#fee2e2',
  Medium: '#fed7aa',
  Low: '#dcfce7',
};

// Màu viền theo type
export const typeColors: Record<string, string> = {
  Bug: '#ef4444',
  Feature: '#3b82f6',
  Task: '#06b6d4',
};

// Màu avatar theo owner (có thể tùy chỉnh)
export const ownerColors: Record<string, string> = {
  default: 'bg-slate-600',
  A: 'bg-blue-600',
  B: 'bg-green-600',
  C: 'bg-purple-600',
  D: 'bg-pink-600',
  E: 'bg-yellow-600',
};

// Màu tag theo type (squares)
export const typeTagColors: Record<string, string> = {
  Bug: 'bg-red-500',
  Feature: 'bg-blue-500',
  Task: 'bg-cyan-500',
};

/**
 * Convert Task[] from API to FullCalendar EventInput[]
 */
export function mapTasksToEvents(tasks: Task[]): EventInput[] {
  // Validation: ensure tasks is an array
  if (!Array.isArray(tasks)) {
    console.error('mapTasksToEvents: tasks is not an array', tasks);
    return [];
  }

  return tasks.map((task) => {
    const priority = task.priority || 'Low';
    const type = task.type || 'Task';
    const owner = task.assignedTo || '';
    const ownerInitial = owner ? owner.charAt(0).toUpperCase() : '';

    return {
      id: task.id,
      title: task.title,
      start: task.startDate || task.dueDate,
      end: task.endDate || task.dueDate,
      allDay: !task.startDate,

      classNames: [`priority-${priority.toLowerCase()}`],
      extendedProps: {
        ...task,

        pillClass: `pill-${priority.toLowerCase()}`,
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
