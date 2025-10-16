export interface CompanyRequest {
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
  items: CompanyRequest[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}
