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
    const response = await axiosInstance.post('/tasks', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const putTask = async (data) => {
  try {
    const response = await axiosInstance.put('/tasks', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await axiosInstance.delete('/tasks', id);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
