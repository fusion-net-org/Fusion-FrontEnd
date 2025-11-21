import { axiosInstance } from '@/apiConfig';

export const createPaymentLink = async (transactionId) => {
  try {
    if (!transactionId) throw new Error('transactionId is required');
    const response = await axiosInstance.post(`/PayOS/${transactionId}/create-link`);
    return response; 
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to create payment link!');
  }
};

export const refreshPayosStatus = async (orderCode, paymentLinkId) => {
  const qs = new URLSearchParams();
  if (orderCode) qs.set('orderCode', String(orderCode));
  if (paymentLinkId) qs.set('paymentLinkId', paymentLinkId);

  const { data } = await axiosInstance.post(`/PayOS/refresh-status?${qs.toString()}`);
  // data = { succeeded, message, data: "<status>" }
  return data?.data ?? data;
};