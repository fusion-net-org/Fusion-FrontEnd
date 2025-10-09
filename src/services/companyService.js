import { axiosInstance } from '../apiConfig';

export const createCompany = async (data) => {
  try {
    const response = await axiosInstance.post('/company', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const getPagedCompanies = async (pageNumber = 1, pageSize = 10) => {
  try {
    const response = await axiosInstance.get(`/company/paged`, {
      params: {
        pageNumber,
        pageSize,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
