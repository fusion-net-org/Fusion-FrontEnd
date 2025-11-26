import type { EventInput } from '@fullcalendar/core';

// Kiểu Task mà calendar cần (khớp với TaskResponse của BE)
export interface TaskCalendarItem {
  id?: string;
  taskId?: string;
  code?: string;
  title: string;

  type?: string | null;
  priority?: string | null;
  severity?: string | null;
  status?: string | null;

  point?: number | null;
  estimateHours?: number | null;
  remainingHours?: number | null;

  createAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dueDate?: string | null;

  createByName?: string | null;

  project?: {
    id?: string;
    name?: string;
  } | null;

  sprint?: {
    id?: string;
    name?: string;
    start?: string | null;
    end?: string | null;
    color?: string | null;
  } | null;

  workflowStatus?: {
    id?: string;
    workflowId?: string;
    name?: string;
    position?: number;
    isStart?: boolean;
    isEnd?: boolean;
    guardNameKey?: string | null;

    // nếu BE có color thì gắn vào đây
    color?: string | null;
    bgColor?: string | null;
    bgClass?: string | null;
  } | null;

  members?: {
    memberId?: string;
    memberName?: string;
    avatar?: string | null;
  }[];
}

/* =======================
 * MÀU SẮC
 * ======================= */

// Màu thanh task theo STATUS (workflow) – fallback
const STATUS_PILL_CLASSES: Record<string, string> = {
  TODO: 'bg-sky-100 text-sky-900',
  'TO DO': 'bg-sky-100 text-sky-900',
  IN_PROGRESS: 'bg-amber-100 text-amber-900',
  DOING: 'bg-amber-100 text-amber-900',
  REVIEW: 'bg-violet-100 text-violet-900',
  IN_REVIEW: 'bg-violet-100 text-violet-900',
  DONE: 'bg-emerald-100 text-emerald-900',
  COMPLETED: 'bg-emerald-100 text-emerald-900',
};

// Tag (ô vuông nhỏ bên phải) theo loại task
export const typeTagColors: Record<string, string> = {
  Bug: 'bg-red-500',
  Feature: 'bg-blue-500',
  Task: 'bg-cyan-500',
  Chore: 'bg-slate-500',
};

// Màu vòng tròn owner
export const ownerColors: Record<string, string> = {
  default: 'bg-slate-600',
  A: 'bg-blue-600',
  B: 'bg-emerald-600',
  C: 'bg-violet-600',
  D: 'bg-pink-600',
  E: 'bg-amber-500',
};

/* =======================
 * HELPERS
 * ======================= */

// Lấy class màu từ workflow, nếu BE có trả sẵn bgClass / bgColorClass thì ưu tiên
function resolvePillClass(task: TaskCalendarItem): string {
  const wf: any = task.workflowStatus ?? {};
  const classFromApi =
    wf.bgClass ??
    wf.bgColorClass ??
    (task as any).statusColorClass ??
    (task as any).pillClass;

  if (typeof classFromApi === 'string' && classFromApi.trim().length > 0) {
    return classFromApi;
  }

  const statusName =
    wf.name ??
    (task.status ?? '').toString();

  const key = statusName.toUpperCase().trim();
  return STATUS_PILL_CLASSES[key] ?? 'bg-slate-100 text-slate-900';
}

// Tính start/end cho event all-day để nó trải dài nhiều ngày giống Asana
// FullCalendar dùng [start, end) nên end +1 day để inclusive
function resolveRange(task: TaskCalendarItem): { start?: string; end?: string } {
  const startRaw =
    task.startDate ??
    task.createAt ??
    task.sprint?.start ??
    task.dueDate ??
    null;

  if (!startRaw) {
    return { start: undefined, end: undefined };
  }

  const endRaw =
    task.endDate ??
    task.dueDate ??
    task.sprint?.end ??
    startRaw;

  const startDate = new Date(startRaw);
  let endDate = new Date(endRaw);

  if (Number.isNaN(startDate.getTime())) {
    return { start: undefined, end: undefined };
  }

  if (Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    // Ít nhất 1 ngày
    endDate = new Date(startDate);
  }
  // +1 ngày để ngày end hiển thị đầy đủ trên calendar month view
  endDate.setDate(endDate.getDate() + 1);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

/* =======================
 * MAIN: map tasks -> events
 * ======================= */

export function mapTasksToEvents(tasks: TaskCalendarItem[]): EventInput[] {
  if (!Array.isArray(tasks)) return [];

  return tasks.map((task) => {
    const priority = task.priority || 'Low';
    const type = task.type || 'Task';

    const firstMember = task.members?.[0];
    const ownerName = firstMember?.memberName || task.createByName || '';
    const ownerInitial = ownerName ? ownerName.trim().charAt(0).toUpperCase() : '';

    const ownerColor = ownerColors[ownerInitial] || ownerColors.default;
    const tagColor = typeTagColors[type] || typeTagColors.Task;

    const { start, end } = resolveRange(task);
    const pillClass = resolvePillClass(task);

    const id = (task as any).id ?? task.taskId;

    return {
      id,
      title: task.title,
      start,
      end,
      allDay: true,
      extendedProps: {
        ...task,
        priority,
        type,
        owner: ownerInitial,
        ownerColor,
        tags: [tagColor],
        pillClass,
      },
    };
  });
}

// Format date cho tooltip nếu cần
export const formatDate = (date?: string | null): string => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
};
