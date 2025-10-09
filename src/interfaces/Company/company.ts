export interface Company {
  id: string;
  name: string;
  ownerUserId: string;
  ownerUserName: string;
  taxCode: string;
  email: string;
  detail: string;
  imageCompany: string;
  avatarCompany: string;
  createAt: string;
  updateAt: string;
  totalMember: number;
  totalProject: number;
}

export interface CompanyResponse {
  items: Company[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}
