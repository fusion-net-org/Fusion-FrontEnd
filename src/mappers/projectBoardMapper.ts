import type { SprintVm, TaskVm, StatusKey, MemberRef } from "@/types/projectBoard.ts";

type Any = any;

/** Bảo toàn UI status */
const asStatus = (x: string | undefined | null): StatusKey => {
  const k = (x ?? "").toLowerCase();
  return (["todo","inprogress","inreview","done"] as StatusKey[]).includes(k as any)
    ? (k as StatusKey) : "todo";
};
const asPriority = (x: string | null | undefined): "Urgent"|"High"|"Medium"|"Low" => {
  const k = (x ?? "Low").toLowerCase();
  if (k === "urgent") return "Urgent";
  if (k === "high") return "High";
  if (k === "medium") return "Medium";
  return "Low";
};
const iso = (d?: string | Date | null) => !d ? new Date().toISOString()
  : (typeof d === "string" ? new Date(d) : d).toISOString();

const toMember = (m: Any): MemberRef => ({
  id: m?.id ?? m?.userId ?? cryptoRandomId(),
  name: m?.name ?? m?.fullName ?? m?.email ?? "Unknown",
  avatarUrl: m?.avatarUrl ?? m?.avatar ?? null,
});

const cryptoRandomId = () => Math.random().toString(36).slice(2, 10);
export type Severity = "Critical" | "High" | "Medium" | "Low";

/** ---- Task DTO -> TaskVm ---- */
export function mapTask(dto: Any): TaskVm {
  const est = Number(dto?.estimateHours ?? dto?.estimate ?? 0) || 0;
  const rem = Number(dto?.remainingHours ?? dto?.remaining ?? est) || 0;
  const story = Number(dto?.storyPoints ?? dto?.points ?? 0) || 0;
  return {
    id: String(dto?.id ?? dto?.taskId ?? cryptoRandomId()),
    code: String(dto?.code ?? dto?.key ?? dto?.number ?? "T-UNKNOWN"),
    title: String(dto?.title ?? dto?.name ?? "Untitled"),
    type: (dto?.type ?? "Feature") as any,
    priority: asPriority(dto?.priority),
    severity: dto?.severity ?? undefined,
    tags: Array.isArray(dto?.tags) ? dto.tags : [],
    storyPoints: story,
    estimateHours: est,
    remainingHours: rem,
    dueDate: dto?.dueDate ? iso(dto.dueDate) : undefined,
    openedAt: iso(dto?.openedAt ?? dto?.createdAt),
    updatedAt: iso(dto?.updatedAt ?? dto?.modifiedAt ?? dto?.createdAt),
    createdAt: iso(dto?.createdAt),
    sprintId: dto?.sprintId ?? dto?.weekId ?? null,
    status: asStatus(dto?.status),
    stage: (dto?.stage ??
      (dto?.status === "done" ? "CLOSED" : "IN_PROGRESS")) as TaskVm["stage"],
    assignees: Array.isArray(dto?.assignees)
      ? dto.assignees.map(toMember)
      : dto?.assignee
        ? [toMember(dto.assignee)]
        : [],
    dependsOn: Array.isArray(dto?.dependsOn) ? dto.dependsOn.map(String) : [],
    parentTaskId: dto?.parentTaskId ?? null,
    carryOverCount: Number(dto?.carryOverCount ?? 0) || 0,
    sourceTicketId: dto?.sourceTicketId ?? null,
    sourceTicketCode: dto?.sourceTicketCode ?? null,
  };
}

/** ---- Sprint DTO -> SprintVm (rỗng columns, sẽ fill bằng tasks) ---- */
export function mapSprint(dto: Any): SprintVm {
  return {
    id: String(dto?.id ?? dto?.sprintId ?? cryptoRandomId()),
    name: String(dto?.name ?? dto?.title ?? "Week"),
    start: dto?.start ?? dto?.startDate ? iso(dto?.start ?? dto?.startDate) : undefined,
    end: dto?.end ?? dto?.endDate ? iso(dto?.end ?? dto?.endDate) : undefined,
    columns: { todo: [], inprogress: [], inreview: [], done: [] },
  };
}

/** ---- Chuẩn hoá input từ API thành { sprints, tasks } ----
 * Chấp nhận:
 * A) { sprints:[], tasks:[] }
 * B) { sprints:[ { ... , tasks:[...] } ] }
 * C) { tasks:[...] } + danh sách tuần riêng/hoặc weekId nằm trong task
 */
export function normalizeBoardInput(input: Any): { sprints: SprintVm[]; tasks: TaskVm[] } {
  const rawSprints: Any[] = input?.sprints ?? input?.weeks ?? [];
  const rawTasks: Any[] = input?.tasks ?? [];

  // Nếu sprint kèm tasks => gom tasks ra ngoài
  const embeddedTasks: Any[] = [];
  const sprints = rawSprints.map(s => {
    const vm = mapSprint(s);
    if (Array.isArray(s?.tasks)) embeddedTasks.push(...s.tasks);
    return vm;
  });

  const tasks = (rawTasks.length ? rawTasks : embeddedTasks).map(mapTask);

  // Nếu chưa có sprint list mà task có sprintId => sinh sprint từ task
  if (!sprints.length && tasks.some(t => t.sprintId)) {
    const byId = new Map<string, SprintVm>();
    tasks.forEach(t => {
      if (!t.sprintId) return;
      if (!byId.has(t.sprintId)) byId.set(t.sprintId, {
        id: t.sprintId,
        name: `Week ${t.sprintId}`,
        columns: { todo: [], inprogress: [], inreview: [], done: [] },
      });
    });
    return { sprints: [...byId.values()], tasks };
  }

  return { sprints, tasks };
}

/** Gán task vào sprint.columns theo status (phục vụ 2 board) */
export function fillSprintColumns(sprints: SprintVm[], tasks: TaskVm[]): SprintVm[] {
  const byId = new Map<string, SprintVm>(sprints.map(s => [s.id, {
    ...s,
    columns: { todo: [], inprogress: [], inreview: [], done: [] }
  }]));
  for (const t of tasks) {
    const sid = t.sprintId ?? "__unplanned__";
    if (!byId.has(sid)) {
      byId.set(sid, {
        id: sid,
        name: sid === "__unplanned__" ? "Unplanned" : `Week ${sid}`,
        columns: { todo: [], inprogress: [], inreview: [], done: [] }
      });
    }
    const s = byId.get(sid)!;
    s.columns[t.status].push(t);
  }
  return [...byId.values()];
}
