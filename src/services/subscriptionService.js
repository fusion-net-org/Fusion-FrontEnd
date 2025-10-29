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
    return response.data; // ResponseModel
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const GetSubscriptionById = async (id) => {
  try {
    const response = await axiosInstance.get(`/SubscriptionPackage/${id}`);
    return response.data; // ResponseModel
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

// payload: { name, price, quotaCompany, quotaProject, description }
export const CreateSubscription = async (payload) => {
  try {
    const response = await axiosInstance.post('/SubscriptionPackage', payload);
    return response.data; // ResponseModel<SubscriptionAdminResponse>
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const UpdateSubscription = async (id, payload) => {
  try {
    const response = await axiosInstance.put(`/SubscriptionPackage/${id}`, payload);
    return response.data; // ResponseModel<SubscriptionAdminResponse>
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const DeleteSubscription = async (id) => {
  try {
    const response = await axiosInstance.delete(`/SubscriptionPackage/${id}`);
    // Controller trả 204 NoContent khi thành công
    // trả về boolean để FE dễ dùng, nhưng vẫn tương thích nếu ai cần object
    return response.status === 204 || response.data?.data === true || false;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
