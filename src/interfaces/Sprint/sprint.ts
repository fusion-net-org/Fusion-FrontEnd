export interface ISprint {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  color: string;
}

export interface ISprintResponse {
  items: ISprint[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
