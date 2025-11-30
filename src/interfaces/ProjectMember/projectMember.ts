export interface IProject {
  id: string;
  name: string;
  code: string;
  status: string;
  isHired: boolean;
  startDate: string;
  endDate: string;
  companyExecutorName: string;
  companyRequestName: string;
}

export interface IProjectMember {
  companyId: string;
  userId: string;
  totalProject: number;
  projects: IProject[];
}

export interface IProjectMemberItemV2 {
  id: number;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  avatar: string;
  status: string;
  gender: string;
  isPartner: boolean;
  isViewAll: boolean;
  joinedAt: string;
}

export interface IProjectMemberV2 {
  items: IProjectMemberItemV2[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
