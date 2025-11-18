// src/interfaces/TransactionPayment/TransactionPayment.ts

import type {
  Guid,
  BillingPeriod,
  ChargeUnit,
  PaymentMode,
} from "@/interfaces/SubscriptionPlan/SubscriptionPlan";

// TODO: có thể refine lại thành union "Pending" | "Succeeded"...
export type PaymentStatus = string;      // keep in sync với Fusion.Repository.Enums.PaymentStatus
export type TransactionType = string;    // keep in sync với Fusion.Repository.Enums.TransactionType

// ----------- Requests -----------

export type TransactionPaymentCreateRequest = {
  planId: Guid;
};

// Query params cho installments/next
export type NextInstallmentParams = {
  planId: Guid;
  userSubscriptionId?: Guid | null;
};

// ----------- Responses -----------

export type TransactionPaymentDetailResponse = {
  id: Guid;

  // Navs
  userId: Guid;
  userName?: string | null;

  planId: Guid;
  planName?: string | null;

  // Payment link / gateway
  orderCode?: number | null;
  paymentLinkId?: string | null;
  provider?: string | null;
  paymentMethod?: string | null;

  // Amount & currency
  amount: number;
  currency: string; // "VND", ...

  // Descriptions / references
  description?: string | null;
  reference?: string | null;

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

  // Bank / counter account info
  accountNumber?: string | null;            // receiving account
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
};

export type NextInstallmentResponse = TransactionPaymentDetailResponse | null;
