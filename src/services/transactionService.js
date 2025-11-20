import { axiosInstance } from "@/apiConfig";

const unwrap = (res) => res?.data?.data ?? res?.data;
const onError = (e, fallback = "Unexpected error") => {
  const msg = e?.response?.data?.message || e?.message || fallback;
  throw new Error(msg);
};

export const getAllTransactionForAdmin = async (filters = {}) => {
  try {
    const response = await axiosInstance.get("/TransactionPayment/admin/pagedTransaction", {
      params: {
        UserName: filters.userName,
        PlanName: filters.planName,
        Status: filters.status,
        Keyword: filters.keyword,
        "TransactionAt.From": filters.paymentDateFrom,
        "TransactionAt.To": filters.paymentDateTo,
        PageNumber: filters.pageNumber ?? 1,
        PageSize: filters.pageSize ?? 10,
        SortColumn: filters.sortColumn ?? "TransactionDateTime",
        SortDescending:
          filters.sortDescending ?? true,
      },
    });

    // TransactionPaymentPagedSummaryResponse
    return unwrap(response);
  } catch (error) {
    onError(error, "Failed to get transaction list!");
  }
};

export const getTransactionById = async (id) => {
  try {
    const response = await axiosInstance.get(`/TransactionPayment/${id}`);
    // TransactionPaymentDetailResponse
    return unwrap(response);
  } catch (error) {
    onError(error, "Failed to get detail transaction!");
  }
};


export async function createTransactionPayment(payload) {
  try {
    const res = await axiosInstance.post("/TransactionPayment/create", payload);
    // ResponseModel<TransactionPaymentDetailResponse>
    return unwrap(res) ?? null;
  } catch (e) {
    onError(e, "Failed to create transaction payment!");
  }
}

export const getNextPendingInstallment = async (params) => {
  try {
    const res = await axiosInstance.get(
      "/TransactionPayment/installments/next",
      { params }
    );
    return unwrap(res) ?? null;
  } catch (error) {
    onError(error);
    return null;
  }
};

//================================ OverView Section ===================================

//1 . Monthly revenue (for overview chart)
export const getMonthlyRevenueForAdmin = async (year) => {
  try {
    const response = await axiosInstance.get(
      "/TransactionPayment/admin/revenue/monthly",
      {
        params: {
          year,
        },
      }
    );
    return unwrap(response); // { year: number, items: MonthlyRevenuePoint[] }
  } catch (error) {
    onError(error, "Failed to load monthly revenue!");
  }
};

// 2.Monthly revenue – 3-year comparison
export const getMonthlyRevenueThreeYearsForAdmin = async (year) => {
  try {
    const response = await axiosInstance.get(
      "/TransactionPayment/admin/revenue/monthly-three-years",
      {
        params: {
          year, 
        },
      }
    );

    return unwrap(response);
  } catch (error) {
    onError(error, "Failed to load 3-year revenue comparison!");
  }
};

//3. PaymentHealthChart
export const getMonthlyStatusForAdmin = async (year) => {
  try {
    const res = await axiosInstance.get(
      "/TransactionPayment/admin/monthly-status",
      { params: { year } }
    );
    return unwrap(res); // TransactionMonthlyStatusResponse
  } catch (error) {
    onError(error);
  }
};

//4.Daily cashflow
export const getDailyCashflowForAdmin = async (days = 30) => {
  try {
    const res = await axiosInstance.get(
      "/TransactionPayment/admin/analytics/daily-cashflow",
      { params: { days } }
    );
    return unwrap(res); // TransactionDailyCashflowResponse
  } catch (error) {
    onError(error, "Failed to get daily cashflow!");
  }
}

//5. Installment aging
export const getInstallmentAgingForAdmin = async (asOf) => {
  try {
    const params = asOf ? { asOf } : undefined;
    const res = await axiosInstance.get(
      "/TransactionPayment/admin/analytics/installments/aging",
      { params }
    );
    return unwrap(res); // TransactionInstallmentAgingResponse
  } catch (error) {
    onError(error, "Failed to get installment aging!");
  }
};

// 6. Top Users by Revenue
export async function getTopCustomersForAdmin(year, topN = 5) {
  try {
    const res = await axiosInstance.get(
      "/TransactionPayment/admin/top-customers",
      {
        params: { year: Number(year), topN },
      }
    );
    return unwrap(res); // TransactionTopCustomersResponse
  } catch (e) {
    onError(e, "Failed to get top customers!");
  }
}

// 7. Payment mode insight
export async function getPaymentModeInsightForAdmin(year) {
  try {
    const res = await axiosInstance.get(
      "/TransactionPayment/admin/payment-mode-insight",
      { params: { year: Number(year) } }
    );
    return unwrap(res);
  } catch (e) {
    onError(e, "Failed to load payment mode insight");
  }
}

// 8. Plan revenue insight
export async function getPlanRevenueInsightForAdmin(year) {
  try {
    const res = await axiosInstance.get(
      "/TransactionPayment/admin/plan-revenue-insight",
      { params: { year: Number(year) } }
    );
    return unwrap(res);
  } catch (e) {
    onError(e, "Failed to load plan revenue insight");
  }
}