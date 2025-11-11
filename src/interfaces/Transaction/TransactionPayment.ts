export type BillingPeriod = "Week" | "Month" | "Year";

/** ===== Transaction Payment DTOs ===== */
export interface TransactionPaymentCreateRequest {
  /** BE swagger yêu cầu: planId */
  planId: string;
}

export interface TransactionPaymentResponse {
  id: string;
  orderCode: number | null;
  paymentLinkId: string | null;
  amount: number;
  currency: string;                 // "VND"
  transactionDateTime: string | null;
  status: string;                   // "Pending" | ...
  userName?: string;
  planName?: string;
}

/** (tuỳ chọn) Kiểu generic cho API wrapper của BE */
export interface ApiEnvelope<T> {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: T;
}

/** ===== Subscription (tối thiểu dùng cho Confirm) ===== */
export interface SubscriptionPlanLite {
  id: string;                       // planId
  name: string;
  code?: string;
}