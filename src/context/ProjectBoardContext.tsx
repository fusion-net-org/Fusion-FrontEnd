// src/context/ProjectBoardContext.tsx
import React, { useEffect, useRef, useState } from "react";
import type { SprintVm, TaskVm } from "@/types/projectBoard";
import {
  patchTaskStatusById,
  putReorderTask,
  postMoveTask,
  postTaskMarkDone,
  postTaskSplit,
} from '@/services/taskService.js';
import { fetchSprintBoard } from "@/services/projectBoardService.js";
import { normalizeBoardInput } from "@/mappers/projectBoardMapper";

/* ================== Context types ================== */
type Ctx = {
  sprints: SprintVm[];
  tasks: TaskVm[];
  loading: boolean;

  // dùng statusId (workflowStatusId), KHÔNG dùng StatusKey cứng
  changeStatus: (projectId: string, t: TaskVm, nextStatusId: string) => Promise<void>;
  moveToNextSprint: (projectId: string, t: TaskVm, toSprintId?: string) => Promise<void>;
  reorder: (
    projectId: string,
    sprintId: string,
    t: TaskVm,
    toStatusId: string,
    toIndex: number
  ) => Promise<void>;
  done: (projectId: string, t: TaskVm) => Promise<void>;
  split: (projectId: string, t: TaskVm) => Promise<void>;
   createTask: (
    projectId: string,
    draft: Partial<TaskVm> & { title: string; sprintId: string; workflowStatusId?: string }
  ) => Promise<TaskVm>;
  attachTaskFromApi: (api: any) => void; 
  attachTaskVm: (vm: TaskVm) => void;
  reloadBoard: () => Promise<void>;
};

const ProjectBoardContext = React.createContext<Ctx | null>(null);

export function useProjectBoard() {
  const ctx = React.useContext(ProjectBoardContext);
  if (!ctx) throw new Error("useProjectBoard outside provider");
  return ctx;
}

/* ================== Helpers ================== */

// Tạo columns rỗng theo statusOrder
function ensureColumns(s: SprintVm): SprintVm {
  const cols: Record<string, TaskVm[]> = {};
  for (const id of s.statusOrder ?? []) cols[id] = [];
  // nếu thiếu meta/order (phòng khi dữ liệu seed chưa đủ), giữ nguyên columns hiện có
  return {
    ...s,
    columns: Object.keys(cols).length ? cols : (s.columns ?? {}),
  };
}

// Chuẩn hoá status của task theo sprint: id hợp lệ, gán lại code/category
function normalizeTaskStatus(t: TaskVm, s: SprintVm): TaskVm {
  let statusId = t.workflowStatusId;
  if (!statusId || !s.statusMeta?.[statusId]) {
    const byCode = Object.values(s.statusMeta ?? {}).find(m => m.code === t.statusCode);
    statusId = byCode?.id ?? s.statusOrder[0];
  }
  const meta = s.statusMeta[statusId];
  return {
    ...t,
    workflowStatusId: statusId,
    statusCode: meta?.code ?? t.statusCode,
    statusCategory: meta?.category ?? t.statusCategory,
  };
}

// ProjectBoardContext.tsx

// helper
function inRange(iso: string, start?: string, end?: string) {
  if (!iso) return false;
  const d = new Date(iso).getTime();
  const s = start ? new Date(start).getTime() : -Infinity;
  const e = end ? new Date(end).getTime() : +Infinity;
  return d >= s && d <= e;
}

// ⬇️ sửa syncColumns: fallback map task → sprint theo due/opened date
function syncColumns(rawSprints: SprintVm[], tasks: TaskVm[]): SprintVm[] {
  const map = new Map<string, SprintVm>();
  for (const s of rawSprints) map.set(s.id, ensureColumns(s));
  
  const all = Array.from(map.values());

  for (const t of tasks) {
    // 1) ưu tiên sprintId có sẵn
    let sid = t.sprintId;

    // 2) nếu chưa có, gán theo khoảng ngày sprint (ưu tiên dueDate, sau đó openedAt/createdAt)
    if (!sid) {
       console.warn("[ProjectBoard] task has no sprintId, skip", t);
      const anchor = t.dueDate || t.openedAt || t.createdAt || "";
      const hit = all.find(s => inRange(anchor, s.start, s.end));
      if (hit) sid = hit.id;
    }
    if (!sid) {
       console.warn("[ProjectBoard] no sprint for sprintId, skip", { sid, taskId: t.id });
    continue;
    }

    const s = map.get(sid);
    if (!s) continue;

    const nt = normalizeTaskStatus(t, s);
    if (!Array.isArray(s.columns[nt.workflowStatusId])) s.columns[nt.workflowStatusId] = [];
    s.columns[nt.workflowStatusId].push(nt);
  }
  return Array.from(map.values());
}


function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function uuid() {
  return (crypto as any)?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Tạo sprint mới “giống” workflow của sprint tham chiếu
function makeNextSprintLike(base: SprintVm, labelIndex: number): SprintVm {
  const start = addDaysISO(base?.end ?? new Date().toISOString(), 1);
  const end = addDaysISO(start, 6);
  return {
    id: `spr-${uuid()}`,
    name: `Week ${labelIndex}`,
    start,
    end,
    state: "Planning",
    capacityHours: base?.capacityHours ?? 160,
    committedPoints: 0,
    workflowId: base?.workflowId,
    statusOrder: [...(base?.statusOrder ?? [])],
    statusMeta: { ...(base?.statusMeta ?? {}) },
    columns: Object.fromEntries((base?.statusOrder ?? []).map(id => [id, [] as TaskVm[]])),
  };
}

/* ================== Provider ================== */
export function ProjectBoardProvider({
  projectId,
  initialData,
  children,
}: {
  projectId: string;
  initialData?: { sprints: SprintVm[]; tasks: TaskVm[] };
  children: React.ReactNode;
}) {
  // Khởi tạo đã sync columns để tránh lỗi 'push' lúc mount
  const [tasks, setTasks] = useState<TaskVm[]>(initialData?.tasks ?? []);
  const [sprints, setSprints] = useState<SprintVm[]>(
    () => syncColumns(initialData?.sprints ?? [], initialData?.tasks ?? [])
  );
  const [loading , setLoading] = useState<boolean>(false);

  // giữ bản tham chiếu mới nhất để dùng trong handlers
  const sRef = useRef<SprintVm[]>(sprints);
  const tRef = useRef<TaskVm[]>(tasks);
  useEffect(() => void (sRef.current = sprints), [sprints]);
  useEffect(() => void (tRef.current = tasks), [tasks]);

  /** Cập nhật tasks bằng fn, rồi sync lại columns từ tasksNext */
  function dedupeById(arr: TaskVm[]) {
  const m = new Map<string, TaskVm>();
  for (const t of arr) m.set(t.id, t);
  return Array.from(m.values());
}

// Thay thế applyWithColumns cũ:
const applyWithColumns = (tasksUpdater: (prev: TaskVm[]) => TaskVm[]) => {
  setTasks(prev => {
    const nextRaw = tasksUpdater(prev);
    const next = dedupeById(nextRaw);
    setSprints(prevS => syncColumns(prevS, next));
    return next;
  });
};
  // 🔁 load lại toàn bộ board từ BE
  const reloadBoard = React.useCallback(async () => {
  if (!projectId) return;

  try {
    setLoading(true);

    const res = await fetchSprintBoard(projectId);
    const normalized = normalizeBoardInput(res ?? {});

    const nextTasks = normalized.tasks ?? [];
    const nextSprints = syncColumns(normalized.sprints ?? [], nextTasks);

    setTasks(nextTasks);
    setSprints(nextSprints);
  } catch (err) {
    console.error("[ProjectBoard] reloadBoard error:", err);
  } finally {
    setLoading(false);
  }
}, [projectId]);


const changeStatus = async (pid: string, t: TaskVm, nextStatusId: string) => {
  const now = new Date().toISOString();
  const sp = sRef.current.find(s => s.id === t.sprintId);
  const meta = sp?.statusMeta?.[nextStatusId];

  // 1) optimistic
  applyWithColumns(prev => prev.map(x => x.id === t.id ? {
    ...x,
    workflowStatusId: nextStatusId,
    statusCode: meta?.code ?? x.statusCode,
    statusCategory: meta?.category ?? x.statusCategory,
    updatedAt: now,
  } : x));

  // 2) call API + sync từ DTO
  try {
    const dto = await patchTaskStatusById(t.id, nextStatusId, { flashColorHex: meta?.color });
    attachTaskFromApi(dto);
  } catch (e) {
    console.error(e);
    // (optional) TODO: rollback nếu muốn
  }
};
 // ⬇️ thay toàn bộ attachTaskVm hiện tại
const attachTaskVm = React.useCallback((vm: TaskVm) => {
  const sp = sRef.current.find(s => s.id === vm.sprintId) ?? sRef.current[0];
  const normalized = sp ? normalizeTaskStatus(vm, sp) : vm;

  applyWithColumns(prev => {
    const existed = prev.some(x => x.id === normalized.id);
    const next = existed
      ? prev.map(x => (x.id === normalized.id ? { ...x, ...normalized } : x))
      : [normalized, ...prev];

    if (!existed && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pb:new_task", { detail: { id: normalized.id } }));
    }
    return next;
  });
}, []);

  /** Nhận DTO task từ BE, map sang TaskVm và thêm vào state */
  const attachTaskFromApi = (api: any) => {
    const sid = api.sprintId ?? api.sprint_id;
    if (!sid) {
      console.warn("[ProjectBoard] attachTaskFromApi: missing sprintId", api);
      return;
    }

    const sprint = sRef.current.find((s) => s.id === sid);
    if (!sprint) {
      console.warn("[ProjectBoard] attachTaskFromApi: sprint not found", {
        sid,
        available: sRef.current.map((s) => s.id),
      });
      return;
    }

    // chọn statusId phù hợp với workflow của sprint
    const statusIdRaw =
      api.currentStatusId ?? api.workflowStatusId ?? api.statusId ?? api.current_status_id;
    const statusId =
      statusIdRaw && sprint.statusMeta?.[statusIdRaw]
        ? statusIdRaw
        : sprint.statusOrder[0];

    const meta = sprint.statusMeta?.[statusId];

    const openedAt = api.openedAt ?? api.createAt ?? api.createdAt ?? new Date().toISOString();
    const createdAt = api.createdAt ?? api.createAt ?? openedAt;
    const updatedAt = api.updatedAt ?? api.updateAt ?? createdAt;

    const vm: TaskVm = {
      id: api.id,
      code: api.code ?? "",
      title: api.title ?? "",
      type: api.type ?? "Feature",
      priority: api.priority ?? "Medium",
      storyPoints: api.storyPoints ?? api.point ?? 0,
      estimateHours: api.estimateHours ?? 0,
      remainingHours: api.remainingHours ?? api.estimateHours ?? 0,
      dueDate: api.dueDate ?? undefined,
      sprintId: sprint.id,
      workflowStatusId: statusId,
      statusCode: api.status ?? meta?.code ?? "",
      statusCategory: meta?.category ?? "TODO",
      StatusName:  meta?.name ?? "",
      assignees: [],
      dependsOn: [],
      parentTaskId: api.parentTaskId ?? null,
      carryOverCount: api.carryOverCount ?? 0,

      openedAt,
      createdAt,
      updatedAt,
      sourceTicketId: api.sourceTaskId ?? null,
      sourceTicketCode: api.sourceTaskCode ?? api.code ?? "",
    };

    applyWithColumns((prev) => [...prev, vm]);
  };

 const reorder = async (pid: string, sprintId: string, t: TaskVm, toStatusId: string, toIndex: number) => {
  const sp = sRef.current.find(s => s.id === sprintId);
  const meta = sp?.statusMeta?.[toStatusId];

  // optimistic: chỉ đổi cột
  applyWithColumns(prev => prev.map(x => x.id === t.id ? {
    ...x,
    workflowStatusId: toStatusId,
    statusCode: meta?.code ?? x.statusCode,
    statusCategory: meta?.category ?? x.statusCategory,
    updatedAt: new Date().toISOString(),
  } : x));

  try {
    const dto = await putReorderTask(pid, sprintId, { taskId: t.id, toStatusId, toIndex }, { flashColorHex: meta?.color });
    attachTaskFromApi(dto);
  } catch (e) {
    console.error(e);
  }
};

  const moveToNextSprint = async (pid: string, t: TaskVm, toSprintId?: string) => {
  const all = sRef.current;
  const curIdx = all.findIndex(s => s.id === (t.sprintId ?? ""));
  const target = toSprintId ? all.find(s => s.id === toSprintId) : all[curIdx + 1];
  const color = target ? target.statusMeta?.[t.workflowStatusId!]?.color : undefined; // màu theo status hiện tại ở sprint mới

  // optimistic
  applyWithColumns(prev => prev.map(x => x.id === t.id ? {
    ...x, sprintId: target?.id ?? x.sprintId, carryOverCount: (x.carryOverCount ?? 0) + 1,
  } : x));

  try {
    const dto = await postMoveTask(t.id, target?.id ?? toSprintId!, { flashColorHex: color });
    attachTaskFromApi(dto);
  } catch (e) {
    console.error(e);
  }
};

  const done = async (pid: string, t: TaskVm) => {
  const sp = sRef.current.find(s => s.id === t.sprintId);
  if (!sp) return;
  const finalId = sp.statusOrder.find(id => sp.statusMeta[id]?.isFinal) ?? sp.statusOrder[sp.statusOrder.length - 1];
  const color = sp.statusMeta[finalId]?.color;

  // optimistic
  applyWithColumns(prev => prev.map(x => x.id === t.id ? {
    ...x, workflowStatusId: finalId, statusCode: sp.statusMeta[finalId]?.code ?? x.statusCode, statusCategory: 'DONE',
  } : x));

  try {
    const dto = await postTaskMarkDone(t.id, { flashColorHex: color });
    attachTaskFromApi(dto);
  } catch (e) {
    console.error(e);
  }
};

  const split = async (pid: string, t: TaskVm) => {
  // optimistic (nhẹ): giữ như cũ, lát nữa attach từ API sẽ cập nhật đúng
  try {
    const dto = await postTaskSplit(t.id, {
      flashColorHexA: sRef.current.find(s => s.id === t.sprintId)?.statusMeta?.[t.workflowStatusId!]?.color,
      flashColorHexB: undefined, // để service tái sử dụng màu A cho part B
    });
    if (dto?.partA) attachTaskFromApi(dto.partA);
    if (dto?.partB) attachTaskFromApi(dto.partB);
  } catch (e) {
    console.error(e);
  }
};
const createTask: Ctx["createTask"] = async (_pid, draft) => {
  const sp = sRef.current.find((x) => x.id === draft.sprintId);
  const statusId = draft.workflowStatusId && sp?.statusMeta[draft.workflowStatusId]
    ? draft.workflowStatusId
    : sp?.statusOrder?.[0];
 if (!sp) {
    console.warn(
      "[ProjectBoard] createTask: sprint not found",
      { draftSprintId: draft.sprintId, available: sRef.current.map(s => s.id) }
    );
  }
  const meta = statusId ? sp?.statusMeta[statusId] : undefined;
  const now = new Date().toISOString();
function newTaskCode() {
  const n = Math.floor(100 + Math.random() * 900);
  return `PRJ-T-${n}`;
}

  const created: TaskVm = {
    id: uuid(),
    code: newTaskCode(),
    title: draft.title.trim(),
    type: draft.type ?? "Feature",
    priority: draft.priority ?? "Medium",
    severity: draft.severity,
    storyPoints: draft.storyPoints ?? 0,
    estimateHours: draft.estimateHours ?? 0,
    remainingHours: draft.remainingHours ?? draft.estimateHours ?? 0,
    dueDate: draft.dueDate,
    sprintId: draft.sprintId,
    workflowStatusId: statusId ?? "st-todo",
    statusCode: draft.statusCode ?? meta?.code ?? "todo",
    statusCategory: draft.statusCategory ?? meta?.category ?? "TODO",
    StatusName:  meta?.name ?? "",
    assignees: draft.assignees ?? [],
    dependsOn: [],
    parentTaskId: null,
    carryOverCount: 0,
    openedAt: now,
    updatedAt: now,
    createdAt: now,
    sourceTicketId: null,
    sourceTicketCode: null,
  };

  applyWithColumns((prev) => [...prev, created]);
  return created;
};

  const value: Ctx = {
    sprints,
    tasks,
    loading,
    changeStatus,
    moveToNextSprint,
    reorder,
    done,
    split,
    createTask,
    attachTaskFromApi,
    attachTaskVm,
    reloadBoard,
  };

  return <ProjectBoardContext.Provider value={value}>{children}</ProjectBoardContext.Provider>;
}
