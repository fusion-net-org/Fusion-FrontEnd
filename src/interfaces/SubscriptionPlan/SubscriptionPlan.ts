// ---------- Aliases ----------
export type Guid = string;

// ---------- String unions (không dùng enum FE) ----------
export type LicenseScope = "SeatBased" | "CompanyWide";
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
};

export type SubscriptionPlanPriceResponse = {
  id: Guid;
  billingPeriod: BillingPeriod;           // "Week" | "Month" | "Year"
  periodCount: number;
  chargeUnit: ChargeUnit;                 // "PerSubscription" | "PerSeat"
  price: number;
  currency: string;                       // "VND" ...
  paymentMode: PaymentMode;               // "Prepaid" | "Installments"
  installmentCount?: number | null;
  installmentInterval?: BillingPeriod | null;
};

// ---------- Detail (BE) ----------
export type SubscriptionPlanDetailResponse = {
  id: Guid;
  name: string;
  description?: string | null;            // detail có description
  isActive: boolean;
  licenseScope: LicenseScope;
  isFullPackage: boolean;
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;
  createdAt: string;                      // DateTime -> ISO string
  updatedAt: string;                      // DateTime -> ISO string
  price?: SubscriptionPlanPriceResponse | null;
  features: SubscriptionPlanFeatureResponse[];
};

export type SubscriptionPlanListItemResponse = {
  id: Guid;
  name: string;
  isActive: boolean;
  licenseScope: LicenseScope;            // "SeatBased" | "CompanyWide"
  isFullPackage: boolean;
  companyShareLimit?: number | null;     // null = unlimited
  seatsPerCompanyLimit?: number | null;  // null = unlimited
  createdAt: string;                     // ISO
  updatedAt: string;                     // ISO
};

export type SubscriptionPlanCreateRequest = {
  name: string;
  description?: string | null;
  isActive: boolean;
  licenseScope: LicenseScope;          // "SeatBased" | "CompanyWide"
  isFullPackage: boolean;
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;
  price: SubscriptionPlanPriceInput;   // có billingPeriod, periodCount, chargeUnit, price, currency, paymentMode, installmentCount?, installmentInterval?
  // undefined = để server tự xử lý theo isFullPackage; [] = clear; list = replace
  featureIds?: Guid[] | null;
};

// ---------- Requests (FE typings để gửi lên API) ----------
export type SubscriptionPlanPriceInput = {
  billingPeriod: BillingPeriod;
  periodCount: number;
  chargeUnit: ChargeUnit;
  price: number;
  currency: string;
  paymentMode: PaymentMode;
  installmentCount?: number | null;
  installmentInterval?: BillingPeriod | null;
};


export type SubscriptionPlanUpdateRequest = {
  id: Guid;
  name: string;
  description?: string | null;
  isActive: boolean;
  licenseScope: LicenseScope;
  isFullPackage: boolean;
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;
  price: SubscriptionPlanPriceInput;
  // null = giữ như cũ, [] = clear, list = replace (nếu không full package)
  featureIds?: Guid[] | null;
};


export type GetPlansPagedParams = {
  keyword?: string;
  isActive?: boolean | null;
  billingPeriod?: BillingPeriod | null;
  sortColumn?: string;
  sortDescending?: boolean;
  pageNumber: number;
  pageSize: number;
};

// Public (customer) view 

export type PlanPricePreviewResponse = {
  amount: number;
  currency: string;
  billingPeriod: BillingPeriod;
  periodCount: number;
  chargeUnit: ChargeUnit;
  paymentMode: PaymentMode;
  installmentCount?: number | null;
  installmentInterval?: BillingPeriod | null;
  discounts?: SubscriptionPlanPriceDiscountResponse[] | null;
};

export type PlanFeatureChipResponse = {
  name: string;
};

export type SubscriptionPlanCustomerResponse = {
  id: Guid;
  name: string;
  description?: string | null;

  isFullPackage: boolean;
  licenseScope: LicenseScope;
  companyShareLimit?: number | null;
  seatsPerCompanyLimit?: number | null;

  price?: PlanPricePreviewResponse | null;
  featuresPreview: PlanFeatureChipResponse[];
};

export type SubscriptionPlanPriceDiscountResponse = {
  installmentIndex: number;     // kỳ thứ mấy (1,2,3,…)
  discountValue: number;        // 10 = 10%
  note?: string | null;
};

export type SubscriptionPlanPriceDiscountInput = {
  installmentIndex: number;
  discountValue: number;        // 10 = 10%
  note?: string | null;
}