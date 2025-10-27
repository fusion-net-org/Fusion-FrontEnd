import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import TaskList from './TaskList';
import TaskFormModal from './TaskFormModal';
import { deleteTask, postTask, putTask } from '@/services/taskService.js';

const TaskPage: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        console.log(response);
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          New Task
        </Button>
      </div>

      {/* Chỉ sắp xếp theo title trong TaskList, không filter title */}
      <TaskList key={refreshKey} onEdit={handleEdit} onDelete={handleDelete} />

      <TaskFormModal
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onSubmit={handleSubmit}
        task={editingTask}
      />
    </div>
  );
};

export default TaskPage;
