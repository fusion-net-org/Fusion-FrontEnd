// src/types/aiTaskGenerate.ts

export type AiBoardSprintContext = {
  id: string;
  name: string;
  start?: string | null;
  end?: string | null;
  state?: string | null;
  capacityHours?: number | null;
  committedPoints?: number | null;
};

export type AiBoardTaskContext = {
  id: string;
  code?: string | null;
  title: string;
  type: string;
  priority: string;
  severity?: string | null;
  sprintId?: string | null;
  sprintName?: string | null;
  statusCode?: string | null;
  statusCategory?: string | null;
  estimateHours?: number | null;
  storyPoints?: number | null;
};

export type AiTaskGenerateRequest = {
  projectId: string;
  projectName: string;

  sprint: {
    id: string;
    name: string;
    start?: string | null;
    end?: string | null;
    capacityHours?: number | null;
  };

  workflow: {
    statuses: Array<{
      id: string;
      code: string;
      name: string;
      category: string;
      isDone: boolean;
      order: number;
    }>;
    defaultStatusId?: string;
  };

  // 👇 NEW: toàn bộ board context
  boardContext?: {
    sprints: AiBoardSprintContext[];
    tasks: AiBoardTaskContext[];
  };

  goal: string;
  context?: string;

  workTypes: string[];
  modules: string[];

  quantity: number;
  granularity: "Epic" | "Task" | "SubTask";

  estimate: {
    unit: "StoryPoints" | "Hours";
    withEstimate: boolean;
    min?: number;
    max?: number;
    totalEffortHours?: number;
  };

  deadline?: string;

  teamContext: {
    memberCount: number;
    roles: string[];
    techStack: string[];
  };

  requirements: {
    functional?: string;
    nonFunctional?: string;
    acceptanceHint?: string;
  };

  outputConfig: {
    includeTitle: boolean;
    includeDescription: boolean;
    includeType: boolean;
    includePriority: boolean;
    includeEstimate: boolean;
    includeAcceptanceCriteria: boolean;
    includeDependencies: boolean;
    includeStatusSuggestion: boolean;
    includeChecklist: boolean;
  };

  duplicateStrategy: {
    includeExistingTasks: boolean;
    avoidSameTitle: boolean;
    avoidSameDescription: boolean;
  };

  existingTasksSnapshot?: Array<{
    id: string;
    code?: string;
    title: string;
    type: string;
    module?: string;
    statusCategory: string;
    priority: string;
    severity?: string | null;
    estimateHours?: number | null;
    storyPoints?: number | null;
  }>;
};
