import { axiosInstance } from "@/apiConfig";

/** GET /api/projects/{projectId}/sprint-board */
export async function fetchSprintBoard(projectId) {
  const { data } = await axiosInstance.get(
    `/projects/${projectId}/sprint-board`
  );

  const payload = (data && data.data) || data || {};

  let sprints;
  if (Array.isArray(payload.sprints)) {
    sprints = payload.sprints;
  } else if (payload.sprint) {
    sprints = [payload.sprint];
  } else {
    sprints = [];
  }

  return {
     components: Array.isArray(payload.components)
      ? payload.components
      : Array.isArray(payload.maintenanceComponents)
        ? payload.maintenanceComponents
        : [],
    workflow: payload.workflow || null,
    sprints,
    tasks: Array.isArray(payload.tasks) ? payload.tasks : [],
  };
}

/** POST /api/projects/{projectId}/sprint-board/{sprintId}/tasks/{taskId}/move
 * body: { toSprintId?, toStatusId?, toIndex? }
 */
export async function moveTaskOnBoard(projectId, _sprintId, taskId, body) {
    const payload = {
        toStatusId: body?.toStatusId ?? null,
        toSprintId: body?.toSprintId ?? null,
        newOrder: typeof body?.toIndex === "number" ? body.toIndex : body?.newOrder,
        actorUserId: body?.actorUserId, // FE nên truyền Guid user hiện tại
    };
    const { data } = await axiosInstance.post(
        `/projects/${projectId}/sprint-board/tasks/${taskId}/move`,
        payload
    );
    return data?.data ?? data ?? true;
}
export async function getProjectTaskList(projectId, query) {
  const { data } = await axiosInstance.get(
    `/projects/${projectId}/sprint-board/tasks`,
    { params: query },
  );
  return data?.data; // PagedResult<TaskVmDto>
}
/** POST /api/projects/{projectId}/sprint-board/{sprintId}/columns/{statusId}/reorder
 * body: { taskIds: string[] }  // thứ tự mới trong cột
 */
export async function reorderColumnOnBoard(projectId, sprintId, statusId, taskIds) {
    const items = (Array.isArray(taskIds) ? taskIds : []).map((id, idx) => ({
        taskId: id,
        order: idx,
    }));
    const { data } = await axiosInstance.post(
        `/projects/${projectId}/sprint-board/reorder`,
        { sprintId, statusId, items }
    );
    return data?.data ?? data ?? true;
}