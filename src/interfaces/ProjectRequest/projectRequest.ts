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
  isMaintenance: boolean;
}

export interface ProjectRequestResponse {
  items: IProjectRequset[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const ProjectRequestClosedRejectReasons = [
  { value: 'NOT_COMPLETED', label: 'Project is not completed' },
  { value: 'NOT_MEET_REQUIREMENTS', label: 'Does not meet requirements' },
  { value: 'QUALITY_ISSUES', label: 'Quality issues' },
  { value: 'MISSING_DELIVERABLES', label: 'Missing deliverables' },
  { value: 'OTHER', label: 'Other' },
];
