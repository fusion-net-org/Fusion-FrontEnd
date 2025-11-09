export type Id = string;
export type StatusKey = "todo" | "inprogress" | "inreview" | "done";
export type Priority = "Urgent" | "High" | "Medium" | "Low";
export type TaskType = "Feature" | "Bug" | "Chore";

export type MemberRef = {
  id: Id;
  name: string;
  avatarUrl?: string | null;
};
export type Severity = "Critical" | "High" | "Medium" | "Low";

export type TaskVm = {
  id: Id;
  code: string;
  title: string;
  type: TaskType;
  severity?: Severity;   // NEW
  tags?: string[];       // NEW
  priority: Priority;
  storyPoints: number;
  estimateHours: number;
  remainingHours: number;
  dueDate?: string;
  openedAt: string;
  updatedAt: string;
  createdAt: string;
  sprintId: Id | null;
  status: StatusKey;
  stage:
    | "IN_PROGRESS"
    | "WAITING_FOR_DEPLOY"
    | "CHECK_AGAIN"
    | "DEV_DONE"
    | "READY_ON_PRODUCTION"
    | "CLOSED";
  assignees: MemberRef[];
  dependsOn: Id[];
  parentTaskId: Id | null;
  carryOverCount: number;
  sourceTicketId: Id | null;
  sourceTicketCode: string | null;
};

export type SprintVm = {
  id: Id;
  name: string;
  start?: string; // ISO
  end?: string;   // ISO
  columns: Record<StatusKey, TaskVm[]>;
};
