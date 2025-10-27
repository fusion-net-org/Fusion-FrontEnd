import { axiosInstance } from '../apiConfig';

// https://localhost:7160/api/CompanyActivityLogs?companyId=DE562EA1-F67A-45CB-92A1-1199C1BC09E6

export const AllActivityLogCompanyById = async (
  companyId,
  Keyword = null,
  From = null,
  To = null,
  PageNumber,
  PageSize,
  SortColumn = null,
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/CompanyActivityLogs`, {
      params: {
        companyId,
        Keyword,
        From,
        To,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
