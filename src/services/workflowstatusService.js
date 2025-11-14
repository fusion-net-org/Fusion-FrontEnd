import { axiosInstance } from '../apiConfig';

export const GetWorkflowStatusByProjectId = async (
  ProjectId,
  Name = '',
  PageNumber = 1,
  PageSize = 10,
  SortColumn = '',
  SortDescending = false,
) => {
  try {
    const res = await axiosInstance.get(`/workflow-status/by-project`, {
      params: {
        ProjectId,
        Name,
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
