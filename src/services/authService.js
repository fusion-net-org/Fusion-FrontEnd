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

export const register = async (data) => {
  try {
    const response = await axiosInstance.post('/Authen/register', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const refreshToken = async (refreshTokenValue) => {
  try {
    const response = await axiosInstance.post('/RefreshToken/refresh', {
      refreshToken: refreshTokenValue,
    });

    const { data } = response.data;

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    const message = error.response?.data?.message || 'Error';
    throw new Error(message);
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await axiosInstance.post('/Authen/request-password-reset', email);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await axiosInstance.post('/Authen/reset-password', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const loginGG = async (data) => {
  try {
    const response = await axiosInstance.post('/Authen/login-google', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
