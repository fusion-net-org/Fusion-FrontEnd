export interface Task {
  id?: string | number;
  _id?: string | number;
  key?: string | number;
  title: string;
  description?: string;
  type?: 'Feature' | 'Task' | 'Bug';
  priority?: 'Low' | 'Medium' | 'High';
  point?: number;
  source?: string;
  dueDate?: string;
  status?: 'In Progress' | 'Done';
}

export interface ITask {
  id: string;
  code: string;
  projectId: string;
  sprintId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  severity: string;
  point: number;
  estimateHours: number;
  remainingHours: number;
  dueDate: string;
  status: string;
  assigneeIds: string[];
  isDeleted: boolean;
  createAt: string;
  updateAt: string;
}

export interface ITaskResponse {
  succeeded: boolean;
  statusCode: number;
  message: string;
  data: {
    items: ITask[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
}
