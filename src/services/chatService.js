import { axiosInstance } from '../apiConfig';

export const getMyFriendList = async () => {
  try {
    const response = await axiosInstance.get('/Friend/paged');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};

export const sendAddFriend = async (email) => {
  try {
    const payload = { email };

    const response = await axiosInstance.post('/Friend/request', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};

export const getMyGroupChatList = async () => {
  try {
    const response = await axiosInstance.get('/Chat/conversations/paged');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};

export const createGroupChat = async (data) => {
  try {
    console.log(data);
    const response = await axiosInstance.post('/Chat/group', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};
