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

export const putSelfUserByAdmin = async (id, formData) => {
  try {
    const res = await axiosInstance.put(`/User/${id}/self-user-admin`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    const resp = error?.response;
    const msg =
      resp?.data?.message ||
      resp?.data?.title ||
      resp?.data?.detail ||
      resp?.statusText ||
      error?.message ||
      'Admin update failed!';
    throw new Error(msg);
  }
};

export const putStatusByAdmin = async (id, status) => {
  try {
    const form = new FormData();
    form.append('status', String(!!status));

    const res = await axiosInstance.put(`/User/${id}/update-status-admin`, form);
    return res.data?.data ?? res.data;
  } catch (error) {
    const resp = error?.response;
    const msg =
      resp?.data?.message ||
      resp?.data?.title ||
      resp?.data?.detail ||
      resp?.statusText ||
      error?.message ||
      'Admin update failed!';
    throw new Error(msg);
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
export async function getAdminUsersPaged(q = {}) {
  try {
    const params = {};
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) params[k] = v;
    });

    const res = await axiosInstance.get('/User/paged-admin', { params });
    return res.data?.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error?.message || 'Get paged users failed!');
  }
}

export const changePassword = async (data) => {
  try {
    const response = await axiosInstance.post('/User/change-password', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};
