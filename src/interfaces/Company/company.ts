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
