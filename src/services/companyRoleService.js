import { axiosInstance } from '../apiConfig';

export const GetRolesPaged = async (
  CompanyId,
  Keyword = '',
  Status = null,
  CreatedAtFrom = null,
  CreatedAtTo = null,
  PageNumber = 1,
  PageSize = 10,
  SortColumn = null,
  SortDescending = null,
) => {
  try {
    const response = await axiosInstance.get(`/roles/paged`, {
      params: {
        CompanyId,
        Keyword,
        Status,
        CreatedAtFrom,
        CreatedAtTo,
        PageNumber,
        PageSize,
        SortColumn,
        SortDescending,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error in GetRolesPaged:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

export const GetRoleById = async (roleId) => {
  try {
    const response = await axiosInstance.get(`/roles/${roleId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error in GetRoleById:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

export const CreateRole = async (payload) => {
  try {
    const response = await axiosInstance.post(`/roles`, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error in CreateRole:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

export const UpdateRole = async (roleId, payload) => {
  try {
    const response = await axiosInstance.put(`/roles/${roleId}`, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error in UpdateRole:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

export const DeleteRole = async (roleId, reason) => {
  try {
    const response = await axiosInstance.delete(`/roles/${roleId}`, {
      data: { reason },
    });
    return response.data;
  } catch (error) {
    console.error('Error in DeleteRole:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

export const getRoleCompanyByAdmin = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.append(key, value);
      }
    });

    const { data } = await axiosInstance.get(`/roles/paged?${query.toString()}`);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};
