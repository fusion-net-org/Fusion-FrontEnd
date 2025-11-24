import { axiosInstance } from '../apiConfig';

export const overviewDashboard = async () => {
  try {
    const response = await axiosInstance.get('/Dashboard/overview');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const getRevenueMonthlyByYear = async () => {
  try {
    const response = await axiosInstance.get(`/TransactionPayment/stats/revenue-monthly`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error fetching revenue data!';
    throw new Error(message);
  }
};

export const getStatusPackage = async () => {
  try {
    const response = await axiosInstance.get('/TransactionPayment/stats/packages');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const getCompaniesCreatedByMonth = async () => {
  try {
    const response = await axiosInstance.get(`/company/stats/created-by-month`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const getCompanyStatusCounts = async () => {
  try {
    const response = await axiosInstance.get(`/company/getCompanyStatusCounts`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const getUserStatusCounts = async () => {
  try {
    const response = await axiosInstance.put(`/User/count-status-user`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const getTotalsDashboard = async () => {
  try {
    const response = await axiosInstance.get(`/DashBoard/total_entities`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const getMonthlyStats = async () => {
  try {
    const response = await axiosInstance.get(`/dashboard/monthly-stats`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const getPlanRate = async () => {
  try {
    const response = await axiosInstance.get(`/DashBoard/purchase-ratio`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
