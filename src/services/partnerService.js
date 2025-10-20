import { axiosInstance } from '../apiConfig';

// export const GetCompanyPartners = async (
//   FromDate,
//   ToDate,
//   pageNumber = 1,
//   pageSize = 8,
//   SortColumn,
//   SortDescending,
// ) => {
//   try {
//     const response = await axiosInstance.get('/partners/owner', {
//       params: {
//         FromDate: FromDate,
//         ToDate: ToDate,
//         PageNumber: pageNumber,
//         PageSize: pageSize,
//         SortColumn,
//         SortDescending,
//       },
//     });
//     return response.data;
//   } catch (error) {
//     throw new Error(error.response?.data?.message || 'Error!');
//   }
// };
export const GetCompanyPartnersByCompanyID = async (
  companyId,
  Keyword,
  FromDate,
  ToDate,
  pageNumber = 1,
  pageSize = 8,
  SortColumn,
  SortDescending,
) => {
  try {
    const response = await axiosInstance.get('/partners/by-company/v2', {
      params: {
        companyId: companyId,
        Keyword: Keyword,
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
export const GetStatusSumaryPartners = async (companyId) => {
  try {
    const response = await axiosInstance.get('partners/status-summary', {
      params: {
        companyId,
      },
    });
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
export const FilterPartners = async (companyId, status) => {
  try {
    const response = await axiosInstance.get(`/partners/status`, {
      params: {
        companyId,
        status,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

//https://localhost:7160/api/partners/cancel/19
export const CancelInvitePartner = async (id) => {
  try {
    const response = await axiosInstance.get(`/partners/cancel/${id}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

//https://localhost:7160/api/partners/accept/2
export const AcceptInvitePartnert = async (id) => {
  try {
    const response = await axiosInstance.get(`/partners/accept/${id}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

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
