export interface ITicket {
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
  submittedByName?: string;
  isBillable?: boolean;
  budget?: number;
  isDeleted?: boolean;
  status: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPagedTickets {
  items: ITicket[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface ITicketResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: IPagedTickets;
}

export interface ITicketStatusCount {
  statusCounts: {
    Pending?: number;
    Accepted?: number;
    Rejected?: number;
    Finished?: number;
    [key: string]: number | undefined;
  };
  total: number;
}

export interface ITicketStatusCountResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: ITicketStatusCount;
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
