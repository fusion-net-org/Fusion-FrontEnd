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
