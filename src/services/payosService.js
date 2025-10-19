
import { axiosInstance } from '../apiConfig';
/**Create payment link for transaction */
export const createPaymentLink = async (transactionId) => {
  try {
    console.log("Creating PayOS link for:", transactionId);
      const response = await axiosInstance.post(`/PayOS/${transactionId}/create-link`);
        console.log("PayOS API Response:", response.data);
     return response.data.data;
  } catch (error) {
   console.error("PayOS create-link error:", error);
    throw new Error(error.response?.data?.message || 'Failed to create payment link!');
  }
};