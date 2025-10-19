import { axiosInstance } from '../apiConfig';
//https://localhost:7160/api/User/self-user
export const getSelfUser = async () => {
  try {
    const response = await axiosInstance.get('/User/self-user');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const putSelfUser = async (formData) => {
  try {
    const response = await axiosInstance.put('/User/self-user', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Update failed!');
  }
};
