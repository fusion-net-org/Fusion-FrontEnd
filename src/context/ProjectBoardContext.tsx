// src/context/ProjectBoardContext.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import type { SprintVm, TaskVm } from "@/types/projectBoard";
import {
  patchTaskStatusById,
  putReorderTask,
  postMoveTask,
  postTaskMarkDone,
  postTaskSplit,
} from "@/services/taskService.js";
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

/* ================== Helpers chung ================== */

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

// Tạo columns rỗng theo statusOrder
function ensureColumns(s: SprintVm): SprintVm {
  const cols: Record<string, TaskVm[]> = {};
  for (const id of s.statusOrder ?? []) cols[id] = [];
  return {
    ...s,
    columns: Object.keys(cols).length ? cols : (s.columns ?? {}),
  };
}

// helper
function inRange(isoStr: string, start?: string, end?: string) {
  if (!isoStr) return false;
  const d = new Date(isoStr).getTime();
  const s = start ? new Date(start).getTime() : -Infinity;
  const e = end ? new Date(end).getTime() : +Infinity;
  return d >= s && d <= e;
}

// syncColumns: fallback map task → sprint theo due/opened date
function syncColumns(rawSprints: SprintVm[], tasks: TaskVm[]): SprintVm[] {
  const map = new Map<string, SprintVm>();
  for (const s of rawSprints) map.set(s.id, ensureColumns(s));

  const all = Array.from(map.values());

  for (const t of tasks) {
    // 1) ưu tiên sprintId có sẵn
    let sid = t.sprintId ?? undefined;

    // 2) nếu chưa có, gán theo khoảng ngày sprint (ưu tiên dueDate, sau đó openedAt/createdAt)
    if (!sid) {
      console.warn("[ProjectBoard] task has no sprintId, trying date-based match", t);
      const anchor = t.dueDate || t.openedAt || t.createdAt || "";
      const hit = all.find(s => inRange(anchor, s.start, s.end));
      if (hit) sid = hit.id;
    }

    if (!sid) {
      console.warn("[ProjectBoard] no sprint for task, skip", { taskId: t.id });
      continue;
    }

    const s = map.get(sid);
    if (!s) {
      console.warn("[ProjectBoard] sprint not found for task", { sid, taskId: t.id });
      continue;
    }

    const nt = normalizeTaskStatus(t, s);
    if (!Array.isArray(s.columns[nt.workflowStatusId])) {
      s.columns[nt.workflowStatusId] = [];
    }
    s.columns[nt.workflowStatusId].push(nt);
  }

  return Array.from(map.values());
}

function addDaysISO(isoStr: string, days: number) {
  const d = new Date(isoStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function uuid() {
  // browser crypto, fallback nếu không có
  return (globalThis as any)?.crypto?.randomUUID?.()
    ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Tạo sprint mới “giống” workflow của sprint tham chiếu (nếu sau này cần)
export function makeNextSprintLike(base: SprintVm, labelIndex: number): SprintVm {
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
    columns: Object.fromEntries(
      (base?.statusOrder ?? []).map(id => [id, [] as TaskVm[]])
    ),
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
  const [loading, setLoading] = useState<boolean>(false);

  // giữ bản tham chiếu mới nhất để dùng trong handlers
  const sRef = useRef<SprintVm[]>(sprints);
  useEffect(() => {
    sRef.current = sprints;
  }, [sprints]);

  /** dedupe task theo id */
  function dedupeById(arr: TaskVm[]) {
    const m = new Map<string, TaskVm>();
    for (const t of arr) m.set(t.id, t);
    return Array.from(m.values());
  }

  /** Thay thế applyWithColumns cũ:
   *  - cập nhật tasks
   *  - tự sync lại columns của mọi sprint
   */
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

  /** Attach TaskVm (đã map sẵn) vào state */
  const attachTaskVm = React.useCallback((vm: TaskVm) => {
    const sp = sRef.current.find(s => s.id === vm.sprintId) ?? sRef.current[0];
    const normalized = sp ? normalizeTaskStatus(vm, sp) : vm;

    applyWithColumns(prev => {
      const existed = prev.some(x => x.id === normalized.id);
      const next = existed
        ? prev.map(x => (x.id === normalized.id ? { ...x, ...normalized } : x))
        : [normalized, ...prev];

      if (!existed && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("pb:new_task", { detail: { id: normalized.id } })
        );
      }
      return next;
    });
  }, [applyWithColumns]);

  /** Nhận DTO task từ BE, map nhẹ và merge vào state */
  const attachTaskFromApi = (api: any) => {
    const sid = api.sprintId ?? api.sprint_id;
    if (!sid) {
      console.warn("[ProjectBoard] attachTaskFromApi: missing sprintId", api);
      return;
    }

    const sprint = sRef.current.find(s => s.id === sid);
    if (!sprint) {
      console.warn("[ProjectBoard] attachTaskFromApi: sprint not found", {
        sid,
        available: sRef.current.map(s => s.id),
      });
      return;
    }

    const statusIdRaw =
      api.currentStatusId ??
      api.workflowStatusId ??
      api.statusId ??
      api.current_status_id;

    const statusId =
      statusIdRaw && sprint.statusMeta?.[statusIdRaw]
        ? statusIdRaw
        : sprint.statusOrder[0];

    const meta = sprint.statusMeta?.[statusId];

    const openedAt =
      api.openedAt ??
      api.createAt ??
      api.createdAt ??
      new Date().toISOString();
    const createdAt = api.createdAt ?? api.createAt ?? openedAt;
    const updatedAt = api.updatedAt ?? api.updateAt ?? createdAt;

    applyWithColumns(prev => {
      const existing = prev.find(x => x.id === api.id);

      // ticketId đúng nghĩa: lấy từ API, nếu không có thì giữ cái cũ
      const ticketId: string | null =
        api.sourceTicketId ??
        api.ticketId ??
        api.sourceTaskId ??
        existing?.sourceTicketId ??
        null;

      const ticketCode: string | null =
        api.sourceTicketCode ??
        api.ticketName ??
        api.sourceTaskCode ??
        existing?.sourceTicketCode ??
        null;

      const vm: TaskVm = {
        ...(existing ?? {}),

        id: api.id,
        code: api.code ?? existing?.code ?? "",
        title: api.title ?? existing?.title ?? "",
        type: api.type ?? existing?.type ?? "Feature",
        priority: api.priority ?? existing?.priority ?? "Medium",

        storyPoints:
          api.storyPoints ??
          api.point ??
          existing?.storyPoints ??
          0,
        estimateHours:
          api.estimateHours ??
          existing?.estimateHours ??
          0,
        remainingHours:
          api.remainingHours ??
          api.estimateHours ??
          existing?.remainingHours ??
          0,
        dueDate: api.dueDate ?? existing?.dueDate ?? undefined,

        sprintId: sprint.id,
        workflowStatusId: statusId,
        statusCode: api.status ?? meta?.code ?? existing?.statusCode ?? "",
        statusCategory: meta?.category ?? existing?.statusCategory ?? "TODO",
        StatusName: meta?.name ?? (existing as any)?.StatusName ?? "",

        assignees: existing?.assignees ?? [],
        dependsOn: existing?.dependsOn ?? [],
        parentTaskId: api.parentTaskId ?? existing?.parentTaskId ?? null,
        carryOverCount:
          api.carryOverCount ?? existing?.carryOverCount ?? 0,

        openedAt,
        createdAt,
        updatedAt,

        // đồng bộ cả alias ticket* + sourceTicket*
        ticketId,
        ticketName: ticketCode,
        sourceTicketId: ticketId,
        sourceTicketCode: ticketId ? ticketCode : null,
      };

      const others = prev.filter(x => x.id !== api.id);
      return [...others, vm];
    });
  };

  const changeStatus = async (pid: string, t: TaskVm, nextStatusId: string) => {
    const now = new Date().toISOString();
    const sp = sRef.current.find(s => s.id === t.sprintId);
    const meta = sp?.statusMeta?.[nextStatusId];

    // 1) optimistic
    applyWithColumns(prev =>
      prev.map(x =>
        x.id === t.id
          ? {
              ...x,
              workflowStatusId: nextStatusId,
              statusCode: meta?.code ?? x.statusCode,
              statusCategory: meta?.category ?? x.statusCategory,
              updatedAt: now,
            }
          : x
      )
    );

    // 2) call API + sync từ DTO
    try {
      const dto = await patchTaskStatusById(t.id, nextStatusId, {
        flashColorHex: meta?.color,
      });
      attachTaskFromApi(dto);
    } catch (e) {
      console.error(e);
      // TODO: rollback nếu cần
    }
  };

  const reorder = async (
    pid: string,
    sprintId: string,
    t: TaskVm,
    toStatusId: string,
    toIndex: number
  ) => {
    const sp = sRef.current.find(s => s.id === sprintId);
    const meta = sp?.statusMeta?.[toStatusId];

    // optimistic: chỉ đổi cột
    applyWithColumns(prev =>
      prev.map(x =>
        x.id === t.id
          ? {
              ...x,
              workflowStatusId: toStatusId,
              statusCode: meta?.code ?? x.statusCode,
              statusCategory: meta?.category ?? x.statusCategory,
              updatedAt: new Date().toISOString(),
            }
          : x
      )
    );

    try {
      const dto = await putReorderTask(
        pid,
        sprintId,
        { taskId: t.id, toStatusId, toIndex },
        { flashColorHex: meta?.color }
      );
      attachTaskFromApi(dto);
    } catch (e) {
      console.error(e);
    }
  };

  const moveToNextSprint = async (pid: string, t: TaskVm, toSprintId?: string) => {
    const all = sRef.current;
    const curIdx = all.findIndex(s => s.id === (t.sprintId ?? ""));
    const target = toSprintId ? all.find(s => s.id === toSprintId) : all[curIdx + 1];

    if (!target && !toSprintId) {
      console.warn("[ProjectBoard] moveToNextSprint: no next sprint", {
        taskId: t.id,
        curSprintId: t.sprintId,
      });
      return;
    }

    const color = target
      ? target.statusMeta?.[t.workflowStatusId!]?.color
      : undefined; // màu theo status hiện tại ở sprint mới

    // optimistic
    applyWithColumns(prev =>
      prev.map(x =>
        x.id === t.id
          ? {
              ...x,
              sprintId: target?.id ?? x.sprintId,
              carryOverCount: (x.carryOverCount ?? 0) + 1,
            }
          : x
      )
    );

    try {
      const dto = await postMoveTask(
        t.id,
        target?.id ?? toSprintId!,
        { flashColorHex: color }
      );
      attachTaskFromApi(dto);
    } catch (e) {
      console.error(e);
    }
  };

  const done = async (pid: string, t: TaskVm) => {
    const sp = sRef.current.find(s => s.id === t.sprintId);
    if (!sp) return;

    const finalId =
      sp.statusOrder.find(id => sp.statusMeta[id]?.isFinal) ??
      sp.statusOrder[sp.statusOrder.length - 1];

    const color = sp.statusMeta[finalId]?.color;

    // optimistic
    applyWithColumns(prev =>
      prev.map(x =>
        x.id === t.id
          ? {
              ...x,
              workflowStatusId: finalId,
              statusCode: sp.statusMeta[finalId]?.code ?? x.statusCode,
              statusCategory: "DONE",
            }
          : x
      )
    );

    try {
      const dto = await postTaskMarkDone(t.id, { flashColorHex: color });
      attachTaskFromApi(dto);
    } catch (e) {
      console.error(e);
    }
  };

  const split = async (pid: string, t: TaskVm) => {
    try {
      const color =
        sRef.current.find(s => s.id === t.sprintId)?.statusMeta?.[t.workflowStatusId!]
          ?.color;

      const dto = await postTaskSplit(t.id, {
        flashColorHexA: color,
        flashColorHexB: undefined, // để service tái sử dụng màu A cho part B
      });
      if (dto?.partA) attachTaskFromApi(dto.partA);
      if (dto?.partB) attachTaskFromApi(dto.partB);
    } catch (e) {
      console.error(e);
    }
  };

  const createTask: Ctx["createTask"] = async (_pid, draft) => {
    const sp = sRef.current.find(x => x.id === draft.sprintId);
    if (!sp) {
      console.warn("[ProjectBoard] createTask: sprint not found", {
        draftSprintId: draft.sprintId,
        available: sRef.current.map(s => s.id),
      });
    }

    const statusId =
      (draft.workflowStatusId && sp?.statusMeta[draft.workflowStatusId]
        ? draft.workflowStatusId
        : sp?.statusOrder?.[0]) ?? "st-todo";

    const meta = sp?.statusMeta[statusId];

    const now = new Date().toISOString();
    const newTaskCode = () => {
      const n = Math.floor(100 + Math.random() * 900);
      return `PRJ-T-${n}`;
    };

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
      workflowStatusId: statusId,
      statusCode: draft.statusCode ?? meta?.code ?? "todo",
      statusCategory: draft.statusCategory ?? meta?.category ?? "TODO",
      StatusName: meta?.name ?? "",

      assignees: draft.assignees ?? [],
      dependsOn: [],
      parentTaskId: null,
      carryOverCount: 0,

      openedAt: now,
      updatedAt: now,
      createdAt: now,

      ticketId: null,
      ticketName: null,
      sourceTicketId: null,
      sourceTicketCode: null,
    };

    applyWithColumns(prev => [...prev, created]);
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

  return (
    <ProjectBoardContext.Provider value={value}>
      {children}
    </ProjectBoardContext.Provider>
  );
}
