import { axiosInstance } from '../apiConfig';

export const getAllTask = async ({
  pageNumber = 1,
  pageSize = 10,
  sortColumn = 'title',
  sortDescending = false,
  // Filter parameters
  search = '',
  type = [],
  priority = [],
  status = [],
  dueDateFrom = '',
  dueDateTo = '',
  pointMin,
  pointMax,
} = {}) => {
  try {
    const params = {
      PageNumber: pageNumber,
      PageSize: pageSize,
      SortColumn: sortColumn,
      SortDescending: sortDescending,
    };

    // Add filter parameters if they exist
    if (search) params.Search = search;
    if (type.length > 0) params.Type = type.join(',');
    if (priority.length > 0) params.Priority = priority.join(',');
    if (status.length > 0) params.Status = status.join(',');
    if (dueDateFrom) params.DueDateFrom = dueDateFrom;
    if (dueDateTo) params.DueDateTo = dueDateTo;
    if (pointMin !== undefined) params.PointMin = pointMin;
    if (pointMax !== undefined) params.PointMax = pointMax;

    const response = await axiosInstance.get('/tasks', { params });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error fetching tasks';
    throw new Error(message);
  }
};

export const getTaskById = async (id) => {
  try {
    const response = await axiosInstance.get('/tasks', id);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const postTask = async (data) => {
  try {
    const payload = {
      projectId: '6909CE3D-38DF-4C71-919E-82300C9984A3',
      sprintId: 'EF92CB06-5C70-41C4-AAFA-DB00FE7E9313',
      ...data,
    };
    const response = await axiosInstance.post('/tasks', payload);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const putTask = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/tasks/${id}`, data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await axiosInstance.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
