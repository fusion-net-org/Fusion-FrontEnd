import { axiosInstance } from '../apiConfig';

//https://localhost:7160/api/sprints/projects/F1AE1F42-1A88-4605-89D7-A51863BAE043

export const getSprintByProjectId = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/sprints/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getSprintByProjectId:', error);
    throw new Error(error.response?.data?.message || 'Fail!');
  }
};

// https://localhost:7160/api/sprints/projects/f1ae1f42-1a88-4605-89d7-a51863bae043/charts
export const getSprintChartsByProjectId = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/sprints/projects/${projectId}/charts`);
    // Trả về data chứa 2 mảng: statusDistribution và sprintWorkload
    return response.data.data;
  } catch (error) {
    console.error('Error in getSprintChartsByProjectId:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch sprint charts');
  }
};
export async function createSprint(payload) {
  try {
    const response = await axiosInstance.post("/sprints", payload);
    // BE đang dùng ResponseModel<SprintVm> => data.data
    return response?.data?.data ?? response?.data;
  } catch (error) {
    // có thể custom message sau
    throw new Error(
      error.response?.data?.message || "Failed to create sprint!",
    );
  }
}