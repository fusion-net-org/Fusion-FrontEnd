export interface CompanyRequest {
  id: string;
  name: string;
  ownerUserId: string;
  ownerUserName: string;
  ownerUserAvatar: string;
  taxCode: string;
  phoneNumber: string;
  address: string;
  website: string;
  email: string;
  detail: string;
  imageCompany: string;
  avatarCompany: string;
  createAt: string;
  updateAt: string;
  isDeleted: boolean;
  totalMember: number;
  totalProject: number;
  totalPartners: number;
  totalApproved: number;
  totalWaitForApprove: number;
  totalOngoingProjects: number;
  totalCompletedProjects: number;
  totalClosedProjects: number;
  totalLateProjects: number;
  onTimeRelease: number;
  totalProjectCreated: number;
  totalProjectHired: number;
  totalProjectRequestSent: number;
  totalProjectRequestReceive: number;
  totalProjectRequestAcceptSent: number;
  totalProjectRequestRejectSent: number;
  totalProjectRequestPendingSent: number;
  totalProjectRequestAcceptReceive: number;
  totalProjectRequestRejectReceive: number;
  totalProjectRequestPendingReceive: number;
  companyRoles: CompanyRole[];
}

export interface CompanyRole {
  roleId: number;
  roleName: string;
  totalMembers: number;
}

export interface CompanyRequestV2 {
  id: string;
  name: string;
  ownerUserId: string;
  ownerUserName: string;
  taxCode: string;
  email: string;
  detail: string;
  imageCompany: string;
  avatarCompany: string;
  isOwner: boolean;
  isPartner: boolean;
  isPendingAprovePartner: boolean;
  createAt: string;
  updateAt: string;
  totalMember: number;
  totalProject: number;
}
export interface CompanyResponse {
  items: CompanyRequest[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface CompanyResponseV2 {
  items: CompanyRequestV2[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface CompanyListResponse {
  id: string | null;
  companyName: string | null;
}

export interface CompanyListResponse {
  id: string | null;
  companyName: string | null;
}

// Generic ResponseModel từ backend trả về
export interface ResponseModel<T> {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: T;
}


//============= Over view ============
/*1.Growth & Status (chart) ====== */

export interface CompanyGrowthPoint {
  year: number;
  month: number; // 1-12
  newCompanies: number;
  cumulativeCompanies: number;
}

export interface CompanyGrowthAndStatusOverview {
  totalCompanies: number;
  activeCompanies: number;
  deletedCompanies: number;
  newCompaniesLast30Days: number;
  growth: CompanyGrowthPoint[];
}
// 2. Company project load distribution
export interface CompanyProjectLoadBucket {
  bucketKey: string;
  label: string;
  companyCount: number;
  totalProjects: number;
}

export interface CompanyProjectLoadOverview {
  totalCompanies: number;
  totalProjects: number;
  buckets: CompanyProjectLoadBucket[];
}