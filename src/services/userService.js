import { axiosInstance } from '../apiConfig';
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
    throw error.response?.data || { message: 'Error!' };
  }
};
//https://localhost:7160/api/User/fa5aa664-0d66-4620-8fd1-4b42bfc18578
export const getUserById = async (id) => {
  try {
    const response = await axiosInstance.get(`/User/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Error!';
    throw new Error(message);
  }
};

export const getUserFullInfo = async (id) => {
  try {
    const response = await axiosInstance.get(`/User/fullInfor/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const getUserLogsByUser = async (id) => {
  try {
    const response = await axiosInstance.get(`/UserLog/by-user/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error!');
  }
};

export const getAllOwnerCompanyByUser = async (userId) => {
  try {
    const res = await axiosInstance.get(`/company/owner/all-company`, {
      params: { userId },
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error fetching owner companies!');
  }
};

export const getAllMemberCompanyByUser = async (userId) => {
  try {
    const response = await axiosInstance.get('/company/member/all-company', {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error fetching member companies!');
  }
};

//=========== OverView Chart ===========
//1.Growth & Active Status
export const getUserGrowthAndStatusOverview = async (months) => {
  try {
    const params = typeof months === 'number' ? { months } : undefined;

    const response = await axiosInstance.get('/User/overview/growth-and-status', { params });

    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Error fetching user growth and status!');
  }
};

// 2. User distribution by company (top companies)
export const getTopCompanyUserDistribution = async (top) => {
  try {
    const params = typeof top === 'number' ? { top } : undefined;

    const response = await axiosInstance.get('/User/overview/company-distribution', { params });

    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Error fetching company user distribution!');
  }
};

// 3. User by permission level
export const getUserPermissionLevelOverview = async () => {
  try {
    const response = await axiosInstance.get('/User/overview/permission-levels');
    // ResponseModel<UserPermissionLevelOverviewResponse>
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || 'Error fetching user permission level overview!',
    );
  }
};

export const GetUserRolesByCompany = async (companyId, userId) => {
  try {
    const response = await axiosInstance.get(`/User/roles/${companyId}/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error fetching member companies!');
  }
};
