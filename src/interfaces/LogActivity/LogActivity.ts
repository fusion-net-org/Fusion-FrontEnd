export interface ILogActivity {
  id: string;
  companyId: string;
  actorUserId: string;
  title: string;
  description: string;
  createdAt: string;
  updateAt: string;
  isDeleted: boolean;
}

export interface LogActivityResponse {
  items: ILogActivity[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
