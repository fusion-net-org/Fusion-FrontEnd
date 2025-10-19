export interface Partner {
  id: number;
  companyAId: string;
  companyBId: string;
  requesterId: string;
  status: string;
  respondedAt: string;
  lastActionBy: string;
  createdAt: string;
  updatedAt: string;
  totalProject: number;
  totalMember: number;
}

export interface PartnerResponse {
  items: Partner[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface SummaryStatusPartner {
  pending: number;
  active: number;
  inactive: number;
  total: number;
}

export interface SummaryStatusPartnerResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: SummaryStatusPartner;
}
