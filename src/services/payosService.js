import { axiosInstance } from '@/apiConfig';

export const createPaymentLink = async (transactionId) => {
  try {
    if (!transactionId) throw new Error('transactionId is required');
    const response = await axiosInstance.post(`/PayOS/${transactionId}/create-link`);
    // console.log("PayOS API Response:", response);  // nếu cần
    return response; // <<=== trả nguyên AxiosResponse
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to create payment link!');
  }
};
