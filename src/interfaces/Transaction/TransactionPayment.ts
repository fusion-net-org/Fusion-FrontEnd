// src/interfaces/TransactionPayment/TransactionPayment.ts

import type {
  Guid,
  BillingPeriod,
  ChargeUnit,
  PaymentMode,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";

// keep in sync với Fusion.Repository.Enums
export type PaymentStatus = string;
export type TransactionType = string;

// ----------- Requests / filters -----------

export type TransactionPaymentCreateRequest = {
  planId: Guid;
};

// Query params cho installments/next
export type NextInstallmentParams = {
  planId: Guid;
  userSubscriptionId?: Guid | null;
};

export type TransactionPaymentFilters = {
  userName?: string;
  planName?: string;
  status?: PaymentStatus;
  keyword?: string;
  paymentDateFrom?: string; // ISO string
  paymentDateTo?: string;   // ISO string
  pageNumber?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDescending?: boolean;
};

// ----------- Responses -----------

// ITEM cho list/paged (map với TransactionPaymentResponse trong BE)
export type TransactionPaymentListItem = {
  id: Guid;

  // Navs
  userId: Guid;
  userName?: string | null;

  planId: Guid;
  planName?: string | null;

  userSubscriptionId?: Guid | null;

  // Payment link / gateway
  orderCode?: number | null;
  paymentLinkId?: string | null;
  provider?: string | null;
  paymentMethod?: string | null;

  // Amount & currency
  amount: number;
  currency: string; // "VND", ...

  // Timestamps (ISO strings)
  createdAt: string;
  transactionDateTime?: string | null;
  dueAt?: string | null;
  paidAt?: string | null;

  // Status & type
  status: PaymentStatus;
  type: TransactionType;

  // Installments meta
  installmentIndex?: number | null;
  installmentTotal?: number | null;

  // Snapshot pricing tại thời điểm charge
  chargeUnitSnapshot: ChargeUnit;
  billingPeriodSnapshot: BillingPeriod;
  periodCountSnapshot: number;
  paymentModeSnapshot: PaymentMode;
};

// DETAIL = list item + description / bank info
export type TransactionPaymentDetailResponse = TransactionPaymentListItem & {
  // Descriptions / references
  description?: string | null;
  reference?: string | null;

  // Bank / counter account info
  accountNumber?: string | null;            // receiving account
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
};

// Paged + summary cho admin dashboard
export type TransactionPaymentPagedSummaryResponse = {
  items: TransactionPaymentListItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;

  totalTransactions: number;
  totalRevenue: number;
  totalSuccess: number;
  totalCancelled: number;
  totalPending: number;
};

export type NextInstallmentResponse = TransactionPaymentDetailResponse | null;

// ================= Monthly revenue overview ================
// 1. Monthly revenue 
export type MonthlyRevenuePoint = {
  month: number;          // 1..12
  totalAmount: number;    // sum Amount (Success)
  transactionCount: number;
};

export type TransactionMonthlyRevenueResponse = {
  year: number;
  items: MonthlyRevenuePoint[];
};

//2 .Monthly revenue – 3-year comparison
export type MonthlyRevenueComparisonPoint = {
  month: number;                       // 1..12
  yearMinus2Amount: number;
  yearMinus2TransactionCount: number;
  yearMinus1Amount: number;
  yearMinus1TransactionCount: number;
  yearAmount: number;
  yearTransactionCount: number;
};

export type TransactionMonthlyRevenueThreeYearsResponse = {
  year: number;        // base year, e.g. 2025
  yearMinus1: number;  // 2024
  yearMinus2: number;  // 2023
  items: MonthlyRevenueComparisonPoint[];
};

//3.PaymentHealthChart
export type TransactionMonthlyStatusItem = {
  month: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
};

export type TransactionMonthlyStatusResponse = {
  year: number;
  items: TransactionMonthlyStatusItem[];
};

//4.DAILY CASHFLOW (last N days)
export type TransactionDailyCashflowPoint = {
  date: string;        // ISO date "2025-11-18"
  revenue: number;     // total amount (Success) in this day
  successCount: number;
};

export type TransactionDailyCashflowResponse = {
  from: string;        // ISO date
  to: string;          // ISO date
  items: TransactionDailyCashflowPoint[];
};

//5.INSTALLMENT AGING / OVERDUE
export type TransactionInstallmentAgingItem = {
  bucketKey: string;          // "NotDue", "1-7", "8-14", "15-30", "31-60", "60+"
  installmentCount: number;
  outstandingAmount: number;
};

export type TransactionInstallmentAgingResponse = {
  asOf: string;               // ISO datetime
  items: TransactionInstallmentAgingItem[];
  totalInstallments: number;
  totalOutstandingAmount: number;
};

//6. Top User 
export type TransactionTopCustomerItem = {
  userId: string;
  userName?: string | null;
  email?: string | null;
  totalAmount: number;
  successCount: number;
  maxPayment: number;
  lastPaymentAt?: string | null;
};

export type TransactionTopCustomersResponse = {
  year: number;
  topN: number;
  items: TransactionTopCustomerItem[];
};

//7.Payment mode insight

export type TransactionPaymentModeInsightItem = {
  paymentMode: PaymentMode;        
  transactionCount: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  totalAmount: number;
};

export type TransactionPaymentModeInsightResponse = {
  year: number;
  items: TransactionPaymentModeInsightItem[];
};

//8.Plan revenue insight
export type TransactionPlanRevenueInsightItem = {
  planId: string;
  planName: string;
  transactionCount: number;
  successCount: number;
  totalAmount: number;
};

export type TransactionPlanRevenueInsightResponse = {
  year: number;
  items: TransactionPlanRevenueInsightItem[];
};

//9.
export type SubscriptionPlanPurchaseStatItem = {
  planId: string;
  planName: string;
  purchaseCount: number;
  totalAmount: number;
  percentage: number;   // đúng với field BE
  isOther?: boolean;    // nếu sau này BE có gộp “Other”
};
// 10. Monthly plan purchases (per month in a year)
export type SubscriptionPlanMonthlyPurchaseItem = {
  planId: string;
  planName: string;
  month: number;
  purchaseCount: number;
};

export type SubscriptionPlanMonthlyPurchaseResponse = {
  year: number;
  items: SubscriptionPlanMonthlyPurchaseItem[];
};
//11. Raw DTO đúng với API backend
export type PlanMonthlyPurchaseCountRowDto = {
  planId: string;
  planName: string;
  year: number;
  month: number;        // 1..12
  purchaseCount: number;
  totalAmount: number;
};
