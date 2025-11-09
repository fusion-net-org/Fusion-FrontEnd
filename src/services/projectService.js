import { axiosInstance } from '../apiConfig';

export const getAllProjectByAdmin = async ({
  CompanyName = '',
  PageNumber = 1,
  PageSize = 10,
  SortColumn = '',
  SortDescending = false,
}) => {
  try {
    const response = await axiosInstance.get('/admin', {
      params: {
        CompanyName,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });

    return response.data?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch admin projects.');
  }
};

export const getProjectById = async (id) => {
  try {
    const response = await axiosInstance.get(`/admin/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
