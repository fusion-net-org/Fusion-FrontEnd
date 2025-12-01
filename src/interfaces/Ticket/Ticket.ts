export interface ITicket {
  id: string;
  projectId: string;
  projectName?: string;
  priority?: string;
  isHighestUrgen?: boolean;
  ticketName?: string;
  description?: string;
  statusId?: string;
  submittedBy?: string;
  submittedByName?: string | null;
  isBillable?: boolean;
  budget?: number;
  isDeleted?: boolean;
  status: string;
  reason: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  process?: TicketProcess | null;
}
export interface TicketProcessItem {
  taskId: string;
  taskCode: string;
  title: string;
  statusName: string;
  statusCategory: string;
  isDone: boolean;
  startedAt?: string | null;
  lastMovedAt?: string | null;
  doneAt?: string | null;
}

export interface TicketProcess {
  hasExecution: boolean;
  totalNonBacklogTasks: number;
  startedCount: number;
  doneCount: number;
  progressPercent: number;
  firstStartedAt?: string | null;
  lastDoneAt?: string | null;
  items: TicketProcessItem[];
}
export interface IPagedTicketData {
  items: ITicket[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface ITicketResponseData {
  totalCount: number;
  pageData: IPagedTicketData;
  statusCounts: Record<string, number>;
  total: number;
}

export interface ITicketResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: ITicketResponseData;
}

export interface ITicketTab {
  id: string;
  projectId: string;
  priority?: string;
  projectName?: string;
  urgency?: string;
  isHighestUrgen?: boolean;
  ticketName?: string;
  description?: string;
  statusId?: string;
  submittedBy?: string;
  submittedByName?: string | null;
  isBillable?: boolean;
  budget?: number;
  isDeleted?: boolean;
  status: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPagedTicketsTab {
  items: ITicket[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
export interface ITicketResponseTab {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: IPagedTicketsTab;
}

export interface IProject {
  id: string;
  companyId: string;
  isHired: boolean;
  companyRequestId: string;
  projectRequestId: string;
  companyRequestName: string;
  companyExecutorName: string;
  code: string;
  name: string;
  description: string;
  status: string;
  workflowId: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createByName: string | null;
  createAt: string;
  updateAt: string;
}

export interface IProjectResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: IProject[];
}
