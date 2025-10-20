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

export const getAllCompanies = async (
  keyword = '',
  ownerUserName = '',
  relationShipEnums = '',
  pageNumber = 1,
  pageSize = 25,
  SortColumn = null,
  SortDescending = null,
  companyId = '',
) => {
  try {
    const params = new URLSearchParams();

    if (keyword && keyword.trim()) params.append('Keyword', encodeURIComponent(keyword.trim()));
    if (ownerUserName && ownerUserName.trim())
      params.append('OwnerUserName', encodeURIComponent(ownerUserName.trim()));
    if (relationShipEnums && relationShipEnums.trim())
      params.append('RelationShipEnums', relationShipEnums);
    if (companyId && companyId.trim()) params.append('companyId', companyId);
    if (SortColumn) params.append('SortColumn', SortColumn);
    if (typeof SortDescending === 'boolean')
      params.append('SortDescending', SortDescending.toString());
    params.append('PageNumber', pageNumber.toString());
    params.append('PageSize', pageSize.toString());

    const queryString = params.toString().replace(/%25/g, '%');

    const response = await axiosInstance.get(`/company/all-companies?${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw new Error(error.response?.data?.message || 'Error fetching companies!');
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

export const getCompanyById = async (id) => {
  try {
    const { data } = await axiosInstance.get(`/company/${id}`);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
