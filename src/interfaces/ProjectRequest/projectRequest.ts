export interface IProjectRequset {
  id: string;
  requesterCompanyId: string;
  requesterCompanyName: string;
  executorCompanyId: string;
  executorCompanyName: string;
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
  convertedProjectId: string;
}

export interface ProjectRequestResponse {
  items: IProjectRequset[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
