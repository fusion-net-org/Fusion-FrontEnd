import { axiosInstance } from '../apiConfig';

export const sendNotificationToSystem = async (data) => {
  try {
    const response = await axiosInstance.post(`/notifications/send/all`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error send notification to system!');
  }
};

export const getAllNotificationByAdmin = async ({
  PageNumber = 1,
  PageSize = 10,
  SortColumn = '',
  SortDescending = false,
}) => {
  try {
    const response = await axiosInstance.get('/notifications/admin', {
      params: {
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });

    return response.data?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch notifications.');
  }
};

export const deleteNotificationByAdmin = async (id) => {
  try {
    const response = await axiosInstance.delete(`/notifications/admin`);
    return response.data?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
