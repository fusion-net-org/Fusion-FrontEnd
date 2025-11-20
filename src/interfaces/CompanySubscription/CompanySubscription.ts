// src/interfaces/CompanySubscription/CompanySubscription.ts

import type { Guid, PagedResult } from "@/interfaces/SubscriptionPlan/SubscriptionPlan";

export type CompanySubscriptionStatus = string;

// ====== CREATE REQUEST ======
export type CompanySubscriptionCreateRequest = {
  userSubscriptionId: Guid;
  companyId: Guid;
  ownerUserId: Guid;
};

// ====== LIST ITEM (company/{companyId}) ======
export type CompanySubscriptionListResponse = {
  id: Guid;
  companyName?: string | null;
  planName?: string | null;
  userName?: string | null;
  status: CompanySubscriptionStatus;
  sharedOn: string;              // DateTimeOffset -> ISO string
  expiredAt?: string | null;     // DateTimeOffset? -> ISO
  seatsLimitSnapshot?: number | null;
  seatsLimitUnit?: number | null;
};

// ====== DETAIL ======
export type CompanySubscriptionEntitlementDetailResponse = {
  featureId: Guid;
  featureCode?: string | null;
  featureName?: string | null;
  category?: string | null;
  enabled: boolean;
};

export type CompanySubscriptionDetailResponse =
  CompanySubscriptionListResponse & {
    companyId: Guid;
    userSubscriptionId: Guid;
    ownerUserId: Guid;
    entitlements: CompanySubscriptionEntitlementDetailResponse[];
  };

// ====== ACTIVE BY COMPANY (dropdown) ======
export type CompanySubscriptionEntitlementDropdownResponse = {
  id: Guid;
  featureName: string;
};

export type CompanySubscriptionActiveResponse = {
  id: Guid;
  nameSubscription?: string | null;
  seatsLimitSnapshot?: number | null;
  seatsLimitUnit?: number | null;
  companySubscriptionEntitlements: CompanySubscriptionEntitlementDropdownResponse[];
};

// ====== PAGED REQUEST / RESULT ======
export type CompanySubscriptionPagedRequest = {
  keyword?: string;
  status?: CompanySubscriptionStatus;  // map enum SubscriptionStatus ở BE
  pageNumber: number;
  pageSize: number;
  sortColumn?: "status" | "createdAt" | "expiredAt";
  sortDescending?: boolean;
};

export type CompanySubscriptionPagedResult =
  PagedResult<CompanySubscriptionListResponse>;
