import { axiosInstance } from '../apiConfig';

export const getAllTask = async () => {
  try {
    const response = await axiosInstance.get('/tasks');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
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
