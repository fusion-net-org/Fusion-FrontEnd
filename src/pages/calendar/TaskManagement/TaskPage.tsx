import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import TaskList from './TaskList';
import TaskFormModal from './TaskFormModal';
import { deleteTask, postTask, putTask } from '@/services/taskService.js';
import { ChevronDown } from 'lucide-react';
import TaskDetailModal from './TaskDetailModal';
import type { Task } from '@/interfaces/Task/task';

const TaskPage: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [sortColumn, setSortColumn] = useState('title');
  const [sortDescending, setSortDescending] = useState(false);

  const handleSortChange = (value: string) => {
    setSortColumn(value);
  };

  const toggleSortOrder = () => {
    setSortDescending((prev) => !prev);
  };

  const handleAdd = () => {
    setEditingTask(null);
    setOpenModal(true);
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setOpenModal(true);
  };

  const handleDelete = async (taskId: string | number) => {
    try {
      const res = await deleteTask(String(taskId));
      if (res?.succeeded) {
        toast.success('Task deleted successfully!');
        setRefreshKey((k) => k + 1);
      } else {
        toast.error('Failed to delete task.');
      }
    } catch {
      toast.error('An error occurred while deleting the task.');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingTask) {
        await putTask(editingTask.id, values);
        toast.success('Task updated successfully!');
      } else {
        const response = await postTask(values);
        toast.success('Task created successfully!');
      }
      setOpenModal(false);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error('An error occurred while saving the task.');
    }
  };

  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 p-6 text-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Task Management</h2>

        {/* SORT CONTROL */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={sortColumn}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="title">Title</option>
              <option value="dueDate">Due Date</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <Button size="small" onClick={toggleSortOrder} className="border-gray-300">
            {sortDescending ? '↓ Desc' : '↑ Asc'}
          </Button>

          {/* <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            New Task
          </Button> */}
        </div>
      </div>

      <TaskList
        key={refreshKey}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetail={(task) => {
          setSelectedTask(task);
          setOpenDetailModal(true);
        }}
        sortColumn={sortColumn}
        sortDescending={sortDescending}
      />

      <TaskDetailModal
        open={openDetailModal}
        task={selectedTask}
        onClose={() => setOpenDetailModal(false)}
        onEdit={(task) => {
          setEditingTask(task);
          setOpenDetailModal(false);
          setOpenModal(true);
        }}
        onDelete={async (taskId) => {
          await handleDelete(taskId);
          setOpenDetailModal(false);
        }}
      />

      <TaskFormModal
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onSubmit={handleSubmit}
        //task={editingTask}
      />
    </div>
  );
};

export default TaskPage;
