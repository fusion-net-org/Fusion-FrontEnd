// src/interfaces/UserSubscription/UserSubscription.ts

import type {
  Guid,
  PagedResult,
  LicenseScope,
  BillingPeriod,
  PaymentMode,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";

// BE dùng enum SubscriptionStatus (Pending / Active / Suspended / Canceled / Expired...)
// FE để string cho mềm, nhưng comment cho rõ.
export type UserSubscriptionStatus = string;

export type UserSubscriptionResponse = {
  id: Guid;
  userId: Guid;
  planId: Guid;
  planName: string;
  status: UserSubscriptionStatus;

  termStart?: string | null;
  termEnd?: string | null;
  nextPaymentDueAt?: string | null;

  unitPrice: number;
  currency: string;
  createdAt: string;
};

// Entitlement detail (trang chi tiết gói của user)
export type EntitlementVm = {
  featureId: Guid;
  code?: string | null;
  name?: string | null;
  enabled: boolean;

  // match UserSubscriptionEntitlement.MonthlyLimit / LimitUnit (nếu BE trả ra)
  monthlyLimit?: number | null;
  limitUnit?: number | null;
};

export type UserSubscriptionDetailResponse = UserSubscriptionResponse & {
  isFullPackage: boolean;
  // BE map từ LicenseScopeSnapshot.ToString() => "Userlimits" | "EntireCompany"
  licenseScope: LicenseScope;
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;

  periodCount: number;
  billingPeriod: BillingPeriod; // "Week" | "Month" | "Year"
  paymentMode: PaymentMode;     // "Prepaid" | "Installments"
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

// ========== Active subscription cho dropdown / share company ==========

export type UserSubscriptionActiveEntitlement = {
  id: Guid;            // Id của UserSubscriptionEntitlement
  featureName: string; // Tên feature hiển thị

  // nếu BE mở rộng UserSubscriptionEntitlementDropdownResponse:
  featureId?: Guid;
  monthlyLimit?: number | null;
};

export type UserSubscriptionActiveResponse = {
  id: Guid;
  nameSubscription?: string | null; // plan name
  userSubscriptionEntitlements: UserSubscriptionActiveEntitlement[];
};
