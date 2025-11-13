import { axiosInstance } from '../apiConfig';

export const GetCommentsByTicketId = async (
  TicketId,
  SearchText = '',
  From = '',
  To = '',
  AuthorUserId = '',
  PageNumber = 1,
  PageSize = 1000,
  SortColumn = '',
  SortDescending = null,
) => {
  try {
    const res = await axiosInstance.get('/ticket-comment/paged', {
      params: {
        TicketId,
        SearchText,
        From,
        To,
        AuthorUserId,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });
    return res.data;
  } catch (error) {
    console.error('Get ticket comments error:', error);
    throw error;
  }
};

export const GetCommentById = async (commentId) => {
  try {
    const res = await axiosInstance.get(`/ticket-comment/${commentId}`);
    return res.data;
  } catch (error) {
    console.error('Get ticket comment by ID error:', error);
    throw error;
  }
};

export const CreateComment = async (commentData) => {
  try {
    const res = await axiosInstance.post('/ticket-comment', commentData);
    return res.data;
  } catch (error) {
    console.error('Create ticket comment error:', error);
    throw error;
  }
};

export const UpdateComment = async (commentId, commentData) => {
  try {
    const res = await axiosInstance.put(`/ticket-comment/${commentId}`, commentData);
    return res.data;
  } catch (error) {
    console.error('Update ticket comment error:', error);
    throw error;
  }
};

export const DeleteComment = async (commentId) => {
  try {
    const res = await axiosInstance.delete(`/ticket-comment/${commentId}`);
    return res.data;
  } catch (error) {
    console.error('Delete ticket comment error:', error);
    throw error;
  }
};
