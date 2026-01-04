/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from '../apiConfig';


const buildBackendPayload = (req) => {
  if (!req) throw new Error('AI request is required');

  const sprint = req.sprint || {};
  const workflow = req.workflow || { statuses: [], defaultStatusId: '' };
  const teamCtx = req.teamContext || { memberCount: 0, roles: [], techStack: [] };

  const boardCtx = req.boardContext || {};
  const boardSprints = Array.isArray(boardCtx.sprints) ? boardCtx.sprints : [];
  const boardTasks = Array.isArray(boardCtx.tasks) ? boardCtx.tasks : [];

  const out = req.outputConfig || {};

  return {
    projectId: req.projectId,
    projectName: req.projectName,

    sprintId: sprint.id,
    sprintName: sprint.name,
    sprintStart: sprint.start,
    sprintEnd: sprint.end,
    sprintCapacityHours: sprint.capacityHours,

    targetSprintIds: Array.isArray(req.targetSprintIds) ? req.targetSprintIds : [],

    workflowStatuses: workflow.statuses || [],
    defaultStatusId: workflow.defaultStatusId,

    boardSprints,
    boardTasks,

    goal: req.goal,
    context: req.context,
    workTypes: req.workTypes || [],
    modules: req.modules || [],
    quantity: req.quantity,
    granularity: req.granularity,

    estimateUnit: req.estimate?.unit,
    withEstimate: req.estimate?.withEstimate ?? true,
    estimateMin: req.estimate?.min,
    estimateMax: req.estimate?.max,
    totalEffortHours: req.estimate?.totalEffortHours,

    deadline: req.deadline,

    teamMemberCount: teamCtx.memberCount,
    teamRoles: teamCtx.roles || [],
    techStack: teamCtx.techStack || [],

    functionalRequirements: req.requirements?.functional,
    nonFunctionalRequirements: req.requirements?.nonFunctional,
    acceptanceHint: req.requirements?.acceptanceHint,

    includeTitle: out.includeTitle ?? true,
    includeDescription: out.includeDescription ?? true,
    includeType: out.includeType ?? true,
    includePriority: out.includePriority ?? true,
    includeEstimate: out.includeEstimate ?? true,
    includeAcceptanceCriteria: out.includeAcceptanceCriteria ?? true,
    includeDependencies: out.includeDependencies ?? true,
    includeStatusSuggestion: out.includeStatusSuggestion ?? true,
    includeChecklist: out.includeChecklist ?? true,

    includeExistingTasks: req.duplicateStrategy?.includeExistingTasks ?? true,
    avoidSameTitle: req.duplicateStrategy?.avoidSameTitle ?? true,
    avoidSameDescription: req.duplicateStrategy?.avoidSameDescription ?? true,
    existingTasksSnapshot: req.existingTasksSnapshot || [],
  };
};
export const generateAndSaveAiTasksBySprint = async (clientRequest) => {
  const dto = buildBackendPayload(clientRequest);
  const { projectId, sprintId } = dto;

  const res = await axiosInstance.post(
    `/projects/${projectId}/sprints/${sprintId}/ai/generate-and-save/by-sprint`,
    dto,
  );

  return res?.data?.data ?? res?.data;
};

/**
 * Gọi AI generate (preview – CHƯA lưu DB).
 * Trả về: AiGenerateTasksResponseDto (thường { tasks: AiGeneratedTaskDraft[] }).
 */
export const generateAiTasks = async (clientRequest) => {
  try {
    const dto = buildBackendPayload(clientRequest);
    const { projectId, sprintId } = dto;

    const res = await axiosInstance.post(
      `/projects/${projectId}/sprints/${sprintId}/ai/generate-tasks`,
      dto,
    );

    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('[AI] generateAiTasks error', error);
    const message =
      error?.response?.data?.message || 'AI generate tasks failed';
    throw new Error(message);
  }
};
// Preview – chỉ generate, không lưu DB
export async function generateAiTasksPreview(payload) {
  const projectId = payload?.projectId;
  if (!projectId) throw new Error("projectId is required");

  const { data } = await axiosInstance.post(
    `/projects/${projectId}/ai/tasks/preview`,
    payload,
  );

  // BE trả { succeeded, data: { tasks: [...] } } hoặc trả thẳng { tasks: [...] }
  const payloadData = data?.data ?? data ?? {};
  return payloadData; // { tasks: [...] }
}
/**
 * Gọi AI generate & LƯU luôn vào DB.
 * Trả về: List<ProjectTaskResponse> (FE dùng như TaskVm).
 */
export const generateAndSaveAiTasks = async (clientRequest) => {
  try {
    const dto = buildBackendPayload(clientRequest);
    const { projectId, sprintId } = dto;

    const res = await axiosInstance.post(
      `/projects/${projectId}/sprints/${sprintId}/ai/generate-and-save`,
      dto,
    );

    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error('[AI] generateAndSaveAiTasks error', error);
    const message =
      error?.response?.data?.message || 'AI generate & save tasks failed';
    throw new Error(message);
  }
};

export default {
  generateAiTasks,
  generateAndSaveAiTasks,
};
