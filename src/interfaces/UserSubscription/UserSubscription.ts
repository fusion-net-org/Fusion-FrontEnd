export type SubscriptionStatus = "Active" | "Expired" | "InActive";

export interface UserSubscriptionListItem {
  id: string;
  namePlan: string | null;
  price: number;
  currency: string | null;
  status: SubscriptionStatus;
  expiredAt: string; // ISO
}

export interface UserSubscriptionPaged {
  items: UserSubscriptionListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/** Query cho GET /UserSubscription/user */
export interface UserSubscriptionQuery {
  status?: SubscriptionStatus | "";
  Keyword?: string;
  PageNumber?: number;
  PageSize?: number;
  SortColumn?: "planName" | "status" | "createdAt" | "expiredAt";
  SortDescending?: boolean;
}
export interface UserSubscriptionEntitlementResponse {
  id: string;
  featureKey: string;
  quantity: number;
  remaining: number;
}

export interface UserSubscriptionDetailResponse {
  id: string;
  namePlan: string | null;
  price: number;
  currency: string | null;
  status: SubscriptionStatus;
  creatAt: string;     // theo backend: CreatAt
  expiredAt: string;
  updateAt?: string | null;
  entitlements: UserSubscriptionEntitlementResponse[];
}