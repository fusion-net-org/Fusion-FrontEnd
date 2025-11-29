// src/types/projectBoard.ts
export type StatusKey = "todo" | "inprogress" | "inreview" | "done";

export type MemberRef = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export type StatusCategory = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export type StatusMeta = {
  id: string;
  code: string;        // "todo" | "inprogress" | ...
  name: string;        // label hiển thị
  category: StatusCategory;
  order: number;
  wipLimit?: number;
  color?: string;
  isFinal?: boolean;
  isStart?: boolean;
  roles?: string[];    
};

export type SprintVm = {
  id: string;
  name: string;
  start?: string;
  end?: string;
  state?: "Planning" | "Active" | "Closed";
  capacityHours?: number;
  committedPoints?: number;

  workflowId?: string;
  // dynamic:
  statusOrder: string[];                         // ["st-todo","st-inp","st-rev","st-done"]
  statusMeta: Record<string, StatusMeta>;        // id -> meta
  columns: Record<string, TaskVm[]>;             // statusId -> TaskVm[]
};

export type TaskVm = {
  id: string;
  code: string;
  title: string;
  type: "Feature" | "Bug" | "Chore" | string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  severity?: "Critical" | "High" | "Medium" | "Low";
  storyPoints?: number;
  estimateHours?: number;
  remainingHours?: number;
  dueDate?: string;

  sprintId: string | null;
  workflowStatusId: string;          // FK
  statusCode: string;                // tiện màu sắc/icon
  statusCategory: StatusCategory;
  assignees: MemberRef[];
  dependsOn: string[];
  parentTaskId: string | null;
  carryOverCount: number;
  StatusName: string;
  openedAt: string;
  updatedAt: string;
  createdAt: string;
ticketId?: string | null;
  ticketName?: string | null;
  sourceTicketId: string | null;
  sourceTicketCode: string | null;
};