import { axiosInstance } from '../apiConfig';

//https://localhost:7160/api/partners/owner?PageNumber=1&PageSize=2
export const GetCompanyPartners = async (
  pageNumber = 1,
  pageSize = 8,
  SortColumn,
  SortDescending,
) => {
  try {
    const response = await axiosInstance.get('/partners/owner', {
      params: {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SortColumn,
        SortDescending,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

// https://localhost:7160/api/partners/status-summary
export const GetStatusSumaryPartners = async () => {
  try {
    const response = await axiosInstance.get('partners/status-summary');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
