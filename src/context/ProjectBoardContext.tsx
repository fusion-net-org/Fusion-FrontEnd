// src/context/ProjectBoardContext.tsx
import React, { useEffect, useRef, useState } from "react";
import type { SprintVm, TaskVm } from "@/types/projectBoard";

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
      const anchor = t.dueDate || t.openedAt || t.createdAt || "";
      const hit = all.find(s => inRange(anchor, s.start, s.end));
      if (hit) sid = hit.id;
    }
    if (!sid) continue; // vẫn không xác định được sprint

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
  const [loading] = useState<boolean>(false);

  // giữ bản tham chiếu mới nhất để dùng trong handlers
  const sRef = useRef<SprintVm[]>(sprints);
  const tRef = useRef<TaskVm[]>(tasks);
  useEffect(() => void (sRef.current = sprints), [sprints]);
  useEffect(() => void (tRef.current = tasks), [tasks]);

  /** Cập nhật tasks bằng fn, rồi sync lại columns từ tasksNext */
  const applyWithColumns = (tasksUpdater: (prev: TaskVm[]) => TaskVm[]) => {
    setTasks(prev => {
      const next = tasksUpdater(prev);
      setSprints(prevS => syncColumns(prevS, next));
      return next;
    });
  };

  const changeStatus = async (_pid: string, t: TaskVm, nextStatusId: string) => {
    const now = new Date().toISOString();
    // lấy meta để cập nhật code/category
    const sp = sRef.current.find(s => s.id === t.sprintId);
    const meta = sp?.statusMeta?.[nextStatusId];

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
  };

  const reorder = async (_pid: string, sprintId: string, t: TaskVm, toStatusId: string, _toIndex: number) => {
    // Ở tầng context chỉ cập nhật status; thứ tự sẽ build lại từ columns đã sync
    return changeStatus(_pid, t, toStatusId);
  };

  const moveToNextSprint = async (_pid: string, t: TaskVm, toSprintId?: string) => {
    const all = sRef.current;
    const curIdx = all.findIndex(s => s.id === (t.sprintId ?? ""));
    const fallbackNext = all[curIdx + 1];

    let target = toSprintId ? all.find(s => s.id === toSprintId) : fallbackNext;

    // nếu chưa có sprint kế -> tạo sprint mới clone workflow hiện tại
    if (!target) {
      const base = all[Math.max(0, curIdx)] ?? all[0];
      const newSprint = makeNextSprintLike(base ?? all[0], all.length + 1);
      setSprints(prev => [...prev, newSprint]);
      target = newSprint;
    }

    const now = new Date().toISOString();
    const targetId = target.id;

    applyWithColumns(prev =>
      prev.map(x =>
        x.id === t.id
          ? {
              ...x,
              sprintId: targetId,
              // giữ nguyên statusId hiện tại
              carryOverCount: (x.carryOverCount ?? 0) + 1,
              updatedAt: now,
            }
          : x
      )
    );
  };

  const done = async (_pid: string, t: TaskVm) => {
    const sp = sRef.current.find(s => s.id === t.sprintId);
    if (!sp) return;
    const finalId = sp.statusOrder.find(id => sp.statusMeta[id]?.isFinal) ?? sp.statusOrder[sp.statusOrder.length - 1];
    if (t.workflowStatusId !== finalId) return changeStatus(_pid, t, finalId);
  };

  const split = async (_pid: string, t: TaskVm) => {
    // Chia Part A/B; Part B sang sprint kế tiếp (tự tạo nếu chưa có), status = cột đầu
    const spVal = Math.max(0, t.storyPoints ?? 0);
    const rhVal = Math.max(0, t.remainingHours ?? 0);
    if (spVal < 2 && rhVal < 2) return;

    const all = sRef.current;
    const curIdx = all.findIndex(s => s.id === (t.sprintId ?? ""));
    let target = all[curIdx + 1];

    if (!target) {
      const base = all[Math.max(0, curIdx)] ?? all[0];
      const newSprint = makeNextSprintLike(base ?? all[0], all.length + 1);
      setSprints(prev => [...prev, newSprint]);
      target = newSprint;
    }

    const firstStatusId = target.statusOrder[0];
    const firstMeta = target.statusMeta[firstStatusId];

    const baseTitle = (t.title ?? "").replace(/\s*\(Part [AB]\)\s*$/i, "").trim();
    const bPts = spVal >= 2 ? Math.floor(spVal / 2) : 0;
    const aPts = spVal - bPts;
    const bHrs = rhVal >= 2 ? Math.floor(rhVal / 2) : 0;
    const aHrs = Math.max(0, rhVal - bHrs);

    const nowIso = new Date().toISOString();
    const partB: TaskVm = {
      ...t,
      id: uuid(),
      title: `${baseTitle} (Part B)`,
      storyPoints: bPts,
      remainingHours: bHrs,
      sprintId: target.id,
      workflowStatusId: firstStatusId,
      statusCode: firstMeta.code,
      statusCategory: firstMeta.category,
      parentTaskId: t.id,
      carryOverCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    applyWithColumns(prev => {
      const updatedA = prev.map(x =>
        x.id === t.id
          ? {
              ...x,
              title: `${baseTitle} (Part A)`,
              storyPoints: aPts,
              remainingHours: aHrs,
              updatedAt: nowIso,
            }
          : x
      );
      return (bPts > 0 || bHrs > 0) ? [...updatedA, partB] : updatedA;
    });
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
  };

  return <ProjectBoardContext.Provider value={value}>{children}</ProjectBoardContext.Provider>;
}
