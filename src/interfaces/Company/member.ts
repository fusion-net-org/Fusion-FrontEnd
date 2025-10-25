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
