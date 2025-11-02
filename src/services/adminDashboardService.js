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

export const getRevenueMonthlyByYear = async (year) => {
  try {
    const response = await axiosInstance.get(
      `/TransactionPayment/stats/revenue-monthly?year=${year}`,
    );
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

export const getCompaniesCreatedByMonth = async (year) => {
  try {
    const response = await axiosInstance.get(`/company/stats/created-by-month?year=${year}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
