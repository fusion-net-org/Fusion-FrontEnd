export type ProjectStatus = 'To do' | 'In progress' | 'In review' | 'Done';

export interface ProjectOwner {
  name: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  code: string; // PRJ - 123
  name: string; // Projects Name
  status: ProjectStatus;
  hireLabel: string; // "Hired by Company name" | "Internal"
  convertedFrom?: string; // PRQ-324
  description: string;
  progress: { done: number; total: number };
  overdueTasks?: number; // 2 tasks overdue
  startDate: string; // ISO or display text "09-10-2025"
  endDate: string; // "30-10-2025"
  lastUpdatedAgo: string; // "5h ago"
  owner: ProjectOwner;
  membersCount: number; // 9
  sprintLabel: string; // "#Sprint 3"
}

export interface ProjectDetailResponse {
  id: string;
  companyId: string | null;
  isHired: boolean;
  companyRequestId: string | null;
  projectRequestId: string | null;
  companyRequestName: string | null;
  companyExecutorName: string | null;
  code: string | null;
  name: string | null;
  description: string | null;
  status: string | null;
  workflowId: string | null;
  startDate: string | null; // ISO date string
  endDate: string | null; // ISO date string
  createdBy: string | null;
  createByName: string;
  createAt: string; // ISO datetime string
  updateAt: string; // ISO datetime string
}
