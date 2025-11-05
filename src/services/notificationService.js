import { axiosInstance } from '../apiConfig';

export const sendNotificationToSystem = async (data) => {
  try {
    const response = await axiosInstance.post(`/notifications/send/all`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error send notification to system!');
  }
};
