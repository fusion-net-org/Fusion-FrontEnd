import { axiosInstance } from '../apiConfig';

export const createCompany = async (data) => {
  try {
    const response = await axiosInstance.post('/company', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const getPagedCompanies = async (pageNumber = 1, pageSize = 8) => {
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

export const searchCompanies = async (keyword, pageNumber = 1, pageSize = 8) => {
  try {
    const response = await axiosInstance.get(
      `/company/paged?Keyword=${encodeURIComponent(keyword)}`,
      {
        params: {
          pageNumber,
          pageSize,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
export const filterAndSortCompanies = async (
  SortColumn,
  SortDescending,
  pageNumber = 1,
  pageSize = 8,
) => {
  try {
    const response = await axiosInstance.get('/company/paged', {
      params: {
        SortColumn,
        SortDescending,
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
//https://localhost:7160/api/company/8e27874a-9364-40aa-96e9-a0677fa58d4c
// export const getCompanyById = async (id) => {
//   try {
//     const response = await axiosInstance.get($`/company/{id}`);
//     return response.data;
//   } catch (error) {
//     throw new Error(error.response?.data?.message || 'Error!');
//   }
// };

export const getCompanyById = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/company/${id}`);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
