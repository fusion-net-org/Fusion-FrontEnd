
export type SubscriptionStatus = "Active" | "Expired" | "InActive";

// map theo backend request
export interface CompanySubscriptionEntitlementCreateRequest {
  featureKey: string;
  quantity: number;
}

export interface CompanySubscriptionCreateRequest {
  companyId: string;
  userSubscriptionId: string;
  entitlements: CompanySubscriptionEntitlementCreateRequest[];
}

export interface CompanySubscriptionListItem {
  id: string;
  nameSubscription: string | null;
  status: SubscriptionStatus;
  createdAt: string;  
  expiredAt: string;  
}

export interface CompanySubscriptionPaged {
  items: CompanySubscriptionListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CompanySubscriptionQuery {
  status?: SubscriptionStatus | "";
  Keyword?: string;
  PageNumber?: number;
  PageSize?: number;
  SortColumn?: "nameSubscription" | "status" | "createdAt" | "expiredAt";
  SortDescending?: boolean;
}


export interface CompanySubscriptionEntitlementDetail {
  id: string;
  featureKey: string;   // server gửi enum -> FE nhận dạng string
  quantity: number;
  remaining: number;
}

export interface CompanySubscriptionDetailResponse {
  id: string;
  companyId: string;
  userSubscriptionId: string;
  nameSubscription: string | null;
  status: SubscriptionStatus;
  createdAt: string;   // ISO
  expiredAt: string;   // ISO
  entitlements: CompanySubscriptionEntitlementDetail[];
}