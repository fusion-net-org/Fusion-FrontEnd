
import { axiosInstance } from '@/apiConfig';

export const createTransaction = async (input) => {
  try {
    const planId =
      typeof input === 'string'
        ? input
        : input?.planId || input?.id || input?.plan?.id;

    if (!planId) throw new Error('planId is required');

    const body = { planId }; // đúng schema swagger
    const response = await axiosInstance.post('/TransactionPayment', body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || 'Failed to create transaction!'
    );
  }
};