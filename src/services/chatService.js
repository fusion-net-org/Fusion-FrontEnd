import { axiosInstance } from '../apiConfig';

export const getMyFriendList = async () => {
  try {
    const response = await axiosInstance.get('/Friend/paged?Status=1');
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
    const response = await axiosInstance.post('/Chat/group', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};

export const getMessages = async (conversationId) => {
  try {
    const response = await axiosInstance.get(
      `/Chat/conversations/${conversationId}/messages/paged`,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};

export const getFriendInvitationList = async () => {
  try {
    const response = await axiosInstance.get('/Friend/pending/received');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};

export const acceptFriendInvitation = async (friendshipId) => {
  try {
    const response = await axiosInstance.post(`Friend/${friendshipId}/accept`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};

export const rejectFriendInvitation = async (friendshipId) => {
  try {
    const response = await axiosInstance.post(`Friend/${friendshipId}/reject`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};

export const unfriend = async (friendshipId) => {
  try {
    const response = await axiosInstance.post(`Friend/${friendshipId}/unfriend`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error!' };
  }
};
