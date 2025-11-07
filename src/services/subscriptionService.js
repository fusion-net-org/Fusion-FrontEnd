import { axiosInstance } from '../apiConfig';

export const getAllSubscriptions = async () => {
  try {
    const response = await axiosInstance.get('/SubscriptionPackage/GetSubscriptionForCustomer');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const GetSubscriptionForAdmin = async () => {
  try {
    const response = await axiosInstance.get('/SubscriptionPackage/GetSubscriptionForAdmin');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const GetSubscriptionById = async (id) => {
  try {
    const response = await axiosInstance.get(`/SubscriptionPackage/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const CreateSubscription = async (payload) => {
  try {
    const response = await axiosInstance.post('/SubscriptionPackage', payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const UpdateSubscription = async (id, payload) => {
  try {
    const response = await axiosInstance.put(`/SubscriptionPackage/${id}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const DeleteSubscription = async (id) => {
  try {
    const response = await axiosInstance.delete(`/SubscriptionPackage/${id}`);

    return response.status === 204 || response.data?.data === true || false;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const createSubcriptionPlan = async (data) => {
  try {
    const response = await axiosInstance.post('/SubscriptionPlan/create', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const updateSubcriptionPlan = async (data) => {
  try {
    const response = await axiosInstance.put('/SubscriptionPlan/update', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const deleteSubcriptionPlan = async (id) => {
  try {
    const response = await axiosInstance.delete(`/SubscriptionPlan/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const getSubscriptionPlans = async ({
  keyword = '',
  isActive = true,
  billingPeriod = null,
  sortColumn = '',
  sortDescending = true,
  pageNumber = 1,
  pageSize = 10,
} = {}) => {
  try {
    const params = {
      Keyword: keyword || undefined,
      IsActive: isActive,
      BillingPeriod: billingPeriod !== null ? billingPeriod : undefined,
      SortColumn: sortColumn,
      SortDescending: sortDescending,
      PageNumber: pageNumber,
      PageSize: pageSize,
    };

    const response = await axiosInstance.get('/SubscriptionPlan', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error fetching subscription plans!');
  }
};
