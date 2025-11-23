/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from '../apiConfig';

/**
 * Chuẩn hoá payload từ AiTaskGenerateRequest (FE) sang DTO BE.
 * BE đang dùng: ProjectId, SprintId, SprintName, SprintStart, SprintEnd,
 * WorkflowStatuses, DefaultStatusId, ... (xem AiTaskGenerateRequestDto).
 */
const buildBackendPayload = (req) => {
  if (!req) throw new Error('AI request is required');

  const sprint = req.sprint || {};
  const workflow = req.workflow || { statuses: [], defaultStatusId: '' };
  const teamCtx = req.teamContext || {
    memberCount: 0,
    roles: [],
    techStack: [],
  };

  // ==== NEW: toàn bộ board context (từ FE: boardContext) ====
  const boardCtx = req.boardContext || {};
  const boardSprints = Array.isArray(boardCtx.sprints) ? boardCtx.sprints : [];
  const boardTasks = Array.isArray(boardCtx.tasks) ? boardCtx.tasks : [];

  return {
    // ==== ids & basic context ====
    projectId: req.projectId,
    projectName: req.projectName,
    sprintId: sprint.id,
    sprintName: sprint.name,
    sprintStart: sprint.start,
    sprintEnd: sprint.end,
    sprintCapacityHours: sprint.capacityHours,

    // ==== workflow ====
    workflowStatuses: workflow.statuses || [],
    defaultStatusId: workflow.defaultStatusId,

    // ==== board context toàn bộ sprint board ====
    // C# AiTaskGenerateRequestDto: BoardSprints, BoardTasks
    boardSprints,
    boardTasks,

    // ==== goal & scope ====
    goal: req.goal,
    context: req.context,
    workTypes: req.workTypes || [],
    modules: req.modules || [],
    quantity: req.quantity,
    granularity: req.granularity,

    // ==== estimate config ====
    estimateUnit: req.estimate?.unit,
    withEstimate: req.estimate?.withEstimate ?? true,
    estimateMin: req.estimate?.min,
    estimateMax: req.estimate?.max,
    totalEffortHours: req.estimate?.totalEffortHours,

    // ==== timebox / deadline ====
    deadline: req.deadline,

    // ==== team context (size, roles, tech) ====
    teamMemberCount: teamCtx.memberCount,
    teamRoles: teamCtx.roles || [],
    techStack: teamCtx.techStack || [],

    // ==== requirements ====
    functionalRequirements: req.requirements?.functional,
    nonFunctionalRequirements: req.requirements?.nonFunctional,
    acceptanceHint: req.requirements?.acceptanceHint,

    // ==== duplicate strategy ====
    includeExistingTasks: req.duplicateStrategy?.includeExistingTasks ?? true,
    avoidSameTitle: req.duplicateStrategy?.avoidSameTitle ?? true,
    avoidSameDescription: req.duplicateStrategy?.avoidSameDescription ?? true,
    existingTasksSnapshot: req.existingTasksSnapshot || [],

    // ==== output config (BE có thể dùng sau) ====
    outputConfig: req.outputConfig,
  };
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
