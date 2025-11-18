import { axiosInstance } from "@/apiConfig";

const unwrap = (res) => res?.data?.data ?? res?.data;
const onError = (e) => {
  const msg = e?.response?.data?.message || e?.message || "Unexpected error";
  throw new Error(msg);
};


export async function createTransactionPayment(payload) {
  try {
    const res = await axiosInstance.post("/TransactionPayment/create", payload);
    // ResponseModel<TransactionPaymentDetailResponse>
    return unwrap(res) ?? null;
  } catch (e) {
    onError(e);
  }
}


export const getAllTransactionForAdmin = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/TransactionPayment/paged', {
      params: {
        PlanName: filters.planName,
        'TransactionAt.From': filters.paymentDateFrom,
        'TransactionAt.To': filters.paymentDateTo,
        AmountMin: filters.amountMin,
        AmountMax: filters.amountMax,
        Status: filters.status,
        PageNumber: filters.pageNumber || 1,
        PageSize: filters.pageSize || 10,
        SortColumn: filters.sortColumn || 'PaymentDate',
        SortDescending: filters.sortDescending !== undefined ? filters.sortDescending : true,
      },
    });

    return response.data?.data || response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get transaction list!');
  }
};

export const getTransactionById = async (id) => {
  try {
    const response = await axiosInstance.get(`/TransactionPayment/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get detail transaction!');
  }
};

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