import { axiosInstance } from '../apiConfig';

export const createProjectComponentsBulk = async (data) => {
  try {
    const payload = data.map((item) => ({
      projectId: item.ProjectId || null,
      projectRequestId: item.ProjectRequestId || null,
      name: item.Name,
      description: item.Description || null,
    }));

    const response = await axiosInstance.post('/project-components/bulk', payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Error!');
  }
};
export const getProjectComponentsByProjectRequestId = async (projectRequestId) => {
  try {
    const response = await axiosInstance.get(
      `/project-components/project-requests/${projectRequestId}`,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Error!');
  }
};

export const getProjectComponentsByProjectId = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/project-components/projects/${projectId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Error!');
  }
};
