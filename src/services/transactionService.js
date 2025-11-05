import { axiosInstance } from '../apiConfig';
/** Create a new transaction when you click pay*/

export const createTransaction = async (subscription) => {
  try {
    const payload = { PackageId: subscription.planId || subscription.plan.id };
    console.log('Payload for transaction:', payload);
    const response = await axiosInstance.post('/TransactionPayment', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to create transaction!');
  }
};

/**Get latest transaction of user */
export const getLatestTransaction = async () => {
  try {
    const response = await axiosInstance.get('/TransactionPayment/latest');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get latest transaction!');
  }
};

export const getAllTransactionForAdmin = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/TransactionPayment/getAllForAdmin', {
      params: {
        TransactionCode: filters.transactionCode,
        PackageName: filters.packageName,
        PaymentDateFrom: filters.paymentDateFrom,
        PaymentDateTo: filters.paymentDateTo,
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
