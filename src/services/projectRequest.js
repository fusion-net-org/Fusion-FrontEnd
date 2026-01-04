import { axiosInstance } from '../apiConfig';

export const GetProjectRequestByCompanyId = async (
  companyId,
  Keyword = null,
  Status = null,
  Deleted,
  IsHaveProject,
  ViewMode,
  DateFilterType = 'StartEndDate',
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
        Deleted,
        IsHaveProject,
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

export const GetProjectRequestByCompanyIdAndPartnerId = async (
  companyId,
  partnerId,
  Keyword = null,
  Status = null,
  ViewMode = null,
  DateFilterType = 'StartEndDate',
  DateRangeFrom = null,
  DateRangeTo = null,
  PageNumber = null,
  PageSize = null,
  SortColumn = null,
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(
      `/projectrequest/companies/${companyId}/partners/${partnerId}`,
      {
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
      },
    );

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

export const RejectProjectRequest = async (id, reason = '') => {
  try {
    const response = await axiosInstance.post(`/projectrequest/${id}/reject`, null, {
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
    if (data.ContractId !== undefined && data.ContractId !== null)
      params.append('ContractId', data.ContractId);
    if (data.Name !== undefined && data.Name !== null) params.append('Name', data.Name);
    if (data.Description !== undefined && data.Description !== null)
      params.append('Description', data.Description);
    if (data.StartDate !== undefined && data.StartDate !== null)
      params.append('StartDate', data.StartDate);
    if (data.EndDate !== undefined && data.EndDate !== null) params.append('EndDate', data.EndDate);
    if (data.IsMaintenance !== undefined && data.IsMaintenance !== null)
      params.append('IsMaintenance', data.IsMaintenance);
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

export const GetProjectRequestById = async (id) => {
  try {
    const response = await axiosInstance.get(`/projectrequest/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    return (
      error.response?.data || {
        succeeded: false,
        message: 'Unexpected error occurred',
      }
    );
  }
};

export const EditProjectRequest = async (id, data) => {
  try {
    const params = new URLSearchParams();

    if (data.RequesterCompanyId) params.append('RequesterCompanyId', data.RequesterCompanyId);
    if (data.ExecutorCompanyId) params.append('ExecutorCompanyId', data.ExecutorCompanyId);
    if (data.Code) params.append('Code', data.Code);
    if (data.Name) params.append('Name', data.Name);
    if (data.Description) params.append('Description', data.Description);
    if (data.Status) params.append('Status', data.Status);
    if (data.StartDate) params.append('StartDate', data.StartDate);
    if (data.EndDate) params.append('EndDate', data.EndDate);

    const response = await axiosInstance.put(`/projectrequest/${id}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error in EditProjectRequest:', error);
    return (
      error.response?.data || {
        succeeded: false,
        message: 'Unexpected error occurred',
      }
    );
  }
};

export const DeleteProjectRequest = async (id, reason = '') => {
  try {
    const response = await axiosInstance.delete(`/projectrequest/${id}`, {
      params: { reason },
    });
    return response.data;
  } catch (error) {
    console.error('Error in DeleteProjectRequest:', error);
    return (
      error.response?.data || {
        succeeded: false,
        message: 'Unexpected error occurred',
      }
    );
  }
};

export const RestoreProjectRequest = async (id) => {
  try {
    const response = await axiosInstance.post(`/projectrequest/${id}/restore`);
    return response.data;
  } catch (error) {
    console.error('Error in RestoreProjectRequest:', error);
    return (
      error.response?.data || {
        succeeded: false,
        message: 'Unexpected error occurred',
      }
    );
  }
};

export const GetAllProjectRequestByAdmin = async (
  companyId,
  Keyword = null,
  Status = null,
  Deleted,
  IsHaveProject,
  ViewMode,
  DateFilterType = 'StartEndDate',
  DateRangeFrom = null,
  DateRangeTo = null,
  PageNumber = null,
  PageSize = null,
  SortColumn = null,
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/projectrequest/paged/admin`, {
      params: {
        Keyword,
        Status,
        Deleted,
        IsHaveProject,
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
    return { data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 10 } };
  }
};

export const getProjectRequestIdByAdmin = async (id) => {
  try {
    const response = await axiosInstance.get(`/projectrequest/${id}/admin`);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    return (
      error.response?.data || {
        succeeded: false,
        message: 'Unexpected error occurred',
      }
    );
  }
};
