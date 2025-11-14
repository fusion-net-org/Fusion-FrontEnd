import { axiosInstance } from '../apiConfig';

//https://localhost:7160/api/projectmember/DE562EA1-F67A-45CB-92A1-1199C1BC09E6/FA5AA664-0D66-4620-8FD1-4B42BFC18578
export const getProjectMemberByCompanyIdAndUserId = async (
  companyId,
  memberId,
  ProjectNameOrCode = '',
  Status = '',
  StartDate = '',
  EndDate = '',
  PageNumber = 1,
  PageSize = 10,
  SortColumn = '',
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/projectmember/${companyId}/${memberId}`, {
      params: {
        ProjectNameOrCode,
        Status,
        StartDate,
        EndDate,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in getProjectMemberByCompanyIdAndUserId:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

export const getProjectMemberByProjectId = async (
  projectId,
  Keyword = '',
  FromDate = '',
  ToDate = '',
  PageNumber = 1,
  PageSize = 10,
  SortColumn = '',
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/projectmember/project/${projectId}`, {
      params: {
        Keyword,
        FromDate,
        ToDate,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in getProjectMemberByProjectId:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

//https://localhost:7160/api/projectmember/charts/F1AE1F42-1A88-4605-89D7-A51863BAE043
export const getProjectMemberCharts = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/projectmember/charts/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getProjectMemberCharts:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};
