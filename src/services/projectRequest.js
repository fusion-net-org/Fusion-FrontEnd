import { axiosInstance } from '../apiConfig';

export const GetProjectRequestByCompanyId = async (
  companyId,
  Keyword = null,
  Status = null,
  ViewMode = null,
  DateFilterType = null,
  DateRangeFrom = null,
  DateRangeTo = null,
  PageNumber = null,
  PageSize = null,
  SortColumn = null,
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/projectrequest/paged/${companyId}`, {
      params: {
        Keyword,
        Status,
        ViewMode,
        DateFilterType,
        'DateRange.From': DateRangeFrom,
        'DateRange.To': DateRangeTo,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });

    return (
      response.data?.data || {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
      }
    );
  } catch (error) {
    console.error('Error in GetProjectRequestByCompanyId:', error);
    return { data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 10 } };
  }
};

//https://localhost:7160/api/projectrequest/752BD235-4246-4990-AEFD-48F58DDF8711/accept
export const AcceptProjectRequest = async (id) => {
  try {
    const response = await axiosInstance.post(`/projectrequest/${id}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error in AcceptProjectRequest:', error);
    return (
      error.response?.data || {
        succeeded: false,
        message: 'Unexpected error occurred',
      }
    );
  }
};
// https://localhost:7160/api/projectrequest/752BD235-4246-4990-AEFD-48F58DDF8711/reject?reason=12312
export const RejectProjectRequest = async (id, reason = '') => {
  try {
    const response = await axiosInstance.put(`/projectrequest/${id}/reject`, null, {
      params: { reason },
    });
    return response.data;
  } catch (error) {
    console.error('Error in RejectProjectRequest:', error);
    return (
      error.response?.data || {
        succeeded: false,
        message: 'Unexpected error occurred',
      }
    );
  }
};

export const CreateProjectRequest = async (data) => {
  try {
    const params = new URLSearchParams();

    if (data.RequesterCompanyId !== undefined && data.RequesterCompanyId !== null)
      params.append('RequesterCompanyId', data.RequesterCompanyId);
    if (data.ExecutorCompanyId !== undefined && data.ExecutorCompanyId !== null)
      params.append('ExecutorCompanyId', data.ExecutorCompanyId);
    if (data.Name !== undefined && data.Name !== null) params.append('Name', data.Name);
    if (data.Description !== undefined && data.Description !== null)
      params.append('Description', data.Description);
    if (data.StartDate !== undefined && data.StartDate !== null)
      params.append('StartDate', data.StartDate);
    if (data.EndDate !== undefined && data.EndDate !== null) params.append('EndDate', data.EndDate);

    const url = `/projectrequest?${params.toString()}`;

    const response = await axiosInstance.post(url);
    return response.data;
  } catch (error) {
    console.error('Error in CreateProjectRequest:', error);
    return (
      error.response?.data || {
        succeeded: false,
        message: 'Unexpected error occurred',
      }
    );
  }
};
