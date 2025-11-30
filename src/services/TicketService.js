import { axiosInstance } from '../apiConfig';

export const GetTicketByProjectId = async (
  ProjectId,
  TicketName = '',
  Priority = '',
  MinBudget = '',
  MaxBudget = '',
  ResolvedFrom = '',
  ResolvedTo = '',
  ClosedFrom = '',
  ClosedTo = '',
  CreateFrom = '',
  CreateTo = '',
  PageNumber = 1,
  PageSize = 10,
  SortColumn = '',
  SortDescending = null,
) => {
  try {
    const res = await axiosInstance.get(`/ticket/by-project`, {
      params: {
        ProjectId,
        TicketName,
        Priority,
        MinBudget,
        MaxBudget,
        ResolvedFrom,
        ResolvedTo,
        ClosedFrom,
        ClosedTo,
        CreateFrom,
        CreateTo,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};
export const CreateTicket = async (ticketData) => {
  try {
    const res = await axiosInstance.post('/ticket', ticketData);
    return res.data;
  } catch (error) {
    console.error('Create ticket error:', error);
    throw error;
  }
};

export const GetTicketDashboard = async (projectId) => {
  try {
    const res = await axiosInstance.get(`/ticket/dashboard`, {
      params: { projectId },
    });
    return res.data;
  } catch (error) {
    console.error('Get ticket dashboard error:', error);
    throw error;
  }
};

//https://localhost:7160/api/ticket/97814D07-A53A-4669-8FAE-1FE1D014E80B
export const GetTicketById = async (ticketId) => {
  try {
    const res = await axiosInstance.get(`/ticket/${ticketId}`);
    return res.data;
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    throw error;
  }
};

export const DeleteTicket = async (ticketId, reason) => {
  try {
    const res = await axiosInstance.delete(`/ticket/${ticketId}`, {
      params: { reason },
    });
    return res.data;
  } catch (error) {
    console.error('Delete ticket error:', error);
    throw error;
  }
};

export const RestoreTicket = async (ticketId) => {
  try {
    const res = await axiosInstance.put(`/ticket/${ticketId}/restore`);
    return res.data;
  } catch (error) {
    console.error('Restore ticket error:', error);
    throw error;
  }
};
export const UpdateTicket = async (ticketId, ticketData) => {
  try {
    const res = await axiosInstance.put(`/ticket/${ticketId}`, ticketData);
    return res.data;
  } catch (error) {
    console.error('Update ticket error:', error);
    throw error;
  }
};

export const GetTicketPaged = async (
  Keyword,
  ProjectId,
  CompanyRequestId,
  CompanyExecutorId,
  Status,
  ViewMode,
  CreatedFrom,
  CreatedTo,
  IsDeleted,
  PageNumber = 1,
  PageSize = 10,
  SortColumn,
  SortDescending,
) => {
  try {
    const params = {};

    if (Keyword) params.Keyword = Keyword;
    if (ProjectId) params.ProjectId = ProjectId;
    if (CompanyRequestId) params.CompanyRequestId = CompanyRequestId;
    if (CompanyExecutorId) params.CompanyExecutorId = CompanyExecutorId;
    if (Status) params.Status = Status;
    if (ViewMode) params.ViewMode = ViewMode;
    if (CreatedFrom) params.CreatedFrom = CreatedFrom;
    if (CreatedTo) params.CreatedTo = CreatedTo;
    if (IsDeleted !== undefined && IsDeleted !== null) params.IsDeleted = IsDeleted;
    if (PageNumber) params.PageNumber = PageNumber;
    if (PageSize) params.PageSize = PageSize;
    if (SortColumn) params.SortColumn = SortColumn;
    if (SortDescending !== undefined) params.SortDescending = SortDescending;

    const res = await axiosInstance.get(`/ticket/paged`, { params });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const GetTicketCountStatus = async (projectId, companyRequestId, companyExecutorId) => {
  try {
    const res = await axiosInstance.get(`/ticket/status-count`, {
      params: {
        projectId,
        companyRequestId,
        companyExecutorId,
      },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const GetProjectsByCompany = async (
  companyId,
  companyRequestId = null,
  executorCompanyId = null,
) => {
  try {
    const params = { companyId };

    if (companyRequestId) params.companyRequestId = companyRequestId;
    if (executorCompanyId) params.executorCompanyId = executorCompanyId;

    const res = await axiosInstance.get('/companies/projects-by-company', {
      params,
    });
    return res.data;
  } catch (error) {
    console.error('Get projects by company error:', error);
    throw error;
  }
};
export const AcceptTicket = async (ticketId) => {
  try {
    const res = await axiosInstance.put(`/ticket/${ticketId}/accept`);
    return res.data;
  } catch (error) {
    console.error('Accept ticket error:', error);
    throw error;
  }
};

export const RejectTicket = async (ticketId, reason = '') => {
  try {
    const res = await axiosInstance.put(`/ticket/${ticketId}/reject`, null, {
      params: { reason },
    });
    return res.data;
  } catch (error) {
    console.error('Reject ticket error:', error);
    throw error;
  }
};

export const GetTicketPagedByAdmin = async (
  Keyword,
  ProjectId,
  CompanyRequestId,
  CompanyExecutorId,
  Status,
  ViewMode,
  CreatedFrom,
  CreatedTo,
  IsDeleted,
  PageNumber = 1,
  PageSize = 10,
  SortColumn,
  SortDescending,
) => {
  try {
    const params = {};

    if (Keyword) params.Keyword = Keyword;
    if (ProjectId) params.ProjectId = ProjectId;
    if (CompanyRequestId) params.CompanyRequestId = CompanyRequestId;
    if (CompanyExecutorId) params.CompanyExecutorId = CompanyExecutorId;
    if (Status) params.Status = Status;
    if (ViewMode) params.ViewMode = ViewMode;
    if (CreatedFrom) params.CreatedFrom = CreatedFrom;
    if (CreatedTo) params.CreatedTo = CreatedTo;
    if (IsDeleted !== undefined && IsDeleted !== null) params.IsDeleted = IsDeleted;
    if (PageNumber) params.PageNumber = PageNumber;
    if (PageSize) params.PageSize = PageSize;
    if (SortColumn) params.SortColumn = SortColumn;
    if (SortDescending !== undefined) params.SortDescending = SortDescending;

    const res = await axiosInstance.get(`/ticket/paged/admin`, { params });
    return res.data;
  } catch (error) {
    throw error;
  }
};
