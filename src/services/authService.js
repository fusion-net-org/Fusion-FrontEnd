import { axiosInstance } from '../apiConfig';

export const login = async (data) => {
  try {
    const response = await axiosInstance.post('/Authen/login', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
