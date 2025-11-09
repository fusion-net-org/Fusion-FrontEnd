import React from "react";
import type { SprintVm, TaskVm, StatusKey } from "@/types/projectBoard";

type Ctx = {
  sprints: SprintVm[];
  tasks: TaskVm[];
  loading: boolean;

  // actions
  changeStatus: (projectId: string, t: TaskVm, next: StatusKey) => Promise<void>;
  moveToNextSprint: (projectId: string, t: TaskVm, toSprintId: string) => Promise<void>;
  reorder: (
    projectId: string,
    sprintId: string,
    t: TaskVm,
    toStatus: StatusKey,
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

export function ProjectBoardProvider({
  projectId,
  initialData,
  children,
}: {
  projectId: string;
  initialData?: { sprints: SprintVm[]; tasks: TaskVm[] };
  children: React.ReactNode;
}) {
  const [sprints, setSprints] = React.useState<SprintVm[]>(initialData?.sprints ?? []);
  const [tasks, setTasks] = React.useState<TaskVm[]>(initialData?.tasks ?? []);
  const [loading, setLoading] = React.useState<boolean>(false);

  // ==== helpers
  function syncColumns(nextSprints: SprintVm[], allTasks: TaskVm[]) {
    const byId = new Map(nextSprints.map((s) => [s.id, s]));
    // clear
    nextSprints.forEach((s) => {
      s.columns = { todo: [], inprogress: [], inreview: [], done: [] };
    });
    // fill
    allTasks.forEach((t) => {
      const s = t.sprintId ? byId.get(t.sprintId) : undefined;
      if (s) (s.columns[t.status] as TaskVm[]).push(t);
    });
  }

  // ==== actions (demo in-memory)
  const changeStatus = async (_pid: string, t: TaskVm, next: StatusKey) => {
    setTasks((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, status: next, updatedAt: new Date().toISOString() } : x))
    );
    setSprints((prev) => {
      const copy = prev.map((s) => ({ ...s, columns: { ...s.columns } }));
      syncColumns(copy, tasks.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
      return copy;
    });
  };

  const moveToNextSprint = async (_pid: string, t: TaskVm, toSprintId: string) => {
    setTasks((prev) =>
      prev.map((x) =>
        x.id === t.id ? { ...x, sprintId: toSprintId, status: "todo", carryOverCount: (x.carryOverCount || 0) + 1 } : x
      )
    );
    setSprints((prev) => {
      const copy = prev.map((s) => ({ ...s, columns: { ...s.columns } }));
      syncColumns(copy, tasks.map((x) =>
        x.id === t.id ? { ...x, sprintId: toSprintId, status: "todo", carryOverCount: (x.carryOverCount || 0) + 1 } : x
      ));
      return copy;
    });
  };

  const reorder = async (_pid: string, sprintId: string, t: TaskVm, toStatus: StatusKey, toIndex: number) => {
    // cập nhật status + updatedAt
    setTasks((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, status: toStatus, updatedAt: new Date().toISOString() } : x))
    );
    setSprints((prev) => {
      const copy = prev.map((s) => ({ ...s, columns: { ...s.columns } }));
      const target = copy.find((s) => s.id === sprintId);
      if (!target) return prev;

      // kéo thả “ảo”: xóa khỏi mọi cột rồi chèn vào cột đích
      (["todo", "inprogress", "inreview", "done"] as StatusKey[]).forEach((k) => {
        target.columns[k] = target.columns[k].filter((it) => it.id !== t.id);
      });
      target.columns[toStatus].splice(toIndex, 0, { ...t, status: toStatus });
      return copy;
    });
  };

  const done = async (_pid: string, t: TaskVm) => changeStatus(_pid, t, "done");

  const split = async (_pid: string, t: TaskVm) => {
    // tách A/B đơn giản
    const sp = Math.max(0, t.storyPoints || 0);
    const rh = Math.max(0, t.remainingHours || 0);
    if (sp < 2 && rh < 2) return;

    const base = t.title.replace(/(\s*\(Part [AB]\)\s*)+$/g, "").trim();
    const bPts = sp >= 2 ? Math.max(1, Math.floor(sp / 2)) : 0;
    const aPts = sp - bPts;
    const bHrs = rh >= 2 ? Math.max(1, Math.floor(rh / 2)) : 0;
    const aHrs = Math.max(0, rh - bHrs);

    const newTask: TaskVm = {
      ...t,
      id: t.id + "-B",
      title: base + " (Part B)",
      storyPoints: bPts,
      remainingHours: bHrs,
      status: "todo",
      createdAt: new Date().toISOString(),
      parentTaskId: t.id,
    };

    setTasks((prev) =>
      [
        ...prev.map((x) => (x.id === t.id ? { ...x, title: base + " (Part A)", storyPoints: aPts, remainingHours: aHrs } : x)),
        newTask,
      ]
    );
    setSprints((prev) => {
      const copy = prev.map((s) => ({ ...s, columns: { ...s.columns } }));
      syncColumns(copy, [
        ...tasks.map((x) =>
          x.id === t.id ? { ...x, title: base + " (Part A)", storyPoints: aPts, remainingHours: aHrs } : x
        ),
        newTask,
      ]);
      return copy;
    });
  };

  const value: Ctx = {
    sprints, tasks, loading,
    changeStatus, moveToNextSprint, reorder, done, split,
  };

  return <ProjectBoardContext.Provider value={value}>{children}</ProjectBoardContext.Provider>;
}
