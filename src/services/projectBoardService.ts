import { axiosInstance } from "@/apiConfig.js";
import { normalizeBoardInput, fillSprintColumns, mapTask } from "@/mappers/projectBoardMapper";
import type { SprintVm, TaskVm, StatusKey } from "@/types/projectBoard.ts";
import { getSprintsByProject } from "@/services/projectService.js"; // bạn đang có sẵn

export type BoardState = { sprints: SprintVm[]; tasks: TaskVm[] };

export async function fetchBoard(projectId: string): Promise<BoardState> {
  // Ưu tiên dùng API của bạn nếu có:
  // 1) Nếu backend có endpoint tổng hợp:
  // const { data } = await axiosInstance.get(`/projects/${projectId}/board`);
  // return normalizeThenFill(data);

  // 2) Từ service có sẵn + tasks rời:
  // (Giả định bạn có /project/:id/tasks, nếu chưa có, tạm lấy trong getSprintsByProject data)
  const sRes = await getSprintsByProject(projectId);
  // cố gắng tìm tasks trong đó (sRes có thể là {items:[]}, {data:...} tuỳ bạn)
  const raw = (sRes?.data ?? sRes ?? {}) as any;
  const input = raw?.sprints || Array.isArray(raw) ? { sprints: (raw?.sprints ?? raw) } : raw;

  // Nếu bạn có API tasks riêng thì merge:
  try {
    const { data: tasksRes } = await axiosInstance.get(`/projects/${projectId}/tasks`);
    (input as any).tasks = tasksRes?.data ?? tasksRes ?? [];
  } catch { /* optional */ }

  const { sprints, tasks } = normalizeBoardInput(input);
  const sFilled = fillSprintColumns(sprints, tasks);
  return { sprints: sFilled, tasks };
}

export async function updateTaskStatus(projectId: string, taskId: string, status: StatusKey) {
  await axiosInstance.put(`/projects/${projectId}/tasks/${taskId}/status`, { status });
}

export async function moveTaskToSprint(projectId: string, taskId: string, toSprintId: string) {
  await axiosInstance.put(`/projects/${projectId}/tasks/${taskId}/sprint`, { toSprintId });
}

export async function reorderInStatus(projectId: string, sprintId: string, taskId: string, toStatus: StatusKey, toIndex: number) {
  await axiosInstance.put(`/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}/reorder`, { toStatus, toIndex });
}

export async function splitTask(projectId: string, taskId: string, payload: { bTitle: string; bStoryPoints: number; bRemainingHours: number; toSprintId?: string | null; }) {
  await axiosInstance.post(`/projects/${projectId}/tasks/${taskId}/split`, payload);
}

export async function markDone(projectId: string, taskId: string) {
  await updateTaskStatus(projectId, taskId, "done");
}
