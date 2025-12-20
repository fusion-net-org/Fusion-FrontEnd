export interface IProjectRequset {
  id: string;
  requesterCompanyId: string;
  requesterCompanyName: string;
  requesterCompanyLogoUrl: string;
  executorCompanyId: string;
  executorCompanyName: string;
  executorCompanyLogoUrl: string;
  createdBy: string;
  createdName: string;
  code: string;
  projectName: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  createAt: string;
  updateAt: string;
  isDeleted: boolean;
  isHaveProject: boolean;
  isClosed: boolean;
  closedBy: string;
  convertedProjectId: string;
  contractId: string;
}

export interface ProjectRequestResponse {
  items: IProjectRequset[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
