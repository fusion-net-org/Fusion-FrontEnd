// src/interfaces/UserSubscription/UserSubscription.ts

import type {
  Guid,
  PagedResult,
  LicenseScope,
  BillingPeriod,
  PaymentMode,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";

// Nếu sau này BE fix cứng enum thì có thể đổi thành union
export type UserSubscriptionStatus = string;

export type UserSubscriptionResponse = {
  id: Guid;
  userId: Guid;
  planId: Guid;
  planName: string;
  status: UserSubscriptionStatus;

  termStart?: string | null;        // DateTimeOffset? -> ISO string
  termEnd?: string | null;
  nextPaymentDueAt?: string | null;

  unitPrice: number;
  currency: string;                 // "VND" ...
  createdAt: string;                // DateTimeOffset -> ISO string
};

export type EntitlementVm = {
  featureId: Guid;
  code?: string | null;
  name?: string | null;
  enabled: boolean;
};

export type UserSubscriptionDetailResponse = UserSubscriptionResponse & {
  isFullPackage: boolean;
  licenseScope: LicenseScope;       // "SeatBased" | "CompanyWide"
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;

  periodCount: number;
  billingPeriod: BillingPeriod;     // "Week" | "Month" | "Year"
  paymentMode: PaymentMode;         // "Prepaid" | "Installments"
  installmentCount?: number | null;
  installmentInterval?: BillingPeriod | null;

  entitlements: EntitlementVm[];
};

export type UserSubscriptionPagedRequest = {
  keyword?: string;
  status?: string;
  pageNumber: number;
  pageSize: number;
};

export type UserSubscriptionPagedResult = PagedResult<UserSubscriptionResponse>;


//1.GetActiveUserSubscription
export type UserSubscriptionActiveEntitlement = {
  id: Guid;
  featureName: string;
};

export type UserSubscriptionActiveResponse = {
  id: Guid;
  nameSubscription?: string | null;
  userSubscriptionEntitlements: UserSubscriptionActiveEntitlement[];
};