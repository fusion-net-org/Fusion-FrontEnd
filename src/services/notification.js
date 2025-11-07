import { axiosInstance } from '../apiConfig';

export const GetNotificationsByUser = async () => {
  try {
    const res = await axiosInstance.get(`/notifications/user`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const MarkNotificationAsRead = async (notificationId) => {
  try {
    const res = await axiosInstance.put(`/notifications/${notificationId}/read`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const SendNotification = async (data) => {
  try {
    const res = await axiosInstance.post(`/notifications/send`, data);
    return res.data;
  } catch (error) {
    throw error;
  }
};
//https://localhost:7160/api/notifications/53412F32-E7E4-4906-93F5-21E12208CE4A
export const DeleteNotification = async (notificationId) => {
  try {
    const res = await axiosInstance.delete(`/notifications/${notificationId}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};
