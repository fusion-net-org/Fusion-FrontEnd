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
  RespondFromDate,
  RespondToDate,
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
        RespondFromDate: RespondFromDate,
        RespondToDate: RespondToDate,
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

//https://localhost:7160/api/partners/between/DE562EA1-F67A-45CB-92A1-1199C1BC09E6/16AB11C0-D1CE-49F6-924B-B9235D5B9ACD
export const GetPartnerBetweenTwoCompanies = async (companyIdA, companyIdB, friendshipId) => {
  try {
    const response = await axiosInstance.get(`/partners/between/${companyIdA}/${companyIdB}`, {
      params: {
        friendshipId,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

//https://localhost:7160/api/partners/delete/35

//https://localhost:7160/api/partners/delete/35
export const DeletePartner = async (id) => {
  try {
    const response = await axiosInstance.delete(`/partners/delete/${id}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const GetAllPartnersOfCompany = async (companyId, companyName = '') => {
  try {
    const response = await axiosInstance.get(`/partners/all-partners/${companyId}`, {
      params: {
        companyName,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
