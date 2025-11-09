// src/utils/taskSort.ts
import type { TaskVm } from "@/components/Company/Projects/TaskCard";

export type SortKey =
  | "updated" | "created" | "due" | "sla"
  | "priority" | "status" | "stage" | "sprint"
  | "sp" | "estimate" | "remaining"
  | "assignees" | "tags" | "code" | "title" | "overdueFirst";

export type SortDir = "asc" | "desc";

const priRank: Record<TaskVm["priority"], number> = { Urgent: 1, High: 2, Medium: 3, Low: 4 };
const stRank:  Record<TaskVm["status"], number>   = { todo: 1, inprogress: 2, inreview: 3, done: 4 };
const stageRank: Record<TaskVm["stage"], number>  = {
  IN_PROGRESS: 1, WAITING_FOR_DEPLOY: 2, CHECK_AGAIN: 3,
  DEV_DONE: 4, READY_ON_PRODUCTION: 5, CLOSED: 6
};

const slaTarget = (t: TaskVm) => {
  const policy: Record<string, number> = {
    "Bug:Urgent": 24, "Bug:High": 48, "Bug:Medium": 72,
    "Feature:Urgent": 72, "Feature:High": 120, "Feature:Medium": 168, "Feature:Low": 336,
    "Chore:Low": 336,
  };
  return policy[`${t.type}:${t.priority}`] ?? null;
};
const hoursBetween = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / 36e5;
const slaRemain = (t: TaskVm) => {
  const tgt = slaTarget(t);
  if (tgt == null) return Number.POSITIVE_INFINITY;
  return Math.ceil(tgt - Math.max(0, hoursBetween(t.openedAt, new Date().toISOString())));
};
const cmpNum = (a: number, b: number) => (a === b ? 0 : a < b ? -1 : 1);
const cmpStr = (a?: string | null, b?: string | null) =>
  (a ?? "").localeCompare(b ?? "", undefined, { numeric: true, sensitivity: "base" });

const sprintRank = (s?: string | null) => {
  if (!s) return 9_999;
  // spr-12 -> 12; s1 -> 1; fall back to alpha compare weight
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 9_999;
};

export const comparators: Record<SortKey, (a: TaskVm, b: TaskVm) => number> = {
  updated:    (a,b) => cmpNum(new Date(a.updatedAt).getTime(), new Date(b.updatedAt).getTime()),
  created:    (a,b) => cmpNum(new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime()),
  due:        (a,b) => cmpNum(new Date(a.dueDate ?? 0).getTime(), new Date(b.dueDate ?? 0).getTime()),
  sla:        (a,b) => cmpNum(slaRemain(a), slaRemain(b)),
  priority:   (a,b) => cmpNum(priRank[a.priority], priRank[b.priority]),
  status:     (a,b) => cmpNum(stRank[a.status], stRank[b.status]),
  stage:      (a,b) => cmpNum(stageRank[a.stage], stageRank[b.stage]),
  sprint:     (a,b) => cmpNum(sprintRank(a.sprintId ?? ""), sprintRank(b.sprintId ?? "")),
  sp:         (a,b) => cmpNum(a.storyPoints||0, b.storyPoints||0),
  estimate:   (a,b) => cmpNum(a.estimateHours||0, b.estimateHours||0),
  remaining:  (a,b) => cmpNum(a.remainingHours||0, b.remainingHours||0),
  assignees:  (a,b) => cmpNum(a.assignees?.length||0, b.assignees?.length||0),
  tags:       (a,b) => cmpNum(a.tags?.length||0, b.tags?.length||0),
  code:       (a,b) => cmpStr(a.code, b.code),
  title:      (a,b) => cmpStr(a.title, b.title),
  // đặt Overdue first như một “pre-sort” có trọng số
  overdueFirst: (a,b) => {
    const oa = slaRemain(a) < 0 ? 0 : 1;
    const ob = slaRemain(b) < 0 ? 0 : 1;
    return cmpNum(oa, ob);
  },
};

export function sortTasks(list: TaskVm[], key: SortKey, dir: SortDir, secondary?: SortKey) {
  const mul = dir === "asc" ? 1 : -1;
  const cmpKey = comparators[key];
  const cmp2   = secondary ? comparators[secondary] : undefined;
  return [...list].sort((a,b) =>
    mul * (cmpKey(a,b) || (cmp2 ? cmp2(a,b) : 0) || comparators.updated(b,a))
  );
}
