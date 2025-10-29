export interface Task  {
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
};