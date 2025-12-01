// ---------- Aliases ----------
export type Guid = string;

// ---------- String unions (không dùng enum FE) ----------
// Khớp với enum BE: Userlimits / EntireCompany
export type LicenseScope = "Userlimits" | "EntireCompany";
export type BillingPeriod = "Week" | "Month" | "Year";
export type ChargeUnit = "PerSubscription" | "PerSeat";
export type PaymentMode = "Prepaid" | "Installments";

// ---------- Wrappers ----------
export type ResponseModel<T> = {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: T;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

// ---------- Shared DTOs ----------
export type SubscriptionPlanFeatureResponse = {
  featureId: Guid;
  featureCode?: string | null;
  featureName?: string | null;
  enabled: boolean;
  /** Monthly limit của feature này trong plan; null = unlimited */
  monthlyLimit?: number | null;
};

export type SubscriptionPlanPriceDiscountResponse = {
  installmentIndex: number; // kỳ thứ mấy (1,2,3,…)
  discountValue: number; // 10 = 10%
  note?: string | null;
};

export type SubscriptionPlanPriceResponse = {
  id: Guid;
  billingPeriod: BillingPeriod; // "Week" | "Month" | "Year"
  periodCount: number;
  chargeUnit: ChargeUnit; // "PerSubscription" | "PerSeat"
  price: number;
  newPrice?: number | null;
  currency: string; // "VND" ...
  paymentMode: PaymentMode; // "Prepaid" | "Installments"
  installmentCount?: number | null;
  installmentInterval?: BillingPeriod | null;
  discounts?: SubscriptionPlanPriceDiscountResponse[] | null;
};

// ---------- Detail (BE) ----------
export type SubscriptionPlanDetailResponse = {
  id: Guid;
  name: string;
  description?: string | null; // detail có description
  isActive: boolean;
  licenseScope: LicenseScope; // "Userlimits" | "EntireCompany"
  isFullPackage: boolean;
  /** Plan free auto-grant hàng tháng hay không */
  autoGrantMonthly: boolean;
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;
  createdAt: string; // DateTime -> ISO string
  updatedAt: string; // DateTime -> ISO string
  price?: SubscriptionPlanPriceResponse | null;
  features: SubscriptionPlanFeatureResponse[];
};

export type SubscriptionPlanListItemResponse = {
  id: Guid;
  name: string;
  isActive: boolean;
  licenseScope: LicenseScope; // "Userlimits" | "EntireCompany"
  isFullPackage: boolean;
  /** Hiển thị flag "Free monthly" trên list */
  autoGrantMonthly: boolean;
  companyShareLimit?: number | null; // null = unlimited
  seatsPerCompanyLimit?: number | null; // null = unlimited
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

// ---------- Inputs ----------
export type SubscriptionPlanPriceDiscountInput = {
  installmentIndex: number;
  discountValue: number; // 10 = 10%
  note?: string | null;
};

export type SubscriptionPlanPriceInput = {
  billingPeriod: BillingPeriod;
  periodCount: number;
  chargeUnit: ChargeUnit;
  price: number;
  currency: string;
  paymentMode: PaymentMode;
  installmentCount?: number | null;
  installmentInterval?: BillingPeriod | null;
  discounts?: SubscriptionPlanPriceDiscountInput[] | null;
};

/** Per-feature limit cho request create/update plan */
export type SubscriptionPlanFeatureLimitInput = {
  featureId: Guid;
  /** null/undefined = unlimited */
  monthlyLimit?: number | null;
};

export type SubscriptionPlanCreateRequest = {
  name: string;
  description?: string | null;
  isActive: boolean;
  licenseScope: LicenseScope; // "Userlimits" | "EntireCompany"
  isFullPackage: boolean;
  /** Plan free auto-grant hàng tháng */
  autoGrantMonthly: boolean;
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;
  price: SubscriptionPlanPriceInput; // billingPeriod, periodCount, chargeUnit, price, currency, paymentMode, installmentCount?, installmentInterval?
  /**
   * Danh sách feature được bật trong plan.
   * undefined = để server tự xử lý theo isFullPackage; [] = clear; list = replace
   */
  featureIds?: Guid[] | null;

  /**
   * Monthly limit cho từng feature trong plan (chủ yếu dùng khi autoGrantMonthly = true).
   * BE map vào SubscriptionPlanFeature.MonthlyLimit
   */
  featureMonthlyLimits?: SubscriptionPlanFeatureLimitInput[] | null;
};

export type SubscriptionPlanUpdateRequest = {
  id: Guid;
  name: string;
  description?: string | null;
  isActive: boolean;
  licenseScope: LicenseScope; // "Userlimits" | "EntireCompany"
  isFullPackage: boolean;
  autoGrantMonthly: boolean;
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;
  price: SubscriptionPlanPriceInput;
  /**
   * null = giữ như cũ, [] = clear, list = replace (nếu không full feature)
   */
  featureIds?: Guid[] | null;
  /** Monthly limit per feature (giống create) */
  featureMonthlyLimits?: SubscriptionPlanFeatureLimitInput[] | null;
};

// ---------- Query params ----------
export type GetPlansPagedParams = {
  keyword?: string;
  isActive?: boolean | null;
  billingPeriod?: BillingPeriod | null;
  sortColumn?: string;
  sortDescending?: boolean;
  pageNumber: number;
  pageSize: number;
};

// ---------- Public (customer) view ----------
export type PlanPricePreviewResponse = {
  amount: number;
  newAmount?: number | null;
  discountPercent?: number | null;
  currency: string;
  billingPeriod: BillingPeriod;
  periodCount: number;
  chargeUnit: ChargeUnit;
  paymentMode: PaymentMode;
  installmentCount?: number | null;
  installmentInterval?: BillingPeriod | null;
};

export type PlanFeatureChipResponse = {
  name: string;
};

export type SubscriptionPlanCustomerResponse = {
  id: Guid;
  name: string;
  description?: string | null;

  isFullPackage: boolean;
  licenseScope: LicenseScope; // "Userlimits" | "EntireCompany"
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;

  price?: PlanPricePreviewResponse | null;
  featuresPreview: PlanFeatureChipResponse[];
};
