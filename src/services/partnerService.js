import { axiosInstance } from '../apiConfig';

//https://localhost:7160/api/partners/owner?PageNumber=1&PageSize=2
// https://localhost:7160/api/partners/owner?FromDate=2025-11-11&ToDate=2025-11-12
export const GetCompanyPartners = async (
  FromDate,
  ToDate,
  pageNumber = 1,
  pageSize = 8,
  SortColumn,
  SortDescending,
) => {
  try {
    const response = await axiosInstance.get('/partners/owner', {
      params: {
        FromDate: FromDate,
        ToDate: ToDate,
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

//https://localhost:7160/api/partners/owner?Keyword=1111111111
export const SearchPartners = async (Keyword) => {
  try {
    const response = await axiosInstance.get('/partners/owner', {
      params: {
        Keyword: Keyword,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

//https://localhost:7160/api/partners/pending
export const FilterPartners = async (status) => {
  try {
    const response = await axiosInstance.get(`/partners/${status}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

//https://localhost:7160/api/partners/cancel/19
export const CancelInvitePartner = async (id) => {
  try {
    const response = await axiosInstance.get(`/partners/cancel/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

//https://localhost:7160/api/partners/accept/2
export const AcceptInvitePartnert = async (id) => {
  try {
    const response = await axiosInstance.get(`/partners/accept/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

//https://localhost:7160/api/partners/invite
export const InvitePartnert = async (data) => {
  try {
    const response = await axiosInstance.post('/partners/invite', data, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
