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
    console.log(formData);
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

export const getOwnerUser = async (companyID) => {
  try {
    const response = await axiosInstance.get(`/User/owner-user/${companyID}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Get owner user failed!');
  }
};

export const changePassword = async (data) => {
  try {
    const response = await axiosInstance.post('/User/change-password', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
