import { axiosInstance } from '../apiConfig';

export const GetAllForCustomer = async () => {
  try {
    const response = await axiosInstance.get('/SubscriptionPlan/for_customer');
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
export const getSubscriptionPlanById = async (planId) => {
  try {
    const response = await axiosInstance.get(`/SubscriptionPlan/${planId}`);
    return response.data?.data; // vì backend trả { succeeded, statusCode, message, data }
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    throw new Error(error.response?.data?.message || 'Error fetching subscription plan!');
  }
};
 