export interface CompanyMemberInterface {
  id: number;
  companyId: string;
  companyName: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  email: string;
  phone: string;
  gender: string;
  numberProductJoin: number;
  numberCompanyJoin: number;
  status: string;
  isDeleted: boolean;
  joinedAt: string;
  isOwner: boolean;
}

export interface CompanyMemberResponse {
  items: CompanyMemberInterface[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface CompanyMemberItem {
  id: number;
  companyId: string;
  companyName: string;
  companyEmail: string;
  companyOwner: string;
  companyAvatar: string;
  companyPhone: string;
  companyAddress: string;
  companyCreateAt: string;

  userId: string;
  memberJoinAt: string;
  status: string;

  userName: string;
  userEmail: string;
  userPhone: string;
  userAvatar: string;
}

export interface CompanyMemberPagedData {
  items: CompanyMemberItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CompanyMemberPagedResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: CompanyMemberPagedData;
}
