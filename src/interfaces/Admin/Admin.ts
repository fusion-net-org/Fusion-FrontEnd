export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  status: "Active" | "Locked" | "Pending" | string;
  roles: string[];
  createdAt: string;
};

export type AdminUserPaged = {
  items: AdminUserRow[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
};

type Query = {
  keyword?: string;
  status?: string;               
  pageNumber?: number;
  pageSize?: number;
  sortColumn?: string;             
  sortDescending?: boolean;
};

export type CompanyInfo = {
  id: string;
  name: string;
  ownerUserId?: string | null;
  ownerUserName?: string | null;
  taxCode?: string | null;
  email?: string | null;
  detail?: string | null;
  imageCompany?: string | null;
  avatarCompany?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;

  totalMember?: number | null;
  totalProject?: number | null;
  totalPartners?: number | null;
  totalApproved?: number | null;

  listMembers?: any[] | null;
  listProjects?: any[] | null;
};