import { axiosInstance } from '../apiConfig';

export const registerDeviceToken = (payload) => {
  return axiosInstance.post('/user-device', payload);
};
