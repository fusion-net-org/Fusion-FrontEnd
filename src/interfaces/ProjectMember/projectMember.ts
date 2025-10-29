export interface IProject {
  id: string;
  name: string;
  code: string;
  status: string;
  isHired: boolean;
  startDate: string;
  endDate: string;
}

export interface IProjectMember {
  companyId: string;
  userId: string;
  totalProject: number;
  projects: IProject[];
}
