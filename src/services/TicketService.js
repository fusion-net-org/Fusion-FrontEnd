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
